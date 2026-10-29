import { periodStart, plain, saoPauloDate, validatePlan, validateTotals } from '../src/social.ts';
import type { PublicProfile } from '../src/social.ts';
import { currentAccount, checkAccountDestination, AccountError } from './account-auth.ts';
import type { AccountEnv } from './account-auth.ts';

export type CommunityEnv = AccountEnv;
type Row = Record<string, string | number | null>;
class HttpError extends Error { status:number; constructor(status:number,message:string){super(message);this.status=status;} }
const fail=(status:number,message:string):never=>{throw new HttpError(status,message);};
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
const id=()=>crypto.randomUUID();
export function mutationIdentity(request:Request,user:string|null):string {
 const origin=request.headers.get('origin');
 if (origin!==new URL(request.url).origin) fail(403,'Origem da solicitação inválida. Reabra o site.');
 if (!user) fail(401,'Entre com sua conta para continuar.');
 return user!;
}
async function limitedBody(request:Request,max:number) {
 if (Number(request.headers.get('content-length')||0)>max) fail(413,'Arquivo ou solicitação maior que o limite.');
 const reader=request.body?.getReader(); if(!reader) return new Uint8Array();
 const chunks:Uint8Array[]=[];let length=0;
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>max){await reader.cancel();fail(413,'Arquivo ou solicitação maior que o limite.');}chunks.push(value);}
 const bytes=new Uint8Array(length);let i=0;for(const c of chunks){bytes.set(c,i);i+=c.length;}return bytes;
}
async function body(request:Request){if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'Envie dados JSON.');try{return JSON.parse(new TextDecoder().decode(await limitedBody(request,900000)));}catch(e){if(e instanceof HttpError)throw e;return fail(400,'Dados JSON inválidos.');}}
export function checkFile(bytes:Uint8Array,type:'avatar'|'pdf'):string {
 if(type==='pdf'){if(bytes.length<5||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')return fail(415,'O edital precisa ser um PDF válido.');return 'application/pdf';}
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return 'image/png';
 return fail(415,'Escolha uma foto JPEG ou PNG.');
}
export function profile(row:Row):PublicProfile{return {id:String(row.public_id),name:String(row.name),bio:String(row.bio||''),avatar:row.avatar_key?'/api/community/avatar/'+row.public_id:'',ranking:row.ranking===1};}
function officialUrl(value:unknown){const s=plain(value,1000,1);let url:URL;try{url=new URL(s);}catch{return fail(400,'Informe o link oficial do edital.');}if(url.protocol!=='https:'||url.username||url.password)fail(400,'Use um endereço HTTPS sem credenciais.');return url.href;}
export async function communityAPI(request:Request,env:CommunityEnv):Promise<Response>{
 try{
  const url=new URL(request.url), parts=url.pathname.replace(/^\/api\/community\/?/,'').split('/').filter(Boolean), path=parts[0]||'me', key=parts[1]||'';
  if(!env.DB) return json({error:'A comunidade precisa do servidor com banco de dados. Seus estudos locais continuam disponíveis.'},503);
  const db=env.DB, read=request.method==='GET', account=await currentAccount(request,env), user=read?(account?.id||null):mutationIdentity(request,account?.id||null);
  if(!read||request.headers.has('x-em-account'))checkAccountDestination(request,user);
  const first=(sql:string,...args: (string|number|null)[])=>db.prepare(sql).bind(...args).first<Row>();
  const rows=async(sql:string,...args:(string|number|null)[])=>(await db.prepare(sql).bind(...args).all<Row>()).results;
  const me=user?await first('SELECT * FROM community_profiles WHERE user_id=?',user):null;
  if(path==='me'&&read){return json({signedIn:!!user,profile:me?profile(me):null,groups:user?await rows('SELECT g.id,g.name,g.invite,g.owner=? AS mine FROM community_groups g JOIN community_members m ON m.group_id=g.id WHERE m.user_id=? ORDER BY g.created_at DESC',user,user):[]});}
  if(path==='profile'&&request.method==='PUT'){
   const b=await body(request);if(!me&&b.consent!==true)fail(400,'Confirme a criação do seu perfil público.');const name=plain(b.name,40,2),bio=plain(b.bio??'',220);if(typeof b.ranking!=='boolean')fail(400,'Escolha se deseja participar dos rankings.');
   await db.prepare('INSERT INTO community_profiles(user_id,public_id,name,bio,ranking,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET name=excluded.name,bio=excluded.bio,ranking=excluded.ranking,updated_at=excluded.updated_at').bind(user,id(),name,bio,b.ranking?1:0,new Date().toISOString()).run();
   await db.prepare('UPDATE accounts SET name=?,bio=? WHERE id=?').bind(name,bio,user).run();
   if(!b.ranking)await db.prepare('DELETE FROM community_daily WHERE user_id=?').bind(user).run();
   return json({ok:true});
  }
  if(path==='avatar'&&read){const p=await first('SELECT avatar_key FROM community_profiles WHERE public_id=?',key);if(!p?.avatar_key||!env.BUCKET)fail(404,'Foto não encontrada.');const obj=await env.BUCKET!.get(String(p!.avatar_key));if(!obj)fail(404,'Foto não encontrada.');return new Response(obj!.body,{headers:{'content-type':obj!.httpMetadata?.contentType||'image/jpeg','x-content-type-options':'nosniff','cache-control':'no-store','content-security-policy':"default-src 'none'; sandbox"}});}
  if(path==='avatar'&&request.method==='PUT'){
   if(!me)fail(409,'Crie seu perfil antes de enviar a foto.');if(!env.BUCKET)fail(503,'Upload indisponível.');const bytes=await limitedBody(request,300000),type=checkFile(bytes,'avatar'),file='avatars/'+me!.public_id+'/'+id();
   await env.BUCKET!.put(file,bytes,{httpMetadata:{contentType:type}});
   try{await db.batch([db.prepare('UPDATE community_profiles SET avatar_key=?,updated_at=? WHERE user_id=?').bind(file,new Date().toISOString(),user),db.prepare('UPDATE accounts SET avatar_key=? WHERE id=?').bind(file,user)]);}catch(e){await env.BUCKET!.delete(file);throw e;}
   if(me!.avatar_key)await env.BUCKET!.delete(String(me!.avatar_key));return json({ok:true});
  }
  if(path==='avatar'&&request.method==='DELETE'){
   if(me?.avatar_key){await db.batch([db.prepare('UPDATE community_profiles SET avatar_key=NULL WHERE user_id=?').bind(user),db.prepare('UPDATE accounts SET avatar_key=NULL WHERE id=?').bind(user)]);await env.BUCKET?.delete(String(me.avatar_key));}return json({ok:true});
  }
  if(path==='plans'&&read){
   const term=(url.searchParams.get('q')||'').slice(0,100), result=await rows(`SELECT e.*,p.public_id,p.name,p.bio,p.avatar_key,p.ranking FROM community_plans e JOIN community_profiles p ON e.owner=p.user_id WHERE e.removed=0 ${key?'AND e.id=?':"AND (instr(lower(e.title||' '||e.organization||' '||e.edition),lower(?))>0)"} ORDER BY e.created_at DESC LIMIT 100`,key||term);
   const mapped=result.map(r=>({id:r.id,title:r.title,organization:r.organization,edition:r.edition,sourceUrl:r.source_url,description:r.description,createdAt:r.created_at,author:profile(r),subjects:r.subjects,topics:r.topics,pdf:!!r.pdf_key,mine:user===r.owner,...(key?{plan:JSON.parse(String(r.plan_json))}:{})}));
   if(key&&!mapped.length)fail(404,'Este plano foi retirado ou não existe.');return json(key?mapped[0]:mapped);
  }
  if(path==='plans'&&request.method==='POST'){
   if(!me)fail(409,'Crie seu perfil para publicar.');const count=await first('SELECT COUNT(*) AS n FROM community_plans WHERE owner=? AND removed=0',user!);if(Number(count?.n)>=20)fail(429,'Limite de 20 publicações ativas por perfil.');
   const raw=await limitedBody(request,9000000), form=await new Request(request.url,{method:'POST',headers:{'content-type':request.headers.get('content-type')||''},body:raw}).formData();
   if(form.get('consent')!=='public')fail(400,'Confirme a publicação pública do plano e do edital.');
   const title=plain(form.get('title'),140,3),organization=plain(form.get('organization'),100,2),edition=plain(form.get('edition'),60,2),description=plain(form.get('description')||'',1000),sourceUrl=officialUrl(form.get('sourceUrl'));
   let plan;try{plan=validatePlan(JSON.parse(String(form.get('plan'))));}catch{return fail(400,'Plano de estudos inválido.');}
   const pdf=form.get('pdf');if(!pdf||typeof pdf==='string'||pdf.size>8000000)fail(400,'Inclua o PDF do edital, até 8 MB.');if(!env.BUCKET)fail(503,'Upload indisponível.');
   const bytes=new Uint8Array(await (pdf as File).arrayBuffer());checkFile(bytes,'pdf');const planId=id(),file='editais/'+planId+'.pdf';await env.BUCKET!.put(file,bytes,{httpMetadata:{contentType:'application/pdf'}});
   try{await db.prepare('INSERT INTO community_plans(id,owner,title,organization,edition,source_url,description,plan_json,pdf_key,subjects,topics,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(planId,user,title,organization,edition,sourceUrl,description,JSON.stringify(plan),file,plan.subjects.length,plan.subjects.reduce((n,s)=>n+s.topics.length,0),new Date().toISOString()).run();}catch(e){await env.BUCKET!.delete(file);throw e;}
   return json({id:planId},201);
  }
  if(path==='plans'&&request.method==='DELETE'){
   const item=await first('SELECT owner FROM community_plans WHERE id=? AND removed=0',key);if(!item||item.owner!==user)fail(404,'Publicação não encontrada no seu perfil.');
   // Soft withdrawal preserves reports and supports recovery without deleting personal study copies.
   await db.prepare('UPDATE community_plans SET removed=1 WHERE id=? AND owner=?').bind(key,user).run();return json({ok:true});
  }
  if(path==='pdf'&&read){const item=await first('SELECT pdf_key FROM community_plans WHERE id=? AND removed=0',key);if(!item?.pdf_key||!env.BUCKET)fail(404,'PDF não encontrado.');const obj=await env.BUCKET!.get(String(item!.pdf_key));if(!obj)fail(404,'PDF não encontrado.');return new Response(obj!.body,{headers:{'content-type':'application/pdf','content-disposition':'attachment; filename="edital-comunidade.pdf"','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; sandbox",'cache-control':'no-store'}});}
  if(path==='report'&&request.method==='POST'){
   if(!me)fail(409,'Crie seu perfil antes de sinalizar.');const item=await first('SELECT id FROM community_plans WHERE id=? AND removed=0',key);if(!item)fail(404,'Publicação não encontrada.');const b=await body(request);await db.prepare('INSERT OR IGNORE INTO community_reports(id,plan_id,reporter,reason,created_at) VALUES(?,?,?,?,?)').bind(id(),key,user,plain(b.reason,500,10),new Date().toISOString()).run();return json({ok:true});
  }
  if(path==='totals'&&request.method==='PUT'){
   if(!me||me.ranking!==1)fail(403,'Ative sua participação nos rankings primeiro.');const b=await body(request),today=saoPauloDate(),totals=validateTotals(b.days,today);
   await db.batch([db.prepare('DELETE FROM community_daily WHERE user_id=?').bind(user),...totals.map(r=>db.prepare('INSERT INTO community_daily(user_id,date,minutes,questions) VALUES(?,?,?,?)').bind(user,r.date,r.minutes,r.questions))]);return json({ok:true,days:totals.length});
  }
  if(path==='ranking'&&read){
   const period=url.searchParams.get('period')||'week',metric=url.searchParams.get('metric')||'minutes',group=url.searchParams.get('group')||'',today=saoPauloDate(),start=periodStart(today,period);
   if(!['minutes','questions'].includes(metric))fail(400,'Métrica inválida.');
   if(group&&(!user||!await first('SELECT user_id FROM community_members WHERE group_id=? AND user_id=?',group,user)))fail(403,'Entre no grupo para ver este ranking.');
   const result=await rows(`SELECT p.public_id,p.name,p.bio,p.avatar_key,p.ranking,SUM(d.minutes) AS minutes,SUM(d.questions) AS questions FROM community_profiles p JOIN community_daily d ON d.user_id=p.user_id ${group?'JOIN community_members m ON m.user_id=p.user_id AND m.group_id=?':''} WHERE p.ranking=1 AND d.date>=? AND d.date<=? GROUP BY p.user_id HAVING SUM(d.${metric})>0 ORDER BY SUM(d.${metric}) DESC,p.public_id ASC LIMIT 100`,...(group?[group]:[]),start,today);
   let rank=0,last=-1;const board=result.map((r,i)=>{const score=Number(r[metric]);if(score!==last)rank=i+1;last=score;return {rank,profile:profile(r),minutes:Number(r.minutes),questions:Number(r.questions)};});return json({start,end:today,timezone:'America/Sao_Paulo',rows:board});
  }
  if(path==='groups'&&request.method==='POST'){
   if(!me)fail(409,'Crie seu perfil primeiro.');const b=await body(request),count=await first('SELECT COUNT(*) AS n FROM community_groups WHERE owner=?',user!);if(Number(count?.n)>=10)fail(429,'Limite de 10 grupos criados.');const gid=id(),invite=id()+id();await db.batch([db.prepare('INSERT INTO community_groups(id,owner,name,invite,created_at) VALUES(?,?,?,?,?)').bind(gid,user,plain(b.name,60,3),invite,new Date().toISOString()),db.prepare('INSERT INTO community_members(group_id,user_id) VALUES(?,?)').bind(gid,user)]);return json({id:gid,invite},201);
  }
  if(path==='invite'&&read){const g=await first('SELECT id,name FROM community_groups WHERE invite=?',key);if(!g)fail(404,'Convite inválido.');return json(g);}
  if(path==='join'&&request.method==='POST'){
   if(!me)fail(409,'Crie seu perfil primeiro.');const b=await body(request),g=await first('SELECT id FROM community_groups WHERE invite=?',plain(b.invite,100,32));if(!g)fail(404,'Convite inválido.');const count=await first('SELECT COUNT(*) AS n FROM community_members WHERE group_id=?',String(g!.id));if(Number(count?.n)>=100)fail(409,'Este grupo atingiu 100 participantes.');await db.prepare('INSERT OR IGNORE INTO community_members(group_id,user_id) VALUES(?,?)').bind(g!.id,user).run();return json({ok:true});
  }
  if(path==='leave'&&request.method==='POST'){await db.prepare('DELETE FROM community_members WHERE group_id=? AND user_id=?').bind(key,user).run();return json({ok:true});}
  if(path==='rotate-invite'&&request.method==='POST'){const next=id()+id(),result=await db.prepare('UPDATE community_groups SET invite=? WHERE id=? AND owner=?').bind(next,key,user).run();if(!result.meta.changes)fail(404,'Grupo não encontrado.');return json({ok:true});}
  return json({error:'Operação não encontrada.'},404);
 }catch(e){if(e instanceof HttpError||e instanceof AccountError)return json({error:e.message},e.status);if(e instanceof Error&&/Texto inválido|caracteres|plano|Quantidade|Data |Período|dias por|limite/i.test(e.message))return json({error:e.message},400);console.error('community operation failed',e instanceof Error?e.message:'unknown');return json({error:'Não foi possível concluir. Nenhum estudo local foi substituído.'},500);}
}

