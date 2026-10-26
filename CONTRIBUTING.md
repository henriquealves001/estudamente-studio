# Colaborar no EstudaMente

## Abrir o projeto

Use Node 24 (mínimo suportado: 22.18). Na pasta do projeto:

```sh
npm ci
npm run dev
```

Use o endereço informado pelo Vite. O armazenamento do navegador muda conforme protocolo, domínio e porta; use apenas dados sintéticos no desenvolvimento. Um clone não contém os estudos pessoais de quem usa o site.

## Enviar uma alteração

1. Atualize a branch principal e crie uma branch para sua tarefa.
2. Faça uma mudança delimitada e descreva seu objetivo.
3. Execute `npm run lint`, `npm test` e `npm run build`.
4. Quando mexer em cálculo, persistência ou migração, inclua um teste de comportamento/regressão apropriado.
5. Envie a branch e abra um pull request para revisão.
6. Descreva o que mudou, como verificou e se há impacto nos dados existentes.

```sh
git switch main
git pull --ff-only
git switch -c minha-alteracao
# editar, conferir e revisar os arquivos antes do commit
git add src tests
git commit -m "Descrever a alteração"
git push -u origin minha-alteracao
```

O workflow CI prepara lint, testes e build no GitHub. Ele só será executado depois do envio ao GitHub; sua inclusão não afirma que já houve uma execução remota. Não publica o site automaticamente.

## Preservar dados

- Mantenha o carregamento de backups versão 6 e a recuperação do legado.
- Acrescente campos de forma compatível; não reclassifique o histórico silenciosamente.
- Não substitua a chave do banco nem faça reset automático de armazenamento.
- Não envie backups pessoais, arquivos `.env.local`, tokens ou chaves de acesso ao repositório.
- Somente o ID público OAuth do Google pode aparecer no frontend; a configuração está em GOOGLE_AGENDA.md.

## Manter as alegações precisas

Acesse o relatório em `public/references/auditoria-metodo.md`. O aplicativo aplica alguns princípios de recuperação e espaçamento, mas não implementa todos os protocolos da bibliografia. Ajuste `src/science-audit.json` quando uma funcionalidade mudar. Um teste de código aprovado não comprova eficácia educacional.

## Publicação atual

O site atual está hospedado em Sites. O repositório GitHub pode ser a área de colaboração; enviar um commit ao GitHub não atualiza essa hospedagem por si só. O pacote para GitHub exclui os metadados e credenciais internos da hospedagem.
