import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyContest, emptyDB, schedule, reviewDue, registerReview, migrate, nextReviewDate, emptyQuestion, saveQuestion, applyPractice, questionDue } from '../src/domain.ts';
import { revisionEvents, defaultCalendarOptions } from '../src/calendar.ts';
const make = () => {
    const c = emptyContest('Integração');
    c.startDate = '2026-01-01'; c.daily = [60, 60, 60, 60, 60, 60, 60];
    c.subjects = ['a', 'b'].map(id => ({ id, name: id, color: '#777777', active: true, questions: 10, points: 1, difficulty: 3 }));
    c.topics = ['a', 'b'].map(id => ({ id, subjectId: id, title: id, hours: 30, done: false, started: '', notes: '' }));
    return c;
};
test('cronograma encerra novos conteúdos no prazo e mantém revisões até a véspera da prova', () => {
    const c = make(); c.deadline = '2026-10-20'; c.examDate = '2026-10-24'; c.topics[0].started = '2026-10-21';
    const before = JSON.stringify(c), p = schedule(c, '2026-10-20');
    assert.equal(p.days.at(-1)!.date, '2026-10-23');
    assert.ok(p.days.find(d => d.date === '2026-10-22')!.tasks.some(t => t.review));
    assert.ok(p.days.filter(d => d.date > c.deadline).every(d => d.tasks.every(t => t.review)));
    assert.ok(p.shortage > 0); assert.equal(JSON.stringify(c), before);
});
test('prova limita cronograma mesmo com prazo posterior e prova passada não gera novas tarefas', () => {
    const c = make(); c.deadline = '2026-11-30'; c.examDate = '2026-10-23';
    assert.equal(schedule(c, '2026-10-20').days.at(-1)!.date, '2026-10-22');
    assert.equal(schedule(c, '2026-10-23').days.length, 0);
    c.deadline = ''; assert.equal(schedule(c, '2026-10-20').days.length, 3);
});
test('redistribuição considera tempo já estudado na semana e reinicia o saldo na semana seguinte', () => {
    const c = make(); c.contentShare = 1; c.deadline = '2026-10-27'; c.topics.forEach(t => { Object.assign(t, { reviewAnchor: '' }); });
    c.logs = [{ id: 'l', subjectId: 'a', topicId: 'a', date: '2026-10-25', minutes: 240, method: 'Teoria', notes: '' }, { id: 'l2', subjectId: 'a', topicId: 'a', date: '2026-10-26', minutes: 30, method: 'Questões', notes: '' }];
    const p = schedule(c, '2026-10-26');
    assert.equal(p.days[0].tasks[0].subjectId, 'b');
    assert.equal(p.days[0].tasks.reduce((n,t) => n+t.minutes, 0), 30);
    // O registro de domingo não ocupa a disponibilidade da semana seguinte.
    const clean = structuredClone(c); clean.logs = [c.logs[0]];
    assert.equal(schedule(clean, '2026-10-26').days[0].tasks[0].subjectId, 'a');
});
test('fila do assunto e agenda externa usam a mesma data limitada pela prova sem reescrever intervalos antigos', () => {
    const c = make(); c.examDate = '2026-10-25'; c.topics[0].started = '2026-10-01';
    c.reviews = [{ id: 'r', topicId: 'a', date: '2026-10-20', interval: 60, rating: 3, questions: 0, correct: 0 }];
    const before = JSON.stringify(c), due = reviewDue(c, c.topics[0])!;
    assert.equal(due.date, '2026-10-24'); assert.equal(due.interval, 4);
    assert.equal(revisionEvents(c, defaultCalendarOptions, new Date('2026-10-20T12:00:00Z')).events[0].originalDate, due.date);
    assert.equal(JSON.stringify(c), before);
    assert.equal(nextReviewDate(c, '2026-10-24', 1), null);
});
test('baixo desempenho objetivo limita Fácil e desempenho intermediário não expande intervalo', () => {
    const c = make(); c.topics[0].started = '2026-10-01';
    c.reviews = [{ id: 'r', topicId: 'a', date: '2026-10-10', interval: 8, rating: 2, questions: 0, correct: 0 }];
    assert.equal(registerReview(c, 'a', '2026-10-20', 3, 10, 4).interval, 1);
    assert.equal(registerReview(c, 'a', '2026-10-20', 3, 10, 7).interval, 8);
    assert.ok(registerReview(c, 'a', '2026-10-20', 2, 10, 9).interval > 8);
});
test('prática limita o próximo intervalo à prova e pergunta e assunto concordam', () => {
    let c = make(); c.examDate = '2026-10-23';
    c = saveQuestion(c, { ...emptyQuestion('a'), id: 'q', prompt: 'Explique', answer: 'Resposta' });
    const input = { id: 'x', sessionId: 'x', questionId: 'q', response: 'Resposta', choice: null, usedHint: false, result: 'alone' as const, confidence: '', correctionMade: true, selfExplanation: '', errorTag: '', notes: '', minutes: 1, at: '2026-10-20T15:00:00Z' };
    c = applyPractice(c, input); c.attempts[0].interval = 30;
    const before = JSON.stringify(c), n = applyPractice(c, { ...input, id: 'y', sessionId: 'y', at: '2026-10-21T15:00:00Z' });
    assert.equal(n.attempts[1].interval, 1);
    assert.equal(questionDue(n, n.questions[0]).date, '2026-10-22');
    assert.equal(reviewDue(n, n.topics[0])!.date, '2026-10-22');
    assert.equal(JSON.stringify(c), before);
});
test('revisão manual inicia fila mesmo sem log de teoria ou âncora legada', () => {
    const c = make(); c.topics[0].reviewAnchor = '';
    c.reviews = [{ id: 'r', topicId: 'a', date: '2026-10-20', interval: 5, rating: 2, questions: 0, correct: 0 }];
    assert.equal(reviewDue(c, c.topics[0])!.date, '2026-10-25');
});
test('modo automático é padrão de planos novos e backups antigos mantêm seus parâmetros', () => {
    assert.equal(make().reviewMode, 'automatic');
    const d = emptyDB(); delete d.contests[0].reviewMode; d.contests[0].reviewGrowth = 1.5;
    const before = JSON.stringify(d), copy = migrate(JSON.parse(before));
    assert.deepEqual(copy, d); assert.equal(copy.contests[0].reviewGrowth, 1.5);
    const invalid = structuredClone(copy) as unknown as {contests: {reviewMode: string}[]}; invalid.contests[0].reviewMode = 'invalid'; assert.throws(() => migrate(invalid));
});
