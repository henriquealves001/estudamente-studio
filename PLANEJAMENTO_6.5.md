# Ciclo adaptativo e integração de revisões — 6.5

## Distribuição por desempenho

Planos novos nascem com ajuste adaptativo ativo. Planos antigos sem `adaptiveCycle` e perfis importados preservam a distribuição anterior; podem ativar a opção na aba Ciclo inteligente. Horas manuais nunca são alteradas pelo ajuste. A preferência faz ida e volta no backup.

Consideramos perguntas objetivas com gabarito, não arquivadas e vinculadas à disciplina. Na janela dos últimos 90 dias, selecionamos a tentativa mais recente de até 50 perguntas diferentes. A amostra precisa de pelo menos 20 perguntas diferentes e prática em três dias distintos; repetir a mesma pergunta não aumenta o tamanho da amostra. Os dias considerados pertencem a essas perguntas. Perguntas abertas e registros agregados não entram, evitando misturar autoavaliação e sobreposições entre bancos.

A taxa usada é de recuperação independente (resultado `alone`); acertar com ajuda indica necessidade de retomada. O peso da disciplina é multiplicado por `1 + 0.25 × (1 - taxa_independente) × n/(n+20)`. O resultado é limitado a um reforço inferior ou igual a 25% do peso, suavizado pelo tamanho da amostra. Não se trata de aumentar horas totais em 25%: a mesma disponibilidade é redistribuída. Pesos do edital, dificuldade pessoal, mínimos, matérias extras e horas manuais continuam respeitados.

Os limiares, janela, fórmula e teto são escolhas de produto para conter oscilações, não parâmetros extraídos diretamente de um artigo nem um algoritmo com eficácia educacional validada. Podem mudar após avaliação. O desempenho disponível cobre apenas as perguntas registradas e não demonstra domínio integral da matéria. Ausência de dados não significa baixo desempenho; não produz penalização.

## Revisões no mesmo dia

Novas revisões manuais registram `recordedAt`, além da data de estudo. Uma avaliação geral cobre tentativas anteriores do mesmo assunto; uma nova tentativa depois dela volta a orientar a revisão da respectiva pergunta. Um erro posterior não fica escondido por uma avaliação geral anterior. A próxima prática usa o intervalo efetivo da revisão geral quando esta cobriu a tentativa anterior.

A mesma lógica informa a fila por pergunta e a revisão do assunto. Perguntas ainda sem tentativa continuam novas; uma revisão geral não equivale a responder todas as perguntas. Questões arquivadas não orientam a fila ativa. Persistem as regras de resultado objetivo e limite pela prova da versão 6.4.

Revisões antigas sem horário não recebem um horário fictício. Em empate de data, a tentativa continua considerada por cautela; tentativas de dias anteriores são cobertas pela avaliação geral. Nenhuma tentativa, log, resultado ou intervalo histórico é reescrito. O cálculo de sugestões futuras pode mudar.

## Validação e pendências

89 testes (80 anteriores, nove novos) cobrem amostra insuficiente, repetições, janela, arquivo, recuperação independente, limites de horas, preferência desativada, mínimos, sequência antes/depois da revisão e preservação de backups. Lint e build devem passar antes da publicação.

O roteiro permanece em PLANO_EVOLUCAO.md. Ritmo de questões e metas estimadas, conferência das métricas de outras telas e conciliação de concursos ainda não estão concluídos nesta entrega. As regras e fontes gerais de revisão seguem documentadas em PLANEJAMENTO_6.4.md.
