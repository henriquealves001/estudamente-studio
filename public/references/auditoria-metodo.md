# Auditoria de aderência — EstudaMente

Data: 26/10/2026.

## Conclusão

**Não é correto afirmar que todo o site implementa todos os livros e estudos listados.** Há aplicação de princípios de recuperação e espaçamento, implementação parcial de outros recursos e métodos ausentes. A bibliografia de 48 referências é o catálogo da síntese original; as 9 obras foram acrescentadas depois como leituras complementares. A presença de uma citação não demonstra reprodução do protocolo ou eficácia do software.

A redação da aba científica foi corrigida para apresentar esse estado em vez de sugerir adoção integral. Não há ensaio controlado de aprendizagem com usuários do EstudaMente.

## Escopo e limite da verificação

Foram confrontados o código React, o documento original de base científica, a bibliografia e as apresentações autorais/editoriais disponíveis. Fontes primárias centrais sobre espaçamento, recuperação, feedback e modelos de memória foram reabertas. Os avisos e fórmulas experimentais do HTML legado também foram examinados, mas não foi feito teste funcional exaustivo de cada recurso do arquivo histórico. Não houve leitura integral de todos os 48 trabalhos nem dos 9 livros. Metadados bibliográficos conferidos anteriormente não são avaliação de qualidade ou replicação científica.

A auditoria verifica correspondência entre alegações e implementação e coerência de regras. Não comprova retenção, transferência, nota ou aprovação. Não acessou nem avaliou o histórico pessoal de nenhum usuário.

## Estado dos recursos

| Recurso | Situação | O que funciona | Limite |
|---|---|---|---|
| Resposta antes do gabarito | Aplicado com condições | A prática solicita uma resposta ou “Não sei” antes de revelar o gabarito e registra o uso de dica. | Perguntas abertas são autoavaliadas. O aplicativo não confere sozinho se a resposta é conceitualmente correta; um acerto não comprova retenção futura. |
| Revisões distribuídas no tempo | Aplicação parcial | As próximas revisões usam datas, resultados e parâmetros que você pode editar. Atraso não vira erro automaticamente. | Os multiplicadores são heurísticas do projeto. Não há evidência de que estes valores sejam ideais para você nem de que expansão seja sempre melhor que intervalos uniformes. |
| Feedback e autoexplicação | Aplicação parcial | O gabarito aparece após a tentativa. Há campos para explicação, correção e reflexão sobre o erro. | A explicação é opcional e depende de quem cadastrou a pergunta; o aplicativo não valida o gabarito nem a qualidade da reflexão. |
| Exemplos e retirada do apoio | Aplicação parcial | Podem ser cadastrados exemplo análogo e exercício guiado antes da tentativa principal. | Não há retirada adaptativa de etapas por proficiência. Se o exemplo revelar a resposta da pergunta principal, isso não constitui uma medição independente de retenção. |
| Confiança e desempenho | Aplicação parcial | Confiança, resposta inicial, ajuda e resultado ficam no histórico. | Não existe cálculo de calibração da confiança nem diagnóstico automático de domínio. Horas e checklist mostram atividade, não retenção medida. |
| Reaprendizagem sucessiva | Protocolo não implementado | É possível voltar a uma pergunta em outra sessão e as tentativas ficam registradas. | A sessão não exige alcançar um critério de recuperação nem o manter em várias sessões. Portanto não reproduz um protocolo completo de reaprendizagem sucessiva. |
| Intercalação de problemas relacionados | Não implementada na fila | A fila prioriza vencimento e perguntas novas; o ciclo distribui tempo entre disciplinas. | Não há classificação nem alternância controlada de tipos de problema relacionados. Alternar disciplinas no cronograma não equivale a esse procedimento. |
| Ciclo, horas e cronograma | Escolhas de organização | Disponibilidade, pesos de prova, dificuldade informada e metas manuais orientam a distribuição. | A fórmula de pesos, os blocos de conteúdo de até 30 min, a revisão de 15 min no cronograma e a estimativa inicial de 2 h por assunto nos modelos são escolhas configuráveis ou operacionais do projeto, não doses científicas demonstradas. |
| Modelo treinado de memória | Não implementado | O aplicativo registra resultados individuais e aplica regras explícitas de intervalo. | Não estima parâmetros de memória com dados, não implementa HLR ou otimização por custo e não prevê probabilidade calibrada de lembrança. Esses estudos são contexto para evolução. |
| Eficácia do próprio EstudaMente | Não demonstrada | Testes técnicos verificam cálculos, preservação dos dados e coerência das regras. | Não foi conduzido estudo controlado de retenção tardia e tempo de aprendizagem. Testes de software não comprovam ganho de aprendizagem, nota ou aprovação. |

