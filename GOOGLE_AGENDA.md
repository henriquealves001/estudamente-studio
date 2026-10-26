# Google Agenda no EstudaMente 6.2

## Usar imediatamente

Na aba Revisão espaçada, escolha horário, duração, antecedência, fuso e horizonte. Salve as preferências e confira a prévia. Cada assunto ocupa um horário, sem sobreposição na prévia; atrasos são levados ao próximo horário futuro e datas na prova ou depois ficam fora. O envio inclui a próxima revisão de cada assunto, não uma série recorrente com revisões ainda não registradas.

- **Adicionar no Google Agenda** abre o formulário de um evento. Confira e salve no Google; ajuste o aviso nesse formulário.
- **Baixar agenda com lembretes** gera `.ics` com horário UTC e alarme. No Google Agenda para computador: Configurações → Importar e exportar → Importar. Confira os avisos após importar. A interpretação dos alarmes depende do calendário de destino.
- Esses dois caminhos são pontuais. Reimportar um arquivo ou salvar um link novamente pode duplicar eventos; não há sincronização por assinatura.

## Ativar a conexão direta

A entrega não contém um cliente OAuth de terceiros. Para habilitar a conexão do seu próprio aplicativo:

1. Crie ou selecione um projeto no Google Cloud Console e ative **Google Calendar API**.
2. Configure a tela de consentimento do Google Auth Platform e, se estiver em teste, seus usuários de teste. Prepare as informações e políticas exigidas pelo Google para distribuição pública.
3. Crie uma credencial OAuth do tipo **Aplicativo da Web**. Em origens JavaScript autorizadas, registre a origem exata de uso, por exemplo `http://127.0.0.1:5175` e, se usado, `http://localhost:5175`. São origens diferentes. Em produção, registre o domínio HTTPS correspondente. Não acrescente caminhos de página.
4. Copie `.env.example` para `.env.local` e preencha `VITE_GOOGLE_CLIENT_ID` com o **ID público** terminado em `.apps.googleusercontent.com`. Nunca coloque CLIENT_SECRET, senha ou token no projeto/frontend.
5. Reinicie o servidor de desenvolvimento; para produção, compile novamente e publique os novos arquivos de `dist/`.
6. Abra Revisão espaçada, clique **Conectar minha conta Google**, conclua a autorização na janela Google e confira a prévia. Depois clique **Sincronizar**.

O escopo é `https://www.googleapis.com/auth/calendar.app.created`: criação e manutenção de agendas secundárias criadas pelo aplicativo. A integração cria **EstudaMente · Revisões**. Não pede acesso amplo à agenda principal e não usa CalendarList. O token fica apenas na memória da aba, expira e não é incluído em backups. É necessário reconectar após recarregar ou expirar.

Os identificadores das agendas são armazenados separadamente no navegador e reutilizados quando acessíveis. Se apagar dados do site, mudar de navegador ou de cliente OAuth, esse vínculo local pode se perder e uma nova agenda pode ser criada. O tema e esse vínculo local não fazem parte do backup de estudos; preferências de horário e metas fazem.

A sincronização atualiza eventos com identificadores estáveis por concurso/assunto, sem enviar convites. Só depois de concluir os envios, cancela os eventos futuros gerenciados pelo app para **esse concurso** que deixaram a prévia (inclusive por alteração do horizonte). Eventos pessoais e de outros concursos não são modificados. O usuário deve conferir a prévia antes de cada envio. Não há sincronização em segundo plano: depois de estudar, recalcule e sincronize novamente. Eventos já enviados podem emitir avisos com o Studio fechado, conforme notificações/permissões do Google e do dispositivo.

Desconectar revoga a autorização da sessão; eventos já enviados permanecem na agenda. Falhas parciais informam quantas revisões foram concluídas; a repetição usa os mesmos IDs. Nenhum evento foi criado na conta do usuário durante a validação desta entrega: os testes da API utilizaram respostas simuladas. A ativação real exige o cliente OAuth e a autorização do titular.

## Documentação oficial

- [Modelo de token no navegador](https://developers.google.com/identity/oauth2/web/guides/use-token-model)
- [Escopos da Calendar API](https://developers.google.com/workspace/calendar/api/auth)
- [Criar uma agenda](https://developers.google.com/workspace/calendar/api/v3/reference/calendars/insert)
- [Criar eventos e seus identificadores](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert)
- [Lembretes e notificações](https://developers.google.com/workspace/calendar/api/concepts/reminders)
