# Perfis e permissões

Fonte única: [`src/lib/permissions.ts`](../src/lib/permissions.ts). Menu,
guarda de rota e server action consultam a mesma tabela, para que esconder um
botão e bloquear a ação nunca divirjam.

## Matriz

| Ação                                      |    Consultor    | Admin | Financeiro |
| ----------------------------------------- | :-------------: | :---: | :--------: |
| Ver catálogo                              |        ✓        |   ✓   |     ✓      |
| Criar solicitação                         |        ✓        |   ✓   |     -      |
| Ver as próprias solicitações              |        ✓        |   ✓   |     ✓      |
| Ver todas as solicitações                 |        -        |   ✓   |     ✓      |
| Ver a fila de compras                     |        -        |   ✓   |     ✓      |
| Ver a fila da expedição                   |        -        |   ✓   |     ✓      |
| Ver dados sensíveis do cliente            | só das próprias |   ✓   |    ✓ ¹     |
| Alterar status                            |        -        |   ✓   |     ✓      |
| Editar/corrigir solicitação               |        -        |   ✓   |     -      |
| Gerenciar catálogo, categorias e usuários |        -        |   ✓   |     -      |
| Exportar                                  |        -        |   ✓   |     ✓      |
| Ver saldo gasto                           |     próprio     | todos |   todos    |

¹ Único ponto do perfil Financeiro ainda sem confirmação da área. Ver abaixo.

## Perfil Financeiro

A spec deixou esse perfil "a definir". A área definiu depois:

> Recebe as solicitações enviadas para compra contendo data, produto, valor e
> site. Consegue alterar o status do pedido.

Foi implementado assim:

- **Fila de compras** (`/financeiro/compras`): lista por item, e não por
  solicitação, porque a compra acontece item a item, um pedido com três
  presentes pode ter três origens. Traz data, produto, valor e site. O "site" é
  o link do presente específico; item de catálogo não tem site, e no lugar
  aparece a categoria.
  Item de catálogo também mostra site quando a categoria tem fornecedor fixo,
  bebida é sempre comprada na Casa da Bebida, por regra da área
  (`src/lib/fornecedores.ts`). O link do presente específico vence o padrão da
  categoria, porque foi escolhido para aquele item.
- **Alteração de status**: liberada, com as mesmas transições e as mesmas
  exigências de motivo que valem para o Admin.

## A expedição não é um perfil

A ação `expedicao.verFila` abre `/expedicao`, a lista de pedidos prontos para
separar. Ela existe para Admin e Financeiro; não há perfil "expedição" porque a
expedição trabalha fora desta ferramenta, hoje recebe uma planilha, e a tela é
o que substitui essa planilha.

Se um dia a expedição passar a entrar no sistema, o perfil entra em
`Perfil` no schema e ganha uma coluna na matriz; nenhuma tela muda.

O acesso a dados sensíveis do cliente segue liberado por coerência com a
permissão de exportar, já que a exportação definida na spec carrega CPF,
telefone e endereço. Está isolado em `PENDENTE_CONFIRMACAO`: se a área quiser
restringir, é a troca de uma linha, e ela vale nos dois lugares de uma vez.

## Escopo de leitura

Permissão sozinha não basta: o consultor pode "ver solicitações", mas só as
dele. Isso é o escopo, e ele vira filtro de banco em `filtroDeSolicitacoes`.

Nenhuma tela escreve o `where` de consultor à mão. O critério de aceite "o
consultor só enxerga as próprias solicitações" não pode depender de quem
escreveu a query.

## Onde a autorização acontece

Sempre no servidor:

- `exigirUsuario()`: exige sessão;
- `exigirPermissao(acao)`: exige uma permissão, redireciona quem não tem;
- `autorizarAction(acao)`: versão para server action e rota de API, que lança
  em vez de redirecionar.

O middleware só checa a existência do cookie de sessão. Ele roda no edge e não
enxerga perfil; serve para evitar renderizar página autenticada à toa, não para
autorizar.
