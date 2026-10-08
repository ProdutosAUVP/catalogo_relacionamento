import { describe, expect, it } from 'vitest'
import type { FaseOperacional, PrioridadeDemanda } from '@prisma/client'
import { lerPeriodo, fatiasDoPeriodo } from '@/lib/periodo'
import {
  compararNaTrilha,
  estavaAberta,
  estavaAtrasada,
  formatarDuracao,
  horasPorProduto,
  oQueEstaSendoEnviado,
  SEM_DEPARTAMENTO,
  variacao,
  volumePorDepartamento,
  volumePorFatia,
} from './demandas'

const AGORA = new Date('2026-08-19T15:00:00Z')
const dia = (d: string) => new Date(`${d}T15:00:00Z`)

describe('oQueEstaSendoEnviado', () => {
  it('mais de um item vira "Kit", com a lista guardada para o detalhe', () => {
    expect(oQueEstaSendoEnviado(['Camiseta', 'Caneca'], 'AUVP Escola')).toEqual({
      rotulo: 'Kit',
      itens: ['Camiseta', 'Caneca'],
    })
  })

  it('um item é o próprio item', () => {
    expect(oQueEstaSendoEnviado(['Livro'], 'AUVP Escola').rotulo).toBe('Livro')
  })

  it('sem item, vale o produto; item em branco não conta', () => {
    expect(oQueEstaSendoEnviado(['  '], 'Consultoria').rotulo).toBe('Consultoria')
    expect(oQueEstaSendoEnviado([], null).rotulo).toBe('Não informado')
  })
})

describe('aberta e atrasada', () => {
  const base = {
    solicitadaEm: dia('2026-08-10'),
    previsaoConclusao: dia('2026-08-15'),
    concluidaEm: null,
  }

  it('passou da previsão sem concluir: atrasada', () => {
    expect(estavaAtrasada(base, AGORA)).toBe(true)
  })

  it('concluída não está atrasada, nem se terminou depois do prazo', () => {
    expect(estavaAtrasada({ ...base, concluidaEm: dia('2026-08-18') }, AGORA)).toBe(false)
  })

  it('sem previsão não conta como atrasada; a trilha aponta a falta à parte', () => {
    expect(estavaAtrasada({ ...base, previsaoConclusao: null }, AGORA)).toBe(false)
  })

  it('olhada no passado, conta como estava naquele instante', () => {
    const fimDaSemana32 = new Date('2026-08-10T03:00:00Z')
    const tarde = {
      ...base,
      solicitadaEm: dia('2026-08-03'),
      previsaoConclusao: dia('2026-08-05'),
      concluidaEm: dia('2026-08-12'),
    }
    expect(estavaAtrasada(tarde, fimDaSemana32)).toBe(true)
    expect(estavaAtrasada(tarde, AGORA)).toBe(false)
  })

  it('ainda não pedida não está aberta', () => {
    expect(estavaAberta({ ...base, solicitadaEm: dia('2026-08-25') }, AGORA)).toBe(false)
  })
})

describe('ordem da trilha', () => {
  type D = {
    id: string
    prioridade: PrioridadeDemanda
    fase: FaseOperacional
    solicitadaEm: Date
    previsaoConclusao: Date | null
    concluidaEm: Date | null
  }
  const d = (id: string, resto: Partial<D>): D => ({
    id,
    prioridade: 'normal',
    fase: 'em_execucao',
    solicitadaEm: dia('2026-08-10'),
    previsaoConclusao: dia('2026-08-25'),
    concluidaEm: null,
    ...resto,
  })

  it('prioritárias no topo, atrasadas antes, sem previsão no fim do grupo, concluídas no fim', () => {
    const lista = [
      d('concluida', { fase: 'concluido', concluidaEm: dia('2026-08-18') }),
      d('normal-sem-previsao', { previsaoConclusao: null }),
      d('normal-cedo', { previsaoConclusao: dia('2026-08-21') }),
      d('alta-em-dia', { prioridade: 'alta' }),
      d('alta-atrasada', { prioridade: 'alta', previsaoConclusao: dia('2026-08-12') }),
      d('urgente', { prioridade: 'urgente' }),
    ]
    expect(lista.sort(compararNaTrilha<D>(AGORA)).map((x) => x.id)).toEqual([
      'alta-atrasada',
      'urgente',
      'alta-em-dia',
      'normal-cedo',
      'normal-sem-previsao',
      'concluida',
    ])
  })
})

describe('volume por departamento', () => {
  it('conta, ordena do maior para o menor e soma 100%', () => {
    const linhas = volumePorDepartamento([
      { subsidiaria: 'Do Not Scare', departamento: 'Produto & CX' },
      { subsidiaria: 'Do Not Scare', departamento: 'Produto & CX' },
      { subsidiaria: 'Do Not Scare', departamento: 'Produto & CX' },
      { subsidiaria: 'AUVP Capital', departamento: 'Consultoria' },
    ])
    expect(linhas.map((l) => [l.departamento, l.quantidade])).toEqual([
      ['Produto & CX', 3],
      ['Consultoria', 1],
    ])
    expect(linhas.reduce((s, l) => s + l.percentual, 0)).toBeCloseTo(100)
  })

  it('departamento vazio vai para um balde nomeado, não some', () => {
    const [linha] = volumePorDepartamento([{ subsidiaria: null, departamento: '  ' }])
    expect(linha!.departamento).toBe(SEM_DEPARTAMENTO)
  })

  it('sem demanda, sem linha', () => {
    expect(volumePorDepartamento([])).toEqual([])
  })
})

describe('horas por produto', () => {
  it('soma minutos, conta envios e tira a média por envio', () => {
    const [holding, consultoria] = horasPorProduto([
      { produto: 'Holding', minutosApontados: 600 },
      { produto: 'Holding', minutosApontados: 480 },
      { produto: 'Consultoria', minutosApontados: 26 },
      { produto: 'The Brain', minutosApontados: 0 },
    ])
    expect(holding).toEqual({ produto: 'Holding', minutos: 1080, envios: 2, mediaPorEnvio: 540 })
    expect(consultoria!.produto).toBe('Consultoria')
  })

  it('produto sem apontamento fica de fora', () => {
    expect(horasPorProduto([{ produto: 'The Brain', minutosApontados: 0 }])).toEqual([])
  })
})

describe('formatarDuracao', () => {
  it('escreve como a proposta', () => {
    expect(formatarDuracao(26)).toBe('26 min')
    expect(formatarDuracao(102)).toBe('1h42')
    expect(formatarDuracao(1080)).toBe('18h')
  })
})

describe('volume por fatia', () => {
  it('cada demanda cai em exatamente uma semana', () => {
    const fatias = fatiasDoPeriodo(lerPeriodo({}, AGORA))
    const contagem = volumePorFatia(
      [
        { solicitadaEm: new Date('2026-08-17T03:00:00Z') }, // segunda 00:00, semana 34
        { solicitadaEm: new Date('2026-08-17T02:59:59Z') }, // domingo 23:59, semana 33
      ],
      fatias,
    )
    expect(contagem.at(-1)).toBe(1)
    expect(contagem.at(-2)).toBe(1)
  })
})

describe('variacao', () => {
  it('sem base não inventa percentual', () => {
    expect(variacao(5, 0)).toEqual({ diferenca: 5, percentual: null })
    expect(variacao(30, 20)).toEqual({ diferenca: 10, percentual: 50 })
  })
})
