import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyContest, today, validateDB, emptyDB, KEY, persist } from '../src/domain.ts';
import { allocationCandidate, allocationDiff, expandAvailability, apportion, setupPlan } from '../src/planningSetup.ts';
import { parseTimer, timerElapsed, pauseTimer, resumeTimer, saveTimerStudy } from '../src/studyTimer.ts';
import type { StudyTimerDraft } from '../src/studyTimer.ts';
const make = () => { const c = emptyContest(); c.daily = [60,60,60,60,60,0,0]; c.subjects = ['Português','Matemática'].map((name,i)=>({id:'s'+i,name,color:'#8177ee',questions:10,points:1,difficulty:3,active:true})); return c; };
const timer = (c=make()): StudyTimerDraft => ({version:1,id:'session',contestId:c.id,subjectId:'s0',topicId:'',method:'Teoria',elapsedMs:0,startedAt:1000,date:today()});
test('proposta de redução conserva minutos exatos, dias de descanso e histórico sem mutar o original',()=>{
 const c=make();c.logs=[{id:'old',subjectId:'s0',topicId:'',date:today(),minutes:30,method:'Teoria',notes:'preservar'}]; const original=JSON.stringify(c);
 const draft=c.subjects.map((s,i)=>({...s,manualMinutes:i?200:400}));
 assert.throws(()=>allocationCandidate(c,draft,'manual',c.daily,false));
 const next=allocationCandidate(c,draft,'manual',c.daily,true);assert.deepEqual(next.subjects.map(s=>s.manualMinutes),[200,100]);assert.deepEqual(next.logs,c.logs);assert.deepEqual(next.daily,c.daily);assert.equal(JSON.stringify(c),original);
 assert.equal(allocationDiff(c,next).length,2);assert.equal(apportion(5,[1,1,1]).reduce((a,b)=>a+b,0),5);
});
test('mínimos só são reduzidos com escolha explícita e matérias extras preservam identidade',()=>{
 const c=make(),draft=c.subjects.map(s=>({...s,minimumMinutes:200,extra:true}));
 const next=allocationCandidate(c,draft,'automatic',c.daily,true);assert.deepEqual(next.subjects.map(s=>s.minimumMinutes),[150,150]);assert.ok(next.subjects.every(s=>s.extra));assert.equal(c.subjects[0].minimumMinutes,undefined);
});
test('aumento respeita 24h por dia, redistribui saturação e não abre dias de descanso',()=>{
 assert.deepEqual(expandAvailability([60,60,0,0,0,0,0],600),[300,300,0,0,0,0,0]);
 assert.deepEqual(expandAvailability([1400,10,0,0,0,0,0],2800),[1440,1360,0,0,0,0,0]);
 assert.throws(()=>expandAvailability([0,0,0,0,0,0,0],60));assert.throws(()=>expandAvailability([60,0,0,0,0,0,0],1441));
});
test('prévia com horário inválido não pode ser aplicada e arquivadas não são alteradas',()=>{
 const c=make();c.subjects[1].active=false;
 assert.throws(()=>allocationCandidate(c,c.subjects,'manual',[NaN,0,0,0,0,0,0],true));
 const next=allocationCandidate(c,c.subjects,'manual',c.daily,true);assert.deepEqual(next.subjects[1],c.subjects[1]);
});
test('guia cria plano independente, usa horários escolhidos e aceita prova desconhecida',()=>{
 const c=make(),original=JSON.stringify(c);const next=setupPlan(c,'custom','IBGE','Português\nMatemática\nPortuguês',[90,0,120,0,0,0,0],'');
 assert.notEqual(next.id,c.id);assert.equal(next.subjects.length,2);assert.equal(next.reviewMode,'automatic');assert.equal(next.examDate,'');assert.deepEqual(next.daily,[90,0,120,0,0,0,0]);assert.equal(JSON.stringify(c),original);
 const db=emptyDB();db.contests.push(next);validateDB(db);
});
test('guia ajusta plano atual sem perder configurações e bloqueia metas incompatíveis',()=>{
 const c=make();c.reviewMode='custom';c.reviewDays=7;c.cycleMode='manual';c.subjects[0].manualMinutes=200;
 const next=setupPlan(c,'current','Ajustado','',c.daily,'');assert.equal(next.id,c.id);assert.equal(next.reviewDays,7);assert.equal(next.cycleMode,'manual');assert.deepEqual(next.logs,c.logs);
 assert.throws(()=>setupPlan(c,'current','Ajustado','',[60,0,0,0,0,0,0],''));
 assert.throws(()=>setupPlan(c,'custom','Nome','Português',[0,0,0,0,0,0,0],''));
});
test('cronômetro desconta pausa e continua após serialização e recarga',()=>{
 const c=make(),t=timer(c);assert.equal(timerElapsed(t,61000),60000);
 const paused=pauseTimer(t,61000);assert.equal(timerElapsed(paused,181000),60000);
 const resumed=resumeTimer(parseTimer(JSON.stringify(paused))!,181000);assert.equal(timerElapsed(resumed,241000),120000);assert.equal(timerElapsed(resumeTimer(resumed,221000),241000),120000);
 assert.equal(timerElapsed(t,500),0);
});
test('sessão salva uma única vez com identificador estável, incluindo após recarga',()=>{
 const c=make(),t=timer(c),next=saveTimerStudy(c,t,today(),2,'medida');assert.equal(next.logs.length,1);assert.equal(next.logs[0].id,'timer-session');assert.equal(next.logs[0].minutes,2);assert.equal(c.logs.length,0);
 assert.equal(saveTimerStudy(next,parseTimer(JSON.stringify(t))!,today(),2,'medida'),next);
});
test('cronômetro bloqueia concurso incorreto, disciplina arquivada, futuro e tempo acima do limite',()=>{
 const c=make(),t=timer(c);assert.throws(()=>saveTimerStudy({...c,id:'other'},t,today(),1,''));
 assert.throws(()=>saveTimerStudy(c,t,'2099-01-01',1,''));assert.throws(()=>saveTimerStudy(c,t,today(),1441,''));c.subjects[0].active=false;assert.throws(()=>saveTimerStudy(c,t,today(),1,''));
 assert.throws(()=>parseTimer('{'));assert.throws(()=>parseTimer(JSON.stringify({...t,elapsedMs:-1})));assert.equal(parseTimer(null),null);
});
test('gravação concorrente não sobrescreve histórico e permite retomar após recarga',()=>{
 const db=emptyDB(),c=make();db.contests=[c];db.activeId=c.id;let raw:string|null=null;const storage={getItem:(key:string)=>key===KEY?raw:null,setItem:(key:string,value:string)=>{if(key===KEY)raw=value;}};
 const first=persist(storage,db,null);const t=timer(c);const next={...first.db,contests:[saveTimerStudy(first.db.contests[0],t,today(),3,'')]};persist(storage,next,first.serialized);
 assert.throws(()=>persist(storage,next,first.serialized));const reloaded=JSON.parse(raw!);assert.equal(saveTimerStudy(reloaded.contests[0],t,today(),3,'').logs.length,1);
});
