# Fluxo de status

Fonte única: [`src/lib/status.ts`](../src/lib/status.ts), coberta por
`status.test.ts`.

## Fluxo linear

```
Pendente
  → Aguardando aprovação
    → Aguardando compra
      → Comprado
        → Organizando envio
          → Entregue / rastreio finalizado
            → Cliente confirmou recebimento
```

Avança uma etapa por vez. Não é possível pular etapa nem voltar pelo caminho
linear — voltar acontece por "Deu problema".

### Atalho: estoque não passa pelo Financeiro

Há uma exceção declarada em `ATALHOS`: de **Aguardando aprovação** a
solicitação pode ir direto para **Organizando envio**, pulando o Financeiro.

Regra da área: item que já está na prateleira não tem o que ser comprado, e
hoje esses casos vão para a expedição por fora do sistema. Quem decide se o
atalho é oferecido é `proximoDepoisDaAprovacao(itens)`, que olha os itens:

| Item                                 | Precisa de compra |
| ------------------------------------ | ----------------- |
| Presente específico                  | sim               |
| Produto que não controla estoque     | sim               |
| Produto que controla e não tem saldo | sim               |
| Produto que controla e tem saldo     | não               |

Basta um item precisar de compra para a solicitação inteira ir ao Financeiro: o
pedido é embalado junto, então ele espera o item que falta.

A tela do detalhe **sugere** o próximo status e explica o porquê; a decisão
continua sendo do Admin, e as duas transições são válidas.

## Saídas do fluxo

- **Deu problema**: acionável a partir de qualquer status vivo. Dali a
  solicitação volta para qualquer etapa anterior ou é cancelada.
- **Devolvido**: só a partir de "Entregue" em diante.
- **Cancelado**: acionável a partir de qualquer status vivo.

## Status finais

"Cliente confirmou recebimento", "Devolvido" e "Cancelado" não admitem
mudança. A tela do Admin diz isso em vez de oferecer um seletor vazio.

## Motivo obrigatório

"Deu problema", "Devolvido" e "Cancelado" exigem motivo preenchido, gravado no
histórico. Exigido em três camadas: no seletor da tela, em
`validarMudancaDeStatus` e numa CHECK constraint do banco.

## Quem muda

Admin e Financeiro. O consultor acompanha.

## Status é da solicitação, não do item

Uma solicitação com três itens tem um status só. Se um item der problema, o
Admin usa observações e histórico.

**Vale confirmar com a área se isso atende** — está registrado em
[perguntas em aberto](05-perguntas-em-aberto.md). Se não atender, a mudança é
de porte médio: o status desce para `solicitacao_itens` e o status da
solicitação passa a ser derivado dos itens.

## Efeito no saldo

**Todos os status entram no gasto do mês**, cancelados e devolvidos inclusive.

A spec v1 dizia para excluir os dois, e o código chegou a fazer isso. A área
corrigiu: uma devolução normalmente vira reenvio, então o dinheiro segue
comprometido, e tirar esses casos da conta subestimaria o gasto do consultor.

`STATUS_FORA_DO_SALDO` continua existindo, vazia. Ela é o lugar único da
pergunta "isto conta no saldo?": se um dia algum status deixar de contar, ele
entra ali e a mudança vale de uma vez para o saldo, o painel e a exportação.

## Da expedição para a frente

"Organizando envio" é o status em que a solicitação está com a expedição. A
tela `/expedicao` monta a partir dele a lista que hoje é uma planilha feita à
mão — ver [`src/lib/expedicao.ts`](../src/lib/expedicao.ts).

A expedição não é um perfil novo: ela trabalha fora desta ferramenta, e quem
abre a tela é Admin ou Financeiro (`expedicao.verFila`). A carta que acompanha
o presente continua sendo escrita fora do sistema, por decisão da área.
