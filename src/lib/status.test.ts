import { describe, expect, it } from 'vitest'
import { StatusSolicitacao } from '@prisma/client'
import {
  FLUXO_LINEAR,
  contaNoSaldo,
  ehTerminal,
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

  it('não deixa pular etapas', () => {
    expect(transicaoPermitida(StatusSolicitacao.pendente, StatusSolicitacao.comprado)).toBe(false)
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
  it('ignora canceladas e devolvidas e conta o resto', () => {
    expect(contaNoSaldo(StatusSolicitacao.cancelado)).toBe(false)
    expect(contaNoSaldo(StatusSolicitacao.devolvido)).toBe(false)

    for (const status of FLUXO_LINEAR) {
      expect(contaNoSaldo(status)).toBe(true)
    }
    expect(contaNoSaldo(StatusSolicitacao.deu_problema)).toBe(true)
  })
})
