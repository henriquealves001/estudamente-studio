import type { Contest } from './domain.ts';
import { recordStudy, validDate } from './domain.ts';
export const TIMER_KEY = 'estudamente-timer-v1';
export type StudyTimerDraft = { version: 1; id: string; contestId: string; subjectId: string; topicId: string; method: string; elapsedMs: number; startedAt: number | null; date: string };
export function parseTimer(raw: string | null): StudyTimerDraft | null {
    if (!raw) return null;
    const t = JSON.parse(raw) as StudyTimerDraft;
    if (t.version !== 1 || !t.id || typeof t.id !== 'string' || !t.contestId || !t.subjectId || typeof t.topicId !== 'string' || !['Teoria', 'Questões', 'Revisão', 'Flashcards'].includes(t.method) || !validDate(t.date) || !Number.isFinite(t.elapsedMs) || t.elapsedMs < 0 || t.startedAt !== null && (!Number.isFinite(t.startedAt) || t.startedAt < 0)) throw Error('O rascunho do cronômetro não pôde ser lido. Exporte-o antes de reiniciar.');
    return t;
}
export function timerElapsed(t: StudyTimerDraft, now: number) { return t.elapsedMs + (t.startedAt === null ? 0 : Math.max(0, now - t.startedAt)); }
export function pauseTimer(t: StudyTimerDraft, now: number): StudyTimerDraft { return { ...t, elapsedMs: timerElapsed(t, now), startedAt: null }; }
export function resumeTimer(t: StudyTimerDraft, now: number): StudyTimerDraft { return t.startedAt !== null ? t : { ...t, startedAt: now }; }
export function saveTimerStudy(c: Contest, t: StudyTimerDraft, date: string, minutes: number, notes: string): Contest {
    if (t.contestId !== c.id) throw Error('Volte ao concurso em que iniciou o cronômetro.');
    const id = 'timer-' + t.id;
    if (c.logs.some(l => l.id === id)) return c;
    const next = recordStudy(c, { subjectId: t.subjectId, topicId: t.topicId, date, minutes, method: t.method, notes });
    return { ...next, logs: next.logs.map((l, i) => i === next.logs.length - 1 ? { ...l, id } : l) };
}
