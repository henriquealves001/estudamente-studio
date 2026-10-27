import { useState } from 'react';
import { useModalFocus } from './useModalFocus';
import type { Contest } from './domain';
import { cycle, schedule, today } from './domain';
import { catalog } from './plans';
import { setupPlan, sumMinutes } from './planningSetup';
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n);
export default function GettingStarted({ current, onSave, onClose, onImport }: { current: Contest; onSave: (c: Contest, existing: boolean) => boolean; onClose: () => void; onImport: () => void }) {
    const [step, setStep] = useState(0), [choice, setChoice] = useState(current.subjects.some(s => s.active) ? 'current' : catalog[0].id);
    const [name, setName] = useState(current.subjects.some(s => s.active) ? current.name : catalog[0].name), [disciplines, setDisciplines] = useState('Português\nMatemática');
    const [daily, setDaily] = useState([...current.daily]), [examDate, setExamDate] = useState(current.examDate >= today() ? current.examDate : ''), [error, setError] = useState('');
    const [proposal, setProposal] = useState<Contest | null>(null);
    function next() {
        try {
            if (step === 0) { if (!name.trim() || choice === 'custom' && !disciplines.trim()) throw Error('Dê um nome ao plano e informe suas disciplinas.'); }
            if (step === 1) setProposal(setupPlan(current, choice, name, disciplines, daily, examDate));
            setError(''); setStep(step + 1);
        } catch (e) { setError((e as Error).message); }
    }
    const dialogRef = useModalFocus(true);
    const first = proposal ? schedule(proposal).days.find(d => d.tasks.length) : null;
    return <div className="overlay"><section ref={dialogRef} tabIndex={-1} className="modal setup-modal" role="dialog" aria-modal="true" aria-labelledby="setup-title"><div className="section-head"><div><div className="eyebrow">PRIMEIROS PASSOS · ETAPA {step + 1} DE 3</div><h2 id="setup-title">{['Qual é seu objetivo?', 'Quanto tempo cabe na sua semana?', 'Seu plano está pronto para conferir.'][step]}</h2></div><button className="quiet" aria-label="Fechar primeiros passos" onClick={onClose}>×</button></div>
    <ol className="setup-steps" aria-label="Etapas do planejamento">{['Objetivo', 'Horários', 'Conferência'].map((label, i) => <li key={label} className={i <= step ? 'reached' : ''} aria-current={i === step ? 'step' : undefined}><span>{i + 1}</span>{label}</li>)}</ol>
    {step === 0 && <><label>Seu ponto de partida<select value={choice} onChange={e => { const value = e.target.value; setChoice(value); setName(value === 'current' ? current.name : value === 'custom' ? 'Meu plano de estudos' : catalog.find(p => p.id === value)!.name); }}>
    {current.subjects.some(s => s.active) && <option value="current">Ajustar meu plano atual</option>}{catalog.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}<option value="custom">Outro concurso · minhas disciplinas</option></select></label>
    <label>Nome do plano<input maxLength={140} value={name} onChange={e => setName(e.target.value)}/></label>
    {choice === 'custom' ? <><label>Disciplinas · uma por linha<textarea rows={5} value={disciplines} onChange={e => setDisciplines(e.target.value)}/></label><p>Começaremos com uma distribuição equilibrada. Depois você poderá adicionar o edital e ajustar os pesos.</p></> : choice === 'current' ? <p>Vamos ajustar horários e data. Seus assuntos, metas manuais, resultados e histórico serão preservados.</p> : <><p>{catalog.find(p => p.id === choice)?.description}</p><small>{catalog.find(p => p.id === choice)?.source.note}</small><p>Será criada uma cópia editável do modelo, sem alterar seus outros planos.</p></>}
    <button className="text-link" onClick={onImport}>Já tenho um backup · importar meu histórico</button></>}
    {step === 1 && <><fieldset className="setup-days"><legend>Horas disponíveis em cada dia · zero significa descanso</legend>{days.map((d, i) => <label key={d}>{d}<input aria-label={'Disponibilidade ' + d} type="number" min="0" max="24" step="0.25" value={Math.round(daily[i] / 60 * 100) / 100} onChange={e => setDaily(daily.map((n, j) => i === j ? Math.round(Number(e.target.value) * 60) : n))}/></label>)}</fieldset><p><strong>{fmt(sumMinutes(daily) / 60)} horas por semana</strong>. Comece com uma rotina que consiga manter.</p><label>Data da prova · opcional<input type="date" min={today()} value={examDate} onChange={e => setExamDate(e.target.value)}/></label><p>Se ainda não sabe a data, o cronograma mostra uma previsão de 28 dias. Em novos planos, as revisões são automáticas e podem ser personalizadas depois.</p></>}
    {step === 2 && proposal && <><div className="setup-summary"><h3>{proposal.name}</h3><p>Prova: {proposal.examDate ? proposal.examDate.split('-').reverse().join('/') : 'a definir'} · conteúdo até {proposal.deadline ? proposal.deadline.split('-').reverse().join('/') : 'a definir'}.</p><p>{fmt(sumMinutes(proposal.daily) / 60)} h/semana · {proposal.subjects.filter(s => s.active).length} disciplinas · {proposal.topics.length} assuntos</p></div><div className="preview-table-wrap"><table className="preview-table"><caption>Seu ciclo semanal inicial</caption><thead><tr><th>Disciplina</th><th>Horas por semana</th></tr></thead><tbody>{cycle(proposal).map(s => <tr key={s.id}><th>{s.name}</th><td>{fmt(s.target / 60)} h<progress aria-label={'Horas de ' + s.name} value={s.target} max={sumMinutes(proposal.daily)}/></td></tr>)}</tbody></table></div>
    {choice === 'current' && <p>Horários: {fmt(sumMinutes(current.daily) / 60)} → {fmt(sumMinutes(proposal.daily) / 60)} h/semana. Os registros já feitos não mudam.</p>}
    {first ? <p><strong>Primeiro dia com tarefas: {first.date.split('-').reverse().join('/')}.</strong> {first.tasks.slice(0, 2).map(t => `${t.title} (${t.minutes} min)`).join(' · ')}. Os demais assuntos ficam no cronograma.</p> : <p>Seu ciclo de horas está pronto. Adicione os assuntos do edital no checklist para gerar tarefas por assunto; você já pode estudar uma disciplina com o cronômetro.</p>}
    <details><summary>Como usar no dia a dia</summary><p>Escolha a disciplina no cronômetro, inicie e pause quando precisar. Ao concluir, confira e salve os minutos para atualizar o plano. As metas de questões ficam disponíveis quando houver dados do seu ritmo; elas não são inventadas no primeiro acesso.</p></details></>}
    {error && <div role="alert" className="notice error">{error}</div>}<div className="modal-actions">{step > 0 && <button className="secondary" onClick={() => { setStep(step - 1); setError(''); }}>Voltar</button>}{step < 2 ? <button onClick={next}>Continuar</button> : <button onClick={() => { if (proposal && !onSave(proposal, choice === 'current')) setError('Não foi possível salvar. Confira o aviso de armazenamento. Seu rascunho continua aqui.'); }}>Confirmar e abrir meu plano</button>}</div></section></div>;
}
