# 0002 — Dinheiro em Decimal, nunca em float

## Contexto

Um dos critérios de aceite é que a exportação some os valores corretamente, e
outro é que o saldo do mês bata com a soma das solicitações.

Em ponto flutuante, `0.1 + 0.2` dá `0.30000000000000004`. Com centenas de
itens, o CSV fecha com centavos de diferença — e a área não tem como saber se
o erro é do sistema ou dela.

## Decisão

`Decimal(12,2)` no Postgres, `Prisma.Decimal` na aplicação. Toda aritmética
monetária passa por `src/lib/money.ts`. `number` só aparece na fronteira, para
formatar em tela ou gravar célula numérica de planilha.

## Consequências

A soma fecha, e há teste provando.

Em troca, ninguém pode escrever `a + b` em valor monetário — é `.plus()`. E
`Prisma.Decimal` não é serializável para Client Component, então valores
cruzam essa fronteira já formatados ou como número.

Foi a troca certa: a alternativa é perder confiança no relatório, que é metade
do que a ferramenta entrega.
