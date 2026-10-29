import { AccountError, accountJSON, authConfig, checkAccountDestination, currentAccount, digest, ensureLegacy, requiredAccount, sameOrigin, sessionCookie, sessionToken, verifiedProviderUser } from './account-auth.ts';
import type { AccountEnv } from './account-auth.ts';
import { checkFile } from './community-api.ts';
import { plain } from '../src/social.ts';

async function readJSON(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new AccountError(415, 'Envie dados JSON.');
  const bytes = await limitedBytes(request, 4096);
  try { return JSON.parse(new TextDecoder().decode(bytes)); } catch { throw new AccountError(400, 'Dados inválidos.'); }
}
async function limitedBytes(request: Request, max: number) {
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  if (reader) for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > max) { await reader.cancel(); throw new AccountError(413, 'Arquivo ou solicitação maior que o limite.'); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}
export async function accountAPI(request: Request, env: AccountEnv, fetcher: typeof fetch = fetch): Promise<Response> {
  try {
    const path = new URL(request.url).pathname.replace(/^\/api\/account\/?/, '') || 'me';
    if (request.method !== 'GET') sameOrigin(request);
    if (path === 'config' && request.method === 'GET') return accountJSON({ provider: authConfig(env) });
    if (!env.DB) throw new AccountError(503, 'O servidor de contas não está disponível. Seu histórico local está preservado.');
    const db = env.DB;
    if (path === 'session' && request.method === 'POST') {
      const authorization = request.headers.get('authorization') || '';
      if (!authorization.startsWith('Bearer ') || authorization.length > 10000) throw new AccountError(401, 'Entre novamente.');
      const verified = await verifiedProviderUser(authorization.slice(7), env, fetcher);
      if (await db.prepare('SELECT provider_session FROM account_revoked_sessions WHERE provider_session=?').bind(verified.sessionId).first()) throw new AccountError(401, 'Esta sessão foi encerrada. Entre novamente.');
      // Deterministic provider-scoped key avoids orphan accounts under concurrent first logins.
      const accountId = 'account-' + await digest('supabase:' + authConfig(env)!.url + ':' + verified.subject);
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO accounts(id,email,name,bio,created_at) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM account_identities WHERE provider=? AND subject=?)').bind(accountId, verified.email, '', '', new Date().toISOString(), 'supabase', verified.subject),
        db.prepare('INSERT OR IGNORE INTO account_identities(provider,subject,account_id) VALUES(?,?,?)').bind('supabase', verified.subject, accountId),
      ]);
      const identity = await db.prepare('SELECT account_id FROM account_identities WHERE provider=? AND subject=?').bind('supabase', verified.subject).first<{ account_id: string }>();
      await db.prepare('UPDATE accounts SET email=? WHERE id=?').bind(verified.email, identity!.account_id).run();
      const token = crypto.randomUUID() + crypto.randomUUID();
      // Replace only the session for this browser; other devices remain independent.
      const previous = sessionToken(request);
      await db.batch([
        db.prepare('DELETE FROM account_sessions WHERE token_hash=? OR expires_at<=?').bind(await digest(previous), Date.now()),
        db.prepare('INSERT INTO account_sessions(token_hash,account_id,provider_session,expires_at) VALUES(?,?,?,?)').bind(await digest(token), identity!.account_id, verified.sessionId, verified.expires),
      ]);
      const response = accountJSON({ ok: true, accountId: identity!.account_id });
      response.headers.set('set-cookie', sessionCookie(request, token, Math.max(1, Math.floor((verified.expires - Date.now()) / 1000))));
      return response;
    }
    if (path === 'logout' && request.method === 'POST') {
      const hash = await digest(sessionToken(request));
      const session = await db.prepare('SELECT account_id,provider_session FROM account_sessions WHERE token_hash=?').bind(hash).first<{ account_id: string; provider_session: string }>();
      if (session) checkAccountDestination(request, session.account_id);
      if (session) await db.batch([
        db.prepare('INSERT OR IGNORE INTO account_revoked_sessions(provider_session,created_at) VALUES(?,?)').bind(session.provider_session, new Date().toISOString()),
        db.prepare('DELETE FROM account_sessions WHERE provider_session=?').bind(session.provider_session),
      ]);
      const response = accountJSON({ ok: true }); response.headers.set('set-cookie', sessionCookie(request, '', 0)); return response;
    }
    const account = await currentAccount(request, env);
    if (request.method !== 'GET') checkAccountDestination(request, account?.id || null);
    if (path === 'me' && request.method === 'GET') {
      if (!account) return accountJSON({ account: null });
      const profile = await db.prepare('SELECT ranking,public_id FROM community_profiles WHERE user_id=?').bind(account.id).first<{ ranking: number; public_id: string }>();
      const identities = (await db.prepare('SELECT provider FROM account_identities WHERE account_id=?').bind(account.id).all<{ provider: string }>()).results.map(x => x.provider);
      return accountJSON({ account: { id: account.id, email: account.email, name: account.name, bio: account.bio, avatar: account.avatar_key ? '/api/account/avatar?account=' + encodeURIComponent(account.id) + '&v=' + encodeURIComponent(account.avatar_key) : '', publicProfile: !!profile, ranking: profile?.ranking === 1, identities, legacyAvailable: !!request.headers.get('oai-authenticated-user-id'), managedLogin: !!sessionToken(request) } });
    }
    await requiredAccount(request, env);
    if (path === 'link-legacy' && request.method === 'POST') {
      if (!sessionToken(request)) throw new AccountError(401, 'Entre primeiro com e-mail ou Google e depois comprove o acesso ao ChatGPT.');
      const legacy = await ensureLegacy(request, env);
      if (!legacy) throw new AccountError(401, 'Entre também no ChatGPT neste navegador para comprovar o vínculo.');
      if (legacy.id === account!.id) return accountJSON({ ok: true });
      if (await db.prepare('SELECT subject FROM account_identities WHERE provider=? AND account_id=?').bind('chatgpt', account!.id).first()) throw new AccountError(409, 'Esta conta já está vinculada a uma identidade ChatGPT. Nenhum vínculo foi substituído.');
      const occupied = await db.prepare('SELECT (SELECT COUNT(*) FROM community_profiles WHERE user_id=?)+(SELECT COUNT(*) FROM community_plans WHERE owner=?)+(SELECT COUNT(*) FROM community_members WHERE user_id=?)+(SELECT COUNT(*) FROM community_reports WHERE reporter=?) AS n').bind(account!.id, account!.id, account!.id, account!.id).first<{ n: number }>();
      if (occupied?.n) throw new AccountError(409, 'As duas contas já têm contribuições. O vínculo precisa de revisão para preservar seus perfis e autorias. Nenhum histórico foi unido.');
      const linked = await db.prepare('SELECT subject FROM account_identities WHERE provider=? AND account_id=?').bind('supabase', legacy.id).first();
      if (linked) throw new AccountError(409, 'Esta identidade ChatGPT já está vinculada a outra conta.');
      // Both identities were proved in this request. Never infer ownership from email/name.
      await db.batch([
        db.prepare('UPDATE account_identities SET account_id=? WHERE provider=? AND account_id=?').bind(legacy.id, 'supabase', account!.id),
        db.prepare('UPDATE account_sessions SET account_id=? WHERE account_id=?').bind(legacy.id, account!.id),
        db.prepare('UPDATE accounts SET email=?,name=CASE WHEN name=\'\' THEN ? ELSE name END,bio=CASE WHEN bio=\'\' THEN ? ELSE bio END,avatar_key=COALESCE(avatar_key,?) WHERE id=?').bind(account!.email, account!.name, account!.bio, account!.avatar_key, legacy.id),
      ]);
      return accountJSON({ ok: true });
    }
    if (path === 'profile' && request.method === 'PUT') {
      const data = await readJSON(request), name = plain(data.name, 40, 2), bio = plain(data.bio, 220);
      if (typeof data.publicProfile !== 'boolean' || typeof data.ranking !== 'boolean' || (data.ranking && !data.publicProfile)) throw new AccountError(400, 'Rankings precisam de um perfil público autorizado.');
      const statements = [db.prepare('UPDATE accounts SET name=?,bio=? WHERE id=?').bind(name, bio, account!.id)];
      if (data.publicProfile) statements.push(db.prepare('INSERT INTO community_profiles(user_id,public_id,name,bio,avatar_key,ranking,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,bio=excluded.bio,avatar_key=excluded.avatar_key,ranking=excluded.ranking,updated_at=excluded.updated_at').bind(account!.id, crypto.randomUUID(), name, bio, account!.avatar_key, data.ranking ? 1 : 0, new Date().toISOString()));
      else {
        const publications = await db.prepare('SELECT COUNT(*) AS n FROM community_plans WHERE owner=? AND removed=0').bind(account!.id).first<{ n: number }>();
        if (publications?.n) throw new AccountError(409, 'Retire seus planos publicados antes de tornar o perfil privado. A autoria das cópias já adotadas será preservada.');
        statements.push(db.prepare('DELETE FROM community_profiles WHERE user_id=?').bind(account!.id));
      }
      if (!data.ranking) statements.push(db.prepare('DELETE FROM community_daily WHERE user_id=?').bind(account!.id));
      await db.batch(statements); return accountJSON({ ok: true });
    }
    if (path === 'avatar' && request.method === 'GET') {
      const expected = new URL(request.url).searchParams.get('account');
      if (expected && expected !== account!.id) throw new AccountError(404, 'Foto não encontrada.');
      if (!account!.avatar_key || !env.BUCKET) throw new AccountError(404, 'Foto não encontrada.');
      const object = await env.BUCKET.get(account!.avatar_key);
      if (!object) throw new AccountError(404, 'Foto não encontrada.');
      return new Response(object.body, { headers: { 'content-type': object.httpMetadata?.contentType || 'image/jpeg', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox" } });
    }
    if (path === 'avatar' && ['PUT', 'DELETE'].includes(request.method)) {
      let key: string | null = null;
      if (request.method === 'PUT') {
        if (!env.BUCKET) throw new AccountError(503, 'Upload indisponível.');
        const bytes = await limitedBytes(request, 300000), type = checkFile(bytes, 'avatar');
        key = 'account-avatars/' + account!.id + '/' + crypto.randomUUID();
        await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: type } });
      }
      try { await db.batch([
        db.prepare('UPDATE accounts SET avatar_key=? WHERE id=?').bind(key, account!.id),
        db.prepare('UPDATE community_profiles SET avatar_key=? WHERE user_id=?').bind(key, account!.id),
      ]); } catch (error) { if (key) await env.BUCKET?.delete(key); throw error; }
      if (account!.avatar_key) await env.BUCKET?.delete(account!.avatar_key);
      return accountJSON({ ok: true });
    }
    return accountJSON({ error: 'Operação não encontrada.' }, 404);
  } catch (error) {
    if (error instanceof AccountError) return accountJSON({ error: error.message }, error.status);
    if (error instanceof Error && /Texto inválido|caracteres|Escolha uma foto/.test(error.message)) return accountJSON({ error: error.message }, 400);
    return accountJSON({ error: 'Não foi possível concluir a operação da conta. Tente novamente.' }, 503);
  }
}
