import { describe, expect, it } from 'vitest'
import { LIMIARES, statusDaSemana, sugerirSituacao } from './status-operacional'

const tranquila = { volume: 8, mediaAnterior: 8, abertas: 10, atrasadas: 0 }

describe('sugestão automática', () => {
  it('volume habitual e nada atrasado: normal', () => {
    expect(sugerirSituacao(tranquila).situacao).toBe('normal')
  })

  it('volume bem acima da média, tudo em dia: alto volume, dizendo quanto', () => {
    const s = sugerirSituacao({ ...tranquila, volume: 26, mediaAnterior: 10 })
    expect(s.situacao).toBe('alto_volume')
    expect(s.motivo).toContain('2,6×')
  })

  it('pico pequeno não é alto volume: 4 contra média de 1', () => {
    expect(sugerirSituacao({ ...tranquila, volume: 4, mediaAnterior: 1 }).situacao).toBe('normal')
  })

  it('sem histórico, alto volume só pelo mínimo absoluto', () => {
    expect(
      sugerirSituacao({ ...tranquila, volume: LIMIARES.altoVolumeMinimo, mediaAnterior: 0 })
        .situacao,
    ).toBe('alto_volume')
  })

  it('uma atrasada já é risco, mesmo com volume baixo', () => {
    const s = sugerirSituacao({ ...tranquila, atrasadas: 1 })
    expect(s.situacao).toBe('risco_de_atraso')
    expect(s.motivo).toBe('1 demanda passou da previsão.')
  })

  it('atraso pesa mais que volume', () => {
    expect(
      sugerirSituacao({ volume: 40, mediaAnterior: 10, abertas: 30, atrasadas: 1 }).situacao,
    ).toBe('risco_de_atraso')
  })

  it('crítica pelo número absoluto de atrasadas...', () => {
    expect(sugerirSituacao({ ...tranquila, abertas: 50, atrasadas: 3 }).situacao).toBe('critica')
  })

  it('...ou pela fração das abertas', () => {
    expect(sugerirSituacao({ ...tranquila, abertas: 6, atrasadas: 2 }).situacao).toBe('critica')
  })

  it('com poucas abertas, uma atrasada é risco, não crise', () => {
    expect(sugerirSituacao({ ...tranquila, abertas: 3, atrasadas: 1 }).situacao).toBe(
      'risco_de_atraso',
    )
  })
})

describe('status da semana', () => {
  const sugestao = sugerirSituacao({ ...tranquila, atrasadas: 1 })

  it('sem definição manual, vale a sugestão', () => {
    const s = statusDaSemana(null, sugestao)
    expect(s.origem).toBe('automatico')
    expect(s.situacao).toBe('risco_de_atraso')
  })

  it('a definição manual vence, e a sugestão continua disponível', () => {
    const s = statusDaSemana(
      {
        situacao: 'alto_volume',
        observacao: 'Evento da Escola',
        definidoPor: 'Logística AUVP',
        definidoEm: new Date('2026-08-18T12:00:00Z'),
      },
      sugestao,
    )
    expect(s.origem).toBe('manual')
    expect(s.situacao).toBe('alto_volume')
    expect(s.motivo).toBe('Evento da Escola')
    expect(s.sugestao.situacao).toBe('risco_de_atraso')
  })

  it('situação nula é "voltou ao automático"', () => {
    const s = statusDaSemana(
      { situacao: null, observacao: null, definidoPor: 'x', definidoEm: new Date() },
      sugestao,
    )
    expect(s.origem).toBe('automatico')
  })
})
