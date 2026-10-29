import { useState, lazy, Suspense } from 'react';
const AllocationChart = lazy(() => import('./AllocationChart'));
import { useModalFocus } from './useModalFocus';
import type { FormEvent } from 'react';
import type { Contest, Subject } from './domain';
import { cycle } from './domain';
import { allocationCandidate, allocationDiff, expandAvailability, sumMinutes } from './planningSetup';
import type { AllocationMode } from './planningSetup';
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n);
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const signature = (c: Contest) => JSON.stringify([c.daily, c.cycleMode, c.subjects.map(s => [s.id, s.active, s.manualMinutes, s.minimumMinutes, s.extra])]);
export default function CycleAllocation({ c, onChange }: { c: Contest; onChange: (c: Contest) => boolean }) {
    const [editing, setEditing] = useState(false), [mode, setMode] = useState<AllocationMode>(c.cycleMode || 'automatic'), [error, setError] = useState('');
    const [draft, setDraft] = useState<Subject[] | null>(null), [daily, setDaily] = useState(c.daily), [fit, setFit] = useState(false);
    const [undo, setUndo] = useState<{ before: Contest; after: string } | null>(null);
    const dialogRef = useModalFocus(editing);
    const budget = cycle(c), capacity = sumMinutes(c.daily), total = budget.reduce((a, b) => a + b.target, 0), over = Math.max(0, total - capacity);
    let candidate: Contest | null = null, problem = '';
    if (draft) { try { candidate = allocationCandidate(c, draft, mode, daily, fit); } catch (e) { problem = (e as Error).message; } }
    const requested = draft?.filter(s => s.active).reduce((n, s) => n + (mode === 'manual' ? s.manualMinutes ?? 0 : s.minimumMinutes ?? 0), 0) ?? 0;
    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault(); const f = new FormData(e.currentTarget);
        try {
            const subjects = c.subjects.map(s => { if (!s.active) return s; const h = Number(f.get(s.id)); if (!Number.isFinite(h) || h < 0 || h > 168) throw Error('Use horas entre 0 e 168.'); return { ...s, extra: f.get('extra-' + s.id) === 'on', [mode === 'manual' ? 'manualMinutes' : 'minimumMinutes']: Math.round(h * 60) }; });
            setDraft(subjects); setDaily([...c.daily]); setFit(false); setError('');
        } catch (e) { setError((e as Error).message); }
    }
    return <section className="card allocation"><div className="section-head"><div><h2>Suas horas, sua escolha</h2><p>{c.cycleMode === 'manual' ? 'Horas manuais por disciplina' : 'Distribuição inteligente com mínimos opcionais'} · {fmt(capacity / 60)} h disponíveis por semana.</p></div><button className="secondary" onClick={() => { setMode(c.cycleMode || 'automatic'); setError(''); setDraft(null); setEditing(true); }}>Definir horas</button></div>
    {undo && signature(c) === undo.after && <div className="notice"><span>Distribuição atualizada. Seu histórico foi preservado.</span><button className="quiet" onClick={() => { if (onChange({ ...c, daily: undo.before.daily, cycleMode: undo.before.cycleMode, subjects: c.subjects.map(s => { const old = undo.before.subjects.find(x => x.id === s.id)!; return { ...s, manualMinutes: old.manualMinutes, minimumMinutes: old.minimumMinutes, extra: old.extra }; }) })) setUndo(null); }}>Desfazer distribuição</button></div>}
    {over > 0 && <div role="alert" className="notice error">Suas metas excedem a disponibilidade em {fmt(over / 60)} h. Use Definir horas para conferir as alternativas.</div>}
    <Suspense fallback={<p>Carregando distribuição…</p>}><AllocationChart rows={budget.map(s => ({...s, name: s.name + (s.extra ? ' · extra' : '')}))} capacity={capacity}/></Suspense>
    {editing && <div className="overlay"><section ref={dialogRef} tabIndex={-1} className="modal setup-modal" role="dialog" aria-modal="true" aria-labelledby="allocation-title"><div className="section-head"><h2 id="allocation-title">{draft ? 'Confira sua nova semana' : 'Definir horas do ciclo'}</h2><button className="quiet" aria-label="Fechar configuração de horas" onClick={() => setEditing(false)}>×</button></div>
    {!draft ? <><label>Distribuição<select value={mode} onChange={e => setMode(e.target.value as AllocationMode)}><option value="automatic">Inteligente · garantir mínimos e distribuir o restante</option><option value="manual">Manual · definir todas as horas</option></select></label><p>{mode === 'manual' ? 'Cada valor é a meta semanal exata. O restante fica como reserva.' : 'Cada valor é um mínimo semanal. O restante segue o peso, a dificuldade e o desempenho, quando ativo.'} Matérias extras podem receber horas fora da prova.</p><form key={mode} onSubmit={submit}>{c.subjects.filter(s => s.active).map(s => <div className="allocation-input" key={s.id}><label>{s.name}<input aria-label={`Horas de ${s.name}`} name={s.id} type="number" min="0" max="168" step="0.01" defaultValue={Math.floor((mode === 'manual' ? s.manualMinutes ?? budget.find(x => x.id === s.id)?.target ?? 0 : s.minimumMinutes ?? 0) / 60 * 100) / 100}/></label><label className="inline-check"><input name={'extra-' + s.id} type="checkbox" defaultChecked={s.extra}/>Matéria extra · fora da prova</label></div>)}{error && <p role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={() => setEditing(false)}>Cancelar</button><button disabled={!budget.length}>Conferir alterações</button></div></form></> : <>
    <p>Nada foi salvo. Compare a proposta e confirme apenas quando sua semana fizer sentido.</p>
    <p><strong>{fmt(requested / 60)} h {mode === 'manual' ? 'solicitadas' : 'de mínimos'}</strong> · {fmt(sumMinutes(daily) / 60)} h nos horários propostos.</p>
    {requested > sumMinutes(daily) && <div className="notice allocation-options"><p>Como você prefere conciliar as horas?</p><button className="secondary" onClick={() => { try { setDaily(expandAvailability(daily, requested)); setFit(false); setError(''); } catch (e) { setError((e as Error).message); } }}>Aumentar disponibilidade para {fmt(requested / 60)} h</button><button className="secondary" onClick={() => { setFit(true); setError(''); }}>Reduzir {mode === 'manual' ? 'metas' : 'mínimos'} proporcionalmente</button></div>}
    <fieldset className="setup-days"><legend>Horários propostos · horas por dia</legend>{days.map((d, i) => <label key={d}>{d}<input aria-label={'Horas propostas ' + d} type="number" min="0" max="24" step="0.01" value={Math.round(daily[i] / 60 * 100) / 100} onChange={e => { setDaily(daily.map((n, j) => j === i ? Math.round(Number(e.target.value) * 60) : n)); }}/></label>)}</fieldset>
    {fit && requested > sumMinutes(daily) && <p className="notice">A proposta reduz os valores que você digitou para caber nos horários. Confira cada disciplina antes de confirmar.</p>}
    {candidate ? <><div className="preview-table-wrap"><table className="preview-table"><caption>Metas semanais por disciplina</caption><thead><tr><th>Disciplina</th><th>Atual</th><th>Proposta</th><th>Diferença</th></tr></thead><tbody>{allocationDiff(c, candidate).map(s => <tr key={s.id}><th>{s.name}</th><td>{fmt(s.before / 60)} h</td><td>{fmt(s.after / 60)} h<progress aria-label={'Meta proposta de ' + s.name} value={s.after} max={Math.max(1, sumMinutes(candidate.daily))}/></td><td>{s.delta > 0 ? '+' : ''}{fmt(s.delta / 60)} h</td></tr>)}</tbody></table></div><p>Disponibilidade: {fmt(capacity / 60)} → {fmt(sumMinutes(candidate.daily) / 60)} h/semana. O cronograma será recalculado; estudos e revisões registrados continuam intactos.</p></> : <p role="status">{problem}</p>}
    {error && <p role="alert">{error}</p>}<div className="modal-actions"><button className="secondary" onClick={() => { setDraft(null); setError(''); }}>Voltar aos valores</button><button disabled={!candidate} onClick={() => { if (candidate && onChange(candidate)) { setUndo({ before: c, after: signature(candidate) }); setEditing(false); } else setError('Não foi possível salvar. Confira o aviso de armazenamento e tente novamente.'); }}>Confirmar nova distribuição</button></div>
    </> }</section></div>}</section>;
}
