import { describe, expect, it } from 'vitest'
import {
  fatiasDoPeriodo,
  intervaloDaSemana,
  lerPeriodo,
  queryDoPeriodo,
  semanaIso,
  semanasNoAno,
  trocarTipo,
} from './periodo'

// Quarta, 19/08/2026, meio-dia em São Paulo.
const AGORA = new Date('2026-08-19T15:00:00Z')

describe('semana ISO', () => {
  it('numera como o protótipo: 17/08 a 23/08/2026 é a 2026-34', () => {
    expect(semanaIso(new Date('2026-08-17T03:00:00Z'))).toEqual({ ano: 2026, semana: 34 })
    expect(semanaIso(new Date('2026-08-24T02:59:59Z'))).toEqual({ ano: 2026, semana: 34 })
  })

  it('começa na segunda 00:00 de São Paulo, e não na de UTC', () => {
    const { inicio, fim } = intervaloDaSemana({ ano: 2026, semana: 34 })
    expect(inicio.toISOString()).toBe('2026-08-17T03:00:00.000Z')
    expect(fim.toISOString()).toBe('2026-08-24T03:00:00.000Z')
  })

  it('domingo às 23h em São Paulo ainda é a semana que termina', () => {
    // 23/08 23:30 em São Paulo = 24/08 02:30 UTC, já segunda em UTC.
    expect(semanaIso(new Date('2026-08-24T02:30:00Z')).semana).toBe(34)
  })

  it('a semana pertence ao ano da sua quinta-feira', () => {
    // 01/01/2027 é sexta: ainda é a última semana de 2026.
    expect(semanaIso(new Date('2027-01-01T15:00:00Z'))).toEqual({ ano: 2026, semana: 53 })
    // 29/12/2025 é segunda: já é a primeira semana de 2026.
    expect(semanaIso(new Date('2025-12-29T15:00:00Z'))).toEqual({ ano: 2026, semana: 1 })
  })

  it('sabe quais anos têm 53 semanas', () => {
    expect(semanasNoAno(2026)).toBe(53)
    expect(semanasNoAno(2025)).toBe(52)
  })
})

describe('lerPeriodo', () => {
  it('sem parâmetro, é a semana atual', () => {
    const p = lerPeriodo({}, AGORA)
    expect(p.tipo).toBe('semana')
    expect(p.rotulo).toBe('Semana 2026-34')
    expect(p.detalhe).toBe('17/08 – 23/08')
    expect(p.aviso).toBeUndefined()
  })

  it('anda para trás e para a frente, virando o ano', () => {
    const p = lerPeriodo({ periodo: 'semana', ref: '2026-W53' }, AGORA)
    expect(p.proximo).toEqual({ periodo: 'semana', ref: '2027-W01' })
    expect(lerPeriodo({ periodo: 'semana', ref: '2026-W01' }, AGORA).anterior).toEqual({
      periodo: 'semana',
      ref: '2025-W52',
    })
  })

  it('mês cobre do dia 1 ao último, no fuso local', () => {
    const p = lerPeriodo({ periodo: 'mes', ref: '2026-12' }, AGORA)
    expect(p.rotulo).toBe('Dezembro de 2026')
    expect(p.inicio.toISOString()).toBe('2026-12-01T03:00:00.000Z')
    expect(p.fim.toISOString()).toBe('2027-01-01T03:00:00.000Z')
    expect(p.proximo).toEqual({ periodo: 'mes', ref: '2027-01' })
  })

  it('ano vai de 1º de janeiro a 1º de janeiro', () => {
    const p = lerPeriodo({ periodo: 'ano', ref: '2026' }, AGORA)
    expect(p.inicio.toISOString()).toBe('2026-01-01T03:00:00.000Z')
    expect(p.fim.toISOString()).toBe('2027-01-01T03:00:00.000Z')
  })

  it('personalizado inclui o último dia, e anda pelo mesmo número de dias', () => {
    const p = lerPeriodo({ periodo: 'personalizado', de: '2026-08-01', ate: '2026-08-10' }, AGORA)
    expect(p.rotulo).toBe('01/08/2026 a 10/08/2026')
    expect(p.detalhe).toBe('10 dias')
    expect(p.fim.toISOString()).toBe('2026-08-11T03:00:00.000Z')
    expect(p.anterior).toEqual({ periodo: 'personalizado', de: '2026-07-22', ate: '2026-07-31' })
    expect(p.proximo).toEqual({ periodo: 'personalizado', de: '2026-08-11', ate: '2026-08-20' })
  })

  it('"atual" leva ao mesmo tipo de período no ponto de hoje', () => {
    expect(lerPeriodo({ periodo: 'mes', ref: '2025-01' }, AGORA).atual).toEqual({
      periodo: 'mes',
      ref: '2026-08',
    })
  })

  it('entrada inválida volta para a semana atual, avisando, sem lançar', () => {
    const casos = [
      { periodo: 'semana', ref: '2026-W54' },
      { periodo: 'mes', ref: '2026-13' },
      { periodo: 'ano', ref: 'vinte' },
      { periodo: 'personalizado', de: '2026-02-31', ate: '2026-03-10' },
      { periodo: 'personalizado', de: '2026-08-10', ate: '2026-08-01' },
      { periodo: 'personalizado', de: '2020-01-01', ate: '2026-01-01' },
    ]
    for (const params of casos) {
      const p = lerPeriodo(params, AGORA)
      expect(p.rotulo).toBe('Semana 2026-34')
      expect(p.aviso).toBeTruthy()
    }
  })

  it('tipo desconhecido é tratado como semana', () => {
    expect(lerPeriodo({ periodo: 'trimestre' }, AGORA).tipo).toBe('semana')
  })
})

