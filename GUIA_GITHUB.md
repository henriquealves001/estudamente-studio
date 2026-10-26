# Colocar o EstudaMente no GitHub

Conta indicada: **henriquealves001**. Nome proposto: **estudamente-studio**. Visibilidade proposta: **Private**.

## Pelo navegador

1. Entre no GitHub com sua conta.
2. Crie um novo repositório chamado `estudamente-studio` e selecione **Private**.
3. Se enviar a pasta pelo navegador, use **uploading an existing file** / **Add file → Upload files** e envie o conteúdo extraído do pacote, preservando `src/`, `public/` e `tests/`. O arquivo `package.json` deve ficar na raiz do repositório, não dentro de outra pasta.
4. Confira se os arquivos ocultos `.github/`, `.gitignore` e `.env.example` também foram incluídos. Para garantir todos os arquivos, prefira o envio por Git descrito abaixo.
5. Em **Settings → Collaborators**, use **Add people** e informe o usuário GitHub do colega. Confira a conta antes de enviar o convite. Depois que aceitar, ele poderá colaborar no repositório privado.

O pacote não cria o repositório sozinho. Não envie o ZIP como se fosse o código: extraia e envie os arquivos ou use Git.

## Com Git, na pasta limpa extraída

Crie antes o repositório vazio no GitHub, sem adicionar README ou arquivos iniciais. O endereço abaixo só será utilizável depois que o repositório existir na conta indicada.

```sh
git init -b main
git add .
git commit -m "Adicionar EstudaMente Studio"
git remote add origin https://github.com/henriquealves001/estudamente-studio.git
git push -u origin main
```

A autenticação é feita pelo gerenciador de credenciais ou pelo fluxo do GitHub. Não coloque senhas/tokens no endereço do remote ou em arquivos do projeto.

## Para o colega

Depois que o repositório for criado e o convite for aceito:

```sh
git clone https://github.com/henriquealves001/estudamente-studio.git
cd estudamente-studio
npm ci
npm run dev
```

Use Node 24 e consulte CONTRIBUTING.md e ROADMAP.md. O site online continua no endereço atual; a integração de publicação com GitHub não foi configurada nesta entrega.

## Documentação oficial

- https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github
- https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository
