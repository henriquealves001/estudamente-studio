import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { accountAPI } from '../server/account-api.ts';
import { communityAPI } from '../server/community-api.ts';
import { digest } from '../server/account-auth.ts';
import type { AccountEnv } from '../server/account-auth.ts';
import { scopedStorage } from '../src/accountStorage.ts';
import { saoPauloDate } from '../src/social.ts';
const origin = 'https://study.test';
function environment() {
  const sql = new DatabaseSync(':memory:');
  for (const file of readdirSync(new URL('../drizzle', import.meta.url)).filter(x => x.endsWith('.sql')).sort()) sql.exec(readFileSync(new URL('../drizzle/' + file, import.meta.url), 'utf8'));
  function prepare(query: string) { let args: unknown[] = []; return { bind(...values: unknown[]) { args = values; return this; }, async first() { return sql.prepare(query).get(...args as never[]) || null; }, async all() { return { results: sql.prepare(query).all(...args as never[]) }; }, async run() { return { meta: { changes: Number(sql.prepare(query).run(...args as never[]).changes) } }; } }; }
  const files = new Map<string, { body: Uint8Array; httpMetadata: { contentType: string } }>();
  const env = { SUPABASE_URL: 'https://provider.test', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', DB: { prepare, async batch(statements: { run: () => Promise<unknown> }[]) { sql.exec('BEGIN'); try { const result = []; for (const s of statements) result.push(await s.run()); sql.exec('COMMIT'); return result; } catch (err) { sql.exec('ROLLBACK'); throw err; } } }, BUCKET: { async put(key: string, body: Uint8Array, options: { httpMetadata: { contentType: string } }) { files.set(key, { body, ...options }); }, async get(key: string) { return files.get(key) || null; }, async delete(key: string) { files.delete(key); } } } as unknown as AccountEnv;
  return { sql, env, files };
}
function req(path: string, method = 'GET', cookie = '', data?: unknown, headers: Record<string, string> = {}) { return new Request(origin + '/api/' + path, { method, headers: { ...(method === 'GET' ? {} : { origin }), ...(cookie ? { cookie } : {}), ...(data ? { 'content-type': 'application/json' } : {}), ...headers }, body: data ? JSON.stringify(data) : undefined }); }
function token(subject: string, sid = 'session-' + subject, exp = Math.floor(Date.now() / 1000) + 3600) { return 'header.' + btoa(JSON.stringify({ sub: subject, session_id: sid, exp, iss: 'https://provider.test/auth/v1' })) + '.signature'; }
const provider: typeof fetch = async (_url, options) => {
  const access = new Headers(options?.headers).get('authorization') || '';
  if (!access.includes('.signature')) return new Response('{}', { status: 401 });
  const claims = JSON.parse(atob(access.split('.')[1]));
  return Response.json({ id: claims.sub, email: claims.sub + '@example.test', email_confirmed_at: '2026-10-29' });
};
async function login(env: AccountEnv, subject: string, cookie = '') {
  const response = await accountAPI(req('account/session', 'POST', cookie, undefined, { authorization: 'Bearer ' + token(subject) }), env, provider);
  assert.equal(response.status, 200); const body = await response.json() as { accountId: string };
  return { cookie: response.headers.get('set-cookie')!.split(';')[0], id: body.accountId };
}
test('E2: sessão validada pelo provedor, cookie protegido e cadastro privado por padrão', async () => {
  const { env, sql } = environment();
  const response = await accountAPI(req('account/session', 'POST', '', undefined, { authorization: 'Bearer ' + token('alice') }), env, provider);
  assert.equal(response.status, 200); const cookie = response.headers.get('set-cookie')!;
  assert.match(cookie, /__Host-em-session=/); assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Lax/);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM community_profiles').get()!.n, 0);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM community_daily').get()!.n, 0);
  const me = await (await accountAPI(req('account/me', 'GET', cookie.split(';')[0]), env)).json() as { account: { publicProfile: boolean; ranking: boolean } };
  assert.equal(me.account.publicProfile, false); assert.equal(me.account.ranking, false);
  assert.equal(sql.prepare('SELECT token_hash FROM account_sessions').get()!.token_hash, await digest(cookie.split(';')[0].split('=')[1]));
});
test('E2: token forjado, e-mail não confirmado, acesso expirado e origem externa são recusados', async () => {
  const { env } = environment();
  assert.equal((await accountAPI(req('account/session', 'POST', '', undefined, { authorization: 'Bearer forged' }), env, provider)).status, 401);
  const unconfirmed: typeof fetch = async () => Response.json({ id: 'alice', email: 'alice@example.test' });
  assert.equal((await accountAPI(req('account/session', 'POST', '', undefined, { authorization: 'Bearer ' + token('alice') }), env, unconfirmed)).status, 401);
  assert.equal((await accountAPI(req('account/session', 'POST', '', undefined, { authorization: 'Bearer ' + token('alice', 'expired', 1) }), env, provider)).status, 401);
  assert.equal((await accountAPI(req('account/session', 'POST', '', undefined, { origin: 'https://evil.test', authorization: 'Bearer ' + token('alice') }), env, provider)).status, 403);
  assert.equal((await accountAPI(req('account/profile', 'PUT', '', { name: 'Alice', bio: '', publicProfile: false, ranking: false }), env)).status, 401);
});
test('E2: nomes iguais não unem contas e identidade é estável em outro navegador', async () => {
  const { env } = environment(), alice = await login(env, 'alice'), bob = await login(env, 'bob');
  for (const user of [alice, bob]) assert.equal((await accountAPI(req('account/profile', 'PUT', user.cookie, { name: 'Mesmo nome', bio: '', publicProfile: false, ranking: false, userId: alice.id }, { 'x-em-account': user.id }), env)).status, 200);
  assert.notEqual(alice.id, bob.id); const other = await login(env, 'alice'); assert.equal(other.id, alice.id); assert.notEqual(other.cookie, alice.cookie);
  const bobMe = await (await accountAPI(req('account/me?owner=' + alice.id, 'GET', bob.cookie), env)).json() as { account: { id: string; email: string } };
  assert.equal(bobMe.account.id, bob.id); assert.equal(bobMe.account.email, 'bob@example.test');
});
test('E2: conta antiga não é destino de operação pendente após troca; exclusão e grupos são protegidos', async () => {
  const { env, sql } = environment(), alice = await login(env, 'alice'), bob = await login(env, 'bob');
  for (const user of [alice, bob]) await accountAPI(req('account/profile', 'PUT', user.cookie, { name: 'Pessoa', bio: '', publicProfile: true, ranking: false }, { 'x-em-account': user.id }), env);
  assert.equal((await accountAPI(req('account/profile', 'PUT', bob.cookie, { name: 'Alterado', bio: '', publicProfile: false, ranking: false }, { 'x-em-account': alice.id }), env)).status, 409);
  const group = await (await communityAPI(req('community/groups', 'POST', alice.cookie, { name: 'Grupo privado' }, { 'x-em-account': alice.id }), env)).json() as { id: string };
  assert.equal((await communityAPI(req('community/ranking?group=' + group.id, 'GET', bob.cookie), env)).status, 403);
  assert.equal((await communityAPI(req('community/rotate-invite/' + group.id, 'POST', bob.cookie, undefined, { 'x-em-account': bob.id }), env)).status, 404);
  sql.prepare('INSERT INTO community_plans(id,owner,title,organization,edition,source_url,description,plan_json,subjects,topics,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run('plan', alice.id, 'Plano', 'Órgão', '2026', 'https://example.test', '', '{}', 1, 1, '2026');
  assert.equal((await communityAPI(req('community/plans/plan', 'DELETE', bob.cookie, undefined, { 'x-em-account': bob.id }), env)).status, 404);
  assert.equal((await communityAPI(req('community/plans/plan', 'DELETE', alice.cookie, undefined, { 'x-em-account': alice.id }), env)).status, 200);
});
test('E2: logout revoga cookie e token da sessão, sem encerrar outro navegador', async () => {
  const { env } = environment(), alice = await login(env, 'alice');
  const secondResponse = await accountAPI(req('account/session', 'POST', '', undefined, { authorization: 'Bearer ' + token('alice', 'other-device') }), env, provider);
  const secondCookie = secondResponse.headers.get('set-cookie')!.split(';')[0];
  assert.equal((await accountAPI(req('account/logout', 'POST', alice.cookie, undefined, { 'x-em-account': alice.id }), env)).status, 200);
  assert.equal((await accountAPI(req('account/profile', 'PUT', alice.cookie, { name: 'Alice', bio: '', publicProfile: false, ranking: false }, { 'x-em-account': alice.id }), env)).status, 409);
  assert.equal((await accountAPI(req('account/session', 'POST', '', undefined, { authorization: 'Bearer ' + token('alice') }), env, provider)).status, 401);
  const other = await (await accountAPI(req('account/me', 'GET', secondCookie), env)).json() as { account: { id: string } }; assert.equal(other.account.id, alice.id);
});
test('E2: cookie vencido não usa identidade ChatGPT de outra conta como fallback', async () => {
  const { env, sql } = environment(), alice = await login(env, 'alice');
  sql.prepare('UPDATE account_sessions SET expires_at=0').run();
  const me = await (await accountAPI(req('account/me', 'GET', alice.cookie, undefined, { 'oai-authenticated-user-id': 'legacy-bob' }), env)).json() as { account: null }; assert.equal(me.account, null);
  assert.equal((await accountAPI(req('account/logout', 'POST', alice.cookie, undefined, { 'x-em-account': alice.id }), env)).status, 200);
});
test('E2: perfil/foto privados não vazam, exposição exige consentimento e ranking pode ser retirado', async () => {
  const { env, sql } = environment(), alice = await login(env, 'alice'), bob = await login(env, 'bob');
  await accountAPI(req('account/profile', 'PUT', alice.cookie, { name: 'Alice', bio: 'Minha bio', publicProfile: false, ranking: false }, { 'x-em-account': alice.id }), env);
  const photo = new Request(origin + '/api/account/avatar', { method: 'PUT', headers: { origin, cookie: alice.cookie, 'x-em-account': alice.id }, body: new Uint8Array([255,216,255,0]) });
  assert.equal((await accountAPI(photo, env)).status, 200);
  assert.equal((await accountAPI(req('account/avatar', 'GET', bob.cookie), env)).status, 404);
  assert.equal((await accountAPI(req('account/avatar', 'GET', alice.cookie), env)).status, 200);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM community_profiles').get()!.n, 0);
  await accountAPI(req('account/profile', 'PUT', alice.cookie, { name: 'Alice', bio: 'Minha bio', publicProfile: true, ranking: true }, { 'x-em-account': alice.id }), env);
  await communityAPI(req('community/totals', 'PUT', alice.cookie, { days: [{ date: saoPauloDate(), minutes: 1, questions: 1 }] }, { 'x-em-account': alice.id }), env);
  const board = await (await communityAPI(req('community/ranking'), env)).json() as { rows: unknown[] }; assert.equal(board.rows.length, 1);
  const publicData = JSON.stringify(board); assert.equal(publicData.includes('alice@example.test'), false); assert.equal(publicData.includes(alice.id), false);
  await accountAPI(req('account/profile', 'PUT', alice.cookie, { name: 'Alice', bio: '', publicProfile: false, ranking: false }, { 'x-em-account': alice.id }), env);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM community_profiles').get()!.n, 0);
});
test('E2: vínculo legado exige as duas identidades e preserva chave/autoria antiga', async () => {
  const { env, sql } = environment(), alice = await login(env, 'alice');
  const headers = { 'x-em-account': alice.id };
  assert.equal((await accountAPI(req('account/link-legacy', 'POST', alice.cookie, undefined, headers), env)).status, 401);
  await communityAPI(req('community/profile', 'PUT', '', { name: 'Perfil antigo', bio: '', ranking: false, consent: true }, { 'oai-authenticated-user-id': 'legacy-alice' }), env);
  assert.equal((await accountAPI(req('account/link-legacy', 'POST', alice.cookie, undefined, { ...headers, 'oai-authenticated-user-id': 'legacy-alice' }), env)).status, 200);
  assert.equal(sql.prepare('SELECT account_id FROM account_identities WHERE provider=? AND subject=?').get('supabase', 'alice')!.account_id, 'legacy-alice');
  const next = await login(env, 'alice'); assert.equal(next.id, 'legacy-alice');
  assert.equal(sql.prepare('SELECT name FROM community_profiles WHERE user_id=?').get('legacy-alice')!.name, 'Perfil antigo');
});
test('E2: vínculo recusa fusão automática de duas contas com contribuições', async () => {
  const { env } = environment(), alice = await login(env, 'alice');
  await accountAPI(req('account/profile', 'PUT', alice.cookie, { name: 'Alice', bio: '', publicProfile: true, ranking: false }, { 'x-em-account': alice.id }), env);
  assert.equal((await accountAPI(req('account/link-legacy', 'POST', alice.cookie, undefined, { 'x-em-account': alice.id, 'oai-authenticated-user-id': 'legacy-alice' }), env)).status, 409);
});
test('E2: dados locais, rascunhos e cronômetros ficam separados sem apagar o visitante', () => {
  const values = new Map<string,string>([['study','guest-history']]);
  const storage = { getItem: (k: string) => values.get(k) || null, setItem: (k: string, v: string) => { values.set(k,v); }, removeItem: (k: string) => { values.delete(k); } };
  const guest = scopedStorage(storage, null), alice = scopedStorage(storage, 'a'), bob = scopedStorage(storage, 'b');
  for (const key of ['study','timer','session','calendar']) { alice.setItem(key,'alice-secret'); assert.equal(bob.getItem(key),null); }
  bob.setItem('study','bob-history'); assert.equal(alice.getItem('study'),'alice-secret'); assert.equal(guest.getItem('study'),'guest-history');
  alice.removeItem('timer'); assert.equal(bob.getItem('study'),'bob-history'); assert.equal(alice.getItem('study'),'alice-secret');
});
test('E2: serviço não configurado mantém modo legado e configuração rejeita chaves secretas', async () => {
  const { env } = environment();
  const config = await (await accountAPI(req('account/config'), { DB: env.DB })).json() as { provider: null }; assert.equal(config.provider, null);
  assert.equal((await accountAPI(req('account/config'), { ...env, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_never_expose' })).status, 503);
});
