# 0001 — Camada de providers para catálogo e clientes

## Contexto

O V1 não integra com Tiny ERP nem com Salesforce, mas as duas APIs existem e
entram na fase 2. A spec é explícita: trocar a implementação depois não deve
exigir migração de dados nem mudança de tela.

O caminho fácil seria cada tela consultar o Prisma direto e, na fase 2,
reescrever as telas. Isso transformaria uma integração em um refactor.

## Decisão

Catálogo e clientes são lidos por trás de duas interfaces —
`CatalogoProvider` e `ClienteProvider`. Nenhuma tela consulta `db.produto` ou
`db.cliente` diretamente para leitura.

Os tipos de retorno são de leitura e não espelham as linhas do banco. Só
carregam o que qualquer fonte conseguiria fornecer: `ProdutoDoCatalogo` não tem
`criadoEm`, porque o Tiny não devolveria isso e a tela não pode passar a
depender de um campo que some quando o provider mudar.

Qual implementação vale é decidido por variável de ambiente
(`CATALOG_PROVIDER`, `CLIENT_PROVIDER`).

## Consequências

Ligar o Tiny vira implementar uma interface e trocar uma variável de ambiente.

Em troca, a escrita continua indo direto ao Prisma: o CRUD do Admin não passa
pelos providers, porque cadastrar produto é operação local mesmo quando a
leitura vem do Tiny. Isso é assimétrico de propósito.

O custo é uma camada de tradução a mais entre banco e tela, que só se paga na
fase 2.
