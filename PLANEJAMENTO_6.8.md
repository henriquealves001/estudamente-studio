# EstudaMente 6.8 — começar, estudar e ajustar

## Entrega

- Primeiros passos em três etapas: objetivo e disciplinas, horários de cada dia e prova opcional, conferência do ciclo antes de salvar. Permite modelo do catálogo, disciplinas próprias ou ajuste do plano atual. Modelos e planos próprios criam um novo concurso; ajustar o atual preserva o histórico e as configurações anteriores. A importação de backup continua acessível.
- Cronômetro no painel e atalho no cabeçalho: iniciar, pausar, retomar, concluir, conferir minutos/data/anotação e salvar no histórico. Mantém uma sessão por origem do navegador, recuperável após recarga. Pausas não contam. Trocar de concurso não atribui a sessão ao concurso errado.
- Definir horas agora abre uma prévia. Quando os mínimos/metas excedem os horários, oferece aumentar disponibilidade nos dias existentes ou reduzir valores proporcionalmente. Os sete horários permanecem editáveis; a tabela compara metas atuais e propostas por disciplina. Nada é aplicado antes de confirmar. Desfazer restaura a distribuição enquanto ela não foi alterada novamente, preservando os registros.

## Dados e limites

O formato e a chave do banco de estudo permanecem na versão 6. Não há migração destrutiva, alteração do banco social, novos segredos ou dependências. O cronômetro usa a chave local `estudamente-timer-v1`; o rascunho não entra no backup completo até virar um registro salvo. Se a leitura falhar, é possível exportar o rascunho sem sobrescrevê-lo.

O cronômetro usa o relógio do dispositivo. Continua contando em segundo plano e com a página fechada; confira uma pausa esquecida antes de registrar. Cada registro atribui o tempo à data escolhida, inclusive se atravessou meia-noite. A duração é arredondada a minutos inteiros (mínimo um), editável, e respeita o limite existente de 24 horas por dia. O relógio não mede atenção e não verifica fraude.

Uma identidade estável evita salvar duas vezes a mesma sessão. Mudanças em outra aba atualizam o rascunho; a proteção já existente contra gravação concorrente no banco impede sobrescrever um histórico mais recente. As proteções locais não equivalem a sincronização entre dispositivos.

Registros de tempo de revisão não avaliam lembrança; a avaliação continua em Revisão espaçada. Tempo de questões não inventa respostas/acertos: use Perguntas e prática, evitando registrar o mesmo tempo duas vezes. O fluxo unificado de tempo e respostas continua pendente.

O guia com disciplinas próprias cria o ciclo de horas, mas não inventa o conteúdo de um edital. Para tarefas por assunto, é necessário adicionar assuntos no checklist ou usar um modelo com conteúdo. Quantidades de questões dependem da amostra de ritmo já implementada.

## Validação

115 testes automatizados, incluindo dez novos cenários de distribuição em minutos, saturação de dias, conservação de histórico, criação independente de plano, ajuste do plano atual, pausa/retomada/recarga, idempotência do registro e gravação concorrente. TypeScript, lint e build verificados. Conferência de interface com dados sintéticos somente na prévia local; nenhum perfil ou total de ranking publicado em produção.

## Pedidos ainda pendentes

Preferência por tipos de gráficos, GIFs leves, personalização do cabeçalho pessoal, conta Google com histórico completo entre dispositivos, feed/comentários/curtidas e simplificação global da navegação. Esta entrega fecha três prioridades; não conclui todo o documento original nem todas as etapas do roteiro.
