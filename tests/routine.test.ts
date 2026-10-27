import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyContest, schedule, plus } from '../src/domain.ts';
const make=()=>{const c=emptyContest();c.startDate='2026-01-01';c.daily=[60,60,60,60,60,0,0];c.subjects=[{id:'s',name:'Tema',color:'#777777',questions:10,points:1,difficulty:3,active:true}];c.topics=[{id:'t',subjectId:'s',title:'Assunto',hours:40,done:false,started:'',notes:''}];return c;};
test('revisão cabe em blocos de cinco ou dez minutos e menos de cinco fica pendente',()=>{
 for(const minutes of [5,10]){const c=make();c.daily=[minutes,0,0,0,0,0,0];c.deadline='2026-10-26';c.topics[0].started='2026-10-01';const before=JSON.stringify(c),p=schedule(c,'2026-10-26');assert.equal(p.days[0].tasks[0].minutes,minutes);assert.equal(p.unscheduledReviews,0);assert.equal(JSON.stringify(c),before);}
 const c=make();c.daily=[4,0,0,0,0,0,0];c.deadline='2026-10-26';c.topics[0].started='2026-10-01';assert.equal(schedule(c,'2026-10-26').unscheduledReviews,1);
});
test('revisões mais antigas entram primeiro e pendências passam ao próximo dia disponível',()=>{
 const c=make();c.daily=[10,10,10,0,0,0,0];c.deadline='2026-10-28';
 c.topics=['2026-10-03','2026-10-01','2026-10-02'].map((date,i)=>({id:'t'+i,subjectId:'s',title:'Tema'+i,hours:2,done:true,started:date,notes:''}));
 const p=schedule(c,'2026-10-26');assert.deepEqual(p.days.map(d=>d.tasks[0].topicId),['t1','t2','t0']);assert.equal(p.unscheduledReviews,0);assert.equal(c.reviews.length,0);
});
test('bloco curto respeita meta manual restante e matéria zerada continua sem tarefas',()=>{
 const c=make();c.cycleMode='manual';c.subjects[0].manualMinutes=7;c.topics[0].started='2026-10-01';c.daily=[10,0,0,0,0,0,0];c.deadline='2026-10-26';
 const p=schedule(c,'2026-10-26');assert.equal(p.days[0].tasks[0].minutes,7);assert.equal(p.days[0].freeMinutes,3);
 c.subjects[0].manualMinutes=0;assert.equal(schedule(c,'2026-10-26').unscheduledReviews,1);
});
test('reserva para prática faz parte do tempo livre e desconta prática já registrada',()=>{
 const c=make();c.deadline='2026-10-26';c.logs=[{id:'l',subjectId:'s',topicId:'',date:'2026-10-26',minutes:5,method:'Questões',notes:''}];
 const d=schedule(c,'2026-10-26').days[0];assert.equal(d.used,5);assert.equal(d.tasks.reduce((n,t)=>n+t.minutes,0),45);assert.equal(d.freeMinutes,10);assert.equal(d.practiceReserve,10);assert.equal(d.used+d.freeMinutes+d.tasks.reduce((n,t)=>n+t.minutes,0),d.capacity);
});
test('histórico acima da capacidade é preservado sem sugerir sobrecarga e descanso fica livre de tarefas',()=>{
 const c=make();c.daily=[30,0,0,0,0,0,0];c.deadline='2026-11-01';c.logs=[{id:'l',subjectId:'s',topicId:'t',date:'2026-10-26',minutes:60,method:'Teoria',notes:''}];const before=JSON.stringify(c),p=schedule(c,'2026-10-26');
 assert.equal(p.days[0].tasks.length,0);assert.equal(p.days[0].freeMinutes,0);assert.equal(p.days[0].practiceReserve,0);assert.ok(p.days.slice(1).every(d=>d.tasks.length===0));assert.equal(JSON.stringify(c),before);
});
test('sem prova ou prazo a janela tem 28 dias a partir do início válido inclusive início futuro',()=>{
 const c=make(),p=schedule(c,'2026-10-26');assert.equal(p.days.length,28);assert.equal(p.days.at(-1)!.date,plus('2026-10-26',27));
 c.startDate='2026-12-01';const future=schedule(c,'2026-10-26');assert.equal(future.days.length,28);assert.equal(future.days[0].date,'2026-12-01');assert.equal(future.days.at(-1)!.date,'2026-12-28');
});
test('prazo vencido abre prévia de retomada sem alterar prazo, conclusão ou histórico',()=>{
 const c=make();c.deadline='2026-10-10';const before=JSON.stringify(c),p=schedule(c,'2026-10-26');
 assert.equal(p.recoveryPreview,true);assert.equal(p.days.length,28);assert.ok(p.days[0].tasks.some(t=>!t.review));assert.equal(JSON.stringify(c),before);
});
test('retomada para antes da prova e prova passada não reabre cronograma',()=>{
 const c=make();c.deadline='2026-10-10';c.examDate='2026-10-29';const p=schedule(c,'2026-10-26');assert.equal(p.recoveryPreview,true);assert.equal(p.days.at(-1)!.date,'2026-10-28');
 c.examDate='2026-10-26';const stopped=schedule(c,'2026-10-26');assert.equal(stopped.days.length,0);assert.equal(stopped.recoveryPreview,false);
});
