import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyContest, emptyDB, emptyQuestion, saveQuestion, applyPractice } from '../src/domain.ts';
import { questionEvents, questionMetrics, questionPace } from '../src/metrics.ts';
import { aggregateTotals } from '../src/social.ts';
import type { Contest, PracticeInput } from '../src/domain.ts';
const make=()=>{const c=emptyContest();c.startDate='2026-01-01';c.subjects=[{id:'s',name:'Tema',color:'#777777',questions:20,points:1,difficulty:3,active:true}];c.topics=[{id:'t',subjectId:'s',title:'Assunto',hours:10,started:'',done:false,notes:''}];return c;};
const input=(id:string,questionId:string,day:number,minutes:number):PracticeInput=>({id,sessionId:id,questionId,response:'A',choice:0,usedHint:false,result:'alone',confidence:'',correctionMade:true,selfExplanation:'',errorTag:'',notes:'',minutes,at:`2026-10-${day}T15:00:00Z`});
function sample(count=20,sameDay=false){let c=make();for(let i=0;i<count;i++){const id='q'+i;c=saveQuestion(c,{...emptyQuestion('t'),id,prompt:'P'+i,answer:'A',options:['A','B'],correct:0});c=applyPractice(c,input('a'+i,id,sameDay?20:20+i%3,1+Math.floor(i/5)));}return c;}
test('métricas incluem prática assistida, revisão, registros gerais e arquivos sem incluir outras categorias',()=>{
 const c=sample(1);c.attempts[0].result='assisted';c.subjects[0].active=false;c.questions[0].archived=true;
 c.reviews=[{id:'r',topicId:'t',date:'2026-10-20',rating:2,interval:2,questions:10,correct:8}];
 c.records=[{id:'g',kind:'Simulados',date:'2026-10-20',title:'Geral',subjectId:'',total:5,correct:3,notes:'',url:''},{id:'n',kind:'Notas',date:'2026-10-20',title:'Nota',subjectId:'s',total:100,correct:100,notes:'',url:''}];
 assert.deepEqual(questionMetrics(c),{total:16,correct:12,alone:0,assisted:1});
 assert.equal(questionMetrics(c,'s').total,11);assert.equal(questionMetrics(c,'').total,5);
});
test('progresso e ranking compartilham origens e cópias de concurso não duplicam questões no ranking',()=>{
 const c=sample(),db=emptyDB();c.records=[{id:'g',kind:'Questões',date:'2026-10-20',title:'Geral',subjectId:'',total:10,correct:8,notes:'',url:''}];
 db.contests=[c,{...structuredClone(c),id:'copy'}];db.activeId=c.id;
 assert.equal(aggregateTotals(db,'2026-10-26').reduce((n,r)=>n+r.questions,0),questionMetrics(c).total);
 assert.equal(questionEvents(c).length,21);
});
test('fontes diferentes com mesmo identificador não são confundidas e eventos duplicados da mesma origem não se repetem',()=>{
 const c=sample(1); c.reviews=[{id:'a0',topicId:'t',date:'2026-10-20',rating:2,interval:2,questions:10,correct:8}];
 c.attempts.push(structuredClone(c.attempts[0]));assert.equal(questionMetrics(c).total,11);
});
test('ritmo exige perguntas diferentes e três dias antes de produzir estimativa',()=>{
 assert.equal(questionPace(sample(19),'s','2026-10-26').ready,false);
 assert.equal(questionPace(sample(20,true),'s','2026-10-26').ready,false);
 const p=questionPace(sample(),'s','2026-10-26');assert.equal(p.ready,true);assert.equal(p.count,20);assert.equal(p.days,3);
});
test('estimativa usa mediana e faixa interquartil do tempo declarado e não muda históricos',()=>{
 const c=sample(),before=JSON.stringify(c),p=questionPace(c,'s','2026-10-26');
 assert.equal(p.median,2.5);assert.equal(p.estimate,12);assert.equal(p.low,9);assert.equal(p.high,17);
 assert.equal(JSON.stringify(c),before);c.attempts[19].minutes=100;
 assert.equal(questionPace(c,'s','2026-10-26').median,2.5);
 assert.throws(()=>questionPace(c,'s','2026-10-26',0));
});
test('nova repetição substitui tempo anterior sem aumentar a amostra',()=>{
 let c=sample();c=applyPractice(c,input('again','q0',23,10));const p=questionPace(c,'s','2026-10-26');
 assert.equal(p.count,20);assert.equal(p.median,3);
});
test('ritmo exclui importações, questões editadas, abertas, arquivadas e datas fora da janela',()=>{
 const c=sample();c.attempts[0].origin='legacy';c.questions[1].prompt='Editada';c.questions[2].archived=true;c.questions[3].options=[];c.questions[3].correct=null;
 assert.equal(questionPace(c,'s','2026-10-26').count,16);
 assert.equal(questionPace(c,'s','2026-10-19').count,0);
 assert.equal(questionPace(c,'s','2027-03-01').count,0);
});
test('revisões e simulados sem tempo por questão não geram ritmo artificial',()=>{
 const c:Contest=make();c.reviews=[{id:'r',topicId:'t',date:'2026-10-20',rating:2,interval:2,questions:200,correct:100}];
 c.records=[{id:'g',kind:'Simulados',date:'2026-10-20',title:'Geral',subjectId:'s',total:500,correct:400,notes:'',url:''}];
 assert.equal(questionMetrics(c).total,700);assert.equal(questionPace(c,'s','2026-10-26').ready,false);
});
