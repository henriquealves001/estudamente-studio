import { subjectPerformance } from './performance.ts';
export type Subject = {
    id: string;
    name: string;
    color: string;
    questions: number;
    points: number;
    difficulty: number;
    active: boolean;
    provisionalWeight?: number;
    minimumMinutes?: number;
    manualMinutes?: number;
    extra?: boolean;
};
export type Topic = {
    id: string;
    subjectId: string;
    title: string;
    hours: number;
    done: boolean;
    started: string;
    notes: string;
    initialInterval?: number;
    reviewAnchor?: string;
};
export type Log = {
    id: string;
    subjectId: string;
    topicId: string;
    date: string;
    minutes: number;
    method: string;
    notes: string;
};
export type Review = {
    recordedAt?: string;
    id: string;
    topicId: string;
    date: string;
    rating: number;
    interval: number;
    questions: number;
    correct: number;
};
export type RecordItem = {
    id: string;
    kind: string;
    date: string;
    title: string;
    subjectId: string;
    total: number;
    correct: number;
    notes: string;
    url: string;
};
export type Question = {
    id: string;
    topicId: string;
    prompt: string;
    answer: string;
    explanation: string;
    hint: string;
    example: string;
    guided: string;
    guidedPrompt: string;
    guidedAnswer: string;
    options: string[];
    correct: number | null;
    source: string;
    archived: boolean;
};
export type AttemptResult = 'alone' | 'assisted' | 'wrong';
export type Attempt = {
    declaredUnknown?: boolean;
    id: string;
    questionId: string;
    topicId: string;
    at: string;
    date: string;
    result: AttemptResult;
    firstResponse: string;
    usedHint: boolean;
    confidence: string;
    correctionMade: boolean;
    selfExplanation: string;
    errorTag: string;
    notes: string;
    minutes: number;
    source: string;
    origin: 'practice' | 'legacy';
    sessionId: string;
    interval: number;
    choice: number | null;
    snapshot: {
        prompt: string;
        answer: string;
    };
};
export type Contest = {
    cycleMode?: 'automatic' | 'manual';
    adaptiveCycle?: boolean;
    calendarOptions?: {
        time: string;
        zone: string;
        duration: number;
        reminder: number;
        horizon: number;
    };
    planOrigin?: {
        catalogId: string;
        edition: string;
        sources: string[];
        createdAt: string;
    };
    id: string;
    name: string;
    examDate: string;
    deadline: string;
    startDate: string;
    daily: number[];
    subjects: Subject[];
    topics: Topic[];
    logs: Log[];
    reviews: Review[];
    records: RecordItem[];
    reviewMode?: 'automatic' | 'custom';
    reviewDays: number;
    reviewGrowth: number;
    reviewMax: number;
    contentShare: number;
    questions: Question[];
    attempts: Attempt[];
    learningVersion: 1;
};
export type Archive = {
    id: string;
    importedAt: string;
    source: string;
    payload: unknown;
};
export type Database = {
    version: 6;
    activeId: string;
    contests: Contest[];
    archives: Archive[];
    updatedAt: string;
};
export const KEY = 'estudamente-studio-6';
export const LEGACY_KEY = 'estudamente-v1.2';
export const colors = ['#8177ee', '#30b9aa', '#e9ab62', '#5d9fe9', '#cf83b1', '#92b365'];
export const uid = () => crypto.randomUUID();
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export function validDate(s: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
        return false;
    const d = new Date(s + 'T12:00:00Z');
    return Number.isFinite(+d) && d.toISOString().slice(0, 10) === s;
}
export function plus(s: string, n: number) { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
export function monday(s: string) { const day = new Date(s + 'T12:00:00Z').getUTCDay(); return plus(s, -((day + 6) % 7)); }
export const dayIndex = (s: string) => (new Date(s + 'T12:00:00Z').getUTCDay() + 6) % 7;
export const defaultReviewSettings = { reviewDays: 1, reviewGrowth: 2, reviewMax: 60 } as const;
// Parâmetros de produto, não intervalos universais prescritos pelos estudos.
export function nextReviewDate(c: Contest, date: string, interval: number) {
    const due = plus(date, interval);
    if (!c.examDate) return due;
    const lastDay = plus(c.examDate, -1);
    return date >= lastDay ? null : due > lastDay ? lastDay : due;
}
export function boundedReviewInterval(c: Contest, date: string, proposed: number) {
    const interval = Math.min(c.reviewMax, Math.max(c.reviewDays, Math.round(proposed)));
    const due = nextReviewDate(c, date, interval);
    return due ? Math.max(1, Math.round((Date.parse(due) - Date.parse(date)) / 86400000)) : interval;
}
export function emptyContest(name = 'Meu primeiro concurso'): Contest { return { id: uid(), name, examDate: '', deadline: '', startDate: today(), daily: [60, 60, 60, 60, 60, 0, 0], subjects: [], topics: [], logs: [], reviews: [], records: [], reviewMode: 'automatic', adaptiveCycle: true, ...defaultReviewSettings, contentShare: .75, questions: [], attempts: [], learningVersion: 1 }; }
export function emptyDB(): Database { const c = emptyContest(); return { version: 6, activeId: c.id, contests: [c], archives: [], updatedAt: '' }; }
export function cycle(c: Contest, now = today()) {
    const week = monday(now), weekly = c.daily.reduce((a, b) => a + b, 0), active = c.subjects.filter(s => s.active);
    const examSubjects = active.filter(s => !s.extra), complete = examSubjects.length > 0 && examSubjects.every(s => s.questions > 0);
    const performance = active.map(s => subjectPerformance(c, s.id, now));
    const raw = active.map((s, i) => s.extra ? 0 : (complete ? s.questions * s.points : (s.provisionalWeight ?? 1)) * s.difficulty * (c.adaptiveCycle ? performance[i].factor : 1));
    const targets = active.map(s => c.cycleMode === 'manual' ? (s.manualMinutes ?? 0) : (s.minimumMinutes ?? 0));
    if (c.cycleMode !== 'manual') {
        let remaining = weekly, pool = active.map((_, i) => i).filter(i => raw[i] > 0);
        for (let i = 0; i < active.length; i++)
            if (raw[i] === 0)
                remaining -= targets[i];
        while (pool.length && remaining > 0) {
            const total = pool.reduce((n, i) => n + raw[i], 0);
            const fixed = pool.filter(i => targets[i] > remaining * raw[i] / total);
            if (!fixed.length) {
                for (const i of pool)
                    targets[i] = remaining * raw[i] / total;
                break;
            }
            for (const i of fixed)
                remaining -= targets[i];
            pool = pool.filter(i => !fixed.includes(i));
        }
    }
    return active.map((s, i) => { const target = targets[i], done = c.logs.filter(l => l.subjectId === s.id && l.date >= week && l.date <= plus(week, 6)).reduce((a, l) => a + l.minutes, 0); return { ...s, performance: performance[i], target, done, balance: target - done, share: weekly ? target / weekly : 0, provisional: c.cycleMode !== 'manual' && !complete && !s.extra }; }).sort((a, b) => b.balance - a.balance);
}
function reviewCoversAttempt(r: Review, a: Attempt) {
    return r.date > a.date || r.date === a.date && !!r.recordedAt && Date.parse(r.recordedAt) >= Date.parse(a.at);
}
function lastTopicReview(c: Contest, topicId: string) {
    return c.reviews.filter(r => r.topicId === topicId).sort((a,b) => a.date.localeCompare(b.date)).at(-1);
}
export function reviewDue(c: Contest, t: Topic) {
    const manual = lastTopicReview(c, t.id);
    const latest = new Map<string, Attempt>();
    for (const a of c.attempts || []) {
        if (a.topicId !== t.id || a.questionId && c.questions?.find(q => q.id === a.questionId)?.archived)
            continue;
        const key = a.questionId || 'unlinked';
        if (!latest.has(key) || latest.get(key)!.at < a.at)
            latest.set(key, a);
    }
    const practice = [...latest.values()].filter(a => !manual || !reviewCoversAttempt(manual, a)).map(a => ({ date: plus(a.date, a.interval), interval: a.interval })).sort((a, b) => a.date.localeCompare(b.date));
    if (t.reviewAnchor === '' && !practice.length && !manual)
        return null;
    const studied = t.reviewAnchor || c.logs.filter(l => l.topicId === t.id).map(l => l.date).sort()[0] || t.started;
    if (!studied && !practice.length && !manual)
        return null;
    const interval = practice[0]?.interval || manual?.interval || t.initialInterval || c.reviewDays;
    const anchor = practice[0] ? plus(practice[0].date, -interval) : manual?.date || studied;
    const due = nextReviewDate(c, anchor, interval);
    if (!due) return null;
    return { date: due, interval: Math.round((Date.parse(due) - Date.parse(anchor)) / 86400000), topic: t };
}
export function registerReview(c: Contest, topicId: string, date: string, rating: number, questions = 0, correct = 0): Review {
    if (!c.topics.some(t => t.id === topicId) || !validDate(date) || date > today() || ![0, 1, 2, 3].includes(rating) || !Number.isInteger(questions) || questions < 0 || !Number.isInteger(correct) || correct < 0 || correct > questions)
        throw Error('Confira os dados da revisão.');
    const hist = c.reviews.filter(r => r.topicId === topicId).sort((a, b) => a.date.localeCompare(b.date));
    if (hist.length && hist.at(-1)!.date >= date)
        throw Error('Registre a revisão após a última data registrada para este assunto.');
    // Acertos objetivos limitam a avaliação subjetiva nas próximas sugestões.
    if (questions > 0) {
        const accuracy = correct / questions;
        // O resultado objetivo limita a autoavaliação; os limiares são heurísticas explícitas.
        rating = Math.min(rating, accuracy < .5 ? 0 : accuracy < .8 ? 1 : 3);
    }
    const previous = reviewDue(c, c.topics.find(t => t.id === topicId)!)?.interval || c.reviewDays;
    const interval = boundedReviewInterval(c, date, rating === 0 ? c.reviewDays : previous * (rating === 1 ? 1 : rating === 2 ? c.reviewGrowth : c.reviewGrowth * 1.3));
    return { id: uid(), topicId, date, recordedAt: new Date().toISOString(), rating, interval, questions, correct };
}
export function recordStudy(c: Contest, l: Omit<Log, 'id'>): Contest {
    const s = c.subjects.find(s => s.id === l.subjectId && s.active), t = c.topics.find(t => t.id === l.topicId);
    if (!s || !validDate(l.date) || l.date > today() || l.date < c.startDate || !Number.isInteger(l.minutes) || l.minutes < 1 || l.minutes > 1440 || l.topicId && (!t || t.subjectId !== s.id))
        throw Error('Confira disciplina, assunto, data e duração (1 a 1440 minutos).');
    if (c.logs.filter(x => x.date === l.date).reduce((n, x) => n + x.minutes, 0) + l.minutes > 1440)
        throw Error('O total do dia não pode ultrapassar 24 horas.');
    return { ...c, logs: [...c.logs, { ...l, id: uid() }], topics: c.topics.map(t => t.id === l.topicId ? { ...t, started: !t.started || l.date < t.started ? l.date : t.started } : t) };
}
export type PlanDay = {
    date: string;
    capacity: number;
    used: number;
    tasks: {
        topicId: string;
        title: string;
        subjectId: string;
        minutes: number;
        review: boolean;
    }[];
};
export function schedule(c: Contest, now = today()) {
    const end = c.examDate ? plus(c.examDate, -1) : c.deadline || plus(now, 27), start = c.startDate > now ? c.startDate : now;
    const weights = cycle(c, now), share = new Map(weights.map(s => [s.id, s.share]));
    const remaining = new Map(c.topics.filter(t => !t.done && share.has(t.subjectId)).map(t => [t.id, Math.max(0, t.hours * 60 - c.logs.filter(l => l.topicId === t.id && !['Revisão', 'Questões', 'Flashcards'].includes(l.method)).reduce((a, l) => a + l.minutes, 0))]));
    const due = c.topics.filter(t => share.has(t.subjectId)).map(t => reviewDue(c, t)).filter(x => x !== null).sort((a, b) => a.date.localeCompare(b.date));
    const customCycle = c.cycleMode === 'manual' || c.subjects.some(s => (s.minimumMinutes ?? 0) > 0 || s.extra);
    const assigned = new Map<string, number>(), recorded = new Map<string, number>();
    for (const log of c.logs) {
        const key = monday(log.date) + '|' + log.subjectId;
        recorded.set(key, (recorded.get(key) || 0) + log.minutes);
    }
    const allowance = (subjectId: string, date: string) => {
        if (!customCycle)
            return Infinity;
        const key = monday(date) + '|' + subjectId;
        return Math.max(0, (weights.find(s => s.id === subjectId)?.target ?? 0) - (assigned.get(key) ?? 0) - (recorded.get(key) || 0));
    };
    const count = (id: string, date: string, minutes: number) => { const key = monday(date) + '|' + id; assigned.set(key, (assigned.get(key) ?? 0) + minutes); };
    const plannedReviews = new Set<string>(), days: PlanDay[] = [];
    const weeklyEffort = (id: string, date: string) => (assigned.get(monday(date) + '|' + id) || 0) + (recorded.get(monday(date) + '|' + id) || 0);
    for (let date = start; date <= end && days.length < 730; date = plus(date, 1)) {
        const capacity = c.daily[dayIndex(date)], used = c.logs.filter(l => l.date === date).reduce((a, l) => a + l.minutes, 0);
        let available = Math.max(0, capacity - used);
        const tasks: PlanDay['tasks'] = [];
        for (const r of due) {
            if (r.date > date || plannedReviews.has(r.topic.id) || available < 15 || allowance(r.topic.subjectId, date) < 15)
                continue;
            tasks.push({ topicId: r.topic.id, title: r.topic.title, subjectId: r.topic.subjectId, minutes: 15, review: true });
            count(r.topic.subjectId, date, 15);
            plannedReviews.add(r.topic.id);
            available -= 15;
        }
        let content = c.deadline && date > c.deadline ? 0 : Math.floor(Math.min(available, Math.max(0, capacity * c.contentShare - c.logs.filter(l => l.date === date && !['Revisão', 'Questões', 'Flashcards'].includes(l.method)).reduce((a, l) => a + l.minutes, 0))));
        while (content >= 1) {
            const candidates = c.topics.filter(t => (remaining.get(t.id) || 0) >= 1 && allowance(t.subjectId, date) >= 1).sort((a, b) => (weeklyEffort(a.subjectId, date) / (share.get(a.subjectId) || 1)) - (weeklyEffort(b.subjectId, date) / (share.get(b.subjectId) || 1)));
            const t = candidates[0];
            if (!t)
                break;
            const minutes = Math.min(30, content, Math.ceil(remaining.get(t.id) || 0), Math.floor(allowance(t.subjectId, date)));
            tasks.push({ topicId: t.id, title: t.title, subjectId: t.subjectId, minutes, review: false });
            count(t.subjectId, date, minutes);
            remaining.set(t.id, Math.max(0, (remaining.get(t.id) || 0) - minutes));
            content -= minutes;
        }
        days.push({ date, capacity, used, tasks });
    }
    return { days, shortage: [...remaining.values()].reduce((a, b) => a + b, 0), unscheduledReviews: due.filter(r => !plannedReviews.has(r.topic.id)).length, truncated: days.length === 730 && days.at(-1)!.date < end };
}
export const obj = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
export const arr = (v: unknown): Record<string, unknown>[] => Array.isArray(v) ? v.map(obj) : [];
const str = (v: unknown, f = '') => typeof v === 'string' ? v : f;
const num = (v: unknown, f = 0) => Number.isFinite(Number(v)) ? Number(v) : f;
const date = (v: unknown) => validDate(str(v)) ? str(v) : '';
export function fingerprint(v: unknown) {
    const s = JSON.stringify(v);
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16) + '-' + s.length;
}
export function validateDB(v: unknown): asserts v is Database {
    const d = obj(v);
    if (d.version !== 6 || !Array.isArray(d.contests) || !d.contests.length || !Array.isArray(d.archives) || typeof d.activeId !== 'string')
        throw Error('Backup 6.0 inválido.');
    const ids = new Set<string>();
    for (const v of d.contests) {
        const c = v as Contest;
        if (!c || typeof c.id !== 'string' || ids.has(c.id) || typeof c.name !== 'string' || !c.name.trim() || !validDate(c.startDate) || c.examDate && !validDate(c.examDate) || c.deadline && !validDate(c.deadline))
            throw Error('Concurso inválido no backup.');
        ids.add(c.id);
        if (!Array.isArray(c.daily) || c.daily.length !== 7 || c.daily.some(n => !Number.isFinite(n) || n < 0 || n > 1440) || !Array.isArray(c.subjects) || !Array.isArray(c.topics) || !Array.isArray(c.logs) || !Array.isArray(c.reviews) || !Array.isArray(c.records))
            throw Error('Estrutura incompleta no backup.');
        for (const field of ['subjects', 'topics', 'logs', 'reviews', 'records'] as const) {
            const seen = new Set<string>();
            for (const x of c[field]) {
                if (!x || typeof x.id !== 'string' || seen.has(x.id))
                    throw Error('Identificadores duplicados ou inválidos.');
                seen.add(x.id);
            }
        }
        if (c.adaptiveCycle !== undefined && typeof c.adaptiveCycle !== 'boolean') throw Error('Preferência adaptativa inválida.');
        if (c.reviewMode !== undefined && !['automatic', 'custom'].includes(c.reviewMode)) throw Error('Modo de revisão inválido.');
        if (!Number.isFinite(c.contentShare) || c.contentShare < 0 || c.contentShare > 1 || !Number.isFinite(c.reviewDays) || c.reviewDays < 1 || !Number.isFinite(c.reviewGrowth) || c.reviewGrowth < 1 || !Number.isFinite(c.reviewMax) || c.reviewMax < c.reviewDays)
            throw Error('Parâmetros inválidos.');
        if (c.planOrigin !== undefined && (!c.planOrigin || typeof c.planOrigin.catalogId !== 'string' || typeof c.planOrigin.edition !== 'string' || !Array.isArray(c.planOrigin.sources) || c.planOrigin.sources.some(s => typeof s !== 'string') || typeof c.planOrigin.createdAt !== 'string'))
            throw Error('Origem do plano inválida.');
        if (c.calendarOptions !== undefined) {
            const o = c.calendarOptions;
            if (!o || typeof o.zone !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(o.time) || !Number.isInteger(o.duration) || o.duration < 5 || o.duration > 120 || !Number.isInteger(o.reminder) || o.reminder < 0 || o.reminder > 40320 || !Number.isInteger(o.horizon) || o.horizon < 1 || o.horizon > 365)
                throw Error('Preferências da agenda inválidas.');
            try {
                new Intl.DateTimeFormat('en', { timeZone: o.zone }).format();
            }
            catch {
                throw Error('Fuso da agenda inválido.');
            }
        }
        if (c.cycleMode !== undefined && !['automatic', 'manual'].includes(c.cycleMode))
            throw Error('Modo de ciclo inválido.');
        for (const s of c.subjects)
            if ([s.minimumMinutes, s.manualMinutes].some(v => v !== undefined && (!Number.isFinite(v) || v < 0 || v > 10080)) || s.extra !== undefined && typeof s.extra !== 'boolean')
                throw Error('Horas de disciplina inválidas.');
        for (const s of c.subjects)
            if (typeof s.name !== 'string' || typeof s.color !== 'string' || typeof s.active !== 'boolean' || ![s.questions, s.points, s.difficulty].every(Number.isFinite) || s.questions < 0 || s.points <= 0 || s.difficulty < 1 || s.difficulty > 5)
                throw Error('Disciplina inválida.');
        const subject = (id: string) => c.subjects.some(s => s.id === id), topic = (id: string) => c.topics.some(t => t.id === id);
        for (const t of c.topics)
            if (t.initialInterval !== undefined && (!Number.isFinite(t.initialInterval) || t.initialInterval < 1) || t.reviewAnchor !== undefined && (typeof t.reviewAnchor !== 'string' || t.reviewAnchor !== '' && !validDate(t.reviewAnchor)) || !subject(t.subjectId) || typeof t.title !== 'string' || typeof t.done !== 'boolean' || typeof t.notes !== 'string' || !Number.isFinite(t.hours) || t.hours < 0 || t.started && !validDate(t.started))
                throw Error('Assunto inválido.');
        validateLearning(c);
        for (const l of c.logs)
            if (!subject(l.subjectId) || l.topicId && !topic(l.topicId) || !validDate(l.date) || !Number.isFinite(l.minutes) || l.minutes <= 0 || typeof l.method !== 'string' || typeof l.notes !== 'string')
                throw Error('Histórico de estudo inválido.');
        for (const r of c.reviews)
            if (r.recordedAt !== undefined && (typeof r.recordedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(r.recordedAt) || !Number.isFinite(Date.parse(r.recordedAt))) || !topic(r.topicId) || !validDate(r.date) || ![r.rating, r.interval, r.questions, r.correct].every(Number.isFinite) || r.interval < 1 || r.questions < 0 || r.correct < 0 || r.correct > r.questions)
                throw Error('Histórico de revisão inválido.');
        for (const r of c.records)
            if (!validDate(r.date) || typeof r.kind !== 'string' || typeof r.title !== 'string' || typeof r.notes !== 'string' || typeof r.url !== 'string' || r.subjectId && !subject(r.subjectId) || ![r.total, r.correct].every(Number.isFinite) || r.total < 0 || r.correct < 0 || r.correct > r.total)
                throw Error('Registro inválido.');
    }
    if (!ids.has(d.activeId as string))
        throw Error('Concurso ativo não encontrado.');
    for (const a of d.archives)
        if (!a || typeof a.id !== 'string' || typeof a.source !== 'string' || !('payload' in a))
            throw Error('Arquivo de migração inválido.');
}
export type SeedUnit = {
    code: string;
    name: string;
    subject: string;
};
export function migrate(input: unknown, seed: SeedUnit[] = []): Database {
    const raw = obj(input), hash = fingerprint(input);
    if (raw.version === 6)
        return upgradeDatabase(input, seed);
    if (raw.format === 'estudamente-all-profiles-v2' && Array.isArray(raw.profiles)) {
        const profiles = arr(raw.profiles);
        if (!profiles.length)
            throw Error('Backup de perfis vazio.');
        const parts = profiles.map((p, i) => { const d = migrate(p.data, seed); d.contests = d.contests.map(c => ({ ...c, id: `profile-${i}-${c.id}`, name: `${str(p.name, 'Perfil')} · ${c.name}` })); return d; });
        const contests = parts.flatMap(p => p.contests);
        const active = Math.max(0, profiles.findIndex(p => p.id === raw.activeProfileId));
        return { version: 6, activeId: parts[active].contests[0].id, contests, archives: [{ id: hash, source: 'HTML 5.0 / legado · todos os perfis', importedAt: new Date().toISOString(), payload: input }], updatedAt: '' };
    }
    const root = obj(raw.data);
    const source = Array.isArray(raw.contests) || raw.gcm || Array.isArray(raw.subjects) ? raw : root;
    if (!Array.isArray(source.contests) && !source.gcm && !Array.isArray(source.subjects))
        throw Error('Formato não reconhecido. Exporte o backup JSON completo pelo EstudaMente antigo.');
    const list = Array.isArray(source.contests) ? arr(source.contests) : [{ id: 'legacy', name: str(obj(source.profile).examName, 'Concurso importado'), data: source.gcm, core: source, subjects: source.subjects }];
    if (!list.length)
        throw Error('Nenhum concurso encontrado no backup.');
    const contests = list.map((ex, index) => {
        const c = emptyContest(str(ex.name, 'Concurso importado')), g = obj(ex.data), core = obj(ex.core), settings = obj(g.settings);
        // O estado raiz contém o concurso ativo mais recente no HTML 5.0.
        const active = str(ex.id) === str(source.activeContestId);
        const learningCore = active && Array.isArray(source.questions) ? source : core;
        const data = active && source.gcm ? obj(source.gcm) : g;
        const config = active && source.gcm ? obj(data.settings) : settings;
        c.reviewMode = 'custom';
        c.adaptiveCycle = false;
        c.id = `legacy-${hash}-${index}`;
        c.examDate = date(config.examDate) || date(obj(core.profile).deadline);
        c.deadline = date(config.planningDeadline) || c.examDate;
        c.startDate = date(config.startDate) || today();
        const daily = config.dailyHours;
        const weeklyMinutes = Math.round(Math.min(10080, Math.max(0, num(config.weeklyHours, 5) * 60)));
        c.daily = Array.isArray(daily) && daily.length === 7 ? daily.map(v => Math.round(Math.min(1440, Math.max(0, num(v) * 60)))) : Array.from({ length: 7 }, (_, i) => Math.floor(weeklyMinutes / 7) + (i < weeklyMinutes % 7 ? 1 : 0));
        c.reviewDays = Math.max(1, num(config.revisionMinimum, 1));
        c.reviewMax = Math.max(c.reviewDays, num(config.revisionMaximum, 60));
        c.reviewGrowth = Math.max(1, num(config.revisionGrowth, 2));
        c.contentShare = Math.min(1, Math.max(0, num(config.contentShare, .75)));
        const subjects = arr(ex.subjects).length ? arr(ex.subjects) : arr(core.subjects);
        const sourceUnits = Array.isArray(ex.units) ? arr(ex.units) : Object.keys(data).length ? seed.map(u => ({ ...u })) : arr(core.topics).map(t => ({ ...t, code: t.id, name: t.title, subject: subjects.find(s => s.id === t.subjectId)?.name }));
        const names = [...new Set([...subjects.map(s => str(s.name)), ...sourceUnits.map(u => str(u.subject)), ...arr(data.studyLogs).map(l => str(l.subject))].filter(Boolean))];
        c.subjects = names.map((name, i) => { const s = subjects.find(x => x.name === name) || {}; return { id: `s${i}`, name, color: /^#[a-f0-9]{6}$/i.test(str(s.color)) ? str(s.color) : colors[i % colors.length], questions: Math.max(0, num(obj(config.questionCount)[name])), points: Math.max(.1, num(obj(config.pointWeight)[name], 1)), difficulty: Math.min(5, Math.max(1, num(obj(config.difficulty)[name], 3))), active: s.active !== false, provisionalWeight: Math.max(0, num(obj(config.allocation)[name], 1)) }; });
        const sub = (name: unknown) => c.subjects.find(s => s.name === name)?.id || '';
        const states = obj(data.unitState);
        c.topics = sourceUnits.filter(u => sub(u.subject)).map((u, i) => { const st = obj(states[str(u.code)]), anchor = date(st.completedDate) || (['Estudado', 'Dominado'].includes(str(st.status)) ? date(st.studyDate) : ''); const name = str(u.name); const estimated = (name.length > 58 ? 4.2 : name.length > 34 ? 3.5 : 2.9) * (/interpretação|subordinação|resolução|equações|probabilidade|geometria|problemas|concordância|regência/i.test(name) ? 1.25 : 1) * (.85 + .1 * num(st.difficulty, 3)) * (.9 + .05 * num(st.priority, 3)); return { id: str(u.code, `t${i}`), title: str(u.name, 'Assunto importado'), subjectId: sub(u.subject), hours: Math.max(.5, num(st.estimatedHours) || estimated), done: ['Estudado', 'Concluído', 'Dominado', 'Revisado'].includes(str(st.status)), started: date(st.studyDate), notes: str(st.notes), reviewAnchor: Object.keys(data).length ? anchor : undefined, initialInterval: anchor && c.deadline ? Math.min(c.reviewMax, Math.max(c.reviewDays, Math.round(Math.max(0, (Date.parse(c.deadline) - Date.parse(anchor)) / 86400000) * num(config.revisionFraction, .1)))) : c.reviewDays }; });
        c.logs = arr(data.studyLogs).filter(l => sub(l.subject) && date(l.date) && num(l.minutes) > 0).map((l, i) => ({ id: `l${i}`, subjectId: sub(l.subject), topicId: c.topics.some(t => t.id === l.unitId) ? str(l.unitId) : '', date: date(l.date), minutes: num(l.minutes), method: str(l.method, 'Estudo'), notes: str(l.notes) }));
        // Quadrados antigos do ciclo são saldos agregados. Apenas o excedente sobre logs vira registro.
        for (const [week, val] of Object.entries(obj(data.cycles))) {
            if (!validDate(week))
                continue;
            for (const [name, values] of Object.entries(obj(val))) {
                if (!sub(name) || !Array.isArray(values))
                    continue;
                const total = values.reduce((n, v) => n + Math.max(0, num(v)) * 60, 0), known = c.logs.filter(l => l.subjectId === sub(name) && monday(l.date) === monday(week)).reduce((n, l) => n + l.minutes, 0);
                if (total > known)
                    c.logs.push({ id: `balance-${week}-${sub(name)}`, subjectId: sub(name), topicId: '', date: week, minutes: total - known, method: 'Saldo legado', notes: 'Saldo agregado sem assunto; preservado sem duplicar os registros detalhados.' });
            }
        }
        c.reviews = arr(data.reviews).filter(r => c.topics.some(t => t.id === r.unitId) && date(r.date)).map((r, i) => ({ id: `r${i}`, topicId: str(r.unitId), date: date(r.date), rating: num(r.questions) > 0 && num(r.correct) / num(r.questions) < .5 ? 0 : 2, interval: c.reviewDays, questions: Math.max(0, num(r.questions)), correct: Math.min(Math.max(0, num(r.questions)), Math.max(0, num(r.correct))) }));
        // Reproduz o intervalo efetivo do 5.0 para cada revisão, mantendo as datas de vencimento.
        for (const t of c.topics) {
            const history = c.reviews.filter(r => r.topicId === t.id).sort((a, b) => a.date.localeCompare(b.date));
            history.forEach((r, i) => {
                const original = arr(data.reviews).filter(x => x.unitId === t.id && date(x.date)).sort((a, b) => str(a.date).localeCompare(str(b.date)))[i];
                const previousDate = history[i - 1]?.date || t.reviewAnchor || t.started || r.date;
                const previousGap = Math.max(c.reviewDays, Math.round((Date.parse(r.date) - Date.parse(previousDate)) / 86400000));
                const accuracy = r.questions > 0 ? r.correct / r.questions : null;
                const factor = accuracy === null ? .4 : accuracy < .5 ? .25 : accuracy < .7 ? .4 : accuracy < .85 ? .65 : 1;
                const difficulty = original?.difficulty === 'Fácil' ? 1.1 : original?.difficulty === 'Difícil' ? .8 : 1;
                r.interval = Math.min(c.reviewMax, Math.max(c.reviewDays, Math.round(previousGap * c.reviewGrowth * factor * difficulty)));
            });
        }
        for (const [field, kind] of [['questionLogs', 'Questões'], ['mockExams', 'Simulados'], ['materials', 'Materiais'], ['wellness', 'Bem-estar'], ['amendments', 'Retificações'], ['essays', 'Redação']] as const) {
            arr(data[field]).forEach((r, i) => { const total = Math.max(0, num(r.questions, num(r.total))); c.records.push({ id: `${field}${i}`, kind, date: date(r.date) || today(), title: str(r.title, str(r.name, str(r.change, kind))), subjectId: sub(r.subject), total, correct: Math.min(total, Math.max(0, num(r.correct))), notes: JSON.stringify(r, null, 2), url: str(r.url) }); });
        }
        // Duplicatas ou formatos desconhecidos não são descartados: o JSON integral fica no arquivo de origem.
        c.topics = c.topics.filter((t, i, a) => a.findIndex(x => x.id === t.id) === i);
        importLearning(c, learningCore);
        return c;
    });
    const activeIndex = Math.max(0, list.findIndex(e => e.id === source.activeContestId));
    const result: Database = { version: 6, activeId: contests[activeIndex].id, contests, archives: [{ id: hash, source: 'HTML 5.0 / legado', importedAt: new Date().toISOString(), payload: input }], updatedAt: '' };
    validateDB(result);
    return result;
}
export function mergeImport(current: Database, incoming: Database): Database {
    const contests = [...current.contests], archives = [...current.archives];
    let added = '';
    for (const c of incoming.contests) {
        const existing = contests.find(x => x.id === c.id);
        if (existing && JSON.stringify(existing) === JSON.stringify(c))
            continue;
        if (existing) {
            const copy = structuredClone(c);
            copy.id = `${c.id}-copy-${fingerprint(c)}`;
            if (!contests.some(x => x.id === copy.id)) {
                contests.push(copy);
                added = copy.id;
            }
        }
        else {
            contests.push(c);
            added = c.id;
        }
    }
    for (const a of incoming.archives)
        if (!archives.some(x => x.id === a.id))
            archives.push(a);
    return { ...current, contests, archives, activeId: added || current.activeId };
}
export function persist(storage: Pick<Storage, 'getItem' | 'setItem'>, db: Database, expected: string | null) {
    validateDB(db);
    const previous = storage.getItem(KEY);
    if (previous !== expected)
        throw Error('Outra aba alterou os dados. Exporte esta sessão e recarregue antes de continuar.');
    const next = { ...db, updatedAt: new Date().toISOString() };
    const serialized = JSON.stringify(next);
    if (previous)
        storage.setItem(KEY + '-previous', previous); // A falha do backup bloqueia a gravação principal.
    storage.setItem(KEY, serialized);
    return { db: next, serialized };
}
export function emptyQuestion(topicId: string): Question { return { id: uid(), topicId, prompt: '', answer: '', explanation: '', hint: '', example: '', guided: '', guidedPrompt: '', guidedAnswer: '', options: [], correct: null, source: '', archived: false }; }
export function validateQuestion(c: Contest, q: Question) {
    if (!q || typeof q.id !== 'string' || !q.id || !c.topics.some(t => t.id === q.topicId))
        throw Error('Escolha um assunto válido para a pergunta.');
    for (const key of ['prompt', 'answer', 'explanation', 'hint', 'example', 'guided', 'guidedPrompt', 'guidedAnswer', 'source'] as const)
        if (typeof q[key] !== 'string' || q[key].length > 20000)
            throw Error('Texto da pergunta inválido ou acima de 20.000 caracteres.');
    if (!q.prompt.trim() || !q.answer.trim())
        throw Error('Preencha a pergunta e a resposta esperada.');
    if (typeof q.archived !== 'boolean' || !Array.isArray(q.options) || q.options.some(v => typeof v !== 'string'))
        throw Error('Formato de pergunta inválido.');
    if (q.options.length) {
        if (q.options.length < 2 || q.options.length > 6 || q.options.some(v => !v.trim() || v.length > 5000) || !Number.isInteger(q.correct) || q.correct! < 0 || q.correct! >= q.options.length)
            throw Error('Informe de 2 a 6 alternativas preenchidas e um gabarito válido.');
    }
    else if (q.correct !== null)
        throw Error('Perguntas abertas não usam alternativa de gabarito.');
    if (Boolean(q.guidedPrompt.trim()) !== Boolean(q.guidedAnswer.trim()))
        throw Error('O exercício guiado precisa de enunciado e resposta.');
}
export function saveQuestion(c: Contest, q: Question) {
    if (q.options.length && Number.isInteger(q.correct))
        q = { ...q, answer: `Alternativa ${String.fromCharCode(65 + q.correct!)}: ${q.options[q.correct!] || ''}` };
    validateQuestion(c, q);
    return { ...c, questions: c.questions.some(x => x.id === q.id) ? c.questions.map(x => x.id === q.id ? q : x) : [...c.questions, q] };
}
export function questionDue(c: Contest, q: Question) {
    const last = c.attempts.filter(a => a.questionId === q.id).sort((a, b) => a.at.localeCompare(b.at)).at(-1);
    const manual = lastTopicReview(c, q.topicId);
    const covered = last && manual && reviewCoversAttempt(manual, last);
    const interval = covered ? manual.interval : last?.interval || c.reviewDays;
    const anchor = covered ? manual.date : last?.date;
    return { last, date: anchor ? nextReviewDate(c, anchor, interval) || '' : '', interval };
}
export function practiceQueue(c: Contest, { topicId = '', subjectId = '', mode = 'all', limit = 10, now = today() }: {
    topicId?: string;
    subjectId?: string;
    mode?: string;
    limit?: number;
    now?: string;
} = {}) {
    const candidates = c.questions.filter(q => !q.archived && c.topics.some(t => t.id === q.topicId && (!topicId || t.id === topicId) && (!subjectId || t.subjectId === subjectId) && c.subjects.some(s => s.id === t.subjectId && s.active))).map(q => ({ q, ...questionDue(c, q) })).filter(x => mode === 'due' ? !!x.date && x.date <= now : mode === 'errors' ? !!x.last && x.last.result !== 'alone' : true);
    candidates.sort((a, b) => { const rank = (x: typeof a) => x.date && x.date <= now ? 0 : !x.last ? 1 : 2; return rank(a) - rank(b) || a.date.localeCompare(b.date) || a.q.id.localeCompare(b.q.id); });
    return candidates.slice(0, Math.max(1, Math.min(50, Math.floor(limit) || 10))).map(x => x.q);
}
export type PracticeInput = {
    declaredUnknown?: boolean;
    id: string;
    sessionId: string;
    questionId: string;
    response: string;
    choice: number | null;
    usedHint: boolean;
    result: AttemptResult;
    confidence: string;
    correctionMade: boolean;
    selfExplanation: string;
    errorTag: string;
    notes: string;
    minutes: number;
    at?: string;
};
export function isDeclaredUnknown(response: string, declaredUnknown?: boolean) { return declaredUnknown === true || declaredUnknown === undefined && response.trim().toLocaleLowerCase('pt-BR') === 'não sei'; }
export function applyPractice(c: Contest, input: PracticeInput): Contest {
    if (c.attempts.some(a => a.id === input.id || a.origin === 'practice' && a.sessionId === input.sessionId && a.questionId === input.questionId))
        throw Error('Esta tentativa já foi salva.');
    const q = c.questions.find(q => q.id === input.questionId), t = c.topics.find(t => t.id === q?.topicId);
    if (!q || q.archived || !t || !c.subjects.some(s => s.id === t.subjectId && s.active))
        throw Error('A pergunta ou disciplina não está disponível para estudo.');
    validateQuestion(c, q);
    if (!input.id || !input.sessionId || typeof input.response !== 'string' || !input.response.trim() || input.response.length > 20000 || !['alone', 'assisted', 'wrong'].includes(input.result) || typeof input.usedHint !== 'boolean' || input.declaredUnknown !== undefined && typeof input.declaredUnknown !== 'boolean')
        throw Error('Registre sua resposta antes de comparar com o gabarito.');
    const at = input.at || new Date().toISOString(), parsed = new Date(at);
    if (!Number.isFinite(+parsed) || +parsed > Date.now() + 60000)
        throw Error('Data de tentativa inválida.');
    const dateValue = localDay(parsed);
    if (!Number.isFinite(input.minutes) || input.minutes < .1 || input.minutes > 1440 || c.logs.filter(l => l.date === dateValue).reduce((n, l) => n + l.minutes, 0) + input.minutes > 1440)
        throw Error('Confira o tempo: de 0,1 minuto até o limite de 24 horas no dia.');
    let result = input.result;
    if (isDeclaredUnknown(input.response, input.declaredUnknown))
        result = 'wrong';
    else if (q.options.length) {
        if (!Number.isInteger(input.choice) || input.choice! < 0 || input.choice! >= q.options.length)
            throw Error('Selecione uma alternativa antes de comparar.');
        result = input.choice === q.correct ? (input.usedHint ? 'assisted' : 'alone') : 'wrong';
    }
    else if (input.usedHint && result === 'alone')
        result = 'assisted';
    const prev = questionDue(c, q).last;
    if (prev && at < prev.at)
        throw Error('A tentativa não pode ser anterior à última desta pergunta.');
    const previous = questionDue(c, q).interval;
    const proposed = result === 'wrong' ? c.reviewDays : result === 'assisted' ? Math.round(previous * .75) : prev && prev.date === dateValue ? previous : prev ? Math.round(previous * c.reviewGrowth) : c.reviewDays;
    const interval = boundedReviewInterval(c, dateValue, proposed);
    const a: Attempt = { ...(input.declaredUnknown === undefined ? {} : { declaredUnknown: input.declaredUnknown }), id: input.id, sessionId: input.sessionId, questionId: q.id, topicId: t.id, at, date: dateValue, result, firstResponse: input.response.trim(), choice: input.choice, usedHint: input.usedHint, confidence: input.confidence, correctionMade: input.correctionMade, selfExplanation: input.selfExplanation.trim(), errorTag: result === 'wrong' ? input.errorTag : '', notes: input.notes.trim(), minutes: input.minutes, source: 'Recuperação ativa', origin: 'practice', interval, snapshot: { prompt: q.prompt, answer: q.answer } };
    return { ...c, attempts: [...c.attempts, a], logs: [...c.logs, { id: 'practice-' + a.id, subjectId: t.subjectId, topicId: t.id, date: dateValue, minutes: a.minutes, method: 'Questões', notes: 'Recuperação ativa · tentativa ' + a.id }], topics: c.topics.map(x => x.id === t.id ? { ...x, started: !x.started || dateValue < x.started ? dateValue : x.started } : x) };
}
function localDay(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export function validateLearning(c: Contest) {
    if (c.learningVersion !== 1 || !Array.isArray(c.questions) || !Array.isArray(c.attempts))
        throw Error('Banco de perguntas incompleto.');
    const ids = new Set<string>();
    for (const q of c.questions) {
        validateQuestion(c, q);
        if (ids.has(q.id))
            throw Error('Perguntas com identificadores duplicados.');
        ids.add(q.id);
    }
    const seen = new Set<string>();
    for (const a of c.attempts) {
        if (!a || typeof a.id !== 'string' || seen.has(a.id) || !c.topics.some(t => t.id === a.topicId) || a.questionId && !c.questions.some(q => q.id === a.questionId && q.topicId === a.topicId) || !['alone', 'assisted', 'wrong'].includes(a.result) || !validDate(a.date) || !Number.isFinite(Date.parse(a.at)) || !Number.isFinite(a.interval) || a.interval < 1 || !Number.isFinite(a.minutes) || a.minutes < 0 || typeof a.usedHint !== 'boolean' || a.declaredUnknown !== undefined && typeof a.declaredUnknown !== 'boolean' || !['practice', 'legacy'].includes(a.origin) || typeof a.sessionId !== 'string' || !a.snapshot || typeof a.snapshot.prompt !== 'string' || typeof a.snapshot.answer !== 'string')
            throw Error('Histórico de tentativas inválido.');
        for (const k of ['firstResponse', 'confidence', 'selfExplanation', 'errorTag', 'notes', 'source'] as const)
            if (typeof a[k] !== 'string')
                throw Error('Texto da tentativa inválido.');
        if (typeof a.correctionMade !== 'boolean' || a.choice !== null && (!Number.isInteger(a.choice) || a.choice < 0))
            throw Error('Resultado de tentativa inválido.');
        seen.add(a.id);
    }
}
function importLearning(c: Contest, core: Record<string, unknown>) {
    const topicMap = new Map<string, string>(), coreSubjects = arr(core.subjects);
    for (const old of arr(core.topics)) {
        const name = str(coreSubjects.find(s => s.id === old.subjectId)?.name);
        if (!name || !str(old.id) || !str(old.title))
            continue;
        let subject = c.subjects.find(s => s.name === name);
        if (!subject) {
            subject = { id: 'core-s-' + str(old.subjectId), name, color: colors[c.subjects.length % colors.length], questions: 0, points: 1, difficulty: 3, active: coreSubjects.find(s => s.id === old.subjectId)?.active !== false };
            while (c.subjects.some(s => s.id === subject!.id))
                subject.id += '-core';
            c.subjects.push(subject);
        }
        let topic = c.topics.find(t => t.id === old.id && t.subjectId === subject.id) || c.topics.find(t => t.subjectId === subject.id && t.title.toLocaleLowerCase() === str(old.title).toLocaleLowerCase());
        if (!topic) {
            let id = str(old.id);
            while (c.topics.some(t => t.id === id))
                id = 'core-' + id;
            topic = { id, subjectId: subject.id, title: str(old.title), hours: Math.max(.1, num(old.minutes, 30) / 60), done: false, started: '', notes: str(old.group) };
            c.topics.push(topic);
        }
        topicMap.set(str(old.id), topic.id);
    }
    const questionMap = new Map<string, string>();
    for (const old of arr(core.questions)) {
        const topicId = topicMap.get(str(old.topicId)) || (c.topics.some(t => t.id === old.topicId) ? str(old.topicId) : '');
        if (!topicId || !str(old.id) || !str(old.prompt).trim() || !str(old.answer).trim())
            continue;
        const q = emptyQuestion(topicId);
        q.id = str(old.id);
        while (c.questions.some(x => x.id === q.id))
            q.id = 'core-' + q.id;
        for (const key of ['prompt', 'answer', 'explanation', 'hint', 'example', 'guided', 'guidedPrompt', 'guidedAnswer', 'source'] as const)
            q[key] = str(old[key]);
        q.archived = old.archived === true;
        if (Array.isArray(old.options) && old.options.length >= 2 && old.options.length <= 6 && old.options.every(v => typeof v === 'string' && v.trim()) && Number.isInteger(old.correct) && num(old.correct) >= 0 && num(old.correct) < old.options.length) {
            q.options = old.options as string[];
            q.correct = num(old.correct);
        }
        // Campos guiados incompletos permanecem no JSON original e como nota de apoio.
        if (Boolean(q.guidedPrompt.trim()) !== Boolean(q.guidedAnswer.trim())) {
            q.guided = [q.guided, q.guidedPrompt, q.guidedAnswer].filter(Boolean).join('\n');
            q.guidedPrompt = '';
            q.guidedAnswer = '';
        }
        try {
            validateQuestion(c, q);
            c.questions.push(q);
            questionMap.set(str(old.id), q.id);
        }
        catch { /* O original integral permanece arquivado. */ }
    }
    for (const [i, old] of arr(core.attempts).sort((a, b) => str(a.at).localeCompare(str(b.at))).entries()) {
        const questionId = questionMap.get(str(old.questionId)) || '', q = c.questions.find(q => q.id === questionId), topicId = q?.topicId || topicMap.get(str(old.topicId)) || (c.topics.some(t => t.id === old.topicId) ? str(old.topicId) : '');
        if (!topicId || !['alone', 'assisted', 'wrong'].includes(str(old.result)) || !Number.isFinite(Date.parse(str(old.at))))
            continue;
        let id = str(old.id, 'legacy-attempt-' + i);
        while (c.attempts.some(a => a.id === id))
            id = 'core-' + id;
        const at = str(old.at), result = (old.usedHint === true && old.result === 'alone' ? 'assisted' : old.result) as AttemptResult, prior = c.attempts.filter(a => a.questionId === questionId && questionId).sort((a, b) => a.at.localeCompare(b.at)).at(-1), previous = prior?.interval || c.reviewDays;
        const interval = result === 'wrong' ? c.reviewDays : result === 'assisted' ? Math.max(c.reviewDays, Math.round(previous * .75)) : prior && prior.date === localDay(new Date(at)) ? previous : prior ? Math.min(c.reviewMax, Math.round(previous * c.reviewGrowth)) : c.reviewDays;
        c.attempts.push({ id, questionId, topicId, at, date: localDay(new Date(at)), result, firstResponse: str(old.firstResponse), usedHint: old.usedHint === true, confidence: str(old.confidence), correctionMade: old.correctionMade === true, selfExplanation: str(old.selfExplanation), errorTag: str(old.errorTag), notes: str(old.notes), minutes: Math.max(0, num(old.minutes)), source: str(old.source, 'Tentativa importada'), origin: 'legacy', sessionId: str(old.examId), interval, choice: null, snapshot: { prompt: q?.prompt || 'Pergunta legada sem vínculo', answer: q?.answer || '' } });
    }
    // Um único saldo de tempo por data e assunto cobre apenas o excedente não detalhado no legado.
    const groups = new Map<string, {
        topicId: string;
        date: string;
        subjectId: string;
        minutes: number;
    }>();
    for (const a of c.attempts) {
        const t = c.topics.find(t => t.id === a.topicId)!;
        const key = a.date + '|' + t.subjectId;
        const group = groups.get(key) || { topicId: t.id, date: a.date, subjectId: t.subjectId, minutes: 0 };
        group.minutes += a.minutes;
        groups.set(key, group);
    }
    for (const [key, g] of groups) {
        const known = c.logs.filter(l => l.date === g.date && l.subjectId === g.subjectId && ['Questões', 'Revisão', 'Revisão ativa', 'Flashcards'].includes(l.method)).reduce((n, l) => n + l.minutes, 0);
        if (g.minutes > known) {
            const minutes = Math.round((g.minutes - known) * 100) / 100;
            if (minutes <= 0)
                continue;
            creditAggregateTime(c, g.subjectId, g.date, minutes);
            c.logs.push({ id: 'legacy-practice-' + key, subjectId: g.subjectId, topicId: g.topicId, date: g.date, minutes, method: 'Questões', notes: 'Saldo de tempo das tentativas antigas, sem duplicar registros detalhados ou saldos semanais.' });
        }
    }
    for (const t of c.topics) {
        const first = c.attempts.filter(a => a.topicId === t.id).map(a => a.date).sort()[0];
        if (first && (!t.started || first < t.started))
            t.started = first;
    }
}
function creditAggregateTime(c: Contest, subjectId: string, date: string, minutes: number) {
    let left = minutes;
    for (const l of c.logs) {
        if (l.method === 'Saldo legado' && l.subjectId === subjectId && monday(l.date) === monday(date)) {
            const used = Math.min(left, l.minutes);
            l.minutes -= used;
            left -= used;
            if (left <= 0)
                break;
        }
    }
    c.logs = c.logs.filter(l => l.minutes > 0);
}
export function upgradeDatabase(input: unknown, seed: SeedUnit[] = []): Database {
    const value = structuredClone(input), d = obj(value);
    if (d.version !== 6 || !Array.isArray(d.contests) || !Array.isArray(d.archives))
        throw Error('Backup 6.0 inválido.');
    const oldIds = new Set<string>();
    for (const item of d.contests) {
        const c = obj(item);
        if (c.learningVersion === undefined) {
            oldIds.add(str(c.id));
            if (c.questions === undefined)
                c.questions = [];
            if (c.attempts === undefined)
                c.attempts = [];
            c.learningVersion = 1;
        }
    }
    if (oldIds.size) {
        for (const archive of arr(d.archives)) {
            if (obj(archive.payload).version === 6)
                continue;
            let recovered: Database;
            try {
                recovered = migrate(archive.payload, seed);
            }
            catch {
                continue;
            }
            for (const source of recovered.contests) {
                const targets = (d.contests as Contest[]).filter(c => oldIds.has(c.id) && (c.id === source.id || c.id.startsWith(source.id + '-copy-')));
                for (const target of targets) {
                    // A restauração de um banco antes arquivado é aditiva; não substitui edições nativas.
                    for (const s of source.subjects)
                        if (!target.subjects.some(t => t.id === s.id))
                            target.subjects.push(s);
                    for (const t of source.topics)
                        if (!target.topics.some(x => x.id === t.id))
                            target.topics.push(t);
                    for (const q of source.questions)
                        if (!target.questions.some(x => x.id === q.id))
                            target.questions.push(q);
                    for (const a of source.attempts)
                        if (!target.attempts.some(x => x.id === a.id))
                            target.attempts.push(a);
                    for (const l of source.logs.filter(l => l.id.startsWith('legacy-practice-')))
                        if (!target.logs.some(x => x.id === l.id)) {
                            creditAggregateTime(target, l.subjectId, l.date, l.minutes);
                            target.logs.push(l);
                        }
                }
            }
        }
    }
    validateDB(value);
    return value;
}