## Problemas reproduzidos e corrigidos

Antes das correções, quatro cenários de regressão falharam. Depois dos ajustes, os quatro passaram, junto com dois testes adicionais de semântica e preservação de dados. São três problemas de produto:

1. **Não resposta convertida em acerto:** ao selecionar “Não sei” numa pergunta aberta, era possível escolher um resultado positivo depois de ver o gabarito. Agora a não resposta é registrada explicitamente e prevalece sobre essa classificação. Uma resposta literal “Não sei” em um exercício de tradução continua possível quando declarada como resposta normal, sem acionar o botão.
2. **Zero acertos e revisão Fácil:** uma revisão com questões respondidas e nenhum acerto podia aumentar o intervalo por autoavaliação. Agora o resultado objetivo impõe Reaprender e o intervalo inicial configurado. A interface explica essa prioridade. Sem questões informadas, permanece a autoavaliação.
3. **Teto de intervalo ignorado:** ao reduzir o intervalo máximo, uma nova tentativa assistida ou repetida no mesmo dia podia manter valor acima do teto. Agora todo novo intervalo é limitado à faixa configurada. Registros anteriores permanecem intactos.

Essas correções são regras conservadoras de consistência. Não transformam os números do algoritmo em parâmetros cientificamente calibrados.

## Evidências no código ativo

- `src/domain.ts:545` — Registro da resposta, ajuda, marcador de não resposta, resultado e intervalo.
- `src/domain.ts:207` — Registro manual da revisão e prioridade de zero acertos.
- `src/domain.ts:516` — Fila por vencimento/novidade/identificador, sem intercalação pedagógica.
- `src/domain.ts:160` — Pesos de prova, dificuldade e horas mínimas/manuais; não deriva um ótimo cognitivo.
- `src/domain.ts:240` — Capacidade, revisões de 15 min e blocos de conteúdo de até 30 min.
- `src/Learning.tsx:30` — Fases de exemplo/guiado/pergunta/comparação, sem retirada adaptativa de etapas.
- `src/Charts.tsx:3` — Gráficos de esforço e tempo; não medem diretamente a memória.
- `tests/science-audit.test.ts:7` — Cenários de regressão da auditoria.

As referências por linha identificam esta revisão; podem mudar com edições futuras.

## Livros: papel real

| Obra | Papel no estado atual |
|---|---|
| A Mind for Numbers · Aprendendo a Aprender | Leitura complementar · protocolo completo não verificado no aplicativo. Relaciona-se à divisão do conteúdo em assuntos, às tentativas e à possibilidade de ajustar o ritmo de estudo. |
| Make It Stick · Fixe o Conhecimento | Leitura complementar · protocolo completo não verificado no aplicativo. Dialoga diretamente com responder antes do gabarito, registrar ajuda e retomar o conteúdo em sessões separadas. |
| Mentes Geniais | Leitura complementar · protocolo completo não verificado no aplicativo. Amplia a discussão sobre estratégias para recordar; o Studio não implementa um treinamento completo de mnemônicas. |
| É Assim Que Aprendemos | Leitura complementar · protocolo completo não verificado no aplicativo. Oferece contexto para atenção, participação ativa, correção e consolidação, sem validar automaticamente as regras do aplicativo. |
| Hábitos Atômicos · Atomic Habits | Leitura complementar · protocolo completo não verificado no aplicativo. Inspiração prática para manter registros simples e uma rotina ajustável. Constância de uso não equivale, por si só, a retenção. |
| Como Aprendemos · How We Learn | Leitura complementar · protocolo completo não verificado no aplicativo. Ajuda a interpretar por que repetir exposições não é o mesmo que testar o que conseguimos lembrar. |
| Ultralearning | Leitura complementar · protocolo completo não verificado no aplicativo. Relaciona-se à autonomia para editar metas, escolher assuntos e comparar resultados. O Studio não promete reproduzir os resultados dos relatos do livro. |
| Você Não Sabe Estudar! | Leitura complementar · protocolo completo não verificado no aplicativo. Entra como leitura complementar. Os intervalos do Studio permanecem configuráveis e não são identificados como uma implementação do método do livro. |
| A Crise do Conforto · The Comfort Crisis | Leitura complementar · protocolo completo não verificado no aplicativo. Leitura de contexto para refletir sobre rotina. Não fundamenta intervalos de revisão nem metas cognitivas ou de saúde no Studio. |

