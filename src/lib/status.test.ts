import { describe, expect, it } from 'vitest'
import { StatusSolicitacao } from '@prisma/client'
import {
  FLUXO_LINEAR,
  contaNoSaldo,
  ehTerminal,
  precisaDeCompra,
  proximoDepoisDaAprovacao,
  transicaoPermitida,
  transicoesPermitidas,
  validarMudancaDeStatus,
} from './status'

describe('fluxo linear', () => {
  it('avança uma etapa por vez', () => {
    for (let i = 0; i < FLUXO_LINEAR.length - 1; i++) {
      const atual = FLUXO_LINEAR[i]!
      const proximo = FLUXO_LINEAR[i + 1]!
      expect(transicaoPermitida(atual, proximo)).toBe(true)
    }
  })

  it('não deixa pular etapas, fora o atalho declarado para a expedição', () => {
    expect(transicaoPermitida(StatusSolicitacao.pendente, StatusSolicitacao.comprado)).toBe(false)
    expect(
      transicaoPermitida(StatusSolicitacao.aguardando_compra, StatusSolicitacao.entregue),
    ).toBe(false)
  })

  it('não deixa voltar pelo fluxo linear', () => {
    expect(
      transicaoPermitida(StatusSolicitacao.comprado, StatusSolicitacao.aguardando_compra),
    ).toBe(false)
  })
})

describe('deu problema', () => {
  it('é acionável de qualquer status vivo', () => {
    for (const status of FLUXO_LINEAR) {
      if (ehTerminal(status)) continue
      expect(transicaoPermitida(status, StatusSolicitacao.deu_problema)).toBe(true)
    }
  })

  it('permite voltar para qualquer status anterior do fluxo', () => {
    const destinos = transicoesPermitidas(StatusSolicitacao.deu_problema)
    for (const status of FLUXO_LINEAR) {
      expect(destinos).toContain(status)
    }
  })

  it('permite cancelar', () => {
    expect(transicaoPermitida(StatusSolicitacao.deu_problema, StatusSolicitacao.cancelado)).toBe(
      true,
    )
  })

  it('é recusado sem motivo — critério de aceite da spec', () => {
    const semMotivo = validarMudancaDeStatus(
      StatusSolicitacao.comprado,
      StatusSolicitacao.deu_problema,
    )
    expect(semMotivo.ok).toBe(false)

    const soEspacos = validarMudancaDeStatus(
      StatusSolicitacao.comprado,
      StatusSolicitacao.deu_problema,
      '   ',
    )
    expect(soEspacos.ok).toBe(false)

    const comMotivo = validarMudancaDeStatus(
      StatusSolicitacao.comprado,
      StatusSolicitacao.deu_problema,
      'Fornecedor cancelou o pedido.',
    )
    expect(comMotivo.ok).toBe(true)
  })
})

describe('devolvido', () => {
  it('só é acionável de entregue em diante', () => {
    expect(transicaoPermitida(StatusSolicitacao.entregue, StatusSolicitacao.devolvido)).toBe(true)
    expect(
      transicaoPermitida(StatusSolicitacao.cliente_confirmou, StatusSolicitacao.devolvido),
    ).toBe(false) // cliente_confirmou é terminal
    expect(transicaoPermitida(StatusSolicitacao.comprado, StatusSolicitacao.devolvido)).toBe(false)
    expect(transicaoPermitida(StatusSolicitacao.pendente, StatusSolicitacao.devolvido)).toBe(false)
  })

  it('exige motivo', () => {
    expect(validarMudancaDeStatus(StatusSolicitacao.entregue, StatusSolicitacao.devolvido).ok).toBe(
      false,
    )
  })
})

describe('status terminais', () => {
  it('não admitem nenhuma transição', () => {
    for (const status of [
      StatusSolicitacao.cliente_confirmou,
      StatusSolicitacao.devolvido,
      StatusSolicitacao.cancelado,
    ]) {
      expect(transicoesPermitidas(status)).toEqual([])
      expect(validarMudancaDeStatus(status, StatusSolicitacao.pendente).ok).toBe(false)
    }
  })
})

describe('mudança para o mesmo status', () => {
  it('é recusada', () => {
    expect(validarMudancaDeStatus(StatusSolicitacao.pendente, StatusSolicitacao.pendente).ok).toBe(
      false,
    )
  })
})

describe('saldo do mês', () => {
  // A spec mandava excluir cancelados e devolvidos. A área corrigiu: devolução
  // normalmente vira reenvio, então o dinheiro segue comprometido.
  it('conta todos os status, inclusive cancelado e devolvido', () => {
    for (const status of Object.values(StatusSolicitacao)) {
      expect(contaNoSaldo(status)).toBe(true)
    }
  })
})

describe('atalho para a expedição', () => {
  it('permite ir da aprovação direto para organizando envio', () => {
    expect(
      transicaoPermitida(
        StatusSolicitacao.aguardando_aprovacao,
        StatusSolicitacao.organizando_envio,
      ),
    ).toBe(true)
  })

  it('mantém o caminho pelo Financeiro disponível', () => {
    expect(
      transicaoPermitida(
        StatusSolicitacao.aguardando_aprovacao,
        StatusSolicitacao.aguardando_compra,
      ),
    ).toBe(true)
  })

  it('não abre o atalho a partir de outros status', () => {
    expect(
      transicaoPermitida(StatusSolicitacao.pendente, StatusSolicitacao.organizando_envio),
    ).toBe(false)
  })
})

describe('precisa de compra', () => {
  const emEstoque = { controlaEstoque: true, estoque: 10 }

  it('não precisa quando tudo é de catálogo e há estoque', () => {
    expect(precisaDeCompra([{ produtoId: 'p1', quantidade: 2, produto: emEstoque }])).toBe(false)
  })

  it('precisa quando o estoque não cobre a quantidade pedida', () => {
    expect(
      precisaDeCompra([
        { produtoId: 'p1', quantidade: 20, produto: { controlaEstoque: true, estoque: 10 } },
      ]),
    ).toBe(true)
  })

  it('precisa quando o produto não controla estoque', () => {
    expect(
      precisaDeCompra([
        { produtoId: 'p1', quantidade: 1, produto: { controlaEstoque: false, estoque: null } },
      ]),
    ).toBe(true)
  })

  it('precisa quando há presente específico', () => {
    expect(precisaDeCompra([{ produtoId: null, quantidade: 1 }])).toBe(true)
  })

  it('um único item sem estoque leva a solicitação inteira ao Financeiro', () => {
    expect(
      precisaDeCompra([
        { produtoId: 'p1', quantidade: 1, produto: emEstoque },
        { produtoId: null, quantidade: 1 },
      ]),
    ).toBe(true)
  })

  it('sugere o próximo status conforme a necessidade de compra', () => {
    expect(proximoDepoisDaAprovacao([{ produtoId: 'p1', quantidade: 1, produto: emEstoque }])).toBe(
      StatusSolicitacao.organizando_envio,
    )
    expect(proximoDepoisDaAprovacao([{ produtoId: null, quantidade: 1 }])).toBe(
      StatusSolicitacao.aguardando_compra,
    )
  })
})
