# EstudaMente Studio 6.9

**Revisão visual em andamento:** navegação agrupada em cinco áreas, início com a próxima tarefa e acesso ao cronômetro. O trabalho de simplificação ainda não foi concluído nem publicado integralmente; o histórico de estudo permanece local.

Escolha gráficos de tempo e distribuição de horas, com preferências por navegador e valores acessíveis em tabelas/listas. Ajuda avançada e histórico recolhidos para reduzir o texto inicial. Veja [PLANEJAMENTO_6.9.md](PLANEJAMENTO_6.9.md).

# Histórico da entrega 6.8

Primeiros passos guiados, cronômetro recuperável no painel e prévia de distribuição de horas com confirmação e desfazer. Veja [PLANEJAMENTO_6.8.md](PLANEJAMENTO_6.8.md) para comportamento, validação e limites.

# Histórico da entrega 6.7

Revisões para dias curtos, reserva explícita e prévia de retomada quando o prazo venceu. [Regras e limites](PLANEJAMENTO_6.7.md), [roteiro](PLANO_EVOLUCAO.md). Datas e históricos existentes preservados.

# EstudaMente Studio 6.6

Totais de questões com origens compartilhadas entre progresso e ranking, registros sem disciplina visíveis e referência de ritmo por bloco de 30 minutos. [Regras e limites](PLANEJAMENTO_6.6.md), [roteiro](PLANO_EVOLUCAO.md).

# EstudaMente Studio 6.5

Ciclo com ajuste conservador por desempenho e integração entre revisões manuais e prática no mesmo dia. [Regras e limites](PLANEJAMENTO_6.5.md), [roteiro e pendências](PLANO_EVOLUCAO.md). Históricos e preferências antigas preservados.

# EstudaMente Studio 6.4

Primeira entrega de integração do planejamento: prazo de conteúdo separado de revisões, limite pela prova, saldo semanal real e configuração automática explicada. Veja [PLANEJAMENTO_6.4.md](PLANEJAMENTO_6.4.md) para regras e limites e [PLANO_EVOLUCAO.md](PLANO_EVOLUCAO.md) para tarefas concluídas e pendentes. A conta social continua funcionando; históricos completos permanecem locais.

# EstudaMente Studio 6.3

React + TypeScript, com servidor Vinext/Cloudflare Workers, D1 e R2 para os recursos da comunidade. O estudo completo continua no navegador; a comunidade recebe perfis, editais publicados, grupos e totais enviados voluntariamente.

## Começar nesta versão

Use Node.js 24. Clone o repositório, abra a pasta e execute:

```sh
npm ci
npm run build
```

Prepare o banco local com a migração descrita em [COMUNIDADE.md](COMUNIDADE.md) e inicie `npm run dev`. O manifesto local é criado a partir de `hosting.example.json`, sem credenciais ou vínculo automático com o Site de produção. Na prévia loopback, Entrar com ChatGPT simula um usuário de teste. A produção usa a identidade da hospedagem.

Para continuar com os dados que já existem no navegador, mantenha protocolo, domínio e porta ou importe seu backup JSON. **Não apague a chave de armazenamento para atualizar.** A chave e o formato do banco de estudo permanecem versão 6.

## Comunidade e rankings

- Editais da comunidade: publicação de PDF e plano, fonte oficial, busca, compartilhamento por link e adoção em novo concurso.
- Perfil: apelido, bio e foto personalizada, identificado pela conta ChatGPT.
- Rankings: horas e questões em listas separadas, com filtros de dia, semana e mês, no fuso de Brasília. Participação opcional; o envio dos totais é manual e substitutivo.
- Grupos: convites, entrada explícita, ranking restrito a membros, renovação de convite e saída.
- Preservação: o plano publicado usa uma lista de campos permitidos e exclui notas, respostas, disponibilidade e histórico. A cópia começa sem conclusões.

