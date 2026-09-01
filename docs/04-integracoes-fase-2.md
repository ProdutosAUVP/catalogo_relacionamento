# Integrações da fase 2

Tiny ERP e Salesforce ficaram fora do V1, mas o código já nasceu no formato
que elas vão exigir. "Preparado" aqui significa uma coisa concreta: **ligar
qualquer uma delas não deve exigir migração de dados nem mudança de tela.**

## Como a preparação funciona

Nenhuma tela lê produtos ou clientes pelo Prisma. Todas passam por
`catalogoProvider` e `clienteProvider`, resolvidos em
[`src/lib/providers/index.ts`](../src/lib/providers/index.ts) a partir de
variáveis de ambiente:

```
CATALOG_PROVIDER=local | tiny
CLIENT_PROVIDER=local  | salesforce
```

Os contratos estão em `providers/types.ts`. Os tipos são de leitura e
deliberadamente não espelham as linhas do banco: `ProdutoDoCatalogo` não tem
`criadoEm` porque o Tiny não devolveria isso, e a tela não pode passar a
depender de um campo que some quando o provider mudar.

As implementações do Tiny e do Salesforce existem como esqueleto e lançam
`ProviderIndisponivelError`. Estão no repositório para fixar o contrato e
deixar visível o que falta.

## Campos já reservados no banco

| Tabela         | Campos                                                        | Para quê                                     |
| -------------- | ------------------------------------------------------------- | -------------------------------------------- |
| `produtos`     | `sku_tiny`                                                    | casar o produto local com o do Tiny          |
| `solicitacoes` | `tiny_pedido_id`, `tiny_status`, `rastreio`, `transportadora` | pedido e rastreio                            |
| `clientes`     | `salesforce_id`                                               | casar o cliente com o registro do Salesforce |

Todos nulos no V1.

## Tiny ERP

O que entra: consulta de produtos e estoque, criação do pedido depois da
aprovação, retorno de número, status e rastreio.

Pendências antes de começar:

- quem detém as credenciais de API;
- como tratar itens externos, que não geram pedido no Tiny e podem não ter
  rastreio. O desenho atual permite catálogo híbrido — produto com `sku_tiny`
  vai para o Tiny, item específico continua fora dele.

## Salesforce

O que entra: busca do cliente por CPF ou ID, com preenchimento automático dos
dados no formulário de solicitação.

Pendências antes de começar:

- quais campos podem ser consultados;
- por qual chave: CPF ou ID.

Como `salesforce_id` já existe em `clientes`, casar os registros não vai exigir
migração. `origem` distingue quem veio de cadastro manual, de importação e do
Salesforce.

## Notificações e carta impressa

Também fora do V1. A notificação de mudança de status tem gancho natural: toda
mudança já grava uma linha em `solicitacao_historico`, então é o ponto onde o
disparo entra sem espalhar código.
