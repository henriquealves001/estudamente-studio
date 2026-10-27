# Integração do planejamento — primeira entrega 6.4

## Correções

O prazo de concluir conteúdo passa a encerrar apenas novas tarefas de conteúdo. Se houver prova, as revisões continuam até sua véspera. O cronograma termina nessa véspera mesmo quando um backup antigo contém prazo posterior. Sem prova, mantém o prazo informado ou a prévia de 28 dias; permanece o limite de 730 dias de cálculo e 84 dias de exibição.

A seleção de conteúdo considera tanto tarefas propostas quanto todas as horas reais registradas para cada disciplina na mesma semana. O saldo reinicia na segunda-feira. Revisões vencidas continuam prioritárias e os limites diários e metas manuais continuam valendo. Revisões não encaixadas ficam explícitas.

Assuntos, perguntas e agenda externa usam a mesma regra de limite pela prova. Uma revisão que ultrapassaria a prova é antecipada à véspera, se ainda houver ao menos um dia após seu estudo. Uma sessão na véspera ou após a prova não cria nova sugestão de revisão antes da prova. Horários da agenda externa continuam sendo preferências de lembrete, não uma reserva sincronizada com a disponibilidade do cronograma.

Resultados objetivos limitam a autoavaliação: abaixo de 50% de acertos, a revisão retoma o intervalo inicial; de 50% a menos de 80%, não há expansão; a partir de 80%, a avaliação pessoal pode permitir expansão. Uma avaliação pessoal mais baixa prevalece. Esses limiares são heurísticas de produto, não resultados numéricos prescritos pelos artigos. O atraso, sozinho, não altera desempenho.

## Automático e personalização

Planos novos oferecem modo automático por padrão. A configuração automática aplica início de 1 dia, crescimento ×2 e teto de 60 dias; a próxima sugestão depende do resultado e da data da prova. A duração de 15 minutos reservada por revisão no cronograma e a reserva de 25% para práticas são estimativas organizacionais, editáveis ou a evoluir. Não existe validação empírica deste algoritmo como um todo.

Backups antigos sem `reviewMode` mantêm todos os campos e abrem na opção de personalização. Nenhum parâmetro antigo é substituído automaticamente. Escolher Automático e salvar restaura os parâmetros padrão para sugestões futuras. A data calculada pode mudar pela correção do limite da prova; intervalos e resultados históricos não são reescritos.

A antiga expressão “Parcela do dia para conteúdo” foi substituída por “Tempo diário máximo para aprender assuntos novos”, com explicação e configuração avançada recolhida. O restante não é automaticamente preenchido por sessões de questões; essa integração diária permanece no roteiro.

## Fundamentação e limites

- Dunlosky e colaboradores (2013), https://doi.org/10.1177/1529100612453266: revisão das técnicas, com apoio à prática de recuperação e prática distribuída. Não determina os valores 1/2/60, a reserva diária ou nossos limiares de acertos.
- Cepeda e colaboradores (2008), https://doi.org/10.1111/j.1467-9280.2008.02209.x: relação entre espaçamento e intervalo de retenção. Seus experimentos não constituem uma fórmula universal para todo concurso, matéria ou aluno.

A antecipação à véspera é uma restrição de prazo do produto. Não significa que concentrar revisões na véspera seja ideal. O sistema mantém a insuficiência de capacidade visível. A previsão reserva a próxima revisão conhecida, sem simular resultados futuros nem criar revisões fictícias a partir das tarefas apenas sugeridas.

## Validação

80 testes automatizados (72 anteriores e oito casos de integração): datas, limites da prova, revisão após prazo de conteúdo, esforço semanal, acertos objetivos, prática e preservação de backups. Testes não comprovam eficácia educacional. As etapas completas e pendências estão em PLANO_EVOLUCAO.md.
