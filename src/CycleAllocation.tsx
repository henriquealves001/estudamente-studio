import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Contest } from './domain';
import { cycle } from './domain';
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n);
export default function CycleAllocation({ c, onChange }: {
    c: Contest;
    onChange: (c: Contest) => boolean;
}) {
    const [editing, setEditing] = useState(false), [mode, setMode] = useState(c.cycleMode || 'automatic'), [error, setError] = useState('');
    const budget = cycle(c), capacity = c.daily.reduce((a, b) => a + b, 0), total = budget.reduce((a, b) => a + b.target, 0), unused = Math.max(0, capacity - total), over = Math.max(0, total - capacity), denominator = Math.max(total, capacity, 1);
    function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); try {
        const subjects = c.subjects.map(s => { if (!s.active)
            return s; const hours = Number(f.get(s.id)); if (!Number.isFinite(hours) || hours < 0 || hours > 168)
            throw Error('Use horas entre 0 e 168.'); return { ...s, extra: f.get('extra-' + s.id) === 'on', ...(mode === 'manual' ? { manualMinutes: Math.round(hours * 60) } : { minimumMinutes: Math.round(hours * 60) }) }; });
        const requested = subjects.filter(s => s.active).reduce((n, s) => n + (mode === 'manual' ? s.manualMinutes ?? 0 : s.minimumMinutes ?? 0), 0);
        if (requested > capacity)
            throw Error(`Você definiu ${fmt(requested / 60)} h para uma semana com ${fmt(capacity / 60)} h. Reduza as horas ou ajuste sua disponibilidade.`);
        if (onChange({ ...c, cycleMode: mode, subjects })) {
            setEditing(false);
            setError('');
        }
    }
    catch (e) {
        setError(String(e));
    } }
    return <section className="card allocation"><div className="section-head"><div><h2>Suas horas, sua escolha</h2><p>{c.cycleMode === 'manual' ? 'Horas manuais por disciplina' : 'Distribuição inteligente com mínimos opcionais'} · {fmt(capacity / 60)} h disponíveis por semana.</p></div><button className="secondary" onClick={() => { setMode(c.cycleMode || 'automatic'); setError(''); setEditing(true); }}>Definir horas</button></div>
 {over > 0 && <div role="alert" className="notice error">Suas metas excedem a disponibilidade em {fmt(over / 60)} h. Ajuste as horas ou a disponibilidade; os mínimos foram preservados.</div>}
 <div className="allocation-bar" role="img" aria-label={'Distribuição semanal: ' + budget.map(s => `${s.name}: ${fmt(s.target / 60)} horas, ${fmt(s.target / denominator * 100)} por cento`).join('; ') + `; livre: ${fmt(unused / 60)} horas`}>{budget.filter(s => s.target > 0).map(s => <div key={s.id} style={{ width: `${s.target / denominator * 100}%`, background: s.color }} title={`${s.name}: ${fmt(s.target / 60)} h · ${fmt(s.target / denominator * 100)}%`}/>)}{unused > 0 && <div className="allocation-free" style={{ width: `${unused / denominator * 100}%` }}/>}</div>
 <div className="allocation-legend">{budget.map(s => <div key={s.id}><i style={{ background: s.color }}/><span>{s.name}{s.extra ? ' · extra' : ''}</span><b>{fmt(s.target / 60)} h</b><small>{fmt(s.target / denominator * 100)}%</small></div>)}{unused > 0 && <div><i className="allocation-free"/><span>Tempo livre / reserva</span><b>{fmt(unused / 60)} h</b><small>{fmt(unused / denominator * 100)}%</small></div>}</div><p className="muted">Percentuais sobre {over ? 'o total das metas' : 'a disponibilidade semanal'}. Matérias extras podem receber horas mesmo sem questões na prova.</p>
 {editing && <div className="overlay" onClick={() => setEditing(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="allocation-title" onClick={e => e.stopPropagation()}><div className="section-head"><h2 id="allocation-title">Definir horas do ciclo</h2><button type="button" className="quiet" aria-label="Fechar configuração de horas" onClick={() => setEditing(false)}>×</button></div><label>Distribuição<select value={mode} onChange={e => setMode(e.target.value as typeof mode)}><option value="automatic">Inteligente · garantir mínimos e distribuir o restante</option><option value="manual">Manual · definir todas as horas</option></select></label><p>{mode === 'manual' ? 'Cada valor é a meta semanal exata. O restante fica como reserva, sem redistribuição.' : 'Cada valor é um mínimo semanal. O restante segue o peso e a dificuldade do edital; matérias extras ficam com seu mínimo.'} Use 1,5 para uma hora e meia.</p><form key={mode} onSubmit={submit}>{c.subjects.filter(s => s.active).map(s => <div className="allocation-input" key={s.id}><label>{s.name}<input aria-label={`Horas de ${s.name}`} name={s.id} type="number" min="0" max="168" step="0.01" defaultValue={mode === 'manual' ? Math.floor((s.manualMinutes ?? budget.find(x => x.id === s.id)?.target ?? 0) / 60 * 100) / 100 : Math.round((s.minimumMinutes ?? 0) / 60 * 100) / 100}/></label><label className="inline-check"><input name={'extra-' + s.id} type="checkbox" defaultChecked={s.extra}/>Matéria extra · fora da prova</label></div>)}{!budget.length && <p>Adicione uma disciplina para definir suas horas.</p>}{error && <div role="alert" className="notice error">{error}</div>}<div className="modal-actions"><button type="button" className="secondary" onClick={() => setEditing(false)}>Cancelar</button><button disabled={!budget.length}>Salvar distribuição</button></div></form></section></div>}
 </section>;
}
