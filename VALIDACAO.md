## Verificação 6.5

89 testes aprovados; nove novos casos em tests/adaptive-cycle.test.ts. Cobertura de ajuste conservador por desempenho e sequência de revisões no mesmo dia. Ver PLANEJAMENTO_6.5.md para critérios e limitações.

## Verificação 6.4

80 testes aprovados: oito novos casos em tests/planning-integration.test.ts verificam integração do planejamento e preservação de dados. A primeira entrega está descrita em PLANEJAMENTO_6.4.md. O histórico de verificações anteriores segue abaixo.

# Validação — EstudaMente Studio 6.2

Data: 26/10/2026.

## Resultados

- `npm run build`: aprovado, TypeScript e Vite sem erros.
- `npm test`: **56 testes aprovados**, zero falhas.
- `npm run lint`: aprovado, sem erros.
- Node 24, dependências do lockfile. O projeto exige Node >=22.18.
- Compilação servida e aberta em prévia local de produção na porta 5180: catálogo carregado, plano GCM ativado com 10 h e distribuição 4/3/3 h, gráfico visível em modo escuro. A prévia temporária foi encerrada após a verificação.
- Desenvolvimento permanece na porta 5175, com os perfis anteriores disponíveis.

## Verificação automatizada

Os 36 testes anteriores de migração, persistência, cálculo, prática, filas e recuperação de perguntas continuam aprovados. Foram acrescentados 20 testes para:

- mínimos inteligentes e redistribuição com múltiplas restrições;
- matéria extra sem questões, metas manuais, tempo livre, meta zero e arquivamento;
- disponibilidade reduzida sem redução silenciosa dos mínimos;
- limite semanal no cronograma incluindo registros existentes e virada de semana;
- backup nativo preservando horas, origem do plano e preferências de agenda; rejeição de valores inválidos;
- distribuição exata de minutos e dias de descanso;
- três planos com métricas/edições explícitas, cópias independentes e base transversal;
- horário UTC/fuso local, horário inexistente por mudança de fuso e reagendamento sem sobreposição;
- exclusão de revisões após/na prova ou de disciplinas arquivadas;
- ICS com alarme, escapes, UID estável e dobra UTF-8 de linhas;
- payloads Google sem convidados, escopo restrito, reutilização/criação de agenda;
- criação/atualização com IDs estáveis, cancelamento apenas de eventos próprios;
- paginação, conflito na criação, erro 401, progresso parcial e preservação de eventos após falha.

Os testes da Calendar API usam respostas simuladas. Não houve conexão OAuth real nem envio de eventos à conta do usuário.

## Conferência no navegador

1. Tema escuro aplicado e mantido após recarregar.
2. Ciclo manual na demonstração: 6 h para disponibilidade de 5 h recusadas com aviso; 2,5 h aceitas, gráfico com 50% para Português e 50% de reserva.
3. Demonstração retornada ao modo inteligente; perguntas, duas tentativas e registros anteriores mantidos.
4. Catálogo e matriz de áreas comuns carregados; distinção entre edições históricas e plano GCM presente.
5. Plano PMBA Soldado ativado em perfil separado com 12 disciplinas, 87 unidades e 10 h semanais. Os perfis existentes permaneceram no seletor após recarregar.
6. Na demonstração, prévia de revisão para 27/10/2026 às 19h (São Paulo) conferida. Antecedência de 20 min salva e preservada após reabrir.
7. Arquivo ICS gerado pela interface e confirmação exibida; conteúdo/estrutura verificados nos testes automatizados.
8. Referência de edição exibida no perfil ativado. Compilação de produção aberta em origem separada, com dados novos de demonstração e sem importar armazenamento pessoal.

## Editais