Todos continuam na biblioteca, sem serem apresentados como métodos integralmente implementados. As apresentações dos autores/editoras são suficientes para fichas bibliográficas e orientação de leitura, mas não para declarar que cada capítulo foi analisado ou aplicado.

## Fontes primárias centrais do confronto

- [Carpenter, Pan e Butler (2022), revisão sobre espaçamento e recuperação](https://www.nature.com/articles/s44159-022-00089-1): fundamenta o uso desses princípios; não valida o código ou pesos do aplicativo.
- [Latimier, Peyre e Ramus (2021), meta-análise de recuperação espaçada](https://link.springer.com/article/10.1007/s10648-020-09572-8): o resumo primário compara espaçamento e sequências expansivas/uniformes; não apoia uma superioridade geral de expansão.
- [Wisniewski, Zierer e Hattie (2020), meta-análise de feedback](https://doi.org/10.3389/fpsyg.2019.03087): distinguir informação corretiva e qualidade do feedback importa. Mostrar uma alternativa correta não equivale automaticamente a uma explicação adequada.
- [Settles e Meeder (2016), modelo HLR](https://aclanthology.org/P16-1174/): prevê e ajusta memória a partir de dados; o Studio não implementa treinamento desse modelo.
- [Eglington e Pavlik (2020), agendamento e custo de prática](https://www.nature.com/articles/s41539-020-00074-4): modela desempenho e custo; o Studio registra tempo, mas não reproduz essa otimização.
- [Make It Stick, apresentação dos autores](https://www.makeitstick.com/): evidencia a abrangência das estratégias da obra, maior que os recursos atualmente implementados.

A bibliografia completa fica na aba e no download. Cada referência agora tem seu papel explicitado: princípio relacionado em uso, relação parcial ou contexto sem protocolo específico.

## Verificação técnica e preservação

- 62 testes automatizados aprovados, incluindo os 56 anteriores e 6 novos da auditoria.
- Compilação e análise de código verificadas antes da publicação.
- Campo de não resposta aditivo e opcional, compatível com backups anteriores; tipo inválido é recusado.
- Histórico existente e arquivos legados não foram reclassificados retroativamente. Novas tentativas passam pelas regras corrigidas; este relatório não certifica resultados históricos já salvos.
- Os testes de software não são evidência de eficácia educacional.

## Lacunas que permanecem

1. Intercalação controlada de tipos de problema relacionados, com desenho e avaliação próprios.
2. Reaprendizagem até critério e retorno em sessões separadas, com medição de retenção tardia.
3. Retirada de apoio conforme proficiência, com tarefas novas para verificar transferência.
4. Verificação pedagógica do banco de perguntas e explicações.
5. Comparação de confiança com desempenho e retenção, com indicadores apropriados.
6. Estudo de eficácia e eficiência do próprio aplicativo, com comparação justa de tempo e teste tardio.

Essas lacunas não foram declaradas como concluídas.

Conferência da interface com dados sintéticos em origem separada: o botão Não sei resultou em 0 acertos sem ajuda e 1 tentativa para reaprender, sem opção de reclassificação positiva; revisão marcada Fácil com 0/10 foi salva como Reaprender, com aviso e intervalo inicial. Não houve criação de eventos Google ou alteração de estudos pessoais nesses cenários.
