# Etapa 2 — contas individuais

Entrega local de 29/10/2026. **Etapa em andamento: ativação externa, conferência visual e homologação real pendentes.** Não foi publicada uma nova versão do site. O responsável informou que ainda não tem projeto Supabase.

## Escolha do serviço

Supabase Auth foi escolhido para administrar senhas, confirmação de e-mail, Google, recuperação e vínculo de identidades pelo SDK oficial `@supabase/supabase-js`. O Worker mantém D1/R2; estudos completos continuam locais, sem migração automática para PostgreSQL nem sincronização de E3.

| Opção | Compatibilidade e operação | Decisão |
| --- | --- | --- |
| ChatGPT/Sites atual | Mantém autoria antiga e acesso da hospedagem; não fornece cadastro próprio por senha/Google e recuperação ao aplicativo | Preservado como acesso legado |
| Supabase Auth | SDK Web, e-mail/senha, recuperação, Google e vínculo; verificação do token via serviço de autenticação, compatível com Worker/D1 | Selecionado, aguardando projeto |
| Firebase Authentication | E-mail, senha e provedores sociais; exigiria outro SDK e integração de tokens com o Worker | Alternativa viável, não adicionada |
| Clerk | SDK e telas prontas, provedores e recuperação; operação/cobrança atreladas ao serviço | Alternativa viável, não adicionada |

