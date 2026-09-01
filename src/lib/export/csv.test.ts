import { describe, expect, it } from 'vitest'
import { COLUNAS } from './linhas'
import { escaparCampo, gerarCsv } from './csv'
import type { LinhaExport } from './linhas'

/** Linha com todas as colunas vazias, sobrescrevendo só o que o teste precisa. */
function linha(sobrescritas: Partial<LinhaExport> = {}): LinhaExport {
  const base = Object.fromEntries(
    COLUNAS.map((c) => [c.chave, ''] as const),
  ) as unknown as LinhaExport
  return Object.assign(base, sobrescritas)
}

describe('escape de campo', () => {
  it('protege o separador ponto e vírgula', () => {
    expect(escaparCampo('Rua A, 10; sala 2')).toBe('"Rua A, 10; sala 2"')
  })

  it('duplica aspas internas', () => {
    expect(escaparCampo('Caneca "premium"')).toBe('"Caneca ""premium"""')
  })

  it('protege quebra de linha, que viraria uma linha nova no arquivo', () => {
    expect(escaparCampo('linha 1\nlinha 2')).toBe('"linha 1\nlinha 2"')
  })

  it('nulo vira campo vazio, não a palavra null', () => {
    expect(escaparCampo(null)).toBe('')
    expect(escaparCampo(undefined)).toBe('')
  })

  it('número sai com vírgula decimal para o Excel pt-BR', () => {
    expect(escaparCampo(1234.5)).toBe('1234,5')
  })
})

describe('geração do CSV', () => {
  it('começa com BOM, sem o qual o Excel corrompe acentos', () => {
    expect(gerarCsv([])).toMatch(/^﻿/)
  })

  it('escreve o cabeçalho na ordem das colunas da spec', () => {
    const [cabecalho] = gerarCsv([]).replace(/^﻿/, '').split('\r\n')
    expect(cabecalho).toBe(COLUNAS.map((c) => c.titulo).join(';'))
  })

  it('gera uma linha por item, não por solicitação', () => {
    const csv = gerarCsv([
      linha({ codigo: 'SOL-2026-0001', produto: 'Caneca' }),
      linha({ codigo: 'SOL-2026-0001', produto: 'Livro' }),
    ])
    const linhas = csv.replace(/^﻿/, '').split('\r\n')
    expect(linhas).toHaveLength(3) // cabeçalho + 2 itens
  })

  it('mantém as colunas do Tiny e de rastreio vazias no V1', () => {
    const csv = gerarCsv([linha({ tinyPedidoId: null, rastreio: null })])
    const corpo = csv.replace(/^﻿/, '').split('\r\n')[1]!
    const campos = corpo.split(';')
    expect(campos[COLUNAS.findIndex((c) => c.chave === 'tinyPedidoId')]).toBe('')
    expect(campos[COLUNAS.findIndex((c) => c.chave === 'rastreio')]).toBe('')
  })
})
