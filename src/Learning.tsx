import { useState } from 'react';
import type { FormEvent } from 'react';
import { uid, today, emptyQuestion, saveQuestion, practiceQueue, questionDue, applyPractice, isDeclaredUnknown } from './domain';
import type { Contest, Question, AttemptResult } from './domain';
type Session = {
    declaredUnknown?: boolean;
    id: string;
    queue: string[];
    index: number;
    phase: 'example' | 'guided' | 'prompt' | 'compare';
    response: string;
    choice: number | null;
    guidedResponse: string;
    guidedRevealed: boolean;
    usedHint: boolean;
    confidence: string;
    result: AttemptResult | '';
    selfExplanation: string;
    errorTag: string;
    correctionMade: boolean;
    notes: string;
    minutes: string;
    started: number;
};
const draftKey = (c: Contest) => 'estudamente-studio-6-session-' + c.id;
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n);
const names = { alone: 'Sem ajuda', assisted: 'Com ajuda', wrong: 'Não lembrei / errei' };
const nice = (d: string) => d ? d.split('-').reverse().join('/') : 'Nova';
function phase(q: Question): Session['phase'] { return q.example ? 'example' : q.guidedPrompt && q.guidedAnswer ? 'guided' : 'prompt'; }
function nextFields(q: Question) { return { phase: phase(q), response: '', declaredUnknown: false, choice: null, guidedResponse: '', guidedRevealed: false, usedHint: false, confidence: '', result: '' as AttemptResult | '', selfExplanation: '', errorTag: '', correctionMade: false, notes: '', minutes: '', started: Date.now() }; }
function readDraft(c: Contest): {
    session: Session | null;
    error: string;
} {
    try {
        const raw = sessionStorage.getItem(draftKey(c));
        if (!raw)
            return { session: null, error: '' };
        const s: Session = JSON.parse(raw);
        if (!s || typeof s.id !== 'string' || !Array.isArray(s.queue) || s.queue.length < 1 || s.queue.length > 50 || s.queue.some(id => typeof id !== 'string' || !c.questions.some(q => q.id === id)) || !Number.isInteger(s.index) || s.index < 0 || s.index > s.queue.length || !['example', 'guided', 'prompt', 'compare'].includes(s.phase) || !['', 'alone', 'assisted', 'wrong'].includes(s.result) || !Number.isFinite(s.started))
            throw Error('Rascunho de sessão inválido.');
        for (const key of ['response', 'guidedResponse', 'confidence', 'selfExplanation', 'errorTag', 'notes', 'minutes'] as const)
            if (typeof s[key] !== 'string')
                throw Error('Rascunho de sessão incompleto.');
        if (s.declaredUnknown !== undefined && typeof s.declaredUnknown !== 'boolean' || typeof s.usedHint !== 'boolean' || typeof s.guidedRevealed !== 'boolean' || typeof s.correctionMade !== 'boolean' || s.choice !== null && (!Number.isInteger(s.choice) || s.choice < 0 || s.choice > 5))
            throw Error('Rascunho de sessão incompleto.');
        let index = s.index;
        while (index < s.queue.length && c.attempts.some(a => a.sessionId === s.id && a.questionId === s.queue[index]))
            index++;
        if (index !== s.index && index < s.queue.length)
            return { session: { ...s, index, ...nextFields(c.questions.find(q => q.id === s.queue[index])!) }, error: '' };
        return { session: { ...s, index }, error: '' };
    }
    catch {
        return { session: null, error: 'Não foi possível restaurar o rascunho da sessão. As tentativas já salvas permanecem no histórico.' };
    }
}
export default function Learning({ c, onChange, onNewTopic }: {
    c: Contest;
    onChange: (next: Contest) => boolean;
    onNewTopic: () => void;
}) {
    const [restored] = useState(() => readDraft(c)), [session, setSession] = useState<Session | null>(restored.session), [error, setError] = useState(restored.error);
    const [search, setSearch] = useState(''), [subjectId, setSubjectId] = useState(''), [topicId, setTopicId] = useState(''), [mode, setMode] = useState('all'), [limit, setLimit] = useState(10), [archived, setArchived] = useState(false), [editing, setEditing] = useState<Question | null>(null);
    const activeTopics = c.topics.filter(t => c.subjects.some(s => s.id === t.subjectId && s.active)), filtered = c.questions.filter(q => { const t = c.topics.find(t => t.id === q.topicId); return (archived || !q.archived) && (!subjectId || t?.subjectId === subjectId) && (!topicId || q.topicId === topicId) && q.prompt.toLocaleLowerCase().includes(search.toLocaleLowerCase()); });
    const subject = (q: Question) => c.subjects.find(s => s.id === c.topics.find(t => t.id === q.topicId)?.subjectId)?.name || 'Disciplina arquivada';
    function saveSession(next: Session | null) {
        setSession(next);
        try {
            if (next)
                sessionStorage.setItem(draftKey(c), JSON.stringify(next));
            else
                sessionStorage.removeItem(draftKey(c));
        }
        catch {
            setError('O rascunho não pôde ser guardado nesta aba. Salve a tentativa antes de sair; os dados confirmados continuam no histórico.');
        }
    }
    function patch(values: Partial<Session>) {
        if (session)
            saveSession({ ...session, ...values });
    }
    function begin() {
        const queue = practiceQueue(c, { subjectId, topicId, mode, limit });
        if (!queue.length) {
            setError('Nenhuma pergunta disponível para este filtro. Adicione perguntas ou escolha outro modo.');
            return;
        }
        setError('');
        saveSession({ id: uid(), queue: queue.map(q => q.id), index: 0, ...nextFields(queue[0]) });
    }
    function finish() {
        if (session && session.index < session.queue.length && (session.response || session.guidedResponse || session.notes) && !confirm('Encerrar e descartar somente o rascunho desta pergunta? As tentativas já salvas serão mantidas.'))
            return;
        setError('');
        saveSession(null);
    }
    function saveEditor(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editing)
            return;
        try {
            const next = saveQuestion(c, editing);
            if (!onChange(next))
                throw Error('Não foi possível salvar. Confira o aviso de armazenamento e tente novamente.');
            setEditing(null);
            setError('');
        }
        catch (e) {
            setError(String(e));
        }
    }
    function compare(unknown = false) {
        if (!session)
            return;
        const q = c.questions.find(q => q.id === session.queue[session.index]);
        if (!q)
            return;
        const response = unknown ? 'Não sei' : q.options.length ? session.choice !== null ? `${String.fromCharCode(65 + session.choice)}) ${q.options[session.choice]}` : '' : session.response.trim();
        if (!response) {
            setError('Registre sua resposta ou selecione “Não sei” antes de comparar.');
            return;
        }
        setError('');
        patch({ response, declaredUnknown: unknown, choice: unknown ? null : session.choice, result: unknown ? 'wrong' : q.options.length ? session.choice === q.correct ? (session.usedHint ? 'assisted' : 'alone') : 'wrong' : '', phase: 'compare', minutes: String(Math.max(.1, Math.round((Date.now() - session.started) / 6000) / 10)) });
    }
    function saveAttempt() {
        if (!session)
            return;
        try {
            const result = isDeclaredUnknown(session.response, session.declaredUnknown) ? 'wrong' : session.result;
            if (!result)
                throw Error('Selecione como foi sua tentativa antes de salvar.');
            const next = applyPractice(c, { id: session.id + '-' + session.queue[session.index], sessionId: session.id, questionId: session.queue[session.index], response: session.response, declaredUnknown: session.declaredUnknown, choice: session.choice, usedHint: session.usedHint, result, confidence: session.confidence, correctionMade: session.correctionMade, selfExplanation: session.selfExplanation, errorTag: session.errorTag, notes: session.notes, minutes: Number(session.minutes) });
            if (!onChange(next))
                throw Error('A tentativa não foi salva. Confira o aviso de armazenamento; seu rascunho permanece disponível.');
            setError('');
            const index = session.index + 1, nextQ = c.questions.find(q => q.id === session.queue[index]);
            saveSession(nextQ ? { ...session, index, ...nextFields(nextQ) } : { ...session, index, response: '', notes: '' });
        }
        catch (e) {
            setError(String(e));
        }
    }
    const question = session ? c.questions.find(q => q.id === session.queue[session.index]) : null;
    const all = c.attempts, alone = all.filter(a => a.result === 'alone').length, assisted = all.filter(a => a.result === 'assisted').length, wrong = all.filter(a => a.result === 'wrong').length;
    const sessionAttempts = session ? all.filter(a => a.sessionId === session.id && a.origin === 'practice') : [];
    return <div className="learning">
 {error && <div className="notice error" role="alert">{error}<button onClick={() => setError('')} aria-label="Fechar aviso de estudo">×</button></div>}
 {session ? <section className="card practice-card" aria-labelledby="practice-title"><div className="section-head"><div><div className="eyebrow">RECUPERAÇÃO ATIVA</div><h2 id="practice-title">{question ? `Pergunta ${session.index + 1} de ${session.queue.length}` : 'Sessão concluída'}</h2></div><button className="quiet" onClick={finish}>{question ? 'Encerrar sessão' : 'Voltar ao banco'}</button></div>
 {question ? <><p>{subject(question)} · {c.topics.find(t => t.id === question.topicId)?.title}</p><progress value={session.index} max={session.queue.length}/>
 {session.phase === 'example' && <><h3>Um exemplo para preparar o raciocínio</h3><div className="study-panel notes">{question.example}</div><p>O exemplo é um apoio inicial. Na próxima etapa, tente resolver o exercício com suas próprias palavras.</p><button onClick={() => patch({ phase: question.guidedPrompt && question.guidedAnswer ? 'guided' : 'prompt' })}>Continuar</button></>}
 {session.phase === 'guided' && <><h3>Prática com apoio</h3><div className="study-panel notes">{question.guidedPrompt}</div>{question.guided && <p className="notes">{question.guided}</p>}<label>Sua resposta ao exercício guiado<textarea value={session.guidedResponse} disabled={session.guidedRevealed} onChange={e => patch({ guidedResponse: e.target.value })} maxLength={20000} rows={3}/></label>{session.guidedRevealed ? <><div className="study-answer notes"><strong>Correção do exercício guiado</strong><p>{question.guidedAnswer}</p></div><button onClick={() => patch({ phase: 'prompt' })}>Tentar sem apoio</button></> : <div className="actions"><button disabled={!session.guidedResponse.trim()} onClick={() => patch({ guidedRevealed: true })}>Comparar exercício guiado</button><button className="quiet" onClick={() => patch({ phase: 'prompt' })}>Ir para tentativa independente</button></div>}</>}
 {session.phase === 'prompt' && <><h3 className="practice-prompt notes">{question.prompt}</h3>{question.options.length ? <fieldset className="answer-options"><legend>Escolha uma alternativa</legend>{question.options.map((option, i) => <label className={session.choice === i ? 'chosen' : ''} key={i}><input type="radio" name="practice-choice" checked={session.choice === i} onChange={() => patch({ choice: i })}/><span>{String.fromCharCode(65 + i)}. {option}</span></label>)}</fieldset> : <label>Sua resposta, antes de consultar o gabarito<textarea autoFocus value={session.response} onChange={e => patch({ response: e.target.value })} maxLength={20000} rows={5} placeholder="Tente lembrar e explique com suas palavras…"/></label>}
 {(question.hint || question.guided) && !session.usedHint && <button className="quiet" onClick={() => patch({ usedHint: true })}>Preciso de uma dica</button>}{session.usedHint && <div className="banner notes"><strong>Dica utilizada · tentativa assistida</strong><br />{question.hint || question.guided}</div>}
 <label>Confiança na resposta<select value={session.confidence} onChange={e => patch({ confidence: e.target.value })}><option value="">Prefiro não informar</option><option>Baixa</option><option>Média</option><option>Alta</option></select></label><div className="actions"><button disabled={question.options.length ? session.choice === null : !session.response.trim()} onClick={() => compare()}>Comparar com gabarito</button><button className="secondary" onClick={() => compare(true)}>Não sei</button></div></>}
 {session.phase === 'compare' && <><h3 className="practice-prompt notes">{question.prompt}</h3><div className="study-panel notes"><strong>Sua primeira resposta</strong><p>{session.response}</p></div><div className="study-answer notes"><strong>Resposta esperada</strong><p>{question.answer}</p>{question.explanation && <><strong>Por que essa resposta?</strong><p>{question.explanation}</p></>}</div>
 {isDeclaredUnknown(session.response, session.declaredUnknown) ? <div className="banner"><strong>Você registrou “Não sei”.</strong> Esta tentativa fica como “Não lembrei / errei”, mesmo depois de consultar a resposta. Uma nova tentativa pode ser feita em outra sessão.</div> : question.options.length ? <div className={'banner ' + (session.result === 'wrong' ? 'error' : '')}><strong>{session.result === 'wrong' ? 'Alternativa incorreta ou não respondida.' : session.result === 'assisted' ? 'Acerto com ajuda.' : 'Acerto sem ajuda.'}</strong> A correção usa o gabarito cadastrado.</div> : <fieldset className="result-options"><legend>Compare sua tentativa com os critérios da resposta</legend>{(['alone', 'assisted', 'wrong'] as const).map(result => <label key={result}><input type="radio" name="practice-result" disabled={result === 'alone' && session.usedHint} checked={session.result === result} onChange={() => patch({ result })}/>{names[result]}</label>)}</fieldset>}
 {!question.explanation.trim() && <p className="muted">Esta pergunta tem apenas o gabarito cadastrado. Para conferir o raciocínio, acrescente uma explicação e uma fonte no editor; o aplicativo não verifica o conteúdo automaticamente.</p>}
 {session.usedHint && <p className="muted">A dica impede registrar esta tentativa como “sem ajuda”.</p>}
 <label>Explique a correção com suas palavras<textarea value={session.selfExplanation} onChange={e => patch({ selfExplanation: e.target.value })} rows={3} maxLength={20000}/></label><label className="inline-check"><input type="checkbox" checked={session.correctionMade} onChange={e => patch({ correctionMade: e.target.checked })}/> Revisei e corrigi meu raciocínio</label>
 {session.result === 'wrong' && <label>O que dificultou?<select value={session.errorTag} onChange={e => patch({ errorTag: e.target.value })}><option value="">Sem categoria</option><option>Não lembrava o conteúdo</option><option>Confundi conceitos</option><option>Interpretação</option><option>Procedimento ou cálculo</option><option>Desatenção</option></select></label>}
 <div className="form-grid"><label>Tempo desta pergunta (minutos)<input type="number" min="0.1" max="1440" step="0.1" required value={session.minutes} onChange={e => patch({ minutes: e.target.value })}/></label><label>Observações<textarea value={session.notes} onChange={e => patch({ notes: e.target.value })} maxLength={20000}/></label></div><p className="muted">O valor sugerido mede até abrir o gabarito. Inclua o tempo de correção e desconte pausas antes de salvar. Ao salvar, ele entra uma única vez no ciclo e nos gráficos. Perguntas abertas têm avaliação feita por você.</p><button disabled={!session.result} onClick={saveAttempt}>Salvar tentativa e continuar</button></>}
 </> : <><div className="practice-complete">✓</div><h3>Mais um passo no seu caminho.</h3><p>{sessionAttempts.length} tentativas salvas · {sessionAttempts.filter(a => a.result === 'alone').length} sem ajuda · {sessionAttempts.filter(a => a.result === 'assisted').length} com ajuda · {sessionAttempts.filter(a => a.result === 'wrong').length} para reaprender.</p><p>O histórico, o ciclo, as próximas revisões e os gráficos já foram atualizados.</p><button onClick={finish}>Concluir e voltar ao banco</button></>}
 </section> : <>
 <details className="home-details"><summary>Resumo das tentativas ({all.length})</summary><div className="learning-stats"><section className="card"><small>TENTATIVAS</small><strong>{all.length}</strong></section><section className="card"><small>SEM AJUDA</small><strong>{alone}</strong></section><section className="card"><small>COM AJUDA</small><strong>{assisted}</strong></section><section className="card"><small>PARA REAPRENDER</small><strong>{wrong}</strong></section></div></details>
 <section className="card"><div className="section-head"><div><h2>Pratique o que precisa lembrar</h2><p>Responda primeiro. Compare, reflita e registre o resultado real.</p></div><button disabled={!activeTopics.length} onClick={() => { setError(''); setEditing(emptyQuestion(topicId || activeTopics[0].id)); }}>＋ Nova pergunta</button></div>
 {!activeTopics.length && <div className="empty">Adicione um assunto ativo ao edital para cadastrar perguntas.<br /><button className="quiet" onClick={onNewTopic}>Abrir edital</button></div>}
 <div className="practice-filters"><label>Disciplina<select value={subjectId} onChange={e => { setSubjectId(e.target.value); setTopicId(''); }}><option value="">Todas as ativas</option>{c.subjects.map(s => <option key={s.id} value={s.id}>{s.name}{s.active ? '' : ' (arquivada)'}</option>)}</select></label><label>Assunto<select value={topicId} onChange={e => setTopicId(e.target.value)}><option value="">Todos os assuntos</option>{c.topics.filter(t => !subjectId || t.subjectId === subjectId).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label><label>Seleção de estudo<select value={mode} onChange={e => setMode(e.target.value)}><option value="all">Novas e revisões</option><option value="due">Revisões vencidas</option><option value="errors">Erros e tentativas assistidas</option></select></label><label>Perguntas na sessão<input type="number" min="1" max="50" step="1" value={limit} onChange={e => setLimit(Number(e.target.value))}/></label></div><div className="actions"><button onClick={begin}>Iniciar recuperação ativa</button><span className="muted">Até {practiceQueue(c, { topicId, subjectId, mode, limit }).length} pergunta(s) disponíveis para esta sessão.</span></div></section>
 <section className="card"><div className="toolbar"><input aria-label="Buscar pergunta" placeholder="Buscar pergunta…" value={search} onChange={e => setSearch(e.target.value)}/><label className="inline-check"><input type="checkbox" checked={archived} onChange={e => setArchived(e.target.checked)}/> Mostrar arquivadas</label></div>{filtered.slice(0, 100).map(q => {
                const state = questionDue(c, q);
                return <article className="question-row" key={q.id}><div><span className="pill">{q.options.length ? 'Objetiva' : 'Aberta'}{q.archived ? ' · Arquivada' : ''}</span><h3 className="notes">{q.prompt}</h3><small>{subject(q)} · {c.topics.find(t => t.id === q.topicId)?.title}</small><small>{state.date ? `Próxima prática: ${nice(state.date)}${state.date <= today() ? ' · vencida' : ''}` : 'Ainda sem tentativa'}{q.source ? ' · Fonte: ' + q.source : ''}</small></div><div className="actions"><button className="quiet" onClick={() => { setError(''); setEditing(structuredClone(q)); }}>Editar pergunta</button><button className="quiet" onClick={() => {
                        if (onChange({ ...c, questions: c.questions.map(x => x.id === q.id ? { ...x, archived: !x.archived } : x) }))
                            setError('');
                    }}>{q.archived ? 'Reativar pergunta' : 'Arquivar pergunta'}</button></div></article>;
            })}{!filtered.length && <div className="empty">Nenhuma pergunta neste filtro. Cadastre a primeira ou importe o backup antigo.</div>}{filtered.length > 100 && <p className="muted">Exibindo 100 perguntas. Use a busca para localizar as demais.</p>}</section>
 <details className="home-details"><summary>Histórico de recuperação ({all.length})</summary><section className="card"><h2>Histórico de recuperação</h2><p>Arquivar ou editar uma pergunta mantém suas tentativas e a versão da resposta usada em cada registro.</p>{all.slice().sort((a, b) => b.at.localeCompare(a.at)).slice(0, 100).map(a => <details className="attempt-row" key={a.id}><summary><span>{a.snapshot.prompt}</span><b className={'pill ' + (a.result === 'wrong' ? 'amber' : a.result === 'assisted' ? 'purple' : 'green')}>{names[a.result]}</b><small>{nice(a.date)} · {fmt(a.minutes)} min{a.origin === 'legacy' ? ' · importada' : ''}</small></summary><div className="notes"><strong>Primeira resposta</strong><p>{a.firstResponse || 'Não registrada no legado.'}</p><strong>Resposta esperada no momento da tentativa</strong><p>{a.snapshot.answer}</p>{a.selfExplanation && <><strong>Sua explicação</strong><p>{a.selfExplanation}</p></>}<p>Dica: {a.usedHint ? 'sim' : 'não'} · Confiança: {a.confidence || 'não informada'} · Correção: {a.correctionMade ? 'registrada' : 'não registrada'} · Próximo intervalo: {a.interval} dia(s).</p>{a.errorTag && <p>Dificuldade: {a.errorTag}</p>}{a.notes && <p>{a.notes}</p>}</div></details>)}{!all.length && <div className="empty">As tentativas aparecerão aqui depois que forem salvas.</div>}</section></details>
 </>}
 {editing && <div className="overlay"><section className="modal learning-editor" role="dialog" aria-modal="true" aria-labelledby="question-title"><div className="section-head"><h2 id="question-title">{c.questions.some(q => q.id === editing.id) ? 'Editar pergunta' : 'Nova pergunta'}</h2><button className="icon-button" aria-label="Fechar editor de pergunta" onClick={() => setEditing(null)}>×</button></div>{error && <div className="notice error" role="alert">{error}</div>}<form onSubmit={saveEditor}><label>Assunto da pergunta<select required value={editing.topicId} onChange={e => setEditing({ ...editing, topicId: e.target.value })}>{c.topics.map(t => <option value={t.id} key={t.id}>{c.subjects.find(s => s.id === t.subjectId)?.name} · {t.title}</option>)}</select></label><label>Formato<select value={editing.options.length ? 'objective' : 'open'} onChange={e => setEditing({ ...editing, options: e.target.value === 'objective' ? ['', ''] : [], correct: e.target.value === 'objective' ? 0 : null })}><option value="open">Pergunta aberta</option><option value="objective">Múltipla escolha</option></select></label><label>Pergunta ou desafio<textarea autoFocus required maxLength={20000} rows={3} value={editing.prompt} onChange={e => setEditing({ ...editing, prompt: e.target.value })}/></label>
 {editing.options.length > 0 && <fieldset><legend>Alternativas e gabarito</legend>{editing.options.map((option, i) => <div className="option-editor" key={i}><label>Alternativa {String.fromCharCode(65 + i)}<input required maxLength={5000} value={option} onChange={e => setEditing({ ...editing, options: editing.options.map((x, j) => j === i ? e.target.value : x) })}/></label><label className="inline-check"><input type="radio" name="correct-choice" checked={editing.correct === i} onChange={() => setEditing({ ...editing, correct: i })}/> Gabarito</label></div>)}<div className="actions"><button className="quiet" type="button" disabled={editing.options.length >= 6} onClick={() => setEditing({ ...editing, options: [...editing.options, ''] })}>＋ Alternativa</button><button className="quiet" type="button" disabled={editing.options.length <= 2} onClick={() => setEditing({ ...editing, options: editing.options.slice(0, -1), correct: Math.min(editing.correct || 0, editing.options.length - 2) })}>Remover última</button></div></fieldset>}
 <label>Resposta esperada / critérios de correção<textarea required={!editing.options.length} readOnly={editing.options.length > 0} maxLength={20000} rows={3} value={editing.options.length ? `Alternativa ${String.fromCharCode(65 + (editing.correct || 0))}: ${editing.options[editing.correct || 0] || ''}` : editing.answer} onChange={e => setEditing({ ...editing, answer: e.target.value })}/></label><label>Explicação da resposta<textarea maxLength={20000} value={editing.explanation} onChange={e => setEditing({ ...editing, explanation: e.target.value })}/></label><label>Dica opcional<textarea maxLength={20000} value={editing.hint} onChange={e => setEditing({ ...editing, hint: e.target.value })}/></label><label>Fonte<input maxLength={20000} value={editing.source} onChange={e => setEditing({ ...editing, source: e.target.value })}/></label><details className="guided-editor"><summary>Exemplo e prática guiada (opcionais)</summary><label>Exemplo resolvido análogo<textarea maxLength={20000} value={editing.example} onChange={e => setEditing({ ...editing, example: e.target.value })}/></label><label>Orientação inicial<textarea maxLength={20000} value={editing.guided} onChange={e => setEditing({ ...editing, guided: e.target.value })}/></label><label>Exercício guiado<textarea maxLength={20000} value={editing.guidedPrompt} onChange={e => setEditing({ ...editing, guidedPrompt: e.target.value })}/></label><label>Resposta do exercício guiado<textarea maxLength={20000} value={editing.guidedAnswer} onChange={e => setEditing({ ...editing, guidedAnswer: e.target.value })}/></label></details><p className="muted">O gabarito objetivo gera a resposta esperada automaticamente a partir da alternativa selecionada. As alterações não mudam as respostas já guardadas no histórico.</p><div className="modal-actions"><button className="secondary" type="button" onClick={() => setEditing(null)}>Cancelar</button><button type="submit">Salvar pergunta</button></div></form></section></div>}
 </div>;
}
