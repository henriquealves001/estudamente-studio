import { useState } from 'react';
import { catalog, activatePlan, commonAreas, makeFoundation } from './plans';
import { cycle } from './domain';
import type { Contest } from './domain';
const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n);
export default function Plans({ current, onActivate }: {
    current: Contest;
    onActivate: (c: Contest) => boolean;
}) {
    const [hours, setHours] = useState(current.daily.reduce((n, v) => n + v, 0) / 60 || 10), [days, setDays] = useState([true, true, true, true, true, false, false]), [preview, setPreview] = useState(''), [error, setError] = useState(''), [selected, setSelected] = useState(catalog.map(p => p.id)), [scope, setScope] = useState<'all' | 'two'>('all');
    const areas = commonAreas(selected), shared = areas.filter(a => a.count >= (scope === 'all' ? selected.length : 2));
    function activate(id: string) { try {
        const next = id === 'foundation' ? makeFoundation(selected, hours, days, scope) : activatePlan(id, hours, days);
        if (onActivate(next))
            setError('');
        else
            setError('O plano não pôde ser salvo. Confira o aviso de armazenamento.');
    }
    catch (e) {
        setError(String(e));
    } }
    let base: Contest | null = null;
    try {
        base = makeFoundation(selected, hours, days, scope);
    }
    catch { /* Formulário permanece editável. */ }
    return <div className="plans">{error && <div className="notice error" role="alert">{error}</div>}
 <section className="card"><div className="section-head"><div><h2>O edital já está organizado. Você escolhe o ritmo.</h2><p>Ativar cria um novo espaço de estudo. Seus planos e históricos atuais continuam preservados.</p></div><span className="pill">3 planos disponíveis</span></div><div className="plan-availability"><label>Horas disponíveis por semana<input type="number" min="0.5" max="168" step="0.5" value={hours} onChange={e => setHours(Number(e.target.value))}/></label><fieldset className="day-picker"><legend>Seus dias de estudo</legend>{labels.map((day, i) => <label key={day} className={days[i] ? 'checked' : ''}><input type="checkbox" checked={days[i]} onChange={e => setDays(days.map((v, j) => j === i ? e.target.checked : v))}/>{day}</label>)}</fieldset></div></section>
 <div className="plan-grid">{catalog.map(p => <section className="card plan-card" key={p.id}><div className="eyebrow">{p.id.startsWith('gcm') ? 'GUARDA MUNICIPAL' : 'CARREIRA POLICIAL'}</div><h2>{p.name}</h2><span className="pill">{p.edition}</span><p>{p.description}</p><div className="plan-counts"><strong>{p.subjects.length}<small>disciplinas</small></strong><strong>{p.subjects.reduce((n, s) => n + s.topics.length, 0)}<small>unidades de estudo</small></strong></div><p className="muted">{p.source.note}</p><div className="actions"><button onClick={() => activate(p.id)}>Usar este plano</button><button className="quiet" onClick={() => setPreview(preview === p.id ? '' : p.id)}>{preview === p.id ? 'Fechar conteúdo' : 'Ver edital e distribuição'}</button></div><a target="_blank" rel="noopener noreferrer" href={p.source.pdf}>Abrir documento de referência ↗</a></section>)}</div>
 {preview && (() => { const p = catalog.find(p => p.id === preview)!; let temp: Contest | null = null; try {
        temp = activatePlan(p.id, hours, days);
    }
    catch { /* Mostrar conteúdo mesmo com horas inválidas. */ } return <section className="card"><h2>{p.name} · o que já vem pronto</h2><p>{p.allocationNote}</p><a href={p.source.url} target="_blank" rel="noopener noreferrer">{p.source.label} ↗</a>{p.subjects.map(s => <details className="syllabus-detail" key={s.name}><summary>{s.name}<span>{s.topics.length} unidades{temp ? ' · ' + fmt((cycle(temp).find(x => x.name === s.name)?.target || 0) / 60) + ' h/sem' : ''}</span></summary>{s.topics.map((t, i) => <div className="program-item" key={i}><strong>{t.title}</strong><small>{t.area} · {t.origin}</small><p className="notes">{t.detail}</p></div>)}</details>)}</section>; })()}
 <section className="card foundation"><div className="eyebrow">PREPARE UMA BASE QUE CONTINUA COM VOCÊ</div><h2>O que vale estudar para mais de um concurso?</h2><p>Compare áreas dos modelos escolhidos e crie um plano de fundamentos. Português e Matemática não precisam recomeçar do zero a cada edital; os detalhes específicos continuam em seus planos próprios.</p><div className="actions">{catalog.map(p => <label className="inline-check" key={p.id}><input type="checkbox" checked={selected.includes(p.id)} onChange={e => setSelected(e.target.checked ? [...selected, p.id] : selected.filter(id => id !== p.id))}/>{p.name}</label>)}</div><label>Amplitude da base<select value={scope} onChange={e => setScope(e.target.value as 'all' | 'two')}><option value="all">Base transversal · áreas presentes em todos os selecionados</option><option value="two">Base ampliada · áreas presentes em pelo menos dois</option></select></label>
 <div className="area-table-wrap"><table className="area-table"><thead><tr><th>Área de preparação</th>{catalog.filter(p => selected.includes(p.id)).map(p => <th key={p.id}>{p.name}</th>)}</tr></thead><tbody>{areas.map(a => <tr key={a.area} className={shared.includes(a) ? 'common-row' : ''}><th>{a.area}</th>{catalog.filter(p => selected.includes(p.id)).map(p => <td key={p.id} aria-label={a.area + ' em ' + p.name + ': ' + (a.plans.includes(p.id) ? 'presente' : 'não consta')}>{a.plans.includes(p.id) ? '✓' : '—'}</td>)}</tr>)}</tbody></table></div>
 {base && <><h3>Como suas {fmt(hours)} horas podem ser distribuídas</h3><p className="muted">Sugestão pela recorrência e participação das áreas nos modelos, sem supor o conteúdo de editais futuros. As métricas ficam editáveis no seu ciclo.</p><div className="foundation-budget">{cycle(base).map(s => <div key={s.id}><strong>{s.name}</strong><span>{fmt(s.target / 60)} h/sem</span><progress value={s.share} max={1}/></div>)}</div>{cycle(base).some(s => s.target < 25) && <div className="banner">Algumas metas ficam abaixo de 25 minutos por semana. Uma base mais concentrada ou maior disponibilidade pode facilitar sessões completas.</div>}</>}
 <p className="muted">Áreas compartilhadas não significam editais idênticos. O roteiro de base cobre fundamentos; conteúdos locais, legislação específica e demais exigências permanecem nos planos de cada prova. Não há transferência automática de conclusões ou duplicação de horas entre perfis.</p><button disabled={selected.length < 2 || !base} onClick={() => activate('foundation')}>Criar meu plano de base geral</button>
 </section><section className="banner">Cada ativação cria uma cópia editável. Você pode mudar horas, dificuldade, distribuição, datas e assuntos sem modificar o modelo nem seus outros perfis.</section>
 </div>;
}
