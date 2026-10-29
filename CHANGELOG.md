## 6.9.1 — Clareza visual e estados iniciais

- Exibir os primeiros passos somente em Hoje, evitando repetir o mesmo cartão em outras áreas.
- Reservar o destaque de data para Hoje e mostrar “Registrar estudo” apenas nas áreas de estudo.
- Incluir orientação quando ciclo, progresso ou desempenho ainda não têm disciplinas e registros.
- Preservar o tema preto/grafite e roxo, os dados, cálculos e históricos. A revisão visual geral continua em andamento.

## 6.7 — Rotina flexível

- Revisões estimadas de 5–15 minutos, respeitando capacidade e metas manuais.
- Tempo livre e reserva identificados sem dupla contagem.
- Janela sem prova acompanha início futuro; prazo vencido oferece prévia de retomada sem alterar datas salvas.
- Avisos no painel e cronograma; oito testes novos, total 105.

## 6.6 — Métricas e ritmo de questões

- Centralizar origens de contagem entre progresso e ranking; mostrar registros sem disciplina.
- Corrigir legenda de registros de estudo e esclarecer acertos com ajuda e duplicações manuais.
- Referência de ritmo por disciplina com mediana, quartis e amostra mínima, sem alterar horas.
- Esclarecer tempo sugerido da prática; oito testes novos, total 97.

## 6.5 — Ciclo adaptativo e sequência de revisões

- Ajuste opcional por perguntas objetivas, com amostra mínima, suavização e mesma carga semanal.
- Revisões novas registram horário; erros posteriores continuam visíveis na fila.
- Planos antigos preservam preferência e registros. Nove testes novos, total 89.

## 6.4 — Planejamento integrado

- Cronograma termina antes da prova e mantém revisões após o prazo de conteúdo.
- Distribuição considera esforço real semanal; revisões e perguntas compartilham limite de data.
- Acertos objetivos limitam expansão do intervalo; padrões e fontes ficam acessíveis na configuração.
- Planos novos usam opção automática; ajustes anteriores e históricos são preservados.
- Roteiro detalhado em PLANO_EVOLUCAO.md; 80 testes.

# Alterações

## 6.1.0 — 26/10/2026

- Banco de perguntas e recuperação ativa nativos em React.
- Perguntas abertas e objetivas; gabarito objetivo gerado automaticamente.
- Exemplo, prática guiada, dica, confiança, autoexplicação e reflexão.
- Registro explícito de sem ajuda / com ajuda / erro.
- Integração das tentativas com ciclo, cronograma de revisão, tempo e gráficos sem criar contagens agregadas duplicadas.
- Agendamento por pergunta; erros não escondidos por acertos em outras perguntas do mesmo assunto.
- Histórico com enunciado e gabarito preservados nas novas tentativas.
- Arquivamento reversível de perguntas e rascunho de sessão por aba/concurso.
- Conversão de perguntas e tentativas do legado, com preservação do JSON integral.
- Atualização aditiva dos bancos 6.0 e recuperação do conteúdo antes apenas arquivado.
- Preservação dos saldos de tempo durante a conversão das tentativas.
- Exibição de tempos curtos em minutos e identificação de acertos com ajuda nos indicadores.
- 36 testes automatizados aprovados; build e lint aprovados.

Simulados completos antigos, módulos específicos de redação e bem-estar ainda contam com o espaço de compatibilidade 5.0. Não há sincronização automática com esse espaço nem entre dispositivos.

## 6.3 — comunidade e competição voluntária (26/10/2026)

- Editais da comunidade: PDF, fonte oficial, plano sem histórico, busca, link e cópia independente.
- Perfil por conta ChatGPT, apelido, bio e foto personalizada.
- Rankings separados de horas e questões por dia, semana e mês, com adesão explícita e envio de totais substitutivo.
- Grupos com convite, entrada explícita, ranking exclusivo de membros, renovação do convite e saída.
- Servidor Vinext/Workers com D1/R2 e migração aditiva, sem alterar o banco local dos estudos.
- Testes de isolamento, consentimento, duplicação, empate, datas, arquivos e preservação dos planos.

## 6.8 — primeiros passos, cronômetro e prévia de horas (27/10/2026)

- Guia objetivo/disciplinas → horários → conferência, com plano próprio, catálogo ou ajuste do atual.
- Cronômetro no painel com pausa, retomada, recuperação após recarga e conferência do registro.
- Identificador estável por sessão evita registro duplicado; proteção contra gravação concorrente preserva histórico.
- Prévia de metas, diferenças por disciplina, alternativas para excesso de horas, confirmação e desfazer.
- Adaptação do cabeçalho e formulários responsivos; foco de teclado contido nos novos diálogos.
- 115 testes, lint e build aprovados; sem mudança de formato do banco, migrações sociais ou dependências.
- Limites e pendências explícitos em PLANEJAMENTO_6.8.md.

## 6.9 — gráficos e clareza (27/10/2026)

- Escolha de colunas, linhas e área compartilhada entre painel e progresso.
- Pizza, barras e faixa para distribuição do ciclo; reserva e excesso de metas explícitos.
- Preferências locais independentes do banco, recarga e atualização entre abas.
- Tabela semanal e lista de horas/percentuais, temas e gráficos sem animação.
- Ajuda avançada do ciclo e histórico de registros recolhidos.
- 121 testes, lint e build; nenhuma alteração de dependências ou formato de dados.
# Em desenvolvimento — E2 (29/10/2026)

- Integração Supabase Auth para e-mail/senha, Google, confirmação, recuperação e alteração de e-mail; ativação externa ainda pendente.
- Identidade interna e vínculo comprovado com o ChatGPT, preservando autoria antiga; sessão revogável e autorização nas APIs.
- Perfil básico privado por padrão, foto estática, prévia, consentimentos sociais e nome/foto no cabeçalho.
- Namespace por conta para estudos, cronômetro, prática, gráficos e cache de agenda; modo visitante e dados anteriores preservados.
- 11 testes de contas adicionados; detalhes, limites e pendências em `CONTAS_E2.md`. Sem publicação nesta entrega.