Referências consultadas: [Supabase Auth](https://supabase.com/docs/guides/auth), [senhas e recuperação](https://supabase.com/docs/guides/auth/passwords), [vínculo de identidades](https://supabase.com/docs/guides/auth/auth-identity-linking), [Firebase Auth](https://firebase.google.com/docs/auth), [Clerk](https://clerk.com/pricing).

Preços consultados em 29/10/2026: Supabase Free anuncia 50.000 usuários ativos mensais, limite de dois projetos ativos e pausa após uma semana de inatividade; Pro começa em US$25/mês. E-mail de produção exige configurar envio e observar limites do provedor. Nenhum plano pago foi contratado. Conferir [preços e limites](https://supabase.com/pricing) antes da ativação; custos de e-mail e hospedagem são separados. Clerk anuncia modalidade gratuita de até 50.000 usuários retidos mensais; as métricas e limites diferem entre fornecedores.

## Ativação em desenvolvimento e produção

1. Criar um projeto Supabase para testes, habilitar e-mail/senha e confirmação de e-mail. Definir senha mínima de 12 caracteres também no provedor. Configurar SMTP para entrega confiável; testar destinatários, quotas e links antes de abrir o cadastro.
2. Copiar `.dev.vars.example` para `.dev.vars`. Preencher `SUPABASE_URL` com a origem HTTPS do projeto e `SUPABASE_PUBLISHABLE_KEY` com a chave pública `sb_publishable_...` (ou anon). O servidor rejeita chaves secretas/service_role nesse campo. Nunca colocar segredo do Google ou chave administrativa no frontend/Git.
3. Em Authentication → URL Configuration, cadastrar a origem exata da aplicação como Site URL e as URLs permitidas de retorno. Desenvolvimento: `http://127.0.0.1:5183/**` apenas no projeto de testes. Produção: `https://DOMINIO-REAL/**`, substituindo pelo domínio existente; não usar curingas de domínio em produção. O retorno preserva caminho/consulta e adiciona `account=1`, inclusive `view` e convites. Não usar `/callback`, reservado ao ChatGPT/Sites.
4. Ativar Google no Supabase. Criar/configurar o cliente Web no Google Cloud e registrar o callback **mostrado pelo Supabase**, normalmente `https://ID-DO-PROJETO.supabase.co/auth/v1/callback`. Guardar o segredo do Google apenas no provedor. Cadastrar contas de teste e cumprir a liberação exigida pelo Google. O cliente existente `VITE_GOOGLE_CLIENT_ID` serve ao Google Agenda e é independente deste login.
5. Habilitar manual linking para o botão de vínculo Google. Manter confirmação segura para alteração de e-mail (confirmação nos endereços antigo e novo). O Supabase administra duplicidade por identidade/e-mail verificado; nomes nunca vinculam usuários. Contas já criadas com outro método devem usar Entrar/Recuperar ou vínculo autenticado.
6. Gerar build, preparar D1 local e iniciar o servidor. Aplicar as migrações SQL pendentes **em ordem, uma única vez**. Em uma base nova: `0000_clear_pandemic.sql`, `0001_marvelous_agent_zero.sql`, `0002_sudden_scrambler.sql`. Em base existente aplicar somente as ainda não executadas. Comando para cada arquivo:

   ```powershell
   node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/ARQUIVO.sql
   ```

7. Na hospedagem, cadastrar as duas variáveis do Worker por seu mecanismo de ambiente, manter o gateway confiável de identidade Sites e aplicar as migrações pela publicação. Usar projeto Supabase separado para produção. Homologar antes da liberação pública.

Sem projeto configurado, a interface informa que e-mail/Google aguardam ativação e mantém acesso ChatGPT e estudo visitante. Não existe login falso por senha. Os testes automatizados simulam o serviço externo; isso não equivale a cadastro/Google/recuperação reais.

## Identidade, autorização e sessões

- `accounts` contém identificador interno, e-mail privado e perfil básico. `account_identities` vincula provedor/subject, com unicidade por identidade e por provedor/conta. Nomes não são chaves. IDs antigos ChatGPT permanecem iguais, preservando planos, grupos e autoria.
- O token Supabase é validado online em `/auth/v1/user` antes de ser aceito. A confirmação do e-mail e os claims emissor, subject, sessão e vencimento são conferidos. O servidor emite um cookie aleatório HttpOnly/SameSite=Lax/Secure no HTTPS e guarda apenas seu hash e vencimento em D1. A renovação do SDK revalida o acesso. Logout revoga a sessão e bloqueia seu token na aplicação; outro navegador com sessão independente permanece válido.
- Todas as mutações exigem a mesma origem. As operações usam o proprietário resolvido pelo servidor; o ID no corpo não concede acesso. `x-em-account` detecta operação atrasada de outra conta, sem funcionar como prova de identidade. Cookie inválido/vencido não recorre a uma identidade ChatGPT diferente.
- Os cabeçalhos `oai-authenticated-*` continuam dependendo do gateway confiável da hospedagem Sites, como no código anterior. **Não expor este Worker diretamente à Internet com cabeçalhos fornecidos pelo cliente.** Uma hospedagem diferente precisa remover/validar esses cabeçalhos na fronteira antes de uso.
- Os tokens do SDK são persistidos em armazenamento próprio do Supabase para renovação/retorno. Senhas não são armazenadas pelo aplicativo. A recuperação usa o fluxo padrão do SDK com token no retorno (implicit), permitindo abrir o link em outro navegador; entrega real e link vencido ainda precisam de homologação no projeto configurado.
- O aplicativo não oferece remoção de métodos de login, para evitar remover o último acesso. Vínculo Google depende de comprovação no provedor; a alteração de e-mail depende das confirmações do Supabase.

## Perfil, exposição e foto

Conta nova começa sem `community_profiles` nem totais. Nome, bio e foto podem ser privados. Torná-los públicos e entrar no ranking são escolhas explícitas, inicialmente desativadas; ranking exige perfil público. Salvar preferências não envia histórico. Desativar ranking remove totais enviados. Retirar perfil público exige retirar antes planos ainda publicados, preservando a autoria.

Foto JPEG/PNG/WebP até 5 MB no navegador, convertida para JPEG estático de 256×256 sem metadados. O servidor aceita assinatura JPEG/PNG até 300 KB em R2. Foto privada requer sessão do proprietário; o endpoint público somente encontra fotos associadas a perfil público. E-mail e identificador interno não integram as respostas públicas. O controle no cabeçalho mostra nome/foto da própria conta; há prévia antes de salvar.

## Histórico local e vínculo antigo

Os dados originais do visitante permanecem nas mesmas chaves. Cada conta usa namespace próprio para estudos, backup anterior, cronômetro, prática, gráficos e cache de agenda. A árvore do aplicativo é remontada ao mudar de identidade, descartando estados de tela da conta anterior. Gravações pendentes mantêm o namespace de origem. O cronômetro de uma conta nunca registra em outra.

Não há importação silenciosa. Para trazer o estudo anterior, fazer backup no modo visitante e importar o arquivo em Dados e migração com prévia. O iframe 5.0 é acessível no modo visitante, pois seu HTML usa armazenamento próprio sem identidade. O tema permanece preferência do aparelho.

Para vincular ChatGPT: entrar com e-mail/Google, comprovar acesso ao ChatGPT no mesmo navegador e confirmar o vínculo. O servidor exige ambas as provas e conserva a chave/autoria antiga. Se o espaço novo já tiver contribuições públicas, recusa a fusão para revisão; não resolve por e-mail parecido nem substitui vínculos existentes. Antes do vínculo, se há banco de estudos no espaço novo, a interface baixa um backup para importação com prévia no espaço vinculado. As chaves e rascunhos antigos continuam fisicamente preservados; não há fusão de histórico local ou nuvem nesta etapa.

## Validação e critérios pendentes

`tests/accounts.test.ts` acrescenta 11 testes de integração sobre SQLite real com adaptador D1 e serviço externo simulado: sessão verificada, privacidade inicial, cookies/hashes, token inválido/expirado, e-mail não confirmado, origem inválida, nomes iguais, duas sessões, propriedade, solicitação atrasada, grupos restritos, foto privada, retirada social, vínculo com dupla prova e recusa de fusão. `tests/community.test.ts` continua cobrindo comunidade/SQL. A suíte completa passou com 132 testes; lint e TypeScript passaram. A compilação de produção passou, com avisos do Vinext/Vite sobre sourcemaps, divisão de módulos e CSS, sem falha.

Conferência visual não realizada: a ferramenta de acesso ao navegador expirou. Antes de encerrar E2, conferir desktop/celular, teclado/foco, cadastro/confirmar e-mail, Google, troca de e-mail, vínculo Google, redefinição em outro navegador, link vencido, logout, mudança de conta e duas sessões reais. Fazer também o vínculo legado pelo gateway de homologação e verificar autores/grupos antigos.

As três migrações foram executadas no D1 local inicialmente vazio. A página inicial e os endpoints de configuração/conta/comunidade responderam HTTP 200 no servidor local, em modo visitante e sem configuração externa. Não foi feita alteração no banco de produção.

| Subetapa | Estado desta entrega |
| --- | --- |
| E2.1 | Serviço escolhido e integração/configuração modelo prontas; projeto, Google, SMTP e acesso experimental pendentes |
| E2.2 | Estrutura e contrato de propriedade concluídos e testados localmente |
| E2.3 | Fluxos implementados; ativação e testes reais pendentes |
| E2.4 | Recuperação/vínculos implementados e regras documentadas; testes reais pendentes |
| E2.5 | Perfil privado/público, foto, prévia e cabeçalho implementados; conferência visual pendente |
| E2.6 | Isolamento automatizado aprovado; cenários reais entre navegadores e recuperação pendentes |
| E2.7 | Documentação e migrações prontas; homologação e publicação pendentes |

## Reversão

Antes da publicação, exportar D1/R2 e backups dos estudos nas origens utilizadas. Reverter para a versão anterior do código se necessário, mantendo as tabelas novas e os namespaces locais preservados; não executar DROP nem apagar chaves. Não reverter só o módulo de autorização após efetuar vínculos de identidade: o código antigo não resolve vínculos Supabase. Nesse caso, manter o resolvedor de contas ou restaurar, em manutenção, o backup consistente anterior à publicação/vínculos. Registrar o instante e o conjunto restaurado. As migrações são aditivas e não apagam contribuições anteriores.

E3 não foi implementada: não existe sincronização automática do estudo nem histórico privado completo em nuvem. E2 só pode ser encerrada após configurar o serviço e atender às verificações reais acima.
