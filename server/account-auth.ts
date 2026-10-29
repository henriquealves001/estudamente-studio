export type AccountEnv = { DB?: D1Database; BUCKET?: R2Bucket; SUPABASE_URL?: string; SUPABASE_PUBLISHABLE_KEY?: string };
export type Account = { id: string; email: string; name: string; bio: string; avatar_key: string | null };
export class AccountError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export const accountJSON = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) throw new AccountError(403, 'Origem inválida. Reabra o EstudaMente.');
}
export function checkAccountDestination(request: Request, accountId: string | null) {
  const expected = request.headers.get('x-em-account');
  if ((expected && expected !== accountId) || (sessionToken(request) && !expected)) throw new AccountError(409, 'A conta mudou em outra aba. Reabra a tela antes de continuar.');
}
export async function digest(value: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map(x => x.toString(16).padStart(2, '0')).join('');
}
export function authConfig(env: AccountEnv) {
  if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return null;
  const url = new URL(env.SUPABASE_URL);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.username || url.password || url.search || url.hash) throw new AccountError(503, 'Configuração de acesso inválida.');
  // Only public keys belong in this configuration. Never expose a service-role key.
  const key = env.SUPABASE_PUBLISHABLE_KEY;
  if (!key.startsWith('sb_publishable_')) {
    try { if (JSON.parse(atob(key.split('.')[1])).role !== 'anon') throw Error(); }
    catch { throw new AccountError(503, 'Configure uma chave pública do provedor.'); }
  }
  return { url: url.origin, key };
}
export const cookieName = (request: Request) => new URL(request.url).protocol === 'https:' ? '__Host-em-session' : 'em-session';
export function sessionToken(request: Request) { return request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(cookieName(request) + '='))?.split('=')[1] || ''; }
export function sessionCookie(request: Request, token: string, age: number) {
  return `${cookieName(request)}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export async function ensureLegacy(request: Request, env: AccountEnv): Promise<Account | null> {
  // These headers are trusted ONLY behind the existing Sites identity gateway.
  const subject = request.headers.get('oai-authenticated-user-id');
  if (!subject || !env.DB) return null;
  await env.DB.prepare('INSERT OR IGNORE INTO accounts(id,email,name,bio,created_at) VALUES(?,?,?,?,?)').bind(subject, request.headers.get('oai-authenticated-user-email') || '', '', '', new Date().toISOString()).run();
  await env.DB.prepare('INSERT OR IGNORE INTO account_identities(provider,subject,account_id) VALUES(?,?,?)').bind('chatgpt', subject, subject).run();
  return env.DB.prepare('SELECT a.* FROM accounts a JOIN account_identities i ON i.account_id=a.id WHERE i.provider=? AND i.subject=?').bind('chatgpt', subject).first<Account>();
}
export async function currentAccount(request: Request, env: AccountEnv): Promise<Account | null> {
  if (!env.DB) return null;
  const token = sessionToken(request);
  if (token) {
    const account = await env.DB.prepare('SELECT a.* FROM accounts a JOIN account_sessions s ON s.account_id=a.id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token), Date.now()).first<Account>();
    // Never fall back to another identity after an expired cookie.
    return account || null;
  }
  return ensureLegacy(request, env);
}
export async function requiredAccount(request: Request, env: AccountEnv) {
  const account = await currentAccount(request, env);
  if (!account) throw new AccountError(401, 'Sua sessão terminou. Entre novamente para continuar.');
  return account;
}
export async function verifiedProviderUser(token: string, env: AccountEnv, fetcher: typeof fetch = fetch) {
  const config = authConfig(env);
  if (!config) throw new AccountError(503, 'O cadastro por e-mail e Google ainda precisa ser ativado.');
  const response = await fetcher(config.url + '/auth/v1/user', { headers: { apikey: config.key, authorization: 'Bearer ' + token }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new AccountError(401, 'Acesso expirado ou inválido. Entre novamente.');
  const user = await response.json() as { id?: string; email?: string; email_confirmed_at?: string };
  if (!user.id || !user.email_confirmed_at) throw new AccountError(401, 'Confirme seu e-mail antes de entrar.');
  // Claims are used only AFTER the issuing provider validates the token.
  let claims: { sub?: string; exp?: number; session_id?: string; iss?: string };
  try { claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { throw new AccountError(401, 'Sessão inválida.'); }
  if (claims.sub !== user.id || claims.iss !== config.url + '/auth/v1' || !claims.session_id || !claims.exp || claims.exp * 1000 <= Date.now()) throw new AccountError(401, 'Sessão inválida ou expirada.');
  return { subject: user.id, email: user.email || '', sessionId: claims.session_id, expires: claims.exp * 1000 };
}
