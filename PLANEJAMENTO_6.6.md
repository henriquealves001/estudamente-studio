# Métricas e ritmo de questões — 6.6

## Totais coerentes

`src/metrics.ts` concentra as origens usadas para contar questões: tentativas da prática, questões informadas nas revisões e registros classificados como Questões ou Simulados. O progresso local e a agregação do ranking usam o mesmo conjunto de eventos e a mesma identidade de origem.

O progresso mostra o total do concurso ativo, de todo o histórico, incluindo disciplinas arquivadas e uma linha explícita para registros sem disciplina. O ranking soma o período escolhido e os concursos da base, deduplicando cópias pelo identificador de origem. Esses recortes podem produzir valores diferentes sem divergência de cálculo. Acertos não são enviados ao ranking. Tentativas com ajuda entram nos acertos informados, com sua contagem separada; perguntas abertas são autoavaliadas.

Uma repetição é outra tentativa e conta no volume. Registros agregados podem descrever as mesmas questões já salvas em outra aba: não há identificação individual suficiente para deduplicar esse conteúdo. Nada é apagado por suposição. A tela de novo registro explica como evitar duplicação. A nova centralização conserva os totais sociais anteriores.

A métrica antes chamada Sessões registradas passou a Registros de estudo: cada tentativa gera um registro de tempo e uma sessão de prática pode conter várias tentativas. A quantidade e o tempo não foram alterados; a legenda agora corresponde à unidade real.

## Referência de ritmo

Na aba Ciclo inteligente, cada disciplina ativa mostra sua meta semanal e uma referência de quantidade para um bloco de 30 minutos. Essa referência não cria novas tarefas nem muda a disponibilidade do aluno.

Usamos até 50 perguntas objetivas diferentes, com gabarito, não arquivadas, praticadas nos últimos 90 dias. Só entram tentativas nativas com tempo válido informado e com enunciado e resposta ainda correspondentes à versão atual. Importações, perguntas abertas e registros agregados não fornecem tempo comparável por pergunta e ficam fora da amostra. Selecionamos a tentativa mais recente de cada pergunta; precisamos de ao menos 20 perguntas e três dias distintos nessa amostra. Repetir a mesma pergunta não aumenta seu tamanho.

A estimativa central é o número inteiro de questões que cabe em 30 minutos usando a mediana do tempo informado. A faixa indicativa usa os quartis de tempo: do ritmo mais lento (quartil 75) ao mais rápido (quartil 25). Não é um intervalo de confiança nem uma garantia; materiais futuros e correção podem mudar o ritmo. Se menos de uma questão couber, isso fica explícito. Quando faltam dados, exibimos Aguardando dados, sem inventar média.

Esses limites e o bloco de 30 minutos são escolhas organizacionais do produto, não valores prescritos pelos artigos. A contagem de questões não demonstra aprendizagem. O tempo de prática continua editável. A interface agora esclarece que o valor inicialmente sugerido é medido até abrir o gabarito: o aluno deve incluir correção e descontar pausas antes de salvar. Não foi introduzido um cronômetro completo nesta entrega.

## Validação

97 testes: 89 anteriores e oito novos cenários de totais, generalização por disciplina, compartilhamento de origens com ranking, deduplicação de cópias, amostra insuficiente, mediana/quartis, repetição e exclusões. Nenhum histórico foi reescrito e nenhuma migração D1 foi necessária. Roteiro e pendências em PLANO_EVOLUCAO.md.
