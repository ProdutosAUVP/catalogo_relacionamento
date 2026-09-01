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

Canceladas e devolvidas não entram no gasto do mês. Todo o resto entra,
inclusive "Deu problema" — o dinheiro pode já ter sido comprometido.
