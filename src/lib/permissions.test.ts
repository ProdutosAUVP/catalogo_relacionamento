import { describe, expect, it } from 'vitest'
import { Perfil } from '@prisma/client'
import {
  escopoDeDadosSensiveis,
  escopoDeSolicitacoes,
  filtroDeSolicitacoes,
  pode,
} from './permissions'

describe('consultor', () => {
  it('vê o catálogo e cria solicitação', () => {
    expect(pode(Perfil.consultor, 'catalogo.ver')).toBe(true)
    expect(pode(Perfil.consultor, 'solicitacao.criar')).toBe(true)
  })

  it('só enxerga as próprias solicitações — critério de aceite da spec', () => {
    expect(escopoDeSolicitacoes(Perfil.consultor)).toBe('proprias')
    expect(filtroDeSolicitacoes(Perfil.consultor, 'u1')).toEqual({ consultorId: 'u1' })
  })

  it('não altera status, não gerencia catálogo e não exporta', () => {
    expect(pode(Perfil.consultor, 'solicitacao.alterarStatus')).toBe(false)
    expect(pode(Perfil.consultor, 'catalogo.gerenciar')).toBe(false)
    expect(pode(Perfil.consultor, 'usuario.gerenciar')).toBe(false)
    expect(pode(Perfil.consultor, 'exportar')).toBe(false)
  })

  it('vê dados sensíveis apenas dos próprios clientes', () => {
    expect(escopoDeDadosSensiveis(Perfil.consultor)).toBe('proprias')
  })
})

describe('admin', () => {
  it('pode tudo', () => {
    for (const acao of [
      'catalogo.gerenciar',
      'solicitacao.alterarStatus',
      'solicitacao.editar',
      'usuario.gerenciar',
      'cliente.gerenciar',
      'exportar',
      'saldo.verTodos',
    ] as const) {
      expect(pode(Perfil.admin, acao)).toBe(true)
    }
  })

  it('enxerga todas as solicitações, sem filtro de consultor', () => {
    expect(escopoDeSolicitacoes(Perfil.admin)).toBe('todas')
    expect(filtroDeSolicitacoes(Perfil.admin, 'u1')).toEqual({})
  })
})

describe('financeiro — definição da área', () => {
  it('recebe a fila de compras', () => {
    expect(pode(Perfil.financeiro, 'compras.verFila')).toBe(true)
  })

  it('enxerga a fila de expedição, para exportar o pedido', () => {
    expect(pode(Perfil.financeiro, 'expedicao.verFila')).toBe(true)
    expect(pode(Perfil.admin, 'expedicao.verFila')).toBe(true)
    expect(pode(Perfil.consultor, 'expedicao.verFila')).toBe(false)
  })

  it('o consultor lê o rastreio, mas quem escreve é quem opera a expedição', () => {
    expect(pode(Perfil.admin, 'expedicao.registrarRastreio')).toBe(true)
    expect(pode(Perfil.financeiro, 'expedicao.registrarRastreio')).toBe(true)
    expect(pode(Perfil.consultor, 'expedicao.registrarRastreio')).toBe(false)
  })

  it('altera o status do pedido', () => {
    expect(pode(Perfil.financeiro, 'solicitacao.alterarStatus')).toBe(true)
  })

  it('vê todas as solicitações e exporta', () => {
    expect(escopoDeSolicitacoes(Perfil.financeiro)).toBe('todas')
    expect(pode(Perfil.financeiro, 'exportar')).toBe(true)
  })

  it('não cria solicitação nem gerencia catálogo e usuários', () => {
    expect(pode(Perfil.financeiro, 'solicitacao.criar')).toBe(false)
    expect(pode(Perfil.financeiro, 'catalogo.gerenciar')).toBe(false)
    expect(pode(Perfil.financeiro, 'usuario.gerenciar')).toBe(false)
    expect(pode(Perfil.financeiro, 'solicitacao.editar')).toBe(false)
  })
})
