import { describe, expect, it } from 'vitest'
import { fornecedorDaCategoria, siteDeCompra } from './fornecedores'

describe('fornecedor por categoria', () => {
  it('bebida vem da Casa da Bebida', () => {
    expect(fornecedorDaCategoria('Bebidas')).toBe('https://casadabebida.com.br')
  })

  it('não depende de caixa nem de espaço em volta', () => {
    expect(fornecedorDaCategoria('  bebidas ')).toBe('https://casadabebida.com.br')
  })

  it('categoria sem fornecedor definido devolve nulo', () => {
    expect(fornecedorDaCategoria('Papelaria')).toBeNull()
    expect(fornecedorDaCategoria(null)).toBeNull()
  })
})

describe('site de compra do item', () => {
  it('o link do presente específico vence o padrão da categoria', () => {
    expect(siteDeCompra('https://loja.exemplo.com/vinho', 'Bebidas')).toEqual({
      url: 'https://loja.exemplo.com/vinho',
      origem: 'item',
    })
  })

  it('item de catálogo de bebida cai no fornecedor da categoria', () => {
    expect(siteDeCompra(null, 'Bebidas')).toEqual({
      url: 'https://casadabebida.com.br',
      origem: 'categoria',
    })
  })

  it('item de catálogo sem fornecedor não inventa link', () => {
    expect(siteDeCompra(null, 'Papelaria')).toBeNull()
  })
})
