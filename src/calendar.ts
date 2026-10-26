import { plus, today, reviewDue, validDate } from './domain.ts';
import type { Contest } from './domain.ts';
export type CalendarOptions = {
    time: string;
    zone: string;
    duration: number;
    reminder: number;
    horizon: number;
};
export const defaultCalendarOptions: CalendarOptions = { time: '19:00', zone: 'America/Sao_Paulo', duration: 15, reminder: 15, horizon: 30 };
export type RevisionEvent = {
    key: string;
    topicId: string;
    contestId: string;
    summary: string;
    description: string;
    start: string;
    end: string;
    zone: string;
    reminder: number;
    originalDate: string;
    date: string;
};
export function validateCalendarOptions(o: CalendarOptions) { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(o.time) || !Number.isInteger(o.duration) || o.duration < 5 || o.duration > 120 || !Number.isInteger(o.reminder) || o.reminder < 0 || o.reminder > 40320 || !Number.isInteger(o.horizon) || o.horizon < 1 || o.horizon > 365)
    throw Error('Confira horário, duração, antecedência e horizonte da agenda.'); try {
    new Intl.DateTimeFormat('en', { timeZone: o.zone }).format();
}
catch {
    throw Error('Informe um fuso horário válido, como America/Sao_Paulo.');
} }
function parts(timestamp: number, zone: string) { const p = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(timestamp)); const get = (key: string) => Number(p.find(x => x.type === key)?.value); return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')); }
export function zonedTime(date: string, time: string, zone: string) { if (!validDate(date))
    throw Error('Data inválida.'); const target = Date.parse(date + 'T' + time + ':00Z'); if (!Number.isFinite(target))
    throw Error('Horário inválido.'); let guess = target; for (let i = 0; i < 5; i++) {
    const difference = target - parts(guess, zone);
    if (!difference)
        return new Date(guess).toISOString();
    guess += difference;
} throw Error('Esse horário não existe no fuso selecionado. Escolha outro horário.'); }
function dayInZone(now: Date, zone: string) { const p = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now); return ['year', 'month', 'day'].map(k => p.find(x => x.type === k)!.value).join('-'); }
export function revisionEvents(c: Contest, options: CalendarOptions, now = new Date()) {
    validateCalendarOptions(options);
    const current = dayInZone(now, options.zone), end = plus(current, options.horizon), rows = c.topics.filter(t => c.subjects.some(s => s.id === t.subjectId && s.active)).map(t => reviewDue(c, t)).filter(r => r !== null).sort((a, b) => a.date.localeCompare(b.date) || a.topic.id.localeCompare(b.topic.id));
    const cursors = new Map<string, number>();
    const events: RevisionEvent[] = [];
    let skipped = 0;
    for (const r of rows) {
        if (r.date > end) {
            skipped++;
            continue;
        }
        let date = r.date < current ? current : r.date;
        let start = '';
        for (let tries = 0; tries <= options.horizon + 2; tries++) {
            const baseline = zonedTime(date, options.time, options.zone), offset = cursors.get(date) || 0;
            const candidate = new Date(Date.parse(baseline) + offset * 60000), finish = new Date(+candidate + options.duration * 60000);
            if (+candidate <= +now) {
                date = plus(date, 1);
                continue;
            }
            if (dayInZone(finish, options.zone) !== date) {
                date = plus(date, 1);
                continue;
            }
            start = candidate.toISOString();
            cursors.set(date, offset + options.duration);
            break;
        }
        if (!start || date > end || c.examDate && date >= c.examDate) {
            skipped++;
            continue;
        }
        events.push({ key: c.id + '|' + r.topic.id, topicId: r.topic.id, contestId: c.id, summary: 'Revisar: ' + r.topic.title, description: `${c.name}\n${c.subjects.find(s => s.id === r.topic.subjectId)?.name || ''}\n${r.topic.title}\nRevisão prevista no EstudaMente. Data original: ${r.date}. Registre a revisão no aplicativo após estudar.`, start, end: new Date(Date.parse(start) + options.duration * 60000).toISOString(), zone: options.zone, reminder: options.reminder, originalDate: r.date, date });
    }
    return { events, skipped };
}
const icsEscape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
const icsDate = (s: string) => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
function foldLine(line: string) { let out = '', bytes = 0; for (const character of line) {
    const size = new TextEncoder().encode(character).length;
    if (bytes + size > 75) {
        out += '\r\n ';
        bytes = 1;
    }
    out += character;
    bytes += size;
} return out; }
export async function eventId(key: string) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)); return 'em' + Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join(''); }
export async function calendarICS(events: RevisionEvent[], now = new Date()) {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//EstudaMente//Studio6//PT-BR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:EstudaMente - Revisões'];
    for (const e of events) {
        lines.push('BEGIN:VEVENT', 'UID:' + await eventId(e.key) + '@estudamente', 'DTSTAMP:' + icsDate(now.toISOString()), 'LAST-MODIFIED:' + icsDate(now.toISOString()), 'DTSTART:' + icsDate(e.start), 'DTEND:' + icsDate(e.end), 'SUMMARY:' + icsEscape(e.summary), 'DESCRIPTION:' + icsEscape(e.description), 'BEGIN:VALARM', 'TRIGGER:-PT' + e.reminder + 'M', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEscape(e.summary), 'END:VALARM', 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    return lines.map(foldLine).join('\r\n') + '\r\n';
}
export function googleCalendarLink(e: RevisionEvent) { const query = new URLSearchParams({ action: 'TEMPLATE', text: e.summary, details: e.description, dates: icsDate(e.start) + '/' + icsDate(e.end), ctz: e.zone }); return 'https://calendar.google.com/calendar/render?' + query.toString(); }
export function googleEvent(e: RevisionEvent) { return { summary: e.summary, description: e.description, start: { dateTime: e.start, timeZone: e.zone }, end: { dateTime: e.end, timeZone: e.zone }, reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: e.reminder }] }, extendedProperties: { private: { estudamente: 'studio6', contestId: e.contestId, topicId: e.topicId } }, status: 'confirmed', transparency: 'transparent' }; }
export class CalendarApiError extends Error {
    status: number;
    completed: number;
    constructor(message: string, status: number, completed = 0) { super(message); this.status = status; this.completed = completed; }
}
export type CalendarRequest = (url: string, init: RequestInit) => Promise<{
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
}>;
const record = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' ? v as Record<string, unknown> : {};
async function api(request: CalendarRequest, token: string, path: string, method = 'GET', body?: unknown) { const response = await request('https://www.googleapis.com/calendar/v3/' + path, { method, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); let data: unknown = {}; try {
    data = await response.json();
}
catch { /* DELETE/empty response. */ } if (!response.ok)
    throw new CalendarApiError(response.status === 401 ? 'A conexão expirou. Conecte sua conta novamente.' : response.status === 403 ? 'O Google recusou a permissão. Confira a autorização e a ativação da Calendar API.' : 'O Google não concluiu a operação (' + response.status + '). Tente novamente.', response.status); return record(data); }
export async function ensureAppCalendar(token: string, savedId: string | string[], zone: string, request: CalendarRequest = fetch) {
    for (const id of [...new Set(Array.isArray(savedId) ? savedId : savedId ? [savedId] : [])]) {
        try {
            await api(request, token, 'calendars/' + encodeURIComponent(id));
            return id;
        }
        catch (e) {
            if (!(e instanceof CalendarApiError) || ![403, 404, 410].includes(e.status))
                throw e;
        }
    }
    const created = await api(request, token, 'calendars', 'POST', { summary: 'EstudaMente · Revisões', description: 'Agenda separada de lembretes de revisão do EstudaMente Studio.', timeZone: zone });
    if (typeof created.id !== 'string')
        throw Error('O Google não retornou o identificador da agenda.');
    return created.id;
}
export async function syncRevisionEvents(token: string, calendarId: string, contestId: string, events: RevisionEvent[], request: CalendarRequest = fetch, now = new Date()) {
    const base = 'calendars/' + encodeURIComponent(calendarId) + '/events';
    let page = '';
    const existing: Record<string, unknown>[] = [];
    do {
        const query = new URLSearchParams({ timeMin: now.toISOString(), maxResults: '250', singleEvents: 'true', showDeleted: 'false' });
        query.append('privateExtendedProperty', 'estudamente=studio6');
        query.append('privateExtendedProperty', 'contestId=' + contestId);
        if (page)
            query.set('pageToken', page);
        const data = await api(request, token, base + '?' + query);
        existing.push(...(Array.isArray(data.items) ? data.items.map(record) : []));
        page = typeof data.nextPageToken === 'string' ? data.nextPageToken : '';
    } while (page);
    const desired = new Set<string>();
    let completed = 0, cancelled = 0;
    try {
        for (const e of events) {
            if (e.contestId !== contestId)
                throw Error('A revisão pertence a outro concurso.');
            const id = await eventId(e.key);
            desired.add(id);
            const body = googleEvent(e);
            try {
                await api(request, token, base + '/' + id + '?sendUpdates=none', 'PATCH', body);
            }
            catch (error) {
                if (!(error instanceof CalendarApiError) || error.status !== 404)
                    throw error;
                try {
                    await api(request, token, base + '?sendUpdates=none', 'POST', { id, ...body });
                }
                catch (conflict) {
                    if (!(conflict instanceof CalendarApiError) || conflict.status !== 409)
                        throw conflict;
                    await api(request, token, base + '/' + id + '?sendUpdates=none', 'PATCH', body);
                }
            }
            completed++;
        }
        // Somente lembretes futuros deste aplicativo e concurso são cancelados, após todas as atualizações.
        for (const old of existing) {
            const props = record(record(old.extendedProperties).private);
            if (typeof old.id === 'string' && !desired.has(old.id) && props.estudamente === 'studio6' && props.contestId === contestId) {
                await api(request, token, base + '/' + encodeURIComponent(old.id) + '?sendUpdates=none', 'PATCH', { status: 'cancelled' });
                cancelled++;
            }
        }
    }
    catch (e) {
        if (e instanceof CalendarApiError)
            e.completed = completed;
        throw e;
    }
    return { completed, cancelled };
}
export const GOOGLE_SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';
type TokenResponse = {
    access_token?: string;
    expires_in?: number;
    error?: string;
};
type GoogleOAuth = {
    initTokenClient: (options: {
        client_id: string;
        scope: string;
        callback: (r: TokenResponse) => void;
        error_callback: (e: {
            type: string;
        }) => void;
    }) => {
        requestAccessToken: (options: {
            prompt: string;
        }) => void;
    };
    hasGrantedAllScopes: (response: TokenResponse, ...scopes: string[]) => boolean;
    revoke: (token: string, done: () => void) => void;
};
declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: GoogleOAuth;
            };
        };
    }
}
export function loadGoogleIdentity() { if (window.google?.accounts?.oauth2)
    return Promise.resolve(); return new Promise<void>((resolve, reject) => { let script = document.querySelector<HTMLScriptElement>('script[data-estudamente-google]'); if (!script) {
    script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.dataset.estudamenteGoogle = '1';
    document.head.appendChild(script);
} const timer = setTimeout(() => reject(Error('O serviço Google não carregou. Verifique sua conexão.')), 15000); script.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true }); script.addEventListener('error', () => { clearTimeout(timer); script?.remove(); reject(Error('Não foi possível carregar a conexão Google.')); }, { once: true }); }); }
export function authorizeGoogle(clientId: string) { const oauth = window.google?.accounts.oauth2; if (!oauth)
    throw Error('A conexão Google ainda está carregando.'); return new Promise<{
    token: string;
    expires: number;
}>((resolve, reject) => { const client = oauth.initTokenClient({ client_id: clientId, scope: GOOGLE_SCOPE, callback: r => { if (r.error || !r.access_token || !oauth.hasGrantedAllScopes(r, GOOGLE_SCOPE)) {
        reject(Error('A autorização da agenda não foi concluída.'));
        return;
    } resolve({ token: r.access_token, expires: Date.now() + Math.max(0, (r.expires_in || 3600) - 60) * 1000 }); }, error_callback: e => reject(Error(e.type === 'popup_closed' ? 'A janela de conexão foi fechada.' : 'O navegador não abriu a conexão Google.')) }); client.requestAccessToken({ prompt: 'consent' }); }); }
export function defaultOptions() { return { ...defaultCalendarOptions }; }
export const exportDay = today;
