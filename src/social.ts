import { colors, emptyContest, uid } from './domain.ts';
import type { Contest, Database } from './domain.ts';

export type SharedPlan = { version: 1; name: string; subjects: { name: string; questions: number; points: number; difficulty: number; extra: boolean; topics: { title: string; hours: number }[] }[] };
export type PublicProfile = { id: string; name: string; bio: string; avatar: string; ranking: boolean };
export type CommunityPlan = { id: string; title: string; organization: string; edition: string; sourceUrl: string; description: string; createdAt: string; author: PublicProfile; subjects: number; topics: number; pdf: boolean; mine?: boolean; plan?: SharedPlan };
export type DailyTotal = { date: string; minutes: number; questions: number };
export function plain(value: unknown, max: number, min = 0): string {
    if (typeof value !== 'string') throw Error('Texto inválido.');
    const text = value.trim();
    if (text.length < min || text.length > max || [...text].some(c=>{const n=c.charCodeAt(0);return n<32&&n!==9&&n!==10&&n!==13;})) throw Error(`Use entre ${min} e ${max} caracteres.`);
    return text;
}
export function validDate(value: unknown): value is string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d=new Date(value+'T12:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value;
}
function number(value: unknown, max: number, min = 0, integer = false) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw Error('Quantidade fora do limite.');
    return value;
}
export function validatePlan(value: unknown): SharedPlan {
    const p = value as SharedPlan;
    if (!p || p.version !== 1 || !Array.isArray(p.subjects) || p.subjects.length < 1 || p.subjects.length > 60) throw Error('O plano precisa ter de 1 a 60 disciplinas.');
    let count = 0;
    const subjects = p.subjects.map(s => {
        if (!s || !Array.isArray(s.topics)) throw Error('Assuntos inválidos.');
        count += s.topics.length;
        if (count > 2000) throw Error('Limite de 2.000 assuntos por plano.');
        return { name: plain(s.name,100,1), questions:number(s.questions,10000,0,true), points:number(s.points,1000), difficulty:number(s.difficulty,5,1), extra:s.extra === true, topics:s.topics.map(t => ({title:plain(t.title,250,1),hours:number(t.hours,1000,0.1)})) };
    });
    return { version:1, name:plain(p.name,140,1),subjects };
}
// Explicit allowlist: no logs, notes, answers, scores, IDs, dates or personal availability.
export function sharePlan(c: Contest): SharedPlan {
    return validatePlan({version:1,name:c.name,subjects:c.subjects.filter(s=>s.active).map(s=>({name:s.name,questions:s.questions,points:s.points,difficulty:s.difficulty,extra:!!s.extra,topics:c.topics.filter(t=>t.subjectId===s.id).map(t=>({title:t.title,hours:t.hours}))}))});
}
export function adoptPlan(value: unknown, hoursPerWeek: number): Contest {
    const p=validatePlan(value), c=emptyContest(p.name);
    if (!Number.isFinite(hoursPerWeek) || hoursPerWeek < 1 || hoursPerWeek > 100) throw Error('Escolha de 1 a 100 horas por semana.');
    const minutes=Math.round(hoursPerWeek*60), daily=Array.from({length:7},(_,i)=>i<5 ? Math.floor(minutes/5)+(i<minutes%5?1:0) : 0);
    c.daily=daily;
    c.subjects=p.subjects.map((s,i)=>({id:uid(),name:s.name,color:colors[i%colors.length],questions:s.questions,points:s.points,difficulty:s.difficulty,active:true,extra:s.extra}));
    c.topics=p.subjects.flatMap((s,i)=>s.topics.map(t=>({id:uid(),subjectId:c.subjects[i].id,title:t.title,hours:t.hours,done:false,started:'',notes:''})));
    return c;
}
export function saoPauloDate(now=new Date()): string {
    const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
    return ['year','month','day'].map(k=>parts.find(p=>p.type===k)!.value).join('-');
}
export function periodStart(date: string, period: string): string {
    if (!validDate(date)) throw Error('Data inválida.');
    if (period==='month') return date.slice(0,7)+'-01';
    if (period==='week') { const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7)); return d.toISOString().slice(0,10); }
    if (period!=='day') throw Error('Período inválido.');
    return date;
}
export function dayBefore(date:string,days:number) { const d=new Date(date+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()-days); return d.toISOString().slice(0,10); }
export function validateTotals(value: unknown, today: string): DailyTotal[] {
    if (!Array.isArray(value) || value.length > 366) throw Error('Até 366 dias por sincronização.');
    const dates=new Set<string>(), first=dayBefore(today,365);
    return value.map(row=> {
        if (!row || !validDate(row.date) || row.date>today || row.date<first || dates.has(row.date)) throw Error('Data repetida, futura ou fora da janela de 366 dias.');
        dates.add(row.date);
        return {date:row.date,minutes:number(row.minutes,1440,0,true),questions:number(row.questions,10000,0,true)};
    });
}
export function aggregateTotals(db: Database, today=saoPauloDate()): DailyTotal[] {
    const rows=new Map<string,DailyTotal>(), seen=new Set<string>(), first=dayBefore(today,365);
    const add=(kind:string,id:string,date:string,minutes:number,questions:number)=>{
        if (seen.has(kind+id) || date<first || date>today || !validDate(date)) return;
        seen.add(kind+id);
        const row=rows.get(date)||{date,minutes:0,questions:0};
        row.minutes+=minutes;row.questions+=questions;rows.set(date,row);
    };
    for (const c of db.contests) {
        c.logs.forEach(l=>add('log:',l.id,l.date,l.minutes,0));
        (c.attempts||[]).forEach(a=>add('attempt:',a.id,a.date,0,1));
        c.reviews.forEach(r=>add('review:',r.id,r.date,0,r.questions));
        c.records.filter(r=>['Questões','Simulados'].includes(r.kind)).forEach(r=>add('record:',r.id,r.date,0,r.total));
    }
    // Never silently clamp or hide questionable totals.
    return validateTotals([...rows.values()].sort((a,b)=>a.date.localeCompare(b.date)).map(r=>({...r,minutes:Math.round(r.minutes)})),today);
}
