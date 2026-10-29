import { useState, useRef, lazy, Suspense } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { KEY, LEGACY_KEY, defaultReviewSettings, uid, today, plus, monday, colors, emptyDB, emptyContest, cycle, schedule, reviewDue, registerReview, recordStudy, migrate, mergeImport, persist, upgradeDatabase } from './domain';
import type { Contest, Database, Subject, Topic, RecordItem } from './domain';
import seed from './seed.json';
import './style.css';
import { QuestionProgress, QuestionTargets } from './QuestionMetrics';
import AdaptiveCycle from './AdaptiveCycle';
import ReviewSettings from './ReviewSettings';
import ThemeToggle from './ThemeToggle';
import CycleAllocation from './CycleAllocation';
import GettingStarted from './GettingStarted';
import StudyTimer from './StudyTimer';
import { ChartPreferencesProvider } from './ChartPreferences';
const Plans = lazy(() => import('./Plans'));
const CalendarPanel = lazy(() => import('./CalendarPanel'));
const Learning = lazy(() => import('./Learning'));
const TimeChart = lazy(() => import('./TimeChart')); 
const Science = lazy(() => import('./Science'));
const Community = lazy(() => import('./Community'));
const tabs = [['painel', 'Visão geral', '◈'], ['ciclo', 'Ciclo inteligente', '◷'], ['agenda', 'Cronograma', '▦'], ['planos', 'Planos pré-programados', '▧'], ['comunidade', 'Editais da comunidade', '♧'], ['social', 'Comunidade e rankings', '◎'], ['edital', 'Edital e checklist', '☷'], ['revisoes', 'Revisão espaçada', '↻'], ['perguntas', 'Perguntas e prática', '✎'], ['graficos', 'Meu progresso', '↗'], ['registros', 'Biblioteca e registros', '▤'], ['dados', 'Dados e migração', '⇄'], ['ciencia', 'Ciência e referências', '⌘'], ['legado', 'Módulos 5.0', '◇']] as const;
function hasTimerDraft() { try { return typeof window !== 'undefined' && Boolean(window.localStorage.getItem('estudamente-timer-v1')); } catch { return false; } }
const sections = [
 {name:'Hoje', items:['painel','revisoes','perguntas']},
 {name:'Planejamento', items:['ciclo','agenda','planos','edital']},
 {name:'Progresso', items:['graficos']},
 {name:'Comunidade', items:['comunidade','social']},
 {name:'Mais', items:['registros','dados','ciencia','legado']}
] as const;

