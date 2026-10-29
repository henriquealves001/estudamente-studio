import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { accountRequest as rawAccountRequest, useAccount } from './AccountContext';
import { useModalFocus } from './useModalFocus';
import { useStudyStorage } from './StudyStorageContext';
import { KEY } from './domain';

const friendlyError = (error: unknown) => {
  const message = (error as Error).message || '';
  if (/invalid login credentials/i.test(message)) return 'E-mail ou senha inválidos. Confira os dados ou recupere sua senha.';
  if (/email not confirmed/i.test(message)) return 'Confirme seu e-mail pelo link recebido. Você pode solicitar outro envio abaixo.';
  if (/rate limit|too many|security purposes/i.test(message)) return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
  if (/expired|invalid.*token|otp/i.test(message)) return 'O link venceu ou já foi usado. Solicite um novo link de recuperação.';
  if (/identity.*already|already.*registered/i.test(message)) return 'Este acesso já pertence a uma conta. Entre nela para continuar.';
  return message || 'Não foi possível concluir. Tente novamente.';
};
export default function AccountControl() {
  const { account, client, recovering, error: accountError, refresh, logout, recovered, accountOpen: open, setAccountOpen: setOpen } = useAccount();
  const studyStorage = useStudyStorage();
  const [mode, setMode] = useState<'login' | 'signup' | 'recover'>('login'), [notice, setNotice] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [name, setName] = useState(account?.name || ''), [bio, setBio] = useState(account?.bio || ''), [publicProfile, setPublicProfile] = useState(account?.publicProfile || false), [ranking, setRanking] = useState(account?.ranking || false), [photo, setPhoto] = useState<File | null>(null), [photoPreview, setPhotoPreview] = useState('');
  const shown = open || recovering;
  const modalRef = useModalFocus(shown);
  useEffect(() => () => { if (photoPreview) URL.revokeObjectURL(photoPreview); }, [photoPreview]);
  function accountRequest(path: string, method = 'GET', data?: unknown) { return rawAccountRequest(path, method, data, undefined, account?.id); }
  async function linkLegacy() {
    // Local histories are not merged by an identity operation. Preserve a reviewable backup first.
    const raw = studyStorage.getItem(KEY);
    if (raw) {
      const anchor = document.createElement('a'), url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      anchor.href = url; anchor.download = 'EstudaMente-antes-do-vinculo.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    await accountRequest('link-legacy', 'POST'); await refresh();
    setNotice('Identidade vinculada. A autoria antiga foi preservada. Se havia estudo nesta conta, o backup foi baixado para importar com prévia. Os dados e rascunhos de origem permanecem guardados neste navegador.');
  }
  async function perform(action: () => Promise<void>) { setBusy(true); setError(''); setNotice(''); try { await action(); } catch (err) { setError(friendlyError(err)); } finally { setBusy(false); } }
  const callbackURL = new URL(location.pathname + location.search, location.origin); callbackURL.searchParams.set('account', '1');
  const callback = callbackURL.href;
  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget), email = String(data.get('email') || ''), password = String(data.get('password') || '');
    await perform(async () => {
      if (!client) throw Error('O cadastro por e-mail e Google ainda precisa ser ativado.');
      if (mode === 'recover') { const result = await client.auth.resetPasswordForEmail(email, { redirectTo: callback }); if (result.error) throw result.error; setNotice('Se houver uma conta para esse e-mail, você receberá um link para redefinir a senha.'); }
      else if (mode === 'signup') { const result = await client.auth.signUp({ email, password, options: { emailRedirectTo: callback } }); if (result.error) throw result.error; setNotice('Confira seu e-mail para confirmar o cadastro. Se já tem conta, use Entrar ou Recuperar senha.'); }
      else { const result = await client.auth.signInWithPassword({ email, password }); if (result.error) throw result.error; }
    });
  }
  async function saveProfile(event: FormEvent) {
    event.preventDefault(); await perform(async () => {
      await accountRequest('profile', 'PUT', { name, bio, publicProfile, ranking });
      if (photo) {
        const image = await createImageBitmap(photo);
        try {
          if (image.width * image.height > 40000000) throw Error('Imagem grande demais. Escolha outra foto.');
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
          const context = canvas.getContext('2d'); if (!context) throw Error('Não foi possível preparar a foto.');
          const side = Math.min(image.width, image.height); context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 256, 256);
          const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error('Não foi possível converter a foto.')), 'image/jpeg', .85));
          await accountRequest('avatar', 'PUT', blob); setPhoto(null); setPhotoPreview('');
        } finally { image.close(); }
      }
      await refresh(); setNotice('Perfil salvo. Seus estudos continuam neste navegador; a sincronização será uma próxima etapa.');
    });
  }
  return <><button className="account-button quiet" onClick={() => setOpen(true)} aria-label={account ? 'Minha conta: ' + (account.name || 'Conta individual') : 'Entrar ou criar conta'}>{account?.avatar ? <img className="community-avatar" src={account.avatar} alt=""/> : <span aria-hidden="true">◎</span>}<span>{account?.name || (account ? 'Minha conta' : 'Entrar')}</span></button>
    {shown && <div className="overlay"><section ref={modalRef} tabIndex={-1} onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); recovered(); } }} className="modal account-modal" role="dialog" aria-modal="true" aria-labelledby="account-title"><div className="section-head"><h2 id="account-title">{recovering ? 'Escolha sua nova senha' : account ? 'Minha conta' : 'Seu espaço no EstudaMente'}</h2><button className="quiet" aria-label="Fechar conta" onClick={() => { setOpen(false); recovered(); }}>×</button></div>
      {(error || accountError) && <p className="notice error" role="alert">{error || accountError}</p>}{notice && <p className="notice" role="status">{notice}</p>}
      {recovering && client ? <form onSubmit={event => { event.preventDefault(); const password = String(new FormData(event.currentTarget).get('password')); void perform(async () => { const result = await client.auth.updateUser({ password }); if (result.error) throw result.error; recovered(); setNotice('Senha atualizada. Você já pode acessar sua conta com ela.'); }); }}><label>Nova senha<input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label><button disabled={busy}>Salvar nova senha</button></form> : account ? <>
        <p className="muted">{account.email || 'Identidade ChatGPT verificada'} · conta individual</p><form onSubmit={saveProfile}><label>Nome de exibição<input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={40} required/></label><label>Apresentação curta<textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} maxLength={220}/></label>
        <label>Foto estática<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file = e.target.files?.[0]; if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5000000)) { setError('Escolha JPEG, PNG ou WebP de até 5 MB.'); e.target.value = ''; return; } setPhoto(file || null); setPhotoPreview(file ? URL.createObjectURL(file) : ''); }}/></label><div className="account-preview"><span className="muted">Prévia</span>{(photoPreview || account.avatar) && <img className="community-avatar" src={photoPreview || account.avatar} alt="Prévia da foto"/>}<strong>{name || 'Seu nome'}</strong><p>{bio}</p></div>
        <label className="check-line"><input type="checkbox" checked={publicProfile} onChange={e => { setPublicProfile(e.target.checked); if (!e.target.checked) setRanking(false); }}/>Quero tornar nome, foto e apresentação públicos na comunidade.</label><label className="check-line"><input type="checkbox" checked={ranking} disabled={!publicProfile} onChange={e => setRanking(e.target.checked)}/>Quero participar dos rankings. Os totais só serão enviados quando eu solicitar.</label><p className="muted">Seu e-mail é privado. O cadastro começa sem perfil público e sem ranking.</p><button disabled={busy}>Salvar perfil</button></form>
        {account.avatar && <button className="quiet" disabled={busy} onClick={() => void perform(async () => { await accountRequest('avatar', 'DELETE'); await refresh(); setNotice('Foto removida.'); })}>Remover foto</button>}
        {client && account.managedLogin && <><details><summary>Acesso e recuperação</summary><p>Mantenha pelo menos um método de acesso. A remoção de métodos não está disponível nesta versão.</p><button disabled={busy} onClick={() => void perform(async () => { const result = await client.auth.resetPasswordForEmail(account.email, { redirectTo: callback }); if (result.error) throw result.error; setNotice('Solicitação de recuperação enviada. Confira seu e-mail.'); })}>Criar ou redefinir senha por e-mail</button><button className="secondary" disabled={busy} onClick={() => void perform(async () => { const result = await client.auth.linkIdentity({ provider: 'google', options: { redirectTo: callback } }); if (result.error) throw result.error; })}>Vincular meu Google</button><form onSubmit={event => { event.preventDefault(); const email = String(new FormData(event.currentTarget).get('email')); void perform(async () => { const result = await client.auth.updateUser({ email }, { emailRedirectTo: callback }); if (result.error) throw result.error; setNotice('Confirme a alteração nos e-mails enviados. Até a confirmação, use o endereço anterior.'); }); }}><label>Novo e-mail<input name="email" type="email" required autoComplete="email"/></label><button disabled={busy}>Solicitar alteração de e-mail</button></form></details>
        {!account.identities.includes('chatgpt') && <details><summary>Preservar minha identidade antiga do ChatGPT</summary><p>Comprove o acesso às duas contas. Nomes ou e-mails parecidos não unem identidades. O vínculo usa o espaço da identidade antiga. Se houver estudos no espaço atual, um backup será baixado antes da mudança para você importar com prévia.</p>{account.legacyAvailable ? <button disabled={busy} onClick={() => void perform(linkLegacy)}>Confirmar vínculo com meu ChatGPT</button> : <a className="button secondary" href={'/signin-with-chatgpt?return_to=' + encodeURIComponent(callbackURL.pathname + callbackURL.search)} target="_top">Comprovar acesso ao ChatGPT</a>}</details>}</>}
        {!account.managedLogin && client && <p>Para adicionar e-mail ou Google, saia desta conta, entre com o novo método e use “Preservar minha identidade antiga do ChatGPT”.</p>}
        <p className="muted">Ao sair, estudos e rascunhos salvos ficam separados nesta conta neste navegador. Faça backup antes de usar outro dispositivo.</p><button className="secondary" disabled={busy} onClick={() => void perform(logout)}>Sair da conta</button>
      </> : <><p>Entre para ter sua própria conta. Seu histórico local fica preservado no modo visitante e poderá ser importado com prévia em Dados e migração.</p>{client ? <><div className="actions">{([['login', 'Entrar'], ['signup', 'Criar conta'], ['recover', 'Recuperar senha']] as const).map(([key, label]) => <button type="button" className="quiet" aria-pressed={mode === key} key={key} onClick={() => setMode(key)}>{label}</button>)}</div><form onSubmit={authenticate}><label>E-mail<input name="email" type="email" autoComplete="email" required maxLength={254}/></label>{mode !== 'recover' && <label>Senha<input name="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 12 : 1} maxLength={128} required/></label>}<button disabled={busy}>{mode === 'recover' ? 'Enviar link de recuperação' : mode === 'signup' ? 'Criar conta' : 'Entrar'}</button></form><button className="secondary" disabled={busy} onClick={() => void perform(async () => { const result = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callback } }); if (result.error) throw result.error; })}>Entrar com Google</button><p className="muted">Entrar com Google identifica sua conta. A autorização do Google Agenda é feita separadamente.</p><form onSubmit={event => { event.preventDefault(); const email = String(new FormData(event.currentTarget).get('email')); void perform(async () => { const result = await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: callback } }); if (result.error) throw result.error; setNotice('Se necessário, uma nova confirmação será enviada. Confira seu e-mail.'); }); }}><details><summary>Reenviar confirmação de e-mail</summary><label>E-mail<input name="email" type="email" required/></label><button disabled={busy}>Reenviar</button></details></form></> : <p className="banner">Cadastro por e-mail e Google em preparação. O login ChatGPT continua disponível.</p>}<a className="button secondary" href={'/signin-with-chatgpt?return_to=' + encodeURIComponent(location.pathname + location.search)} target="_top">Entrar com ChatGPT</a><button className="quiet" onClick={() => setOpen(false)}>Continuar no modo visitante</button></>}
    </section></div>}
  </>;
}
