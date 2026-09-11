import { describe, expect, it } from 'vitest'
import { dinheiro, formatarBRL, somar, subtotal, totalDosItens } from './money'

describe('aritmética de dinheiro', () => {
  it('não acumula erro de ponto flutuante', () => {
    // 0.1 + 0.2 === 0.30000000000000004 em number.
    expect(somar([0.1, 0.2]).toString()).toBe('0.3')
  })

  it('multiplica valor unitário por quantidade sem perder centavo', () => {
    expect(subtotal('19.99', 3).toString()).toBe('59.97')
  })

  it('fecha o total dos itens, critério de aceite da exportação', () => {
    const itens = [
      { valorUnitario: '149.90', quantidade: 2 },
      { valorUnitario: '89.90', quantidade: 1 },
      { valorUnitario: '35.55', quantidade: 3 },
    ]
    // 299.80 + 89.90 + 106.65
    expect(totalDosItens(itens).toString()).toBe('496.35')
  })

  it('soma de lista vazia é zero, não NaN', () => {
    expect(totalDosItens([]).toString()).toBe('0')
  })
})

describe('formatação', () => {
  it('exibe em reais', () => {
    // O Intl usa espaço não separável entre símbolo e número.
    expect(formatarBRL(dinheiro('1234.56')).replace(/ /g, ' ')).toBe('R$ 1.234,56')
  })
})
