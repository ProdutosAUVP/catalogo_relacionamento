# 0007: Fotos de produto no Postgres, não em bucket

## Contexto

A spec previa um bucket S3-compatível para as fotos, e as variáveis
`STORAGE_*` estão reservadas desde o início. Mas o upload era o que faltava
para o CRUD de produto funcionar, e o CRUD de produto é requisito de primeira
ordem: a área de Relacionamento precisa cadastrar presente sem chamar o time
técnico.

Um bucket depende de escolher o provedor, provisionar, gerar credenciais e
decidir quem as guarda, decisões que não são da área e que travariam a única
coisa que ela faria sozinha desde o primeiro dia.

O volume ajuda a decidir: são algumas dezenas de fotos de catálogo, com teto
de 5 MB cada. Não é acervo, é vitrine.

## Decisão

A foto é gravada na tabela `arquivos` e servida por `/api/arquivos/[id]`,
atrás da sessão como o resto da ferramenta. `Produto.fotoUrl` continua sendo
uma URL: as telas não sabem de onde ela vem.

Toda a leitura e escrita de arquivo mora em `src/lib/arquivos.ts`.

## Consequências

O cadastro de produto funciona no dia em que a ferramenta subir, sem
dependência externa. O backup do banco já leva as fotos junto, e não há um
segundo lugar onde o dado possa ficar órfão.

Em troca:

- as fotos entram no dump do Postgres, que cresce;
- elas não passam pelo otimizador de imagem do Next, porque ele busca a origem
  do servidor e sem cookie levaria 401. `ProdutoImagem` marca `unoptimized`
  para essas URLs. Com foto pequena, é troca barata;
- não há CDN na frente.

Nenhuma das três dói no volume do V1, e as três deixam de valer no mesmo dia:
trocar por bucket é reescrever `salvarFoto` e apontar a URL para lá. As
solicitações antigas continuam válidas, porque o que está gravado nelas é uma
URL, e não o arquivo.
