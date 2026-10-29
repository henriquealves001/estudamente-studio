import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Contest } from './domain';
import { useStudyStorage } from './StudyStorageContext';
import { defaultOptions, validateCalendarOptions, revisionEvents, calendarICS, googleCalendarLink, loadGoogleIdentity, authorizeGoogle, ensureAppCalendar, syncRevisionEvents, CalendarApiError } from './calendar';
const clientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
const cacheKey = 'estudamente-google-calendars-' + clientId;
function download(content: string) { const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = 'EstudaMente-revisoes.ics'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
export default function CalendarPanel({ c, onChange }: {
    c: Contest;
    onChange: (c: Contest) => boolean;
}) {
    const localStorage = useStudyStorage();
    const [options, setOptions] = useState(c.calendarOptions || defaultOptions()), [message, setMessage] = useState(''), [ready, setReady] = useState(false), [connected, setConnected] = useState(false), [busy, setBusy] = useState(false);
    const token = useRef<{
        token: string;
        expires: number;
    } | null>(null), synchronizing = useRef(false), knownId = useRef('');
    const result = useMemo(() => { try {
        return { ...revisionEvents(c, options), error: '' };
    }
    catch (e) {
        return { events: [], skipped: 0, error: String(e) };
    } }, [c, options]);
    useEffect(() => { if (!clientId)
        return; let alive = true; loadGoogleIdentity().then(() => { if (alive)
        setReady(true); }).catch(e => { if (alive)
        setMessage(String(e)); }); return () => { alive = false; token.current = null; }; }, []);
    function save(e: FormEvent) { e.preventDefault(); try {
        validateCalendarOptions(options);
        if (onChange({ ...c, calendarOptions: options }))
            setMessage('Horário e lembretes salvos. Confira a prévia antes de enviar.');
        else
            setMessage('Não foi possível salvar as preferências da agenda.');
    }
    catch (e) {
        setMessage(String(e));
    } }
    async function connect() { try {
        const response = await authorizeGoogle(clientId);
        token.current = response;
        setConnected(true);
        setMessage('Conta conectada. Clique em sincronizar para criar ou atualizar os lembretes.');
    }
    catch (e) {
        setMessage(String(e));
    } }
    async function sync() {
        if (synchronizing.current)
            return;
        try {
            if (!token.current || token.current.expires <= Date.now()) {
                token.current = null;
                setConnected(false);
                throw Error('Conecte sua conta novamente para enviar os lembretes.');
            }
            if (result.error)
                throw Error(result.error);
            synchronizing.current = true;
            setBusy(true);
            const access = token.current.token;
            let cached: string[] = [];
            try {
                const stored: unknown = JSON.parse(localStorage.getItem(cacheKey) || '[]');
                if (Array.isArray(stored))
                    cached = stored.filter((x): x is string => typeof x === 'string');
            }
            catch { /* Cache local opcional. */ }
            const id = await ensureAppCalendar(access, knownId.current ? [knownId.current, ...cached] : cached, options.zone);
            knownId.current = id;
            try {
                localStorage.setItem(cacheKey, JSON.stringify([...new Set([...cached, id])]));
            }
            catch {
                throw Error('A agenda foi preparada, mas o navegador não guardou seu identificador. Libere espaço e tente novamente nesta aba. Não foram enviados novos eventos.');
            }
            const progress = await syncRevisionEvents(access, id, c.id, result.events);
            setMessage(`${progress.completed} revisão(ões) enviadas/atualizadas; ${progress.cancelled} lembrete(s) futuro(s) desatualizado(s) cancelado(s), somente neste concurso. Abra o Google Agenda para conferir as notificações.`);
        }
        catch (e) {
            setMessage(e instanceof CalendarApiError ? `${e.message} ${e.completed} revisão(ões) já concluídas nesta tentativa. Repetir a sincronização usa os mesmos identificadores.` : String(e));
        }
        finally {
            synchronizing.current = false;
            setBusy(false);
        }
    }
    return <section className="card calendar-panel"><div className="section-head"><div><div className="eyebrow">LEMBRAR NA HORA CERTA</div><h2>Revisões no Google Agenda</h2><p>Escolha um horário e confira as próximas revisões. As atrasadas vão para o próximo horário futuro disponível.</p></div><span className="pill">{result.events.length} revisões na prévia</span></div>
 <form onSubmit={save}><div className="calendar-options"><label>Começar às<input type="time" required value={options.time} onChange={e => setOptions({ ...options, time: e.target.value })}/></label><label>Duração por assunto (min)<input type="number" min="5" max="120" required value={options.duration} onChange={e => setOptions({ ...options, duration: Number(e.target.value) })}/></label><label>Avisar antes (min)<input type="number" min="0" max="40320" required value={options.reminder} onChange={e => setOptions({ ...options, reminder: Number(e.target.value) })}/></label><label>Próximos dias<input type="number" min="1" max="365" required value={options.horizon} onChange={e => setOptions({ ...options, horizon: Number(e.target.value) })}/></label><label>Fuso horário<input list="calendar-zones" value={options.zone} onChange={e => setOptions({ ...options, zone: e.target.value })} required/><datalist id="calendar-zones"><option>America/Sao_Paulo</option><option>America/Manaus</option><option>America/Rio_Branco</option><option>Europe/Lisbon</option><option>UTC</option></datalist></label></div><button className="secondary" type="submit" disabled={busy}>Salvar preferências da agenda</button></form>
 {(message || result.error) && <div className={'notice ' + (result.error ? 'error' : '')} role="status">{result.error || message}</div>}
 <div className="calendar-methods"><div><h3>Usar agora</h3><p>Adicione uma revisão pelo botão ao lado dela ou baixe o arquivo para importar no Google Agenda.</p><button disabled={!!result.error || !result.events.length} onClick={async () => { try {
        download(await calendarICS(result.events));
        setMessage('Arquivo gerado. No Google Agenda, abra Configurações → Importar e exportar. Confira os avisos após importar.');
    }
    catch (e) {
        setMessage(String(e));
    } }}>↓ Baixar agenda com lembretes (.ics)</button><p className="muted">Arquivo e botões são envios pontuais; alterações futuras precisam de novo envio. Reimportar arquivos ou salvar o mesmo link novamente pode duplicar eventos. Confira os avisos na agenda de destino.</p></div><div><h3>Conexão direta</h3><p>Envia e atualiza lembretes em uma agenda separada chamada EstudaMente · Revisões. Não altera sua agenda principal.</p>{clientId ? <><button disabled={!ready || busy} onClick={connect}>{connected ? 'Reconectar conta Google' : 'Conectar minha conta Google'}</button><button className="secondary" disabled={!connected || busy || !!result.error} onClick={sync}>{busy ? 'Sincronizando…' : `Sincronizar ${result.events.length} revisão(ões)`}</button>{connected && <button className="quiet" disabled={busy} onClick={() => { const current = token.current; token.current = null; setConnected(false); if (current)
        window.google?.accounts.oauth2.revoke(current.token, () => { }); setMessage('Conexão encerrada. Eventos já enviados continuam no seu Google Agenda.'); }}>Desconectar</button>}</> : <div className="banner">A conexão direta ainda precisa ser ativada pelo responsável pelo aplicativo. Os botões individuais e o arquivo de agenda já estão disponíveis.</div>}<p className="muted">A sincronização acontece ao clicar no botão, com o aplicativo aberto. Ela atualiza a próxima revisão e cancela somente lembretes futuros deste concurso que saíram da prévia. O Google entrega os avisos mesmo com o Studio fechado, conforme as permissões e notificações do seu dispositivo.</p></div></div>
 {result.events.length > 0 ? <div className="calendar-preview">{result.events.slice(0, 20).map(e => <div className="list-row" key={e.key}><div><strong>{e.summary}</strong><small>{new Date(e.start).toLocaleString('pt-BR', { timeZone: options.zone, dateStyle: 'short', timeStyle: 'short' })} · {options.zone}{e.originalDate !== e.date ? ' · reagendada da data ' + e.originalDate.split('-').reverse().join('/') : ''}</small></div><a className="button secondary" href={googleCalendarLink(e)} target="_blank" rel="noopener noreferrer">Adicionar no Google Agenda ↗</a></div>)}{result.events.length > 20 && <p className="muted">Exibindo 20 de {result.events.length} revisões. O arquivo e a sincronização incluem toda a prévia.</p>}</div> : <div className="empty">Nenhuma revisão nesse horizonte. Registre um estudo ou uma tentativa para iniciar as revisões.</div>}
 {result.skipped > 0 && <p className="muted">{result.skipped} revisão(ões) fora do horizonte escolhido ou sem encaixe antes da data da prova.</p>}
 </section>;
}
