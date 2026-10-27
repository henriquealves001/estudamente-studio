import type { Contest } from './domain';
import { cycle } from './domain';
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n);
export default function AdaptiveCycle({ c, onChange }: { c: Contest; onChange: (c: Contest) => boolean }) {
    const manual = c.cycleMode === 'manual', rows = cycle(c);
    return <section className="card">
        <h2>Ajustar ao meu desempenho</h2>
        <label className="inline-check"><input type="checkbox" checked={c.adaptiveCycle === true} disabled={manual} onChange={e => onChange({ ...c, adaptiveCycle: e.target.checked })}/>Dar mais prioridade às matérias com dificuldades registradas</label>
        <p>{manual ? 'Suas horas manuais são mantidas. O ajuste por desempenho funciona na distribuição inteligente.' : 'O ajuste só começa após 20 perguntas objetivas diferentes, praticadas em pelo menos 3 dias nos últimos 90 dias. Antes disso, o ciclo mantém os pesos e sua dificuldade pessoal.'}</p>
        <details><summary>Ver os dados que orientam a distribuição</summary>
            {rows.filter(s => !s.extra).map(s => <div className="list-row" key={s.id}><div><strong>{s.name}</strong><small>{s.performance.count} perguntas diferentes · {s.performance.days} dias</small></div><span className="pill">{!c.adaptiveCycle || manual ? 'Sem ajuste' : !s.performance.ready ? 'Aguardando dados' : `Prioridade +${fmt((s.performance.factor-1)*100)}%`}</span></div>)}
            <p>Conta a tentativa mais recente de cada pergunta objetiva com gabarito, até 50 perguntas. Acertar com ajuda indica necessidade de retomada. Perguntas abertas, registros agregados e perguntas arquivadas não entram neste ajuste.</p>
            <p>A prioridade muda o peso usado na divisão das mesmas horas disponíveis; não aumenta sua carga. Mínimos e matérias extras continuam respeitados. O aumento de prioridade é limitado a 25% e suavizado pelo tamanho da amostra; esses limites são escolhas do aplicativo, não uma fórmula científica validada.</p>
        </details>
    </section>;
}