Consulte [COMUNIDADE.md](COMUNIDADE.md) para fluxos, armazenamento, regras de contagem e limites. Não há antifraude, moderação administrativa completa, extração automática de assuntos do PDF ou sincronização do histórico completo entre dispositivos nesta entrega. Quantidade de horas/questões não mede aprendizagem.

## Verificação e colaboração

```sh
npm run lint
npm test
npm run build
```

72 testes passaram, incluindo 10 cenários da comunidade. Build e lint também foram verificados. A auditoria de dependências ficou sem achados altos ou críticos; permanecem 8 achados moderados em dependências transitivas, documentados em VALIDACAO.md. Não há dados pessoais, credenciais nem registros de demonstração incluídos no código.

[CONTRIBUTING.md](CONTRIBUTING.md) orienta a colaboração; [ROADMAP.md](ROADMAP.md) registra os próximos trabalhos. Mudanças no GitHub não publicam automaticamente na hospedagem Sites.

---

# Histórico e documentação das versões 6.0–6.2

As seções abaixo descrevem entregas anteriores. Para instalação e armazenamento atuais, prevalecem as instruções 6.3 acima.

# EstudaMente Studio 6.2

Para colaboração: consulte **CONTRIBUTING.md**, **ROADMAP.md** e **GUIA_GITHUB.md**. O pacote para GitHub contém código e documentação; estudos pessoais continuam no armazenamento de cada navegador.

Aplicativo local de estudos em React + TypeScript + Vite, com Recharts e interface responsiva. A base 6.0 foi reconstruída a partir do **HTML EstudaMente Studio 5.0 Universal encontrado no computador** e do projeto React/TypeScript inicial. O ZIP 6.0 mencionado na conversa anterior não estava disponível; a versão 6.1 continua a base 6.0 reconstruída e entregue nesta conversa, agora com banco de perguntas e recuperação ativa nativos em React.

## Começar

1. Extraia o ZIP em uma **pasta nova**. Mantenha sua pasta e seu HTML antigos guardados.
2. Use Node.js **22.18 ou superior** (Node 24 também funciona).
3. No terminal, dentro da pasta `estudamente-studio-6`, execute:

```sh
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite. O projeto antigo em `~/estudamente` não foi substituído por esta entrega.

Para conferir e abrir a versão de produção:

```sh
npm run build
npm run preview
```

O diretório `dist/` já contém a compilação validada. Sirva-o por HTTP; não abra `dist/index.html` por duplo clique. A aplicação usa caminhos na raiz do servidor. Para hospedar em uma subpasta, ajuste o `base` do Vite e os links de compatibilidade.

Se já usa a prévia desta conversa em `127.0.0.1:5175`, mantenha esse endereço para continuar com os mesmos dados. Para iniciar o projeto extraído nessa porta, encerre primeiro o servidor que a estiver usando e execute:

```sh
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

## Novidades da versão 6.2

- Aparência clara, escura ou conforme o sistema, com preferência local persistente.
- **Ciclo → Definir horas** abre a configuração de mínimos no modo inteligente ou metas exatas no modo manual. Aceita horas decimais (1,5 = 1 h 30 min), convertidas para minutos. Matérias extras podem receber horas mesmo sem aparecer na prova. O restante manual fica livre, sem redistribuição automática.
- Um gráfico único mostra horas e percentuais por disciplina, além da reserva. A configuração bloqueia metas acima da disponibilidade; se reduzir a disponibilidade depois, um aviso mantém os mínimos visíveis sem reduzi-los silenciosamente.
- Metas personalizadas também limitam os blocos sugeridos pelo cronograma em cada semana, considerando o tempo registrado. Matérias com meta zero não recebem blocos; horas extras não concluem o checklist automaticamente. Como o cronograma também respeita o tempo de conteúdo e o prazo, uma meta não garante que todo o edital caiba.
- **Planos pré-programados**: GCM Firmino Alves (001/2026), PMBA Soldado (referência histórica SAEB/05/2022) e PMBA Oficial/CFO (referência histórica PM/BM 001-CG/2024, prova 2025). Cada ativação cria novo perfil com IDs próprios; não substitui concursos existentes nem transfere conclusões.
- Ajuste horas/dias antes de ativar; depois edite o ciclo, disciplinas, assuntos e datas normalmente. Estimativas iniciais de 2 horas por unidade são editáveis e não representam duração oficial de aprendizado.
- Comparação de áreas e criação de **base geral**, transversal a todos os modelos selecionados ou ampliada a pelo menos dois. É uma sugestão de fundamentos e distribuição por recorrência/participação, sem previsão de futuros editais e sem afirmar equivalência completa de programas.
- Revisões com horário, fuso, duração, prévia e arquivo `.ics` com alarme; botão por revisão para o Google Agenda. A conexão direta OAuth e atualização de eventos estão implementadas, mas exigem configurar o ID público do aplicativo. Veja **GOOGLE_AGENDA.md**. Não há sincronização contínua em segundo plano.

