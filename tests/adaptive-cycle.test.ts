import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyContest, cycle, emptyQuestion, saveQuestion, applyPractice, registerReview, questionDue, reviewDue, emptyDB, migrate } from '../src/domain.ts';
import { subjectPerformance } from '../src/performance.ts';
import type { Contest, PracticeInput } from '../src/domain.ts';
const make = () => {
    const c = emptyContest(); c.startDate = '2026-01-01';
    c.subjects = ['a','b'].map(id => ({ id, name: id, color: '#777777', questions: 10, points: 1, difficulty: 3, active: true }));
    c.topics = ['a','b'].map(id => ({ id, subjectId: id, title: id, hours: 10, started: '', done: false, notes: '' }));
    return c;
};
const input = (id: string, questionId: string, at: string, correct = true): PracticeInput => ({ id, sessionId: id, questionId, response: 'Resposta', choice: correct ? 0 : 1, usedHint: false, result: 'alone', confidence: '', correctionMade: true, selfExplanation: '', errorTag: '', notes: '', minutes: 1, at });
function add(c: Contest, count: number, sameDay = false) {
    for (let i=0; i<count; i++) {
        const id='q'+i;
        c=saveQuestion(c, {...emptyQuestion('a'), id, prompt: 'Pergunta '+i, answer: 'Certa', options: ['Certa','Errada'], correct: 0 });
        c=applyPractice(c,input('a'+i,id,`2026-10-${sameDay ? '20' : 20+i%3}T15:00:00Z`,false));
    }
    return c;
}
test('ajuste exige 20 perguntas diferentes e pelo menos três dias', () => {
    assert.equal(subjectPerformance(add(make(),19),'a','2026-10-26').factor,1);
    assert.equal(subjectPerformance(add(make(),20,true),'a','2026-10-26').factor,1);
    assert.equal(subjectPerformance(add(make(),20),'a','2026-10-26').ready,true);
});
test('dificuldade observada aumenta prioridade suavemente sem aumentar horas e sem mutar dados', () => {
    const c=add(make(),20), before=JSON.stringify(c), rows=cycle(c,'2026-10-26');
    assert.ok(rows.find(s=>s.id==='a')!.target > rows.find(s=>s.id==='b')!.target);
    const p=subjectPerformance(c,'a','2026-10-26'); assert.equal(p.factor,1.125); assert.ok(p.factor<=1.25);
    assert.ok(Math.abs(rows.reduce((n,s)=>n+s.target,0)-300)<.0001); assert.equal(JSON.stringify(c),before);
});
test('ajuste desligado, horas manuais e mínimos são respeitados', () => {
    const c=add(make(),20); delete c.adaptiveCycle;
    assert.equal(cycle(c,'2026-10-26').find(s=>s.id==='a')!.target,150);
    c.adaptiveCycle=true; c.cycleMode='manual'; c.subjects[0].manualMinutes=60; c.subjects[1].manualMinutes=120;
    assert.deepEqual(cycle(c,'2026-10-26').map(s=>s.target).sort((a,b)=>a-b),[60,120]);
    c.cycleMode='automatic'; c.subjects[1].minimumMinutes=200;
    assert.equal(cycle(c,'2026-10-26').find(s=>s.id==='b')!.target,200);
    c.subjects[0].extra=true; c.subjects[0].minimumMinutes=30;
    assert.equal(cycle(c,'2026-10-26').find(s=>s.id==='a')!.target,30);
});
test('repetir uma pergunta não aumenta a amostra e perguntas abertas, arquivadas ou antigas não entram', () => {
    let c=add(make(),1);
    for(let i=0;i<25;i++) c=applyPractice(c,input('again'+i,'q0',`2026-10-${String(21+Math.floor(i/5)).padStart(2,'0')}T${String(16+i%5).padStart(2,'0')}:00:00Z`,false));
    assert.equal(subjectPerformance(c,'a','2026-10-26').count,1);
    c.questions[0].archived=true; assert.equal(subjectPerformance(c,'a','2026-10-26').count,0);
    c.questions[0].archived=false; c.questions[0].options=[]; c.questions[0].correct=null;
    assert.equal(subjectPerformance(c,'a','2026-10-26').count,0);
    c=add(make(),20); assert.equal(subjectPerformance(c,'a','2027-03-01').count,0);
});
test('acertos independentes recentes substituem erros antigos sem contar a pergunta duas vezes', () => {
    let c=add(make(),20);
    for(let i=0;i<20;i++) c=applyPractice(c,input('ok'+i,'q'+i,'2026-10-23T15:00:00Z',true));
    const p=subjectPerformance(c,'a','2026-10-26');assert.equal(p.count,20);assert.equal(p.independentRate,1);assert.equal(p.factor,1);
});
function reviewed() {
    let c=saveQuestion(make(), {...emptyQuestion('a'),id:'q',prompt:'Pergunta',answer:'Certa',options:['Certa','Errada'],correct:0});
    c=applyPractice(c,input('old','q','2026-10-20T10:00:00Z',false));
    c.reviews=[{id:'r',topicId:'a',date:'2026-10-20',recordedAt:'2026-10-20T12:00:00Z',rating:2,interval:10,questions:10,correct:9}];
    return c;
}
test('revisão com horário cobre prática anterior no mesmo dia e alinha assunto e pergunta', () => {
    const c=reviewed(), before=JSON.stringify(c);
    assert.equal(questionDue(c,c.questions[0]).date,'2026-10-30');
    assert.equal(reviewDue(c,c.topics[0])!.date,'2026-10-30');
    assert.equal(JSON.stringify(c),before);
});
test('erro após revisão no mesmo dia continua pendente e não é escondido pela avaliação do assunto', () => {
    const c=applyPractice(reviewed(),input('later','q','2026-10-20T16:00:00Z',false));
    assert.equal(questionDue(c,c.questions[0]).date,'2026-10-21');
    assert.equal(reviewDue(c,c.topics[0])!.date,'2026-10-21');
});
test('prática posterior utiliza intervalo da revisão do assunto e legado sem horário permanece conservador', () => {
    let c=reviewed(); c=applyPractice(c,input('next','q','2026-10-21T16:00:00Z',true));
    assert.equal(c.attempts.at(-1)!.interval,20);
    const old=reviewed(); delete old.reviews[0].recordedAt;
    assert.equal(reviewDue(old,old.topics[0])!.date,'2026-10-21');
    const d=emptyDB();d.contests=[old];d.activeId=old.id;delete old.adaptiveCycle;
    assert.deepEqual(migrate(JSON.parse(JSON.stringify(d))),d);
});
test('horário de revisão novo é salvo e campos opcionais inválidos são recusados no backup', () => {
    const c=make(), r=registerReview(c,'a','2026-10-20',2);
    assert.ok(Number.isFinite(Date.parse(r.recordedAt!)));
    const d=emptyDB(); d.contests=[{...c,reviews:[r]}];d.activeId=c.id;
    assert.deepEqual(migrate(JSON.parse(JSON.stringify(d))),d);
    d.contests[0].reviews[0].recordedAt='invalid'; assert.throws(()=>migrate(d));
});
