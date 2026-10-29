# EstudaMente 6.9 — gráficos à sua escolha

## O que mudou

- Gráficos semanais do painel e de Meu progresso permitem escolher colunas, linhas ou área. A escolha é compartilhada entre essas duas telas. Os três formatos mostram estudado e disponível, com legenda, resumo e tabela consultável.
- O ciclo oferece pizza (anel), barras por disciplina ou faixa proporcional. Mantém horas e percentuais por disciplina em texto, incluindo metas zeradas e tempo livre/reserva. Metas acima da disponibilidade usam o total das metas como denominador e continuam com aviso de excesso; o gráfico não transforma um plano inviável em viável.
- Preferências ficam na chave `estudamente-chart-preferences-v1`, separadas do banco de estudos. Atualizar o formato não grava nenhum concurso, não muda cálculos ou histórico e não transmite dados ao servidor. Recarga preserva a escolha; abas abertas acompanham mudanças de preferência via evento de armazenamento. Se não for possível guardar a escolha, ela vale na sessão e um aviso explica a limitação.
- Ajuda de cálculo e ajustes avançados do ciclo ficam em uma seção recolhida. O histórico de estudo em Meu progresso também fica recolhido, com a contagem de registros no título. As funções continuam acessíveis.
- Visualizações vazias recebem orientação sem criar horas ou fatias fictícias. Preferências desconhecidas/corrompidas retornam aos padrões. As tabelas e listas permitem consultar os números sem depender das cores. Animações dos gráficos foram desativadas.

## Limites

A preferência é por navegador e origem, compartilhada pelos concursos locais desse navegador. Ainda não existe conta de estudos com sincronização entre dispositivos. O backup de estudo não inclui preferências de aparência nem o rascunho não confirmado do cronômetro. Alterar gráficos não altera o método científico, a distribuição de horas ou a eficácia do aplicativo.

Gráficos de tempo oferecem formatos temporais; pizza fica disponível para partes do total de horas. Progresso de checklist e acertos continuam nos indicadores próprios. Não se convertem percentuais de acertos em participação da carga semanal.

O aplicativo continua com as mesmas abas. Esta é uma simplificação das telas de ciclo e progresso, sem declarar concluída toda a revisão de navegação ou os demais pedidos do documento. Permanecem pendentes GIFs, cabeçalho pessoal com foto/nome, conta Google/histórico em nuvem, feed social e conciliação completa de concursos.

## Validação

121 testes automatizados (115 anteriores e seis novos de preferências, reserva, percentuais, excesso de horas, dados zerados e resumo de tempo). Lint, TypeScript e build. Conferência em navegador com dados sintéticos locais: troca de formato, preferência comum no painel/progresso, persistência após recarga, gráfico de distribuição e manutenção do histórico. Nenhum perfil, estudo ou total de ranking de teste publicado na comunidade.
