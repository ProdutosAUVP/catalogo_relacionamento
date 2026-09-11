import { describe, expect, it } from 'vitest'
import { StatusSolicitacao } from '@prisma/client'
import { Prisma } from '@prisma/client'
import {
  pecasASeparar,
  linhasDaExpedicao,
  COLUNAS_DA_EXPEDICAO,
  type PedidoDeExpedicao,
} from './expedicao'

function pedido(sobrescritas: Partial<PedidoDeExpedicao> = {}): PedidoDeExpedicao {
  return {
    id: 'p1',
    codigo: 'SOL-2026-0001',
    data: new Date('2026-03-10T12:00:00Z'),
    status: StatusSolicitacao.organizando_envio,
    consultor: 'Ana',
    cliente: 'Cliente Um',
    clienteCpf: '123.456.789-09',
    clienteTelefone: '(11) 98888-7777',
    destinatario: 'Cliente Um',
    cep: '01310-100',
    logradouro: 'Av. Paulista',
    numero: '1000',
    complemento: null,
    bairro: 'Bela Vista',
    cidade: 'São Paulo',
    uf: 'SP',
    enderecoCompleto: 'Av. Paulista, 1000 - Bela Vista - São Paulo/SP - CEP 01310-100',
    motivo: 'Aniversário',
    observacoes: null,
    itens: [{ produto: 'Caneca', quantidade: 2, deCatalogo: true, jaEmEstoque: true }],
    valorTotal: new Prisma.Decimal('100.00'),
    rastreio: null,
    transportadora: null,
    ...sobrescritas,
  }
}

describe('peças a separar', () => {
  it('soma as quantidades, e não os pedidos', () => {
    const fila = [
      pedido({
        itens: [
          { produto: 'Caneca', quantidade: 2, deCatalogo: true, jaEmEstoque: true },
          { produto: 'Vinho', quantidade: 1, deCatalogo: false, jaEmEstoque: false },
        ],
      }),
      pedido({ id: 'p2' }),
    ]

    expect(pecasASeparar(fila)).toBe(5)
  })

  it('fila vazia não quebra a conta', () => {
    expect(pecasASeparar([])).toBe(0)
  })
})

describe('linhas da planilha de expedição', () => {
  it('gera uma linha por item, não por pedido', () => {
    const linhas = linhasDaExpedicao([
      pedido({
        itens: [
          { produto: 'Caneca', quantidade: 2, deCatalogo: true, jaEmEstoque: true },
          { produto: 'Vinho', quantidade: 1, deCatalogo: false, jaEmEstoque: false },
        ],
      }),
    ])

    expect(linhas).toHaveLength(2)
    expect(linhas.map((l) => l.produto)).toEqual(['Caneca', 'Vinho'])
  })

  it('marca a origem do item: da prateleira ou de uma compra', () => {
    const linhas = linhasDaExpedicao([
      pedido({
        itens: [
          { produto: 'Caneca', quantidade: 1, deCatalogo: true, jaEmEstoque: true },
          { produto: 'Vinho', quantidade: 1, deCatalogo: false, jaEmEstoque: false },
        ],
      }),
    ])

    expect(linhas.map((l) => l.origem)).toEqual(['Estoque', 'Compra'])
  })

  it('repete o endereço em cada linha, quem separa lê item a item', () => {
    const linhas = linhasDaExpedicao([
      pedido({
        itens: [
          { produto: 'Caneca', quantidade: 1, deCatalogo: true, jaEmEstoque: true },
          { produto: 'Vinho', quantidade: 1, deCatalogo: false, jaEmEstoque: false },
        ],
      }),
    ])

    expect(linhas.every((l) => l.cep === '01310-100' && l.cidade === 'São Paulo')).toBe(true)
  })

  it('preenche exatamente as colunas declaradas, sem sobra nem falta', () => {
    const [linha] = linhasDaExpedicao([pedido()])
    expect(Object.keys(linha!).sort()).toEqual(COLUNAS_DA_EXPEDICAO.map((c) => c.chave).sort())
  })
})
