# Modelo de dados

Fonte: [`prisma/schema.prisma`](../prisma/schema.prisma). Este documento
explica as decisões que o schema não consegue dizer sozinho.

## Nada é deletado

Produto, categoria e usuário são desativados pelo campo `ativo`, nunca
removidos. Uma solicitação de seis meses atrás precisa continuar legível
exatamente como foi criada — inclusive com o produto que saiu do catálogo.

As chaves estrangeiras usam `onDelete: Restrict` justamente para que uma
exclusão acidental falhe em vez de apagar histórico.

## Valores congelam na criação

`solicitacao_itens.valor_unitario` recebe uma cópia do preço no momento em que
o item é adicionado. Reajustar o preço de um produto não altera solicitação
já feita, e o relatório do mês passado continua fechando.

`solicitacoes.valor_total` é a soma dos itens, gravada na própria linha. É
redundante de propósito: o painel e o saldo mensal leem esse campo sem precisar
de join com os itens.

## Endereço é snapshot

Os campos `entrega_*` moram na solicitação, e não no cliente. Se o cliente se
mudar, a solicitação antiga continua mostrando para onde o presente foi de
fato enviado.

## CPF é a chave de deduplicação

Gravado só com dígitos, sem máscara, com `UNIQUE` e uma CHECK constraint que
recusa qualquer outro formato. Sem isso, `529.982.247-25` e `52998224725`
virariam dois clientes.

## Item: catálogo ou específico, nunca os dois

Um item tem `produto_id` preenchido, **ou** `descricao_livre` + `url_externa`.
A regra existe em dois lugares:

- `itemSchema`, em `src/lib/validators/solicitacao.ts`, para que o consultor
  receba uma mensagem legível;
- CHECK constraint `item_catalogo_ou_especifico`, para que nenhum script,
  seed ou correção manual consiga gravar um item inválido.

## Estoque opcional

`controla_estoque = false` cobre produtos externos e itens montados sob
encomenda, que não têm essa informação. A tela omite a disponibilidade em vez
de exibir zero — zero significaria "acabou", que é outra coisa.

## Histórico é imutável

`solicitacao_historico` recebe uma linha por mudança de status, com autor,
horário e motivo. Nunca é editado nem apagado: é o que responde "por que essa
solicitação parou".

Uma CHECK constraint exige motivo em `deu_problema`, `devolvido` e
`cancelado`.

## Código sequencial

`SOL-2026-0001`, gerado a partir da tabela `contador_codigo` com um UPDATE
atômico dentro da transação que cria a solicitação. Contar linhas existentes
abriria corrida entre dois consultores salvando no mesmo instante.

## Campos da fase 2

`sku_tiny`, `tiny_pedido_id`, `tiny_status`, `rastreio`, `transportadora` e
`salesforce_id` existem desde o V1 e ficam nulos. Ligar as integrações depois
não vai exigir migração de dados.

## Status `cancelado`

A spec lista nove status. O schema tem dez: `cancelado` é exigido por duas
regras do próprio documento — "de Deu problema a solicitação pode voltar para
qualquer status anterior ou ser cancelada" e "o saldo considera todos os status
exceto os cancelados e devolvidos". Sem ele, nenhuma das duas é representável.
