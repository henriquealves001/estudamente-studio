import { cycle, emptyContest, colors, uid, validDate, today } from './domain.ts';
import type { Contest, Subject } from './domain.ts';
import { activatePlan } from './plans.ts';
export type AllocationMode = 'automatic' | 'manual';
export const sumMinutes = (daily: number[]) => daily.reduce((n, x) => n + x, 0);
export function validateDaily(daily: number[]) {
    if (daily.length !== 7 || daily.some(n => !Number.isInteger(n) || n < 0 || n > 1440)) throw Error('Use de 0 a 24 horas por dia.');
}
// Largest remainders preserve the exact total in whole minutes.
export function apportion(total: number, weights: number[]): number[] {
    const sum = sumMinutes(weights);
    if (!Number.isInteger(total) || total < 0 || weights.some(n => !Number.isFinite(n) || n < 0) || !sum && total) throw Error('Não foi possível distribuir esse tempo.');
    const raw = weights.map(n => sum ? total * n / sum : 0), result = raw.map(Math.floor);
    const order = raw.map((n, i) => ({ i, remainder: n - result[i] })).sort((a, b) => b.remainder - a.remainder || a.i - b.i);
    const remainder = total - sumMinutes(result);
    for (let i = 0; i < remainder; i++) result[order[i].i]++;
    return result;
}
export function expandAvailability(daily: number[], total: number) {
    validateDaily(daily);
    const days = daily.map((n, i) => n > 0 ? i : -1).filter(i => i >= 0);
    if (!days.length || total > days.length * 1440) throw Error('Selecione mais dias ou ajuste os horários. A proposta respeita até 24 horas por dia.');
    const next = [...daily]; let left = total; let pool = [...days];
    while (pool.length) {
        const values = apportion(left, pool.map(i => daily[i]));
        const full = pool.filter((_, j) => values[j] > 1440);
        if (!full.length) { pool.forEach((i, j) => next[i] = values[j]); break; }
        for (const i of full) { next[i] = 1440; left -= 1440; }
        pool = pool.filter(i => !full.includes(i));
    }
    return next;
}
export function allocationCandidate(c: Contest, subjects: Subject[], mode: AllocationMode, daily: number[], fit: boolean): Contest {
    validateDaily(daily);
    const key = mode === 'manual' ? 'manualMinutes' : 'minimumMinutes';
    const active = subjects.filter(s => s.active), weights = active.map(s => s[key] ?? 0);
    if (weights.some(n => !Number.isInteger(n) || n < 0 || n > 10080)) throw Error('Confira as horas de cada disciplina.');
    const capacity = sumMinutes(daily), requested = sumMinutes(weights);
    if (requested > capacity && !fit) throw Error('As metas ainda ultrapassam os horários. Escolha como ajustar abaixo.');
    const reduced = fit && requested > capacity ? apportion(capacity, weights) : weights;
    const byId = new Map(active.map((s, i) => [s.id, reduced[i]]));
    return { ...c, daily: [...daily], cycleMode: mode, subjects: subjects.map(s => s.active ? { ...s, [key]: byId.get(s.id)! } : { ...s }) };
}
export function allocationDiff(before: Contest, after: Contest) {
    const old = cycle(before), next = cycle(after);
    return next.map(s => ({ id: s.id, name: s.name, color: s.color, before: old.find(x => x.id === s.id)?.target ?? 0, after: s.target, delta: s.target - (old.find(x => x.id === s.id)?.target ?? 0) }));
}
export function setupPlan(current: Contest, choice: string, name: string, disciplines: string, daily: number[], examDate: string): Contest {
    validateDaily(daily);
    if (!sumMinutes(daily)) throw Error('Escolha pelo menos um horário de estudo.');
    if (!name.trim()) throw Error('Dê um nome ao seu plano.');
    if (examDate && (!validDate(examDate) || examDate < today())) throw Error('Use uma data de prova de hoje em diante, ou deixe em branco.');
    let next: Contest;
    if (choice === 'current') {
        next = { ...current };
        if (!current.subjects.some(s => s.active)) throw Error('Escolha um modelo ou adicione disciplinas ao seu plano.');
        if (current.deadline && examDate && current.deadline > examDate) next.deadline = examDate;
    } else if (choice === 'custom') {
        const names = [...new Set(disciplines.split(/\n/).map(s => s.trim()).filter(Boolean))];
        if (!names.length || names.length > 50 || names.some(n => n.length > 100)) throw Error('Informe de 1 a 50 disciplinas, uma por linha, com até 100 caracteres.');
        next = emptyContest(name);
        next.subjects = names.map((name, i) => ({ id: uid(), name, color: colors[i % colors.length], active: true, difficulty: 3, questions: 0, points: 1 }));
    } else next = activatePlan(choice, sumMinutes(daily) / 60, daily.map(n => n > 0));
    next = { ...next, name: name.trim(), daily: [...daily], examDate };
    if (choice !== 'current') next.deadline = examDate;
    const required = next.subjects.filter(s => s.active).reduce((n, s) => n + (next.cycleMode === 'manual' ? s.manualMinutes ?? 0 : s.minimumMinutes ?? 0), 0);
    if (required > sumMinutes(daily)) throw Error('Os horários não comportam suas metas atuais. Ajuste primeiro em Ciclo inteligente → Definir horas.');
    return next;
}