- GCM 001/2026: PDF fornecido, quadro de nível médio, 10 questões/pontos 4/3/3. Desdobramento pedagógico de 122 unidades preservado do planejamento anterior. Perfis antigos não foram corrigidos automaticamente.
- PMBA Soldado: SAEB/05/2022, programa da Polícia Militar; proporções individuais de estudo são sugestões porque não existe contagem individual oficial naquele quadro.
- PMBA Oficial: PM/BM 001-CG/2024, prova 2025, programa CFOPM; contagens oficiais nas seis disciplinas e conteúdo agregado detalhado.
- PDFs de referência copiados sem alterar os originais. Origem e limitações constam no catálogo/README.

## Limites e preservação

A conexão direta do Google está implementada, mas não ativada nesta entrega por ausência de cliente OAuth do aplicativo. Há alternativa pronta por ICS e formulário individual. A sincronização depende de clique com o Studio aberto; não é uma tarefa contínua em servidor. Notificações dependem das permissões do Google/dispositivo. Reimportações manuais podem duplicar eventos.

Não houve importação de um backup pessoal nesta etapa. Os testes cobrem migração e retenção dos registros com dados sintéticos; não equivalem a uma auditoria de todos os arquivos pessoais possíveis. Faça backup antes de atualizar e mantenha a mesma origem para acessar o armazenamento existente.

O ZIP inclui fontes, testes, compilação, README, guia Google e PDFs públicos. Exclui node_modules, caches, credenciais e dados de estudo do navegador. Um manifesto SHA-256 permite conferir os arquivos embalados. As versões ZIP 6.0 e 6.1 continuam preservadas.

## Atualização — Ciência e referências

A nova aba recupera 48 referências com IDs 01–48 e adiciona 9 obras com traduções agrupadas, links e proveniência. Compilação e lint aprovados após a inclusão. As fontes e livros ficam em dados estáticos; a aba não recebe o banco de estudos e não grava no armazenamento. Nenhum arquivo pessoal de estudo ou o documento DOCX original foi incluído na publicação.

Conferência visual: tema escuro, busca por Cepeda (3 resultados), combinação de filtro e busca sem resultado, clique em citação interna [19] restaurando filtros, busca de Oakley (1 de 9 obras). As edições traduzidas foram agrupadas conforme páginas da autora e editora. Os 56 testes anteriores continuam aprovados.

## Auditoria de aderência — 26/10/2026

Quatro cenários novos falharam antes das correções e passaram após os ajustes. Dois testes adicionais conferem resposta literal em tradução e ida/volta de backup com marcador opcional. Total: 62 testes aprovados. O relatório de aderência distingue os 10 critérios do produto e as lacunas não implementadas. Isso verifica coerência técnica e comunicação; não é validação educacional.

Conferência da interface com dados sintéticos em origem separada: o botão Não sei resultou em 0 acertos sem ajuda e 1 tentativa para reaprender, sem opção de reclassificação positiva; revisão marcada Fácil com 0/10 foi salva como Reaprender, com aviso e intervalo inicial. Não houve criação de eventos Google ou alteração de estudos pessoais nesses cenários.


## 6.3 — comunidade

72 testes aprovados (62 anteriores + 10 novos). Verificação de autorização entre usuários, origem/CSRF, publicação explícita, arquivos, retirada por autor, substituição de totais, saída do ranking, empates, períodos de Brasília, entrada/saída de grupos e renovação de convite. SQLite em memória executa o SQL gerado. Build inclui verificação TypeScript do cliente e servidor.

Conferência local no navegador: login simulado, perfil público com opt-in, publicação de plano e PDF, adoção em novo concurso com 7,5 horas, ranking de horas/questões e criação de grupo. Todos os dados dessa conferência são sintéticos e separados da produção.

Dependências do starter foram atualizadas para remover achados altos/críticos. A auditoria npm ainda indica 8 moderados em ferramentas de desenvolvimento e cadeias transitivas de geração de imagens/esbuild. Não houve uso de npm audit fix --force ou downgrade automático. Os achados moderados não equivalem a falha comprovada dos fluxos testados, mas permanecem pendentes de revisão/atualização compatível.
