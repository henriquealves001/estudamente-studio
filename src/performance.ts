import type { Contest } from './domain';

// Limites conservadores de produto; não são parâmetros prescritos pelos artigos.
export function subjectPerformance(c: Contest, subjectId: string, now: string) {
    const from = new Date(Date.parse(now + 'T12:00:00Z') - 89 * 86400000).toISOString().slice(0, 10);
    const topics = new Set(c.topics.filter(t => t.subjectId === subjectId).map(t => t.id));
    const questions = new Set(c.questions.filter(q => topics.has(q.topicId) && !q.archived && q.options.length >= 2 && q.correct !== null).map(q => q.id));
    const eligible = c.attempts.filter(a => questions.has(a.questionId) && a.date >= from && a.date <= now).sort((a,b) => b.at.localeCompare(a.at));
    const seen = new Set<string>();
    const sample = eligible.filter(a => { if (seen.has(a.questionId)) return false; seen.add(a.questionId); return true; }).slice(0, 50);
    const sampleIds = new Set(sample.map(a => a.questionId));
    const days = new Set(eligible.filter(a => sampleIds.has(a.questionId)).map(a => a.date)).size;
    const independentRate = sample.length ? sample.filter(a => a.result === 'alone').length / sample.length : 0;
    const ready = sample.length >= 20 && days >= 3;
    const factor = ready ? 1 + .25 * (1 - independentRate) * sample.length / (sample.length + 20) : 1;
    return { count: sample.length, days, independentRate, ready, factor };
}