### Editais e origem dos planos

Os PDFs de referência acompanham o projeto em `public/references/` e podem ser abertos no catálogo. Os arquivos originais do computador não foram alterados.

- **GCM**: arquivo fornecido `edital_de_concurso_publico_n_001_2026_1706215.pdf`. O quadro de nível médio contém 10 questões por disciplina com pontos 4/3/3: Português, Matemática e Conhecimentos Gerais. As 122 unidades são desdobramentos pedagógicos herdados do planejamento anterior. O modelo novo corrige as métricas; perfis já existentes não são modificados automaticamente.
- **PMBA Soldado**: [página oficial do concurso 2022](https://www.ba.gov.br/bombeiros/concursos/curso-de-formacao-de-soldado-cfsd-2022), com o edital SAEB/05/2022, anexo da Polícia Militar. São 12 disciplinas/87 unidades. O edital define 50 questões gerais e 30 específicas, sem contagem individual por disciplina; as questões individuais permanecem em zero e as proporções são sugestões provisórias explicitadas no catálogo.
- **PMBA Oficial**: [edital oficial UNEB](https://cfopmbm2024.uneb.br/documentos/Edital_CFOPM-BM-2025-DOE.pdf), programa CFOPM, sem misturar o programa de Bombeiros. São 6 disciplinas/103 unidades, com contagens 20/5/10/5/20/20 para Português/Inglês/Matemática/Informática/Ciências Humanas/Direito. As disciplinas agregadas são detalhadas por área no checklist.

PMBA usa edições históricas como referência de preparação, sem preencher data de uma nova prova. Banco do Brasil e INSS não foram incluídos nesta etapa. O catálogo não constitui acompanhamento automático de retificações: confira a edição e eventuais atualizações no organizador antes de usar para uma seleção específica.

### Atualizar para 6.2 sem substituir seus dados

Faça backup JSON no endereço em que estuda antes de atualizar. O formato de dados continua versão 6; os campos de horas, origem e agenda são aditivos. Tema e vínculo OAuth são preferências locais separadas. A carga de backups antigos não grava sobre o original e os registros arquivados permanecem disponíveis.

A memória do navegador é separada por **protocolo, domínio e porta**. Abrir o mesmo projeto em outro endereço pode mostrar uma base vazia; importe seu backup na nova origem. O ZIP contém código/documentação e referências públicas, sem dados pessoais do navegador e sem credenciais. O histórico antigo permanece no endereço original até você removê-lo.

## Novidades da versão 6.1

A aba **Perguntas e prática** traz o banco e o estudo por recuperação ativa para o React:

- perguntas abertas e objetivas de 2 a 6 alternativas, com gabarito e explicação;
- edição, arquivamento e reativação sem apagar as tentativas;
- exemplo análogo e exercício guiado opcionais antes da tentativa independente;
- resposta registrada antes da exibição do gabarito; opção “Não sei”;
- dica marcada como ajuda, impedindo classificar a tentativa como independente;
- classificação explícita nas perguntas abertas; correção pelo gabarito nas objetivas;
- confiança, correção, autoexplicação, categoria de erro, observações e tempo ajustável;
- fila por assunto/disciplina, perguntas novas, vencidas ou com erros/ajuda, até 50 por sessão;
- rascunho por concurso na própria aba, recuperável após recarregar ou trocar de tela;
- histórico com cópia do enunciado e gabarito usados em cada tentativa nativa;
- importação de perguntas, exemplos, etapas guiadas, alternativas, fontes, tentativas e reflexões antigas.

### Atualizar de 6.0 para 6.1

Exporte um backup do 6.0 antes de trocar os arquivos. Extraia a nova versão em uma pasta separada e use **a mesma origem do navegador** (protocolo, endereço e porta) se quiser continuar lendo o armazenamento existente. Não troque `localhost` por `127.0.0.1` esperando compartilhar os dados: são origens distintas.

A chave principal e a versão do banco continuam compatíveis com o formato 6. O leitor acrescenta os campos novos sem excluir os anteriores. Se o backup legado integral já estiver arquivado dentro do banco 6.0, a atualização tenta recuperar dele as perguntas e tentativas para os concursos correspondentes, incluindo cópias preservadas. Edições nativas existentes são mantidas. Sem esse arquivo de origem, importe o JSON antigo normalmente.

A primeira leitura prepara a atualização em memória. A próxima alteração salva usa a cópia anterior de segurança; não reescreve o armazenamento só por abrir a página. Não houve importação de histórico pessoal nesta entrega: os dados conferidos no navegador são demonstrativos.

### Como praticar

1. Cadastre disciplinas e assuntos em **Edital e checklist**, ou importe um backup.
2. Em **Perguntas e prática**, cadastre perguntas ligadas aos assuntos.
3. Escolha filtros e inicie uma sessão.
4. Tente responder antes de comparar; use a dica quando precisar.
5. Confira o gabarito e indique o resultado nas perguntas abertas.
6. Registre sua reflexão, ajuste o tempo se houve pausa e salve.

Salvar acrescenta uma tentativa e um registro de tempo com vínculo entre si. Não cria outro registro agregado de questões nem uma segunda revisão com os mesmos acertos. O tempo entra no ciclo e nos gráficos como **Questões**, sem descontar a estimativa de conteúdo teórico do assunto e sem concluir o checklist automaticamente.

Cada pergunta tem seu próprio intervalo: erro reinicia no mínimo, ajuda reduz ou mantém, e acerto independente em um dia posterior aumenta até o teto. Repetir acertos no mesmo dia não multiplica o intervalo. A tela de revisões do assunto usa a pergunta com vencimento mais próximo entre as praticadas desde a revisão manual mais recente; um acerto em outra pergunta não esconde um erro pendente. Os acertos com ajuda são contados como acertos e identificados separadamente; isso não equivale a domínio independente.

O rascunho fica em `sessionStorage`, por concurso e por aba. Ele não é parte do backup JSON e pode desaparecer ao fechar a aba/navegador. Salve as tentativas antes de sair. As tentativas confirmadas ficam no banco principal. Encerrar a sessão pode descartar apenas o rascunho atual, com confirmação quando existe resposta/observação; o histórico salvo é mantido.

## O que funciona em React

- **Concursos independentes:** crie concursos, alterne entre eles e preserve seus históricos separados.
- **Disciplinas livres:** nome, cor, questões, pontos, dificuldade; arquivamento e reativação sem excluir assuntos ou histórico.
- **Ciclo inteligente flexível:** metas por questões × pontos × dificuldade. Quando as quantidades de questões não estão completas, a distribuição provisória usa dificuldade e, quando disponíveis, as proporções antigas do ciclo; o aviso identifica metas provisórias. Você estuda na ordem que preferir.
- **Horas por dia:** de segunda a domingo, incluindo dias de descanso. A meta semanal resulta da soma da disponibilidade diária.
- **Estudo integrado:** tempo, disciplina, assunto opcional, método e notas. Registros atualizam saldo semanal, esforço restante, gráficos e início da revisão. Um estudo geral sem assunto contabiliza horas, mas não cria revisão de um assunto.
- **Cronograma recalculado:** parte do esforço ainda não registrado em cada assunto e da capacidade diária restante. Revisões previstas entram antes do conteúdo; o conteúdo respeita a parcela diária configurada. Assuntos concluídos deixam a fila de conteúdo. Revisões sem encaixe e carga que não cabe no prazo são exibidas explicitamente.
- **Checklist:** assuntos, busca, filtro por disciplina, estimativas editáveis, notas e conclusão reversível. Estudar não marca um assunto como concluído automaticamente.
- **Revisão espaçada:** intervalo inicial, crescimento e teto configuráveis; avaliação real de recuperação; acertos; histórico; registro de minutos no ciclo; exportação `.ics`.
- **Gráficos:** horas por dia, comparação com disponibilidade, conclusão por disciplina e acertos de questões, simulados e revisões.
- **Biblioteca e registros:** questões, simulados, materiais com link, redação, bem-estar, retificações e notas. Questões e simulados com disciplina alimentam o gráfico de acertos. Essas categorias têm formulário de registro comum; tempo de estudo é registrado em uma sessão própria.
- **Modelo GCM:** 122 assuntos extraídos do HTML 5.0, adicionados em um novo concurso. O modelo não é atualização oficial de edital; confira datas, questões e conteúdo da sua prova.

## Migrar com cuidado

### Antes de importar

Abra o EstudaMente antigo e exporte seu backup JSON. Se usa vários perfis, prefira a exportação de **todos os perfis**. Guarde esse arquivo fora do navegador.

O HTML normalmente guarda dados no navegador, e não dentro do próprio arquivo HTML. Abrir a versão nova em outro endereço não transfere esse armazenamento automaticamente.

### Importação

1. No Studio 6.2, entre em **Dados e migração**.
2. Escolha seu arquivo JSON, ou use **Buscar dados 5.0 neste navegador** quando o armazenamento estiver na mesma origem.
3. Confira os concursos e as contagens na prévia.
4. Confirme para importar mantendo os concursos atuais.
5. Confira a aba Edital, os registros, as horas e as revisões.
6. Exporte um backup completo do 6.2.

A importação aceita o banco antigo com `gcm`, os concursos do 5.0, o pacote `estudamente-all-profiles-v2` e backups nativos 6.0, 6.1 e 6.2. Formatos não reconhecidos são recusados antes de gravar. Se algum perfil de um pacote estiver inválido, o pacote é recusado integralmente para evitar uma migração parcial silenciosa.

### Preservação e diferenças

- As chaves antigas de armazenamento **não são apagadas ou sobrescritas pelo React**.
- O JSON legado completo fica em **Arquivos originais preservados**, inclusive campos ainda não convertidos para componentes React.
- A exportação 6.2 inclui todos os concursos e esses arquivos de origem.
- Uma importação idêntica é ignorada. Se o mesmo concurso nativo existir com conteúdo diferente, a importação entra como uma cópia. Um backup legado alterado também entra como outra versão de concurso; não há fusão automática de históricos conflitantes.
- Saldos semanais antigos de quadrados do ciclo viram registros agregados somente na parte que excede os registros detalhados daquele período e disciplina. Ao converter tempo de tentativas, essa parte é retirada do saldo agregado antes de virar registro de questões, evitando duplicação de horas. Registros de teoria continuam independentes.
- Tentativas de perguntas antigas removidas podem permanecer sem vínculo de pergunta, quando o assunto ainda é identificável. O formato antigo não guardava versões históricas de gabarito: os registros importados usam a resposta disponível no backup, e o JSON bruto permanece arquivado.
- Registros legados com referências/datas inválidas não entram nos cálculos; continuam disponíveis no JSON original arquivado. Confira a prévia e as contagens antes de aceitar.
- Os estados `Estudado` e `Dominado` do 5.0 entram como concluídos. `Em estudo` permanece pendente.
- Assuntos GCM importados preservam a conclusão como marco de revisão e os intervalos calculados pelo 5.0. Assuntos legados sem conclusão continuam aguardando o checklist. Nas novas sessões nativas, o primeiro estudo de um assunto inicia suas revisões.
- Parâmetros e estimativas são sugestões de organização, sem promessa de nota ou aprovação.

## Módulos antigos e compatibilidade

A migração é **híbrida**. Os módulos prioritários acima são nativos em React. O banco de perguntas e a recuperação ativa já são nativos na aba **Perguntas e prática**. Recursos específicos do simulado antigo, redação, bem-estar e demais ferramentas completas continuam acessíveis em **Módulos 5.0 → Abrir espaço 5.0**.

O espaço de compatibilidade:

- executa uma cópia adaptada do HTML 5.0 em um quadro;
- isola tanto a chave principal quanto as chaves de perfis, índice e perfil ativo;
- na primeira abertura, usa uma cópia de um backup legado disponível, ou dados antigos da mesma origem;
- mantém registros próprios: **não sincroniza automaticamente com o React**;
- permite trazer alterações para o React por **Importar alterações do 5.0**, com prévia e confirmação. Perguntas e tentativas antigas agora também são convertidas para o banco nativo; campos desconhecidos continuam no arquivo integral arquivado;
- oferece o HTML original intacto para download.

O original está em `public/legacy/EstudaMente_Studio_5_Universal.html`. A cópia de compatibilidade está em `public/legacy/compat.html`. Nela também foram corrigidos o contador sem data de prova e os destinos das abas Acompanhamento e Redação.

## Armazenamento, recuperação e limites

- Chave nativa: `estudamente-studio-6`.
- Cópia do estado anterior: `estudamente-studio-6-previous`.
- Antes de cada alteração, a aplicação salva a versão anterior; se essa cópia falhar, bloqueia a gravação principal.
- Falhas de quota/permissão e conflitos com outra aba são mostrados. A alteração não é anunciada como salva quando a gravação falha.
- Evite editar em duas abas ao mesmo tempo. Em caso de conflito, exporte a sessão e recarregue antes de seguir.
- Se o banco local estiver corrompido ao iniciar, a aplicação bloqueia gravações para não substituir o conteúdo. Em Dados e migração, baixe o conteúdo local bruto e a versão anterior antes de qualquer reparo. Esses arquivos podem ser examinados e importados em outra origem limpa.
- O armazenamento depende do navegador e da origem (protocolo, endereço e porta). Limpar dados do navegador pode removê-lo. **Backups JSON fora do navegador são necessários.**
- Não há conta de estudos, nuvem ou sincronização de estudos entre dispositivos. A agenda Google é opcional e sincronizada sob comando; o `.ics` é uma exportação pontual.
- A previsão calcula até 730 dias e exibe os primeiros 84 dias. Sem prazo, mostra uma prévia de 28 dias. Ela reserva apenas a próxima revisão atualmente conhecida de cada assunto; não simula resultados futuros de revisões.
- A capacidade do dia é respeitada para novas sugestões. Históricos legados acima da disponibilidade são mantidos, sem alocar novas tarefas naquele dia.
- Gráficos são carregados sob demanda para reduzir o carregamento inicial.
- As fontes web são opcionais; se indisponíveis, o navegador usa fontes locais. Após instalar as dependências, o aplicativo e os dados de estudo funcionam localmente.

## Verificação

```sh
npm run build
npm test
npm run lint
```

Os 56 testes automatizados cobrem os cálculos e a migração anteriores, além de edição/arquivamento de perguntas, correção objetiva, ajuda, filas de prática, revisão por pergunta, snapshots históricos, duplicação de tentativas/tempo e atualização aditiva dos bancos 6.0. Também cobrem mínimos, metas manuais, cronograma, catálogo, cópias independentes, fusos, ICS e API Google com respostas simuladas. Veja `VALIDACAO.md` para os resultados desta entrega.

## Estrutura

- `src/App.tsx`: telas e fluxos React.
- `src/domain.ts`: modelos tipados, cálculo, migração e persistência.
- `src/Learning.tsx`: banco de perguntas, editor, prática e rascunho de sessão.
- `src/Charts.tsx`: gráficos carregados sob demanda.
- `src/seed.json`: modelo com 122 assuntos do HTML 5.0.
- `src/style.css`: interface responsiva.
- `src/CycleAllocation.tsx`: horas manuais, mínimos e gráfico de distribuição.
- `src/plans.ts`, `src/catalog.json`, `src/Plans.tsx`: modelos e base comum.
- `src/calendar.ts`, `src/CalendarPanel.tsx`: agenda e integração Google.
- `src/ThemeToggle.tsx`: preferência de aparência.
- `tests/`: 56 testes automatizados, com execução por `all.test.ts`.
- `GOOGLE_AGENDA.md` e `.env.example`: ativação da conexão direta.
- `public/references/`: editais usados nos modelos.
- `public/legacy/`: HTML original e cópia isolada.
- `dist/`: compilação de produção.

Nenhum histórico pessoal foi embutido no ZIP. Os registros usados para conferir a interface foram sintéticos, em uma origem local separada.

## Ciência e referências

A aba Ciência e referências recupera as 48 referências comentadas de Base_cientifica_revisoes_e_estudo.docx, documento usado na construção original e citado pelo HTML 5.0. Mantém a numeração, comentários e a distinção entre consulta a texto/trechos, resumo e registro histórico na síntese original. Os links DOI foram preservados; 34 registros tiveram metadados confirmados por Crossref nesta etapa. As páginas primárias dos estudos japonês [45] e chinês [46] também foram consultadas. Os demais registros mantêm sua origem explícita, sem declarar nova leitura integral.

A biblioteca inclui as 9 obras correspondentes aos 11 títulos indicados pelo criador em 26/10/2026, agrupando A Mind for Numbers/Aprendendo a Aprender e Make It Stick/Fixe o Conhecimento. As fichas se baseiam em apresentações de autores/editoras e metadados, com catálogo bibliográfico para Mentes Geniais; não declaram leitura integral, endosso dos autores ou participação de todos esses livros na versão inicial. Livros de orientação e contexto são distinguidos dos artigos científicos originais.

A aba é informativa: não lê nem modifica históricos de estudo. Oferece busca de referências, filtro temático, busca de livros e download da bibliografia. Referências, livros e explicações carregam sob demanda. O arquivo public/references/bibliografia-estudamente.txt contém a lista completa.

## Auditoria de aderência — 26/10/2026

A aba científica agora explicita 10 verificações com status de aplicação e limites, e distingue fontes relacionadas em uso, aplicação parcial e contexto. O relatório está em `public/references/auditoria-metodo.md`. Não há adoção integral de todos os livros nem validação de eficácia do aplicativo.

Corrigidos: não resposta convertida em acerto numa pergunta aberta, expansão de intervalo com zero acertos objetivos e teto ignorado após reduzir o máximo de revisão. As mudanças afetam novos registros; preservam o histórico e acrescentam somente um marcador opcional de não resposta. Total atual: 62 testes.

### Paleta aprovada após a etapa 1

Aplicada a direção preto/grafite e roxo: superfícies neutras, ação principal roxa,
seleção e foco em lavanda, ações secundárias discretas e campos com contraste.
Tema claro correspondente preservado, assim como a preferência já salva pelo aluno.
Esta alteração é visual: não modifica dados, cálculos ou o armazenamento de estudos.
A reorganização completa das categorias continua no planejamento por etapas.
