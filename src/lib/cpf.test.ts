import { describe, expect, it } from 'vitest'
import { cpfValido, formatarCpf, mascararCpf, normalizarCpf } from './cpf'

describe('normalização', () => {
  it('remove máscara para que a deduplicação não dependa de formatação', () => {
    expect(normalizarCpf('529.982.247-25')).toBe('52998224725')
    expect(normalizarCpf('529 982 247 25')).toBe('52998224725')
    expect(normalizarCpf('52998224725')).toBe('52998224725')
  })
})

describe('validação', () => {
  it('aceita CPF com dígitos verificadores corretos', () => {
    expect(cpfValido('529.982.247-25')).toBe(true)
    expect(cpfValido('111.444.777-35')).toBe(true)
  })

  it('recusa dígito verificador errado', () => {
    expect(cpfValido('529.982.247-26')).toBe(false)
  })

  it('recusa sequência repetida, que passa no cálculo mas não é CPF', () => {
    expect(cpfValido('111.111.111-11')).toBe(false)
    expect(cpfValido('000.000.000-00')).toBe(false)
  })

  it('recusa tamanho errado', () => {
    expect(cpfValido('5299822472')).toBe(false)
    expect(cpfValido('')).toBe(false)
  })
})

describe('exibição', () => {
  it('formata com máscara', () => {
    expect(formatarCpf('52998224725')).toBe('529.982.247-25')
  })

  it('mascara para quem não pode ver o dado completo', () => {
    expect(mascararCpf('52998224725')).toBe('***.982.247-**')
  })
})
