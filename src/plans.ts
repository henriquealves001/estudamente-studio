import catalogData from './catalog.json' with { type: 'json' };
import { emptyContest, uid, colors, today, plus } from './domain.ts';
import type { Contest } from './domain.ts';
export type CatalogTopic = {
    title: string;
    detail: string;
    area: string;
    origin: string;
};
export type CatalogSubject = {
    name: string;
    questions: number;
    points: number;
    weight: number;
    topics: CatalogTopic[];
};
export type CatalogPlan = {
    id: string;
    name: string;
    edition: string;
    description: string;
    source: {
        label: string;
        url: string;
        pdf: string;
        note: string;
    };
    examDate: string;
    allocationNote: string;
    subjects: CatalogSubject[];
};
export const catalog: CatalogPlan[] = catalogData;
export function distributeHours(hours: number, days: boolean[]) { if (!Number.isFinite(hours) || hours <= 0 || hours > 168 || days.length !== 7 || !days.some(Boolean))
    throw Error('Informe horas semanais positivas e pelo menos um dia de estudo.'); const total = Math.round(hours * 60), count = days.filter(Boolean).length; if (total > count * 1440)
    throw Error('A disponibilidade ultrapassa 24 horas em um dos dias. Selecione mais dias ou reduza as horas.'); let i = 0; return days.map(active => active ? Math.floor(total / count) + (i++ < total % count ? 1 : 0) : 0); }
export function activatePlan(planId: string, hours: number, days: boolean[], now = today()): Contest {
    const p = catalog.find(p => p.id === planId);
    if (!p)
        throw Error('Plano não encontrado.');
    const c = emptyContest(p.name);
    c.startDate = now;
    c.daily = distributeHours(hours, days);
    c.examDate = p.examDate >= now ? p.examDate : '';
    c.deadline = c.examDate ? (plus(c.examDate, -7) >= now ? plus(c.examDate, -7) : c.examDate) : '';
    c.planOrigin = { catalogId: p.id, edition: p.edition, sources: [p.source.url], createdAt: new Date().toISOString() };
    c.subjects = p.subjects.map((s, i) => ({ id: uid(), name: s.name, color: colors[i % colors.length], questions: s.questions, points: s.points, difficulty: 3, active: true, provisionalWeight: s.weight }));
    c.topics = p.subjects.flatMap((s, i) => s.topics.map(t => ({ id: uid(), subjectId: c.subjects[i].id, title: t.title, hours: 2, started: '', done: false, notes: `${t.origin}\nÁrea: ${t.area}\n${t.detail}\nEstimativa inicial de 2 horas, editável.` })));
    return c;
}
export function commonAreas(ids: string[]) { const selected = catalog.filter(p => new Set(ids).has(p.id)); const areas = [...new Set(selected.flatMap(p => p.subjects.flatMap(s => s.topics.map(t => t.area))))]; return areas.map(area => { const plans = selected.filter(p => p.subjects.some(s => s.topics.some(t => t.area === area))); const priority = plans.reduce((total, p) => { const sum = p.subjects.reduce((n, s) => n + s.weight, 0) || 1; return total + p.subjects.reduce((n, s) => n + s.weight / sum * s.topics.filter(t => t.area === area).length / Math.max(1, s.topics.length), 0); }, 0) / Math.max(1, plans.length); return { area, plans: plans.map(p => p.id), count: plans.length, score: plans.length * plans.length * priority }; }).sort((a, b) => b.count - a.count || b.score - a.score || a.area.localeCompare(b.area)); }
const foundations: Record<string, string[]> = {
    'Português': ['Compreensão e interpretação de textos', 'Tipologia textual e gêneros', 'Ortografia e acentuação', 'Classes de palavras', 'Sintaxe da oração e do período', 'Concordância nominal e verbal', 'Regência e crase', 'Pontuação e significação das palavras'],
    'Matemática': ['Conjuntos numéricos, operações e frações', 'Razões, proporções e porcentagens', 'Expressões algébricas e equações', 'Sequências numéricas', 'Geometria básica e medidas', 'Contagem e probabilidade'],
    'História do Brasil': ['Brasil Colônia e formação do território', 'Independência e Brasil Império', 'Brasil República', 'História da Bahia e movimentos sociais'],
    'Geografia do Brasil': ['Território brasileiro e regionalização', 'População e urbanização', 'Economia e fontes de energia', 'Clima, recursos naturais e questões ambientais', 'Aspectos geográficos da Bahia'],
    'Atualidades': ['Globalização e transformações sociais', 'Política, economia e sociedade no Brasil', 'Diversidade cultural e questões ambientais', 'Tecnologia e informação no mundo contemporâneo'],
    'Informática': ['Sistemas operacionais e arquivos', 'Editores de textos, planilhas e apresentações', 'Internet, intranet e correio eletrônico', 'Computação em nuvem'],
    'Direito Constitucional': ['Princípios fundamentais e direitos e garantias', 'Organização do Estado e Administração Pública', 'Militares estaduais e segurança pública', 'Constituição do Estado da Bahia'],
    'Direitos Humanos': ['Declaração Universal dos Direitos Humanos', 'Convenção Americana sobre Direitos Humanos', 'Igualdade e enfrentamento à discriminação'],
    'Direito Administrativo': ['Administração Pública e princípios', 'Poderes e deveres administrativos', 'Agentes públicos e regime do militar estadual'],
    'Direito Penal': ['Teoria do crime', 'Crimes contra a pessoa e liberdade pessoal', 'Crimes contra o patrimônio', 'Crimes contra a dignidade sexual', 'Crimes contra a Administração Pública'],
    'Direito Penal Militar': ['Crimes contra autoridade ou disciplina militar', 'Crimes contra o serviço e o dever militar', 'Crimes contra a Administração Militar']
};
export function makeFoundation(ids: string[], hours: number, days: boolean[], scope: 'all' | 'two' = 'all'): Contest {
    const unique = [...new Set(ids)], selected = catalog.filter(p => unique.includes(p.id));
    if (selected.length < 2)
        throw Error('Selecione pelo menos dois planos para comparar as bases.');
    const rows = commonAreas(unique).filter(a => a.count >= (scope === 'all' ? selected.length : 2) && foundations[a.area]);
    if (!rows.length)
        throw Error('Não há base compartilhada para essa seleção.');
    const c = emptyContest('Base geral · ' + selected.map(p => p.name.replace('PMBA · ', '')).join(' + '));
    c.daily = distributeHours(hours, days);
    c.planOrigin = { catalogId: 'foundation', edition: 'Base transversal · ' + scope, sources: selected.map(p => p.source.url), createdAt: new Date().toISOString() };
    c.subjects = rows.map((r, i) => ({ id: uid(), name: r.area, color: colors[i % colors.length], questions: 0, points: 1, difficulty: 3, active: true, provisionalWeight: r.score || r.count }));
    c.topics = rows.flatMap((r, i) => foundations[r.area].map(title => ({ id: uid(), subjectId: c.subjects[i].id, title, hours: 2, started: '', done: false, notes: `Roteiro de fundamentos, não uma equivalência integral dos editais.\nÁrea presente em: ${selected.filter(p => r.plans.includes(p.id)).map(p => p.name).join(', ')}.\nAs horas são uma sugestão pela recorrência e participação das áreas nos modelos escolhidos; ajuste ao seu diagnóstico.` })));
    return c;
}
