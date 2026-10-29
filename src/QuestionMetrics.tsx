import type { Contest } from './domain';
import { cycle, today } from './domain';
import { questionMetrics, questionPace } from './metrics';
const fmt=(n:number)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:1}).format(n);
export function QuestionProgress({c}:{c:Contest}) {
    const total=questionMetrics(c), general=questionMetrics(c,'');
    const rows=[...c.subjects.map(s=>({id:'subject:'+s.id,name:s.name+(!s.active?' · arquivada':''),...questionMetrics(c,s.id)})),...(general.total?[{id:'general',name:'Sem disciplina informada',...general}]:[])];
    return <section className="card"><h2>Desempenho registrado</h2>
        <p>{total.total} questões registradas · {total.correct} acertos informados · {total.assisted} com ajuda na prática</p>
        {rows.map(s=><div className="list-row" key={s.id}><div><strong>{s.name}</strong><small>{s.total} questões · {s.correct} acertos</small>{s.alone+s.assisted>0&&<small>Prática: {s.alone} sem ajuda · {s.assisted} com ajuda</small>}</div><strong>{s.total?fmt(s.correct/s.total*100)+'%':'Sem dados'}</strong></div>)}
        {!rows.length&&<p className="empty">Seu desempenho aparece aqui depois dos primeiros registros de questões ou prática.</p>}
        <details><summary>Como os totais são calculados?</summary><p>Somamos tentativas da prática, questões de revisões e registros de questões ou simulados, incluindo disciplinas arquivadas. Acertos com ajuda entram nos acertos informados e aparecem separados na prática. Perguntas abertas são autoavaliadas. Repetir uma pergunta conta como nova tentativa, sem comprovar domínio.</p><p>O ranking usa essas mesmas origens para contar questões, em seu período e conjunto de concursos. Ele não mede acertos. Registros agregados podem descrever as mesmas questões de outra aba; não temos informação suficiente para identificá-las. Confira antes de registrar novamente.</p></details>
    </section>;
}
export function QuestionTargets({c,onPractice}:{c:Contest;onPractice:()=>void}) {
    const rows=cycle(c), now=today();
    return <section className="card"><div className="section-head"><h2>Seu ritmo de questões</h2><button className="quiet" onClick={onPractice}>Registrar prática ↗</button></div>
        <p>Referência para um bloco de 30 minutos, usando os tempos que você informou. As horas do seu planejamento continuam iguais.</p>
        {rows.map(s=>{const pace=questionPace(c,s.id,now);return <div className="list-row" key={s.id}><div><strong>{s.name}</strong><small>{fmt(s.target/60)} h na meta semanal · {pace.count} perguntas na amostra · {pace.days} dias</small>{pace.ready&&<small>Mediana: {fmt(pace.median)} min por pergunta · faixa indicativa: {pace.low}–{pace.high} questões em 30 min</small>}</div><span className="pill">{pace.ready?(pace.estimate<1?'Menos de 1 em 30 min':`≈ ${pace.estimate} em 30 min`):'Aguardando dados'}</span></div>})}
        {!rows.length&&<p className="muted">Adicione disciplinas e pratique para conhecer seu ritmo.</p>}
        <details><summary>Quando a estimativa aparece?</summary><p>Precisamos de 20 perguntas objetivas diferentes, distribuídas em pelo menos três dias nos últimos 90 dias. Usamos a tentativa mais recente de até 50 perguntas, com gabarito e enunciado ainda correspondentes ao registro. Perguntas arquivadas, abertas e tentativas importadas não entram. Repetições da mesma pergunta não aumentam a amostra.</p><p>A referência usa a mediana do tempo informado; a faixa vem dos quartis e não é um intervalo de confiança. Os limites são escolhas do aplicativo. A dificuldade de novas questões e o tempo de correção podem mudar o ritmo. Esta é uma estimativa de volume, não uma obrigação nem uma medida de aprendizagem.</p></details>
    </section>;
}
