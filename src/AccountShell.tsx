import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { AccountContext, accountRequest } from './AccountContext';
import type { OwnAccount } from './AccountContext';
import { scopedStorage } from './accountStorage';
import { StudyStorageContext } from './StudyStorageContext';

export default function AccountShell({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<OwnAccount | null | undefined>(), [client, setClient] = useState<SupabaseClient | null>(null), [error, setError] = useState(''), [recovering, setRecovering] = useState(false), [attempt, setAttempt] = useState(0);
  const signingOut = useRef(false);
  const [accountOpen, setAccountOpen] = useState(() => new URLSearchParams(location.search).has('account'));
  async function refresh() { const result = await accountRequest<{ account: OwnAccount | null }>('me'); setAccount(result.account); }
  useEffect(() => {
    let active = true, unsubscribe = () => {}; let queue = Promise.resolve(); let previousSubject: string | null | undefined;
    const callbackError = new URLSearchParams(location.hash.slice(1)).get('error_description') || new URLSearchParams(location.search).get('error_description');
    function synchronize(session: Session | null) {
      if (!active || signingOut.current) return;
      const subject = session?.user.id || null;
      if (subject !== previousSubject) setAccount(undefined);
      previousSubject = subject;
      queue = queue.catch(() => {}).then(async () => {
        if (!active) return;
        try {
          if (session) await accountRequest('session', 'POST', undefined, session.access_token);
          const result = await accountRequest<{ account: OwnAccount | null }>('me');
          if (active) setAccount(result.account);
        } catch (err) { if (active) setError((err as Error).message); }
      });
    }
    void accountRequest<{ provider: { url: string; key: string } | null }>('config').then(async ({ provider }) => {
      if (!active) return;
      if (callbackError) { setError('O link de acesso venceu ou já foi usado. Solicite um novo link em Recuperar senha.'); history.replaceState(null, '', location.pathname + location.search.split('&error')[0]); }
      if (!provider) { synchronize(null); return; }
      const auth = createClient(provider.url, provider.key, { auth: { storageKey: 'em-auth-' + new URL(provider.url).hostname, flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
      setClient(auth);
      const subscription = auth.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && active) setRecovering(true);
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT' || event === 'PASSWORD_RECOVERY') synchronize(session);
      });
      unsubscribe = () => { subscription.data.subscription.unsubscribe(); auth.auth.stopAutoRefresh(); };
    }).catch(err => { if (active) setError((err as Error).message); });
    return () => { active = false; unsubscribe(); };
  }, [attempt]);
  const scope = account?.id || null;
  const storage = useMemo(() => ({ local: scopedStorage(window.localStorage, scope), session: scopedStorage(window.sessionStorage, scope) }), [scope]);
  async function logout() {
    const previous = account;
    signingOut.current = true;
    setAccount(undefined);
    try {
      await accountRequest('logout', 'POST', undefined, undefined, previous?.id);
      if (client) { const result = await client.auth.signOut({ scope: 'local' }); if (result.error) throw result.error; }
      if (previous?.legacyAvailable) { window.location.assign('/signout-with-chatgpt?return_to=' + encodeURIComponent(location.pathname + location.search)); return; }
      setAccount(null); setRecovering(false); setError('');
    } catch (err) { setError((err as Error).message); /* Keep the workspace hidden until identity is known again. */ }
    finally { signingOut.current = false; }
  }
  if (account === undefined) return <div className="empty" role="status">{error || 'Conferindo sua conta…'}{error && <button onClick={() => { setError(''); setAttempt(x => x + 1); }}>Tentar novamente</button>}</div>;
  return <AccountContext.Provider value={{ account, client, recovering, error, refresh, logout, recovered: () => setRecovering(false), accountOpen, setAccountOpen }}><StudyStorageContext.Provider key={scope || 'local'} value={storage}>{children}</StudyStorageContext.Provider></AccountContext.Provider>;
}