const weekdays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(n);
const hours = (n: number) => Math.abs(n) < 60 ? `${fmt(n)} min` : `${fmt(n / 60)} h`;
const nice = (d: string) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não definida';
function download(name: string, content: string, type = 'application/json') { const url = URL.createObjectURL(new Blob([content], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
function backup(db: Database) { download(`EstudaMente-6-backup-${today()}.json`, JSON.stringify(db, null, 2)); }
function load() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw)
            return { db: emptyDB(), raw: null, error: '' };
        const db = upgradeDatabase(JSON.parse(raw), seed.units);
        return { db, raw, error: '' };
    }
    catch (e) {
        return { db: emptyDB(), raw: null, error: `Os dados salvos não puderam ser abertos. Nenhum dado foi substituído. ${String(e)}` };
    }
}
function Card({ children, className = '' }: {
    children: ReactNode;
    className?: string;
}) { return <section className={'card ' + className}>{children}</section>; }
function Empty({ children }: {
    children: ReactNode;
}) { return <div className="empty">{children}</div>; }
function StudioApp() {
    const [initial] = useState(load), [db, setDB] = useState<Database>(initial.db), saved = useRef(initial.raw);
    const [tab, setTab] = useState(() => { const p=new URLSearchParams(location.search); return p.has('communityPlan') || p.get('view')==='community' ? 'comunidade' : p.has('groupInvite') || p.get('view')==='social' ? 'social' : 'painel'; }), [message, setMessage] = useState(initial.error), [modal, setModal] = useState(''), [editId, setEditId] = useState(''), [search, setSearch] = useState(''), [filter, setFilter] = useState(''), [recordKind, setRecordKind] = useState('Questões');
    const [showSetup, setShowSetup] = useState(false);
    const [timerSuggestion, setTimerSuggestion] = useState<{ contestId: string; subjectId: string; topicId: string; method: string; nonce: number } | null>(null);
    const [pending, setPending] = useState<Database | null>(null), [importSource, setImportSource] = useState(''), [showCompat, setShowCompat] = useState(false), [legacySnapshot, setLegacySnapshot] = useState('');
    const c = db.contests.find(x => x.id === db.activeId)!, now = today(), budget = cycle(c, now), plan = schedule(c, now), active = c.subjects.filter(s => s.active);
    const reviewed = c.topics.filter(t => active.some(s => s.id === t.subjectId)).map(t => reviewDue(c, t)).filter(x => x !== null).sort((a, b) => a.date.localeCompare(b.date)), due = reviewed.filter(r => r.date <= now);
    const completed = c.topics.filter(t => t.done).length, week = monday(now), weekLogs = c.logs.filter(l => l.date >= week && l.date <= plus(week, 6)), spent = weekLogs.reduce((n, l) => n + l.minutes, 0), available = c.daily.reduce((a, b) => a + b, 0);
    const subject = (id: string) => c.subjects.find(s => s.id === id)?.name || 'Geral';
    function commit(next: Database) {
        try {
            if (initial.error)
                throw Error('Recupere ou exporte os dados locais antes de gravar nesta instalação.');
            const result = persist(localStorage, next, saved.current);
            saved.current = result.serialized;
            setDB(result.db);
            return true;
        }
        catch (e) {
            setMessage(String(e));
            return false;
        }
    }
    function change(next: Contest) { return commit({ ...db, contests: db.contests.map(x => x.id === c.id ? next : x) }); }
    function open(name: string, id = '') { setMessage(''); setEditId(id); setModal(name); }
    function preview(raw: string, source: string) {
        try {
            if (raw.length > 25000000)
                throw Error('Arquivo maior que 25 MB. Divida o backup por perfil antes de importar.');
            setPending(migrate(JSON.parse(raw), seed.units));
            setImportSource(source);
            setMessage('Confira os concursos e confirme a importação. Os dados atuais serão preservados.');
        }
        catch (e) {
            setMessage('Importação não realizada: ' + String(e));
        }
    }
    function localImport() {
        try {
            const profiles = JSON.parse(localStorage.getItem('estudamente-v2-profiles') || 'null');
            if (Array.isArray(profiles) && profiles.length) {
                const packed = { format: 'estudamente-all-profiles-v2', activeProfileId: localStorage.getItem('estudamente-v2-active'), profiles: profiles.map(p => ({ ...p, data: JSON.parse(localStorage.getItem('estudamente-v2-data-' + p.id) || 'null') })) };
                preview(JSON.stringify(packed), 'Perfis 5.0 deste navegador');
                return;
            }
            const raw = localStorage.getItem(LEGACY_KEY);
            if (!raw) {
                setMessage('Não há dados 5.0 nesta origem. No HTML antigo, exporte o JSON e importe o arquivo aqui.');
                return;
            }
            preview(raw, 'Navegador: ' + LEGACY_KEY);
        }
        catch (e) {
            setMessage(String(e));
        }
    }
    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const values = new FormData(e.currentTarget), s = (k: string) => String(values.get(k) || '').trim(), n = (k: string) => Number(s(k));
        try {
            let next = c, saveNotice = '';
            if (modal === 'concurso') {
                const ex = emptyContest(s('name'));
                if (commit({ ...db, contests: [...db.contests, ex], activeId: ex.id })) {
                    setModal('');
                    setMessage('Concurso criado. Configure disciplinas, horários e edital.');
                }
                return;
            }
            if (modal === 'disciplina') {
                const old = c.subjects.find(x => x.id === editId);
                if (c.subjects.some(x => x.name.toLocaleLowerCase() === s('name').toLocaleLowerCase() && x.id !== editId))
                    throw Error('Já existe uma disciplina com esse nome.');
                const item: Subject = { ...old, id: old?.id || uid(), name: s('name'), color: s('color'), questions: n('questions'), points: n('points'), difficulty: n('difficulty'), active: old?.active ?? true, provisionalWeight: old?.provisionalWeight };
                next = { ...c, subjects: old ? c.subjects.map(x => x.id === old.id ? item : x) : [...c.subjects, item] };
            }
            if (modal === 'assunto') {
                const old = c.topics.find(x => x.id === editId);
                const item: Topic = { ...old, id: old?.id || uid(), subjectId: s('subjectId'), title: s('title'), hours: n('hours'), notes: s('notes'), done: old?.done || false, started: old?.started || '' };
                next = { ...c, topics: old ? c.topics.map(x => x.id === old.id ? item : x) : [...c.topics, item] };
            }
            if (modal === 'estudo') {
                next = recordStudy(c, { subjectId: s('subjectId'), topicId: s('topicId'), date: s('date'), minutes: n('minutes'), method: s('method'), notes: s('notes') });
            }
            if (modal === 'revisao') {
                const r = registerReview(c, editId, s('date'), n('rating'), n('questions'), n('correct'));
                if (r.rating !== n('rating'))
                    saveNotice = 'Revisão salva com avaliação ajustada aos acertos informados. O resultado objetivo limita o crescimento do intervalo.';
                next = { ...c, reviews: [...c.reviews, r], logs: [...c.logs, { id: uid(), topicId: editId, subjectId: c.topics.find(t => t.id === editId)!.subjectId, date: s('date'), minutes: n('minutes'), method: 'Revisão', notes: 'Revisão espaçada registrada' }] };
                if (n('minutes') < 1 || c.logs.filter(l => l.date === s('date')).reduce((n, l) => n + l.minutes, 0) + n('minutes') > 1440)
                    throw Error('Duração inválida ou total do dia acima de 24 horas.');
            }
            if (modal === 'registro') {
                if (n('correct') > n('total'))
                    throw Error('Os acertos não podem ultrapassar o total.');
                const r: RecordItem = { id: uid(), kind: s('kind'), date: s('date'), title: s('title'), subjectId: s('subjectId'), total: n('total'), correct: n('correct'), notes: s('notes'), url: s('url') };
                if (r.url && !/^https?:\/\//i.test(r.url))
                    throw Error('Use um endereço iniciado por https:// ou http://.');
                next = { ...c, records: [...c.records, r] };
            }
            if (modal === 'config') {
                const daily = weekdays.map((_, i) => Math.round(n('day' + i) * 60));
                if (s('deadline') && s('examDate') && s('deadline') > s('examDate'))
                    throw Error('O prazo de conteúdo deve ser anterior ou igual à prova.');
                next = { ...c, name: s('name'), examDate: s('examDate'), deadline: s('deadline'), startDate: s('startDate'), daily, reviewMode: s('reviewMode') === 'automatic' ? 'automatic' : 'custom', ...(s('reviewMode') === 'automatic' ? defaultReviewSettings : { reviewDays: n('reviewDays'), reviewGrowth: n('reviewGrowth'), reviewMax: n('reviewMax') }), contentShare: n('contentShare') / 100 };
            }
            if (change(next)) {
                setModal('');
                setMessage(saveNotice || 'Salvo. Ciclo, checklist, cronograma e gráficos atualizados.');
            }
        }
        catch (e) {
            setMessage(String(e));
        }
    }
    function compat() {
        try {
            if (!showCompat) {
                const archive = db.archives.find(a => a.source.includes('legado'));
                const payload = archive?.payload as {
                    format?: string;
                    profiles?: {
                        data: unknown;
                    }[];
                    data?: unknown;
                } | undefined;
                const raw = payload?.format === 'estudamente-all-profiles-v2' ? JSON.stringify(payload.profiles?.[0]?.data) : payload?.data && !('subjects' in payload) && !('contests' in payload) ? JSON.stringify(payload.data) : archive ? JSON.stringify(archive.payload) : localStorage.getItem(LEGACY_KEY);
                if (raw && !localStorage.getItem('estudamente-studio-6-compat'))
                    localStorage.setItem('estudamente-studio-6-compat', raw);
                setLegacySnapshot(localStorage.getItem('estudamente-studio-6-compat') || '');
                setShowCompat(true);
            }
        }
        catch (e) {
            setMessage(String(e));
        }
    }
    const chart = Array.from({ length: 7 }, (_, i) => { const date = plus(week, i); return { dia: weekdays[i], horas: c.logs.filter(l => l.date === date).reduce((n, l) => n + l.minutes, 0) / 60, meta: c.daily[i] / 60 }; });
    const titles: Record<string, [
        string,
        string
    ]> = { comunidade: ['Planejar também é compartilhar.', 'Editais e planos feitos por pessoas que estudam com você.'], social: ['Seu próximo passo, em companhia.', 'Perfil, grupos e rankings para dar ritmo à sua preparação.'], ciencia: ['Conheça as ideias por trás do seu estudo.', 'Pesquisa, leituras e escolhas que dão forma ao EstudaMente.'], planos: ['Seu ponto de partida, pronto.', 'Escolha um edital ou construa uma base comum. Ajuste horas e ciclo ao seu ritmo.'], painel: ['Seu próximo passo, com clareza.', 'Hoje, uma tarefa de cada vez. O plano acompanha seu ritmo.'], ciclo: ['Um ciclo que cabe na sua vida.', 'Escolha a ordem. O saldo mostra onde investir seu próximo bloco.'], agenda: ['Um plano vivo para cada dia.', 'A carga restante é redistribuída conforme seus registros e horários.'], edital: ['Do edital à conquista.', 'Transforme conteúdos em passos claros e acompanhe sua conclusão.'], revisoes: ['Relembre. Conecte. Avance.', 'Revisões registradas alimentam o histórico e as próximas datas.'], perguntas: ['Lembrar é parte de aprender.', 'Seu banco de perguntas e sua prática, agora no Studio.'], graficos: ['Veja o caminho que você constrói.', 'Seu progresso é calculado a partir de registros reais.'], registros: ['Tudo o que apoia sua preparação.', 'Questões, simulados, materiais, redação e anotações em um só lugar.'], dados: ['Seu histórico merece cuidado.', 'Importe com prévia, preserve as origens e mantenha seus backups.'], legado: ['Seu EstudaMente, por inteiro.', 'Acesso de compatibilidade às ferramentas do HTML 5.0.'] };
    const editingSubject = c.subjects.find(x => x.id === editId), editingTopic = c.topics.find(x => x.id === editId);
    const todayTasks = plan.days.find(d => d.date === now)?.tasks ?? [];
    const firstTodayTask = todayTasks[0];
    const currentSection = sections.find(section => (section.items as readonly string[]).includes(tab)) ?? sections[0];
    return <div className="app"><aside><a className="brand" href="#" onClick={e => { e.preventDefault(); setTab('painel'); }}><img className="brand-mark" src="/marca-estudamente.png" alt=""/><span>Estuda<span className="light">Mente</span><small>SEU ESPAÇO DE ESTUDO</small></span></a><nav aria-label="Navegação principal">{sections.map(section => <button key={section.name} className={currentSection.name === section.name ? 'selected' : ''} aria-current={currentSection.name === section.name ? 'page' : undefined} onClick={() => setTab(section.items[0])}>{section.name === 'Planejamento' ? <><span className="desktop-section">Planejamento</span><span className="mobile-section">Plano</span></> : section.name}</button>)}</nav><div className="sidebar-footer">Conhecimento. Estratégia. Resultados.<button className="quiet" onClick={() => backup(db)}>↓ Fazer backup</button></div></aside>
 <div className="workspace"><header><div className="breadcrumb">Meu espaço <span>/</span> {tabs.find(t => t[0] === tab)?.[1]}</div><div className="header-actions"><details className="header-menu"><summary>Opções</summary><div><button className="quiet" onClick={() => setShowSetup(true)}>Primeiros passos</button><button className="quiet" onClick={() => open('concurso')}>＋ Novo concurso</button></div></details><button className="quiet" onClick={() => { setTab('painel'); setTimeout(() => { const d = document.getElementById('inicio-cronometro') as HTMLDetailsElement | null; if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }, 0); }}>◷ Cronômetro</button><ThemeToggle onError={setMessage}/><select aria-label="Concurso ativo" value={c.id} onChange={e => commit({ ...db, activeId: e.target.value })}>{db.contests.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select><button className="avatar" aria-label="Meu perfil na comunidade" onClick={() => setTab('social')}>◎</button></div></header>
 <main>{currentSection.items.length > 1 && <nav className="section-nav" aria-label={"Opções de " + currentSection.name}>{currentSection.items.map(id => { const item = tabs.find(t => t[0] === id); return item ? <button key={id} className={tab === id ? "active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{item[1]}{id === "revisoes" && due.length > 0 && <b>{due.length}</b>}</button> : null; })}</nav>}<div className="page-intro"><div><div className="eyebrow">SEU CENTRO DE COMANDO <span>·</span> {now.split('-').reverse().join('.')}</div><h1>{titles[tab][0]}</h1><p>{titles[tab][1]}</p>{c.planOrigin && tab !== 'ciencia' && <small className="plan-origin">Plano de referência: {c.planOrigin.edition}</small>}</div>{tab !== 'painel' && <button className="primary" onClick={() => active.length ? open('estudo') : open('disciplina')}>＋ Registrar estudo</button>}</div>
 {message && <div className={'notice ' + (initial.error ? 'error' : '')} role="status"><span>{message}</span><button aria-label="Fechar aviso" onClick={() => setMessage('')}>×</button></div>}
 {!active.length && tab !== 'dados' && tab !== 'legado' && tab !== 'ciencia' && tab !== 'planos' && tab !== 'comunidade' && tab !== 'social' && <Card className="welcome"><div><div className="eyebrow">UM NOVO COMEÇO</div><h2>Prepare seu próximo passo.</h2><p>Adicione disciplinas e assuntos ou traga seu histórico do EstudaMente.</p></div><div className="actions"><button onClick={() => setShowSetup(true)}>Montar meu plano · 3 passos</button><button className="secondary" onClick={() => setTab('dados')}>Importar histórico</button><button className="quiet" onClick={() => open('disciplina')}>Adicionar disciplina</button></div></Card>}
 {tab === 'painel' && active.length > 0 && <section className="today-focus"><div><span className="eyebrow">SUA PRÓXIMA AÇÃO</span><h2>{firstTodayTask ? firstTodayTask.title : 'Continue no seu ritmo.'}</h2><p>{firstTodayTask ? `${subject(firstTodayTask.subjectId)} · ${firstTodayTask.review ? 'Revisão' : 'Conteúdo'} · ${fmt(firstTodayTask.minutes)} min previstos` : 'Sem tarefas previstas para hoje. Escolha uma disciplina para estudar ou aproveite o descanso.'}</p><button onClick={() => { if (firstTodayTask && !hasTimerDraft()) setTimerSuggestion(previous => ({ contestId: c.id, subjectId: firstTodayTask.subjectId, topicId: firstTodayTask.topicId, method: firstTodayTask.review ? 'Revisão' : 'Teoria', nonce: (previous?.nonce ?? 0) + 1 })); const d = document.getElementById('inicio-cronometro') as HTMLDetailsElement | null; if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }}>Estudar agora</button><button className="quiet" onClick={() => setTab('revisoes')}>Ver revisões ({due.length})</button></div><div className="today-side"><strong>{hours(available)}</strong><span>disponíveis na semana</span><strong>{due.length}</strong><span>revisões para agora</span></div></section>}
 <div hidden={tab !== 'painel'}><details id="inicio-cronometro" className="home-details" open={hasTimerDraft() || undefined}><summary>Cronômetro de estudo</summary><StudyTimer key={timerSuggestion?.nonce ?? 0} suggestion={timerSuggestion?.contestId === c.id ? timerSuggestion : null} c={c} db={db} onSave={next => { const ok = change(next); if(ok) setMessage('Sessão salva. Seu plano e progresso foram atualizados.'); return ok; }} onSwitch={id => commit({ ...db, activeId: id })}/></details></div>
 {showSetup && <GettingStarted key={c.id} current={c} onClose={() => setShowSetup(false)} onImport={() => { setShowSetup(false); setTab('dados'); }} onSave={(next, existing) => { const ok = commit({ ...db, activeId: next.id, contests: existing ? db.contests.map(x => x.id === c.id ? next : x) : [...db.contests, next] }); if(ok) { setShowSetup(false); setTab('painel'); setMessage('Seu plano está pronto. Escolha uma disciplina no cronômetro para começar.'); } return ok; }}/> }
 {tab === 'painel' && active.length > 0 && <><details className="home-details"><summary>Meu plano e progresso</summary><section className="hero-panel"><div><div className="eyebrow">SEU FOCO ATUAL</div><h2>{c.name}</h2><p>{c.deadline ? `Conteúdo até ${nice(c.deadline)}` : 'Defina seus horários e a data da prova para personalizar o plano.'}</p><button className="hero-link" onClick={() => open('config')}>Ajustar meu planejamento ↗</button></div><div className="deadline"><span>ATÉ A PROVA</span><strong>{c.examDate ? Math.max(0, Math.ceil((Date.parse(c.examDate) - Date.parse(now)) / 86400000)) : '—'}<small>dias</small></strong><span>{nice(c.examDate)}</span></div></section>
 <div className="stats"><Card><span className="metric-icon purple">◷</span><label>ESTUDO NA SEMANA</label><strong>{hours(spent)}</strong><small>de {hours(available)} planejadas</small><progress value={Math.min(spent, available)} max={available || 1}/></Card><Card><span className="metric-icon green">✓</span><label>EDITAL CONCLUÍDO</label><strong>{c.topics.length ? Math.round(completed / c.topics.length * 100) : 0}<em>%</em></strong><small>{completed} de {c.topics.length} assuntos</small><progress value={completed} max={c.topics.length || 1}/></Card><Card><span className="metric-icon amber">↻</span><label>REVISÕES PARA AGORA</label><strong>{due.length}</strong><small>{due.filter(r => r.date < now).length} atrasadas · sem penalizar acertos</small><button className="text-link" onClick={() => setTab('revisoes')}>Abrir revisões →</button></Card><Card><span className="metric-icon blue">↗</span><label>REGISTROS DE ESTUDO</label><strong>{c.logs.length}</strong><small>{hours(c.logs.reduce((n, l) => n + l.minutes, 0))} de dedicação total</small><button className="text-link" onClick={() => setTab('graficos')}>Acompanhar progresso →</button></Card></div>
 <div className="two-col"><Card><div className="section-head"><div><h2>Seu ritmo nesta semana</h2><p>Horas estudadas, de segunda a domingo.</p></div><span className="pill">Esta semana</span></div><Suspense fallback={<p>Carregando gráfico…</p>}><TimeChart data={chart}/></Suspense></Card><Card><div className="section-head"><div><h2>Próximo passo</h2><p>Prioridades para continuar.</p></div><span className="metric-icon purple">✳</span></div>{budget.slice(0, 3).map((s, i) => <div className="priority-row" key={s.id}><span className="rank">0{i + 1}</span><div><strong>{s.name}</strong><small>{s.balance > 0 ? `${hours(s.balance)} para a meta semanal` : 'Meta semanal alcançada'}</small></div><button className="icon-button" aria-label={'Estudar ' + s.name} onClick={() => open('estudo', s.id)}>↗</button></div>)}{!budget.length && <Empty>Seu próximo passo começa com a primeira disciplina.</Empty>}<p className="muted">A ordem é livre. Escolha o que funciona melhor hoje.</p></Card></div>
 </details><>{plan.recoveryPreview && <div className="notice">Seu prazo de conteúdo venceu. As sugestões abaixo são uma prévia de retomada; a data salva continua a mesma.</div>}<Card><div className="section-head"><div><h2>Plano de hoje</h2><p>Conteúdo e revisões dentro da disponibilidade.</p></div><button className="quiet" onClick={() => setTab('agenda')}>Ver cronograma ↗</button></div>{todayTasks.map((t, i) => <div className="list-row" key={i}><span className={'badge ' + (t.review ? 'amber' : 'purple')}>{t.review ? '↻' : '▤'}</span><div><strong>{t.title}</strong><small>{subject(t.subjectId)} · {t.review ? 'Revisão' : 'Conteúdo'}</small></div><span>{fmt(t.minutes)} min</span></div>)}{!todayTasks.length && <Empty>Sem tarefas alocadas hoje. Você pode descansar ou registrar um estudo livre.</Empty>}</Card></></>}
 {(['comunidade','social'].includes(tab)) && <Suspense fallback={<Card>Conectando à comunidade…</Card>}><Community mode={tab==='comunidade'?'editais':'social'} db={db} current={c} onAdopt={next=>{const ok=commit({...db,contests:[...db.contests,next],activeId:next.id});if(ok){setTab('ciclo');setMessage('Plano copiado em um novo concurso. Ajuste seu ciclo sem alterar o original.');}return ok;}}/></Suspense>}
 {tab === 'ciencia' && <Suspense fallback={<Card>Carregando base científica…</Card>}><Science /></Suspense>}
 {tab === 'planos' && <Suspense fallback={<Card>Carregando planos…</Card>}><Plans key={c.id} current={c} onActivate={next => {
                const ok = commit({ ...db, contests: [...db.contests, next], activeId: next.id });
                if (ok) {
                    setMessage('Plano criado em um novo perfil. Seus concursos e históricos anteriores foram preservados.');
                    setTab('ciclo');
                }
                return ok;
            }}/></Suspense>}
 {tab === 'ciclo' && <><CycleAllocation c={c} onChange={change}/><details className="cycle-help"><summary>Como o ciclo é calculado e ajustado?</summary><AdaptiveCycle c={c} onChange={change}/><div className="banner"><strong>Seu ciclo é flexível.</strong> {c.cycleMode === 'manual' ? 'As metas seguem as horas que você definiu. O tempo livre fica como reserva.' : 'As metas usam questões × pontos × dificuldade, com ajuste opcional por desempenho e respeito aos mínimos. Com questões incompletas, a distribuição é provisória. Matérias extras recebem o mínimo escolhido.'} Todos os métodos de estudo contam para o saldo.</div></details><Card><div className="section-head"><div><h2>Disponibilidade semanal</h2><p>{hours(available)} por semana · seus dias de descanso são respeitados.</p></div><button className="secondary" onClick={() => open('config')}>Editar horários</button></div><div className="daily">{c.daily.map((m, i) => <div key={i}><span>{weekdays[i]}</span><strong>{hours(m)}</strong></div>)}</div></Card><details className="home-details"><summary>Estimativa de questões</summary><QuestionTargets c={c} onPractice={() => setTab('perguntas')}/></details><Card><div className="section-head"><h2>Metas e saldos da semana</h2><button className="quiet" onClick={() => open('disciplina')}>＋ Disciplina</button></div>{budget.map(s => <div className="cycle-row" key={s.id}><div className="section-head"><strong><i style={{ background: s.color }}/>{s.name}</strong><span className="pill">{s.provisional ? 'Provisória · ' : ''}{fmt(s.share * 100)}%</span></div><div className="cycle-values"><span>Meta <b>{hours(s.target)}</b></span><span>Estudado <b>{hours(s.done)}</b></span><span>{s.balance < 0 ? 'Além da meta' : 'Restante'} <b>{hours(Math.abs(s.balance))}</b></span><button className="quiet" onClick={() => open('estudo', s.id)}>Registrar ↗</button></div><progress value={Math.min(s.done, s.target)} max={s.target || 1}/></div>)}</Card><details className="home-details"><summary>Gerenciar disciplinas</summary><Card><h2>Disciplinas do concurso</h2><p>Arquivar mantém assuntos e histórico. Reative quando quiser.</p>{c.subjects.map(s => <div className="list-row" key={s.id}><i style={{ background: s.color }}/><div><strong>{s.name}</strong><small>{s.questions} questões × {s.points} pontos · dificuldade {s.difficulty}/5</small></div><span className="pill">{s.active ? 'Ativa' : 'Arquivada'}</span><button className="quiet" onClick={() => open('disciplina', s.id)}>Editar</button><button className="quiet" onClick={() => change({ ...c, subjects: c.subjects.map(x => x.id === s.id ? { ...x, active: !x.active } : x) })}>{s.active ? 'Arquivar' : 'Reativar'}</button></div>)}</Card></details></>}
 {tab === 'agenda' && <><details className="home-details"><summary>Como o cronograma é calculado?</summary><div className="banner">As revisões pendentes entram primeiro, em blocos estimados de 5 a 15 minutos. Aprender assuntos novos usa até {fmt(c.contentShare * 100)}% do tempo diário; o restante fica disponível para questões e outras práticas. O prazo de conteúdo encerra apenas os assuntos novos; as revisões continuam até a véspera da prova. Registre o que fizer para atualizar o plano.</div></details><div className="actions"><button onClick={() => open('config')}>Ajustar prazo e horários</button><span className="pill">{c.examDate ? 'Até a véspera da prova' : plan.recoveryPreview ? 'Prévia de retomada · 28 dias' : c.deadline ? 'Prazo definido' : 'Prévia de 28 dias'}</span></div>{plan.recoveryPreview && <div className="notice">Seu prazo de conteúdo venceu. Esta é uma prévia de retomada {c.examDate ? 'até a véspera da prova' : 'de 28 dias'}, com o esforço restante. A data salva continua a mesma; use Ajustar prazo e horários para definir uma nova.</div>}{plan.shortage > 0 && <div className="notice error">{hours(plan.shortage)} de conteúdo ficaram fora desta previsão. Ajuste disponibilidade, estimativas ou data de conclusão.</div>}{plan.unscheduledReviews > 0 && <div className="notice">{plan.unscheduledReviews} revisões ficaram sem encaixe na disponibilidade.</div>}{plan.truncated && <div className="notice">Prévia limitada a 730 dias. O déficit considera apenas esse horizonte.</div>}{!plan.days.length && <Empty>O prazo já passou ou o início está depois do prazo. Ajuste as datas do concurso.</Empty>}<div className="agenda-grid">{plan.days.slice(0, 7).map(d => <Card key={d.date}><div className="section-head"><strong>{nice(d.date)}</strong><span className="pill">{hours(d.capacity)}</span></div><small>{hours(d.used)} registradas · {hours(d.freeMinutes)} livres</small>{d.practiceReserve > 0 && <small>O tempo livre inclui {hours(d.practiceReserve)} da reserva para questões e outras práticas.</small>}{d.tasks.map((t, i) => <div className="agenda-task" key={i}><span className={t.review ? 'review-dot' : 'content-dot'}/><div><strong>{t.title}</strong><small>{subject(t.subjectId)} · {fmt(t.minutes)} min · {t.review ? 'Revisão · duração estimada' : 'Conteúdo'}</small></div></div>)}{!d.tasks.length && <p className="muted">{d.capacity === 0 ? 'Descanso' : 'Sem nova tarefa alocada'}</p>}</Card>)}</div>{plan.days.length > 7 && <details className="home-details"><summary>Ver próximos dias</summary><div className="agenda-grid">{plan.days.slice(7, 84).map(d => <Card key={d.date}><div className="section-head"><strong>{nice(d.date)}</strong><span className="pill">{hours(d.capacity)}</span></div><small>{hours(d.used)} registradas · {hours(d.freeMinutes)} livres</small>{d.practiceReserve > 0 && <small>O tempo livre inclui {hours(d.practiceReserve)} da reserva para questões e outras práticas.</small>}{d.tasks.map((t, i) => <div className="agenda-task" key={i}><span className={t.review ? 'review-dot' : 'content-dot'}/><div><strong>{t.title}</strong><small>{subject(t.subjectId)} · {fmt(t.minutes)} min · {t.review ? 'Revisão · duração estimada' : 'Conteúdo'}</small></div></div>)}{!d.tasks.length && <p className="muted">{d.capacity === 0 ? 'Descanso' : 'Sem nova tarefa alocada'}</p>}</Card>)}</div></details>}{plan.days.length > 84 && <p className="muted">Exibindo os primeiros 84 dias. O cálculo de déficit considera todo o horizonte informado, limitado a 730 dias.</p>}</>}
 {tab === 'edital' && <>{c.planOrigin && <Card><h2>Origem deste planejamento</h2><p>{c.planOrigin.edition}</p><div className="actions">{c.planOrigin.sources.filter(url=>/^https?:\/\//i.test(url)).map((url,i)=><a className="button secondary" href={url} target="_blank" rel="noopener noreferrer" key={url}>Referência {i+1} ↗</a>)}</div><small>Conteúdo e estimativas são editáveis. Os links de publicações da comunidade dependem de o autor manter a publicação disponível.</small></Card>}<div className="toolbar"><input aria-label="Buscar assunto" placeholder="Buscar no edital…" value={search} onChange={e => setSearch(e.target.value)}/><select aria-label="Filtrar disciplina" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Todas as disciplinas</option>{c.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><button disabled={!active.length} onClick={() => open('assunto')}>＋ Novo assunto</button></div><Card>{c.topics.filter(t => (!filter || t.subjectId === filter) && t.title.toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(t => <div className="list-row topic" key={t.id}><input type="checkbox" aria-label={'Concluir ' + t.title} checked={t.done} onChange={e => change({ ...c, topics: c.topics.map(x => x.id === t.id ? { ...x, done: e.target.checked, reviewAnchor: x.reviewAnchor !== undefined ? (e.target.checked ? now : '') : undefined, started: x.started || (e.target.checked ? now : ''), initialInterval: x.reviewAnchor !== undefined ? c.reviewDays : x.initialInterval } : x) })}/><div><strong className={t.done ? 'strike' : ''}>{t.title}</strong><small>{subject(t.subjectId)} · {fmt(t.hours)} h estimadas · {t.started ? 'Iniciado em ' + nice(t.started) : 'Não iniciado'}</small>{t.notes && <small className="notes">{t.notes}</small>}</div><button className="quiet" onClick={() => open('assunto', t.id)}>Editar</button></div>)}{!c.topics.length && <Empty>Adicione os assuntos do seu edital. Cada um terá estimativa, checklist e revisão.</Empty>}</Card></>}
 {tab === 'revisoes' && <><details className="home-details"><summary>Como funcionam as revisões?</summary><div className="banner">O sistema calcula sua próxima revisão após cada resultado. Erros antecipam a retomada; dificuldades limitam o crescimento. Atrasos não contam como erro. As sugestões respeitam a data da prova. <button className="quiet" onClick={() => open('config')}>Ver padrão e personalizar</button></div></details><Card><h2>Suas revisões</h2>{reviewed.map(r => <div className="list-row" key={r.topic.id}><span className={'badge ' + (r.date <= now ? 'amber' : 'green')}>↻</span><div><strong>{r.topic.title}</strong><small>{subject(r.topic.subjectId)} · próxima: {nice(r.date)} · intervalo {r.interval} dia(s){c.examDate && r.date >= c.examDate ? ' · após a data da prova' : ''}</small></div><span className="pill">{r.date < now ? 'Atrasada' : r.date === now ? 'Hoje' : 'Agendada'}</span><button disabled={c.reviews.some(x => x.topicId === r.topic.id && x.date === now)} onClick={() => open('revisao', r.topic.id)}>Revisar</button></div>)}{!reviewed.length && <Empty>Registre um estudo vinculado a um assunto para iniciar suas revisões.</Empty>}</Card><details className="home-details"><summary>Histórico de revisões ({c.reviews.length})</summary><Card>{[...c.reviews].reverse().slice(0, 50).map(r => <div className="list-row" key={r.id}><div><strong>{c.topics.find(t => t.id === r.topicId)?.title}</strong><small>{nice(r.date)} · próximo intervalo: {r.interval} dia(s) · {['Reaprender', 'Difícil', 'Bom', 'Fácil'][r.rating] || 'Importada'}</small></div><span>{r.questions ? `${r.correct}/${r.questions} acertos` : 'Sem questões'}</span></div>)}</Card></details><details className="home-details"><summary>Agenda e lembretes</summary><Suspense fallback={<Card>Carregando agenda…</Card>}><CalendarPanel key={c.id} c={c} onChange={change}/></Suspense></details></>}
 {tab === 'graficos' && <><div className="two-col"><Card><h2>Estudado × disponível</h2><Suspense fallback={<p>Carregando gráfico…</p>}><TimeChart data={chart}/></Suspense></Card><Card><h2>Conclusão por disciplina</h2>{c.subjects.map(s => { const ts = c.topics.filter(t => t.subjectId === s.id), n = ts.filter(t => t.done).length; return <div className="cycle-row" key={s.id}><div className="section-head"><strong>{s.name}</strong><span>{n}/{ts.length}</span></div><progress value={n} max={ts.length || 1}/></div>; })}</Card></div><QuestionProgress c={c}/><details className="card history-details"><summary>Histórico de estudo · {c.logs.length} {c.logs.length === 1 ? 'registro' : 'registros'}</summary><p>Desfazer remove o registro e recalcula as metas. Não altera o checklist nem apaga revisões já registradas.</p>{[...c.logs].reverse().slice(0, 100).map(l => <div className="list-row" key={l.id}><div><strong>{subject(l.subjectId)} · {l.method}</strong><small>{nice(l.date)} · {l.topicId ? c.topics.find(t => t.id === l.topicId)?.title : 'Estudo geral'} · {fmt(l.minutes)} min</small></div><button className="quiet" onClick={() => {
                    if (l.id.startsWith('practice-') || l.id.startsWith('legacy-practice-')) {
                        setTab('perguntas');
                        return;
                    }
                    if (confirm('Desfazer este registro de estudo?')) {
                        const logs = c.logs.filter(x => x.id !== l.id);
                        change({ ...c, logs, topics: c.topics.map(t => t.id === l.topicId ? { ...t, started: logs.filter(x => x.topicId === t.id).map(x => x.date).sort()[0] || '' } : t) });
                    }
                }}>{l.id.startsWith('practice-') || l.id.startsWith('legacy-practice-') ? 'Ver tentativas' : 'Desfazer'}</button></div>)}</details></>}
 {tab === 'perguntas' && <Suspense fallback={<Card><p>Carregando banco de perguntas…</p></Card>}><Learning key={c.id} c={c} onChange={change} onNewTopic={() => setTab('edital')}/></Suspense>}
 {tab === 'registros' && <><div className="toolbar"><select aria-label="Tipo de registro" value={recordKind} onChange={e => setRecordKind(e.target.value)}>{['Questões', 'Simulados', 'Materiais', 'Redação', 'Bem-estar', 'Retificações', 'Notas'].map(k => <option key={k}>{k}</option>)}</select><button onClick={() => open('registro')}>＋ Novo registro</button></div><Card><h2>{recordKind}</h2>{c.records.filter(r => r.kind === recordKind).slice().reverse().map(r => <article className="record" key={r.id}><div className="section-head"><strong>{r.title}</strong><span className="pill">{nice(r.date)}</span></div><small>{subject(r.subjectId)}{r.total > 0 ? ` · ${r.correct}/${r.total} acertos (${fmt(r.correct / r.total * 100)}%)` : ''}</small><p className="notes">{r.notes}</p>{/^https?:\/\//i.test(r.url) && <a target="_blank" rel="noopener noreferrer" href={r.url}>Abrir material ↗</a>}</article>)}{!c.records.some(r => r.kind === recordKind) && <Empty>Nenhum registro nesta categoria. Adicione o primeiro.</Empty>}</Card></>}
 {tab === 'dados' && <><div className="two-col"><Card><span className="metric-icon purple">⇄</span><h2>Traga seu histórico</h2><p>Importe backups 5.0, versões antigas compatíveis ou 6.0. A prévia permite conferir os concursos. Campos sem equivalente permanecem no JSON original arquivado.</p><label className="file-button">Escolher backup JSON<input type="file" accept=".json,application/json" onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                    try {
                        preview(await f.text(), f.name);
                    }
                    catch (err) {
                        setMessage(String(err));
                    }
                }
                e.target.value = '';
            }}/></label><button className="secondary" onClick={localImport}>Buscar dados 5.0 neste navegador</button></Card><Card><span className="metric-icon green">↓</span><h2>Um backup é tranquilidade</h2><p>O backup inclui todos os concursos, históricos e arquivos originais da migração. Guarde uma cópia fora do navegador.</p><button onClick={() => backup(db)}>Exportar backup completo</button><button className="secondary" onClick={() => {
                try {
                    const raw = localStorage.getItem(KEY + '-previous');
                    if (raw)
                        download('EstudaMente-6-versao-anterior.json', raw);
                    else
                        setMessage('Ainda não existe cópia anterior.');
                }
                catch (e) {
                    setMessage(String(e));
                }
            }}>Baixar versão anterior</button><button className="quiet" onClick={() => {
                try {
                    const raw = localStorage.getItem(KEY);
                    if (raw)
                        download('EstudaMente-dados-locais-originais.json', raw);
                    else
                        setMessage('Nenhum dado 6.0 armazenado.');
                }
                catch (e) {
                    setMessage(String(e));
                }
            }}>Recuperar conteúdo local bruto</button></Card></div>
 {pending && <Card className="import-preview"><h2>Prévia da importação</h2><p>Origem: {importSource}</p>{pending.contests.map(x => <div className="list-row" key={x.id}><div><strong>{x.name}</strong><small>{x.subjects.length} disciplinas · {x.topics.length} assuntos · {x.logs.length} estudos · {x.reviews.length} revisões · {x.records.length} registros · {x.questions.length} perguntas · {x.attempts.length} tentativas</small></div></div>)}<p>Os concursos atuais ficam preservados. Uma versão diferente de um concurso existente entra como cópia. Importações idênticas não se repetem.</p><div className="actions"><button onClick={() => {
                    if (commit(mergeImport(db, pending))) {
                        setPending(null);
                        setMessage('Importação concluída. Originais e dados atuais preservados.');
                    }
                }}>Confirmar e preservar dados atuais</button><button className="quiet" onClick={() => setPending(null)}>Cancelar</button></div></Card>}
 <Card><h2>Arquivos originais preservados</h2>{db.archives.map(a => <div className="list-row" key={a.id}><div><strong>{a.source}</strong><small>Importado em {new Date(a.importedAt).toLocaleString('pt-BR')}</small></div><button className="secondary" onClick={() => download(`EstudaMente-origem-${a.id}.json`, JSON.stringify(a.payload, null, 2))}>Baixar original</button></div>)}{!db.archives.length && <Empty>Os arquivos de origem aparecerão aqui após uma importação legada.</Empty>}</Card><div className="banner">Dados do HTML aberto como arquivo podem estar em uma origem diferente. Nesse caso, exporte o JSON pelo HTML antigo. Nenhuma chave antiga é apagada. Não há sincronização entre dispositivos.</div></>}
 {tab === 'legado' && <><Card><h2>Compatibilidade com os módulos antigos</h2><div className="banner">Este espaço conserva regras do HTML 5.0. Estimativas de retenção e diagnósticos do legado são experimentais e não calibrados. As correções da prática nativa não reescrevem o comportamento nem os registros desse arquivo histórico.</div><p>O banco de perguntas e a recuperação ativa já estão na aba Perguntas e prática. As ferramentas completas do HTML 5.0 — incluindo simulados antigos e recursos anteriores — continuam disponíveis em um espaço separado.</p><p><strong>Os registros deste espaço não se sincronizam automaticamente com o React.</strong> Para atualizar os módulos 6.0, use “Importar alterações do 5.0” e confirme a prévia. O concurso importado entra como uma nova versão quando houver diferenças.</p><div className="actions"><button onClick={compat}>Abrir espaço 5.0</button><button className="secondary" onClick={() => {
                try {
                    const raw = localStorage.getItem('estudamente-studio-6-compat');
                    if (raw)
                        preview(raw, 'Espaço de compatibilidade 5.0');
                    else
                        setMessage('Abra o espaço 5.0 e salve os registros primeiro.');
                    setTab('dados');
                }
                catch (e) {
                    setMessage(String(e));
                }
            }}>Importar alterações do 5.0</button><a className="button secondary" href="/legacy/EstudaMente_Studio_5_Universal.html" download>Baixar HTML 5.0 original</a></div><p className="muted">O espaço 5.0 usa uma chave própria. As chaves do HTML original permanecem intactas. A primeira abertura usa uma cópia do backup legado disponível.</p></Card>{showCompat && <iframe className="legacy-frame" title="EstudaMente 5.0 — espaço de compatibilidade" src="/legacy/compat.html"/>}{legacySnapshot && <button className="quiet" onClick={() => download('EstudaMente-compat-copia-inicial.json', legacySnapshot)}>Baixar cópia da abertura do espaço 5.0</button>}</>}
 <footer>ESTUDAMENTE STUDIO <span>6.9 · Um passo de cada vez.</span><button className="quiet" onClick={() => open('config')}>Configurar concurso</button></footer>
 </main></div>
 {modal && <div className="overlay" onMouseDown={e => {
                if (e.target === e.currentTarget)
                    setModal('');
            }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="section-head"><h2 id="modal-title">{{ concurso: 'Novo concurso', disciplina: editingSubject ? 'Editar disciplina' : 'Adicionar disciplina', assunto: editingTopic ? 'Editar assunto' : 'Adicionar assunto', estudo: 'Registrar estudo', revisao: 'Registrar revisão', config: 'Meu planejamento', registro: 'Novo registro' }[modal]}</h2><button className="icon-button" aria-label="Fechar" onClick={() => setModal('')}>×</button></div>{message && <div className="modal-notice" role="status">{message}</div>}<form key={modal + editId} onSubmit={submit}>
 {modal === 'concurso' && <label>Nome do concurso<input autoFocus name="name" required maxLength={100} placeholder="Ex.: Analista Administrativo"/></label>}
 {modal === 'disciplina' && <><label>Nome<input autoFocus name="name" required defaultValue={editingSubject?.name} maxLength={100}/></label><div className="form-grid"><label>Questões na prova<input name="questions" type="number" min="0" max="10000" step="1" defaultValue={editingSubject?.questions || 0} required/></label><label>Pontos por questão<input name="points" type="number" min="0.1" max="100" step="0.1" defaultValue={editingSubject?.points || 1} required/></label><label>Dificuldade pessoal (1–5)<input name="difficulty" type="number" min="1" max="5" step="1" defaultValue={editingSubject?.difficulty || 3} required/></label><label>Cor<input name="color" type="color" defaultValue={editingSubject?.color || colors[c.subjects.length % colors.length]}/></label></div></>}
 {modal === 'assunto' && <><label>Disciplina<select name="subjectId" required defaultValue={editingTopic?.subjectId}>{c.subjects.filter(s => s.active || s.id === editingTopic?.subjectId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Assunto<input autoFocus name="title" required defaultValue={editingTopic?.title} maxLength={250}/></label><label>Estimativa total de horas<input name="hours" type="number" min="0.1" max="1000" step="0.1" defaultValue={editingTopic?.hours || 2} required/></label><label>Notas<textarea name="notes" defaultValue={editingTopic?.notes} maxLength={5000}/></label></>}
 {modal === 'estudo' && <StudyFields c={c} selected={editId}/>}
 {modal === 'revisao' && <><p>{c.topics.find(t => t.id === editId)?.title}</p><label>Data<input name="date" type="date" defaultValue={now} max={now} required/></label><label>Como foi a recuperação?<select name="rating" defaultValue="2"><option value="0">Não lembrei · reaprender</option><option value="1">Difícil</option><option value="2">Bom</option><option value="3">Fácil</option></select></label><div className="form-grid"><label>Questões<input name="questions" type="number" min="0" step="1" defaultValue="0" required/></label><label>Acertos<input name="correct" type="number" min="0" step="1" defaultValue="0" required/></label><label>Minutos de revisão<input name="minutes" type="number" min="1" max="1440" defaultValue="15" required/></label></div><p className="muted">O tempo também será registrado no ciclo. Se houver questões e nenhum acerto, a revisão será registrada como Reaprender. Sem questões informadas, o resultado é sua autoavaliação. Só é permitida uma revisão por assunto em cada data.</p></>}
 {modal === 'registro' && <><label>Categoria<select name="kind" defaultValue={recordKind}>{['Questões', 'Simulados', 'Materiais', 'Redação', 'Bem-estar', 'Retificações', 'Notas'].map(k => <option key={k}>{k}</option>)}</select></label><label>Título<input name="title" autoFocus required maxLength={200}/></label><div className="form-grid"><label>Data<input name="date" type="date" defaultValue={now} max={now} required/></label><label>Disciplina<select name="subjectId"><option value="">Geral</option>{c.subjects.map(s => <option value={s.id} key={s.id}>{s.name}</option>)}</select></label><label>Questões / total<input name="total" type="number" defaultValue="0" min="0" step="1" required/></label><label>Acertos<input name="correct" type="number" defaultValue="0" min="0" step="1" required/></label></div><label>Link do material (opcional)<input name="url" type="url" placeholder="https://…"/></label><label>Notas / conteúdo<textarea name="notes" rows={5} maxLength={20000}/></label><p className="muted">Informe somente questões que ainda não foram salvas em Perguntas e prática ou em uma revisão. Registros repetidos em abas diferentes são somados. Para contabilizar tempo, registre também um estudo.</p></>}
 {modal === 'config' && <><label>Nome do concurso<input name="name" defaultValue={c.name} required maxLength={100}/></label><div className="form-grid"><label>Início<input name="startDate" type="date" required defaultValue={c.startDate}/></label><label>Data da prova<input name="examDate" type="date" defaultValue={c.examDate}/></label><label>Concluir conteúdo até<input name="deadline" type="date" defaultValue={c.deadline}/></label></div><h3>Horas disponíveis por dia</h3><div className="hours-grid">{weekdays.map((d, i) => <label key={d}>{d}<input name={'day' + i} type="number" min="0" max="24" step="0.01" required defaultValue={Math.round(c.daily[i] / 60 * 100) / 100}/></label>)}</div><ReviewSettings c={c}/><details><summary>Ajustar tempo para assuntos novos</summary><label>Tempo diário máximo para aprender assuntos novos (%)<input name="contentShare" type="number" min="0" max="100" required defaultValue={Math.round(c.contentShare * 100)}/></label><small>Inclui leitura, aula e elaboração inicial do assunto. Questões, flashcards e revisões são práticas de recuperação e não descontam essa estimativa. A reserva padrão de 25% é uma escolha de organização, editável; não uma proporção prescrita pela ciência.</small></details></>}
 <div className="modal-actions"><button className="secondary" type="button" onClick={() => setModal('')}>Cancelar</button><button type="submit">Salvar e atualizar plano</button></div></form></section></div>}
 </div>;
}
function StudyFields({ c, selected }: {
    c: Contest;
    selected: string;
}) { const [sid, setSid] = useState(selected || c.subjects.find(s => s.active)?.id || ''); return <><div className="form-grid"><label>Disciplina<select name="subjectId" value={sid} onChange={e => setSid(e.target.value)} required>{c.subjects.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Data<input type="date" name="date" defaultValue={today()} min={c.startDate} max={today()} required/></label></div><label>Assunto<select key={sid} name="topicId"><option value="">Estudo geral (sem revisão automática)</option>{c.topics.filter(t => t.subjectId === sid).map(t => <option value={t.id} key={t.id}>{t.title}</option>)}</select></label><div className="form-grid"><label>Duração em minutos<input name="minutes" type="number" min="1" max="1440" step="1" defaultValue="30" required/></label><label>Método<select name="method">{['Teoria', 'Questões', 'Revisão', 'Flashcards', 'Redação', 'Estudo'].map(m => <option key={m}>{m}</option>)}</select></label></div><label>Observações<textarea name="notes" maxLength={5000}/></label><p className="muted">Vincule um assunto para iniciar as revisões e abater o esforço restante no cronograma.</p></>; }
export default function App() { return <ChartPreferencesProvider><StudioApp/></ChartPreferencesProvider>; }
