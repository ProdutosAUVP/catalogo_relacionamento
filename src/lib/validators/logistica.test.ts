import { describe, expect, it } from 'vitest'
import { membroSchema, perguntaSchema, statusDaSemanaSchema } from './logistica'

describe('status da semana', () => {
  it('aceita a definição manual com observação', () => {
    const r = statusDaSemanaSchema.parse({
      ano: '2026',
      semana: '34',
      situacao: 'alto_volume',
      observacao: ' Evento da Escola ',
    })
    expect(r).toEqual({
      ano: 2026,
      semana: 34,
      situacao: 'alto_volume',
      observacao: 'Evento da Escola',
    })
  })

  it('"automatico" vira situação nula, e observação vazia vira nula', () => {
    const r = statusDaSemanaSchema.parse({
      ano: 2026,
      semana: 34,
      situacao: 'automatico',
      observacao: '',
    })
    expect(r.situacao).toBeNull()
    expect(r.observacao).toBeNull()
  })

  it('recusa semana fora da ISO e situação desconhecida', () => {
    expect(
      statusDaSemanaSchema.safeParse({ ano: 2026, semana: 54, situacao: 'normal' }).success,
    ).toBe(false)
    expect(
      statusDaSemanaSchema.safeParse({ ano: 2026, semana: 3, situacao: 'otima' }).success,
    ).toBe(false)
    expect(
      statusDaSemanaSchema.safeParse({ ano: 2025, semana: 53, situacao: 'normal' }).success,
    ).toBe(false)
    expect(
      statusDaSemanaSchema.safeParse({ ano: 2026, semana: 53, situacao: 'normal' }).success,
    ).toBe(true)
  })
})

describe('membro da equipe', () => {
  it('exige nome e função; o resto é opcional', () => {
    expect(membroSchema.safeParse({ nome: 'Ana', funcao: '' }).success).toBe(false)
    const r = membroSchema.parse({ nome: 'Ana', funcao: 'Coordenação', descricao: '', email: '' })
    expect(r).toEqual({
      nome: 'Ana',
      funcao: 'Coordenação',
      descricao: null,
      email: null,
      ordem: 0,
    })
  })
})

describe('pergunta frequente', () => {
  it('exige pergunta e resposta', () => {
    expect(perguntaSchema.safeParse({ pergunta: 'Prazo?', resposta: '' }).success).toBe(false)
    expect(
      perguntaSchema.parse({ pergunta: 'Qual o prazo?', resposta: '5 dias úteis.' }).ordem,
    ).toBe(0)
  })
})
