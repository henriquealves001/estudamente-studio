import type { Contest } from './domain';

export type QuestionEvent = { key: string; date: string; subjectId: string; total: number; correct: number; alone: number; assisted: number };
// Identidade de origem compartilhada entre progresso local e ranking.
export function questionEvents(c: Contest): QuestionEvent[] {
    const subject = new Map(c.topics.map(t => [t.id,t.subjectId])), seen = new Set<string>();
    const rows: QuestionEvent[] = [
        ...c.attempts.map(a => ({ key:'attempt:'+a.id,date:a.date,subjectId:subject.get(a.topicId)||'',total:1,correct:a.result==='wrong'?0:1,alone:a.result==='alone'?1:0,assisted:a.result==='assisted'?1:0 })),
        ...c.reviews.map(r => ({ key:'review:'+r.id,date:r.date,subjectId:subject.get(r.topicId)||'',total:r.questions,correct:r.correct,alone:0,assisted:0 })),
        ...c.records.filter(r => ['Questões','Simulados'].includes(r.kind)).map(r => ({key:'record:'+r.id,date:r.date,subjectId:r.subjectId,total:r.total,correct:r.correct,alone:0,assisted:0}))
    ];
    return rows.filter(r => {if(seen.has(r.key))return false;seen.add(r.key);return true;});
}
export function questionMetrics(c: Contest, subjectId?: string) {
    const rows=questionEvents(c).filter(r => subjectId===undefined || r.subjectId===subjectId);
    return rows.reduce((sum,r) => ({total:sum.total+r.total,correct:sum.correct+r.correct,alone:sum.alone+r.alone,assisted:sum.assisted+r.assisted}),{total:0,correct:0,alone:0,assisted:0});
}
function quantile(sorted:number[], p:number) {
    const index=(sorted.length-1)*p, lower=Math.floor(index), fraction=index-lower;
    return sorted[lower]+(sorted[Math.ceil(index)]-sorted[lower])*fraction;
}
export function questionPace(c: Contest, subjectId: string, now: string, blockMinutes=30) {
    if(!Number.isFinite(blockMinutes)||blockMinutes<=0||blockMinutes>120) throw Error('Use um bloco entre 0 e 120 minutos.');
    const from=new Date(Date.parse(now+'T12:00:00Z')-89*86400000).toISOString().slice(0,10);
    const topics=new Set(c.topics.filter(t=>t.subjectId===subjectId).map(t=>t.id));
    const questions=new Map(c.questions.filter(q=>topics.has(q.topicId)&&!q.archived&&q.options.length>=2&&q.correct!==null).map(q=>[q.id,q]));
    const seen=new Set<string>();
    const sample=c.attempts.filter(a=>{
        const q=questions.get(a.questionId);
        return a.origin==='practice'&&q&&a.date>=from&&a.date<=now&&Number.isFinite(a.minutes)&&a.minutes>=.1&&a.snapshot.prompt===q.prompt&&a.snapshot.answer===q.answer;
    }).sort((a,b)=>b.at.localeCompare(a.at)).filter(a=>{if(seen.has(a.questionId))return false;seen.add(a.questionId);return true;}).slice(0,50);
    const days=new Set(sample.map(a=>a.date)).size, ready=sample.length>=20&&days>=3;
    const times=sample.map(a=>a.minutes).sort((a,b)=>a-b);
    if(!ready)return {ready:false as const,count:sample.length,days,median:null,estimate:null,low:null,high:null};
    const median=quantile(times,.5), slow=quantile(times,.75), fast=quantile(times,.25);
    return {ready:true as const,count:sample.length,days,median,estimate:Math.floor(blockMinutes/median),low:Math.floor(blockMinutes/slow),high:Math.floor(blockMinutes/fast)};
}
