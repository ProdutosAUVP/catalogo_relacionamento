import { describe, expect, it } from 'vitest'
import { acompanhamentosFaltando, mensagemDePendencia } from './acompanhamentos'

const kit = {
  produtoId: 'k1',
  produto: {
    nome: 'Kit Queijos com Vinho',
    exigeAcompanhamento: 'vinho',
    serveComoAcompanhamento: null,
  },
}
const outroKit = {
  produtoId: 'k2',
  produto: {
    nome: 'Caixa MDF para vinho',
    exigeAcompanhamento: 'vinho',
    serveComoAcompanhamento: null,
  },
}
const vinho = {
  produtoId: 'v1',
  produto: {
    nome: 'Vinho Silk & Spice',
    exigeAcompanhamento: null,
    serveComoAcompanhamento: 'vinho',
  },
}
const caneca = {
  produtoId: 'c1',
  produto: { nome: 'Caneca AUVP', exigeAcompanhamento: null, serveComoAcompanhamento: null },
}
const especifico = { produtoId: null }

describe('acompanhamentos', () => {
  it('kit sozinho não passa', () => {
    expect(acompanhamentosFaltando([kit])).toEqual([
      { exigencia: 'vinho', produtos: ['Kit Queijos com Vinho'] },
    ])
  })

  it('kit com o vinho junto passa', () => {
    expect(acompanhamentosFaltando([kit, vinho])).toEqual([])
  })

  it('a ordem não importa: o vinho pode ter entrado primeiro', () => {
    expect(acompanhamentosFaltando([vinho, kit])).toEqual([])
  })

  it('um vinho só atende os dois kits', () => {
    expect(acompanhamentosFaltando([kit, outroKit, vinho])).toEqual([])
  })

  it('dois kits sem vinho aparecem juntos na mesma pendência', () => {
    expect(acompanhamentosFaltando([kit, outroKit])).toEqual([
      { exigencia: 'vinho', produtos: ['Kit Queijos com Vinho', 'Caixa MDF para vinho'] },
    ])
  })

  it('o mesmo kit repetido não duplica o aviso', () => {
    expect(acompanhamentosFaltando([kit, kit])[0]?.produtos).toEqual(['Kit Queijos com Vinho'])
  })

  it('item que não acompanha nada não satisfaz a exigência', () => {
    expect(acompanhamentosFaltando([kit, caneca])).toHaveLength(1)
  })

  it('presente específico não satisfaz: é texto livre, não dá para conferir', () => {
    expect(acompanhamentosFaltando([kit, especifico])).toHaveLength(1)
  })

  it('solicitação sem kit nenhum não tem pendência', () => {
    expect(acompanhamentosFaltando([caneca, vinho, especifico])).toEqual([])
  })

  it('a mensagem nomeia o que falta e para quais produtos', () => {
    expect(mensagemDePendencia(acompanhamentosFaltando([kit]))).toBe(
      '“Kit Queijos com Vinho” precisa de um vinho na mesma solicitação. Escolha no catálogo antes de continuar.',
    )
    expect(mensagemDePendencia(acompanhamentosFaltando([kit, outroKit]))).toBe(
      '“Kit Queijos com Vinho” e “Caixa MDF para vinho” precisam de um vinho na mesma solicitação. Escolha no catálogo antes de continuar.',
    )
  })

  it('sem pendência, não há mensagem', () => {
    expect(mensagemDePendencia([])).toBeNull()
  })
})
