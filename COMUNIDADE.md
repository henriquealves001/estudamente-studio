# Comunidade — primeira versão funcional (6.3)

## Editais e planos

Abra **Editais da comunidade**. A consulta é pública. Para contribuir, entre com ChatGPT e crie um perfil público com apelido. No concurso que deseja compartilhar, confira disciplinas e assuntos; escolha **Compartilhar meu plano**, informe órgão, edição, fonte oficial HTTPS e envie o PDF (até 8 MB). Revise a apresentação e confirme a publicação pública.

Somente nome do plano, disciplinas, assuntos, pesos e estimativas são compartilhados. Notas pessoais, logs, respostas, conclusões, horários e histórico não integram o plano. O texto da apresentação e o PDF são publicados como fornecidos: não envie dados pessoais nem material sem autorização. O servidor não extrai automaticamente os assuntos do PDF; organize o checklist antes de compartilhar.

O link abre a prévia para qualquer visitante. **Criar minha cópia e adaptar** acrescenta um novo concurso com IDs próprios e sem histórico. Não substitui concursos existentes. A pessoa escolhe suas horas e pode alterar o ciclo depois. O autor pode retirar sua publicação; cópias já criadas continuam com seus destinatários.

As publicações são contribuições da comunidade, sem certificação oficial ou atualização automática de retificações. A sinalização registra o problema no banco; ainda não há fila administrativa de moderação ou notificações automáticas. Até essa fila existir, a administração pode examinar a tabela `community_reports` pela ferramenta de banco da hospedagem e tratar o caso.

## Perfil e rankings

O login identifica o usuário pelo cabeçalho confiável da hospedagem. O e-mail não integra as respostas públicas. Apelido, bio e foto escolhidos são públicos. A foto é recortada para 256 × 256 e convertida para JPEG no navegador, sem os metadados originais; o servidor aceita apenas assinaturas JPEG/PNG e limita o upload a 300 KB. O arquivo original escolhido tem limite de 5 MB.

A participação nos rankings é opcional e começa desativada. Depois de ativar e salvar o perfil, **Atualizar meus totais** envia data, minutos e quantidade de questões dos últimos 366 dias. A tela mostra o resumo antes do envio. Não há sincronização automática em segundo plano.

- Horas: soma dos logs, incluindo o tempo de prática já contabilizado pelo aplicativo, sem somar novamente os minutos da tentativa.
- Questões: tentativas de prática, questões registradas em revisões e totais de Questões/Simulados. Repetições contam como novas tentativas. Acertos não aumentam o volume: responder é o critério deste ranking.
- IDs repetidos em cópias de concursos são deduplicados na agregação. Registros inseridos manualmente como eventos diferentes não são identificados como duplicados por conteúdo.
- Dia: data atual em America/Sao_Paulo. Semana: segunda-feira até hoje. Mês: primeiro dia até hoje. Empates dividem posição (1, 1, 3).
- Cada envio substitui os totais daquele usuário, em transação. Não soma o mesmo envio duas vezes. Para usar outro dispositivo, importe antes o backup completo; não há fusão automática de totais de vários dispositivos.
- Servidor rejeita datas futuras/repetidas, mais de 366 dias, acima de 1.440 minutos ou 10.000 questões por dia. A interface não reduz números silenciosamente.
- Desmarcar a participação e salvar remove os totais enviados e oculta a pessoa de todos os rankings. Os estudos locais continuam intactos.

Os números são declarados pelos usuários, sem auditoria antifraude. Ranking de volume não mede aprendizagem, domínio ou mérito, e não concede prêmios. Não há usuários ou pontuações de demonstração no servidor de produção.

## Grupos com amigos

Crie um grupo e copie o convite. Quem abrir o link precisa criar perfil e confirmar a entrada; o link não adiciona ninguém automaticamente. O ranking do grupo é acessível apenas a membros, e só mostra quem optou por participar. Apelidos e fotos permanecem perfis públicos. Os convites podem ser compartilhados por membros; o criador pode renovar o link, invalidando o anterior. Há saída voluntária. Nesta versão, limites são 10 grupos criados por usuário e 100 membros por grupo; gerenciamento completo de membros e transferência da administração ainda não existem.

## Armazenamento e desenvolvimento

Estudos completos continuam no navegador, na chave e no formato 6 existentes. Esta versão não migra o histórico pessoal para a nuvem. D1 recebe perfis, publicações, totais voluntários, grupos, membros e sinalizações. R2 recebe fotos e PDFs publicados. Não há senhas próprias: a hospedagem gerencia Sign in with ChatGPT.

A aplicação mantém React e TypeScript, agora com servidor Vinext/Cloudflare Workers. **Não é mais uma distribuição apenas estática.** O build produz `dist/client`, `dist/server` e `.openai` de publicação. `npm run dev` inicia a prévia completa. Sem configuração da hospedagem, `scripts/ensure-hosting.mjs` cria um manifesto local com DB/BUCKET, sem identidade de Site ou credenciais.

A prévia local oferece login simulado apenas em loopback pelo plugin original Sites. Não use isso como autenticação fora do desenvolvimento. Na produção, os cabeçalhos de identidade são fornecidos pela hospedagem; não exponha o Worker diretamente em outro domínio sem implementar/verificar uma fronteira de identidade equivalente.

Para preparar o banco **local** depois de gerar o build:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_clear_pandemic.sql
```

Aplique cada migração pendente uma única vez e em ordem; não repita a criação das tabelas em um banco já preparado. A publicação Sites aplica as migrações de produção. SQL e metadados gerados devem acompanhar os commits; não reescreva migrações já aplicadas.

A retirada de publicação é lógica (`removed=1`), preservando a trilha de sinalizações. Arquivos retirados deixam de ser disponibilizados pelo endpoint; limpeza física e política de retenção administrativa precisam ser definidas antes de crescimento amplo. Também permanecem como próximos trabalhos: moderação, limites por frequência de requisição e controles antifraude mais fortes. Os limites de quantidade/tamanho desta entrega não substituem essas proteções.