describe('queryDoPeriodo', () => {
  it('não leva chave vazia para a URL', () => {
    expect(queryDoPeriodo({ periodo: 'semana', ref: '2026-W34' })).toBe(
      'periodo=semana&ref=2026-W34',
    )
    expect(queryDoPeriodo({ periodo: 'personalizado', de: '2026-08-01', ate: '2026-08-02' })).toBe(
      'periodo=personalizado&de=2026-08-01&ate=2026-08-02',
    )
  })
})

describe('fatiasDoPeriodo', () => {
  it('uma semana vem com as sete anteriores, terminando nela', () => {
    const fatias = fatiasDoPeriodo(lerPeriodo({}, AGORA))
    expect(fatias.map((f) => f.rotulo)).toEqual([
      '2026-27',
      '2026-28',
      '2026-29',
      '2026-30',
      '2026-31',
      '2026-32',
      '2026-33',
      '2026-34',
    ])
  })

  it('o mês mostra as semanas, recortadas nas bordas', () => {
    const p = lerPeriodo({ periodo: 'mes', ref: '2026-08' }, AGORA)
    const fatias = fatiasDoPeriodo(p)
    // 01/08/2026 é sábado, na semana 31; 31/08 é segunda, na semana 36.
    expect(fatias[0]!.rotulo).toBe('2026-31')
    expect(fatias.at(-1)!.rotulo).toBe('2026-36')
    expect(fatias[0]!.inicio).toEqual(p.inicio)
    expect(fatias.at(-1)!.fim).toEqual(p.fim)
  })

  it('o ano mostra os doze meses', () => {
    const fatias = fatiasDoPeriodo(lerPeriodo({ periodo: 'ano', ref: '2026' }, AGORA))
    expect(fatias).toHaveLength(12)
    expect(fatias[0]!.rotulo).toBe('jan')
  })

  it('personalizado longo troca semanas por meses', () => {
    const curto = lerPeriodo(
      { periodo: 'personalizado', de: '2026-08-01', ate: '2026-08-31' },
      AGORA,
    )
    const longo = lerPeriodo(
      { periodo: 'personalizado', de: '2026-01-01', ate: '2026-08-31' },
      AGORA,
    )
    expect(fatiasDoPeriodo(curto)[0]!.chave).toMatch(/^\d{4}-\d{2}$/)
    expect(fatiasDoPeriodo(curto)).toHaveLength(6)
    expect(fatiasDoPeriodo(longo)).toHaveLength(8)
    expect(fatiasDoPeriodo(longo)[0]!.rotulo).toBe('jan')
  })

  it('as fatias cobrem o período sem buraco nem sobreposição', () => {
    const p = lerPeriodo({ periodo: 'mes', ref: '2026-08' }, AGORA)
    const fatias = fatiasDoPeriodo(p)
    for (let i = 1; i < fatias.length; i++) {
      expect(fatias[i]!.inicio).toEqual(fatias[i - 1]!.fim)
    }
  })
})

describe('trocarTipo', () => {
  const semana34 = lerPeriodo({ periodo: 'semana', ref: '2026-W34' }, AGORA)

  it('mantém o ponto que está na tela', () => {
    expect(trocarTipo(semana34, 'mes')).toEqual({ periodo: 'mes', ref: '2026-08' })
    expect(trocarTipo(semana34, 'ano')).toEqual({ periodo: 'ano', ref: '2026' })
  })

  it('personalizado começa com as datas do período atual, último dia incluído', () => {
    expect(trocarTipo(semana34, 'personalizado')).toEqual({
      periodo: 'personalizado',
      de: '2026-08-17',
      ate: '2026-08-23',
    })
  })

  it('do mês para a semana, vai para a semana do dia 1º', () => {
    const agosto = lerPeriodo({ periodo: 'mes', ref: '2026-08' }, AGORA)
    expect(trocarTipo(agosto, 'semana')).toEqual({ periodo: 'semana', ref: '2026-W31' })
  })
})
