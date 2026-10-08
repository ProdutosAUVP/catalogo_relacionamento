import { describe, expect, it } from 'vitest'
import { Perfil } from '@prisma/client'
import { USUARIOS_DA_DEMONSTRACAO, usuarioDaDemonstracao } from './demonstracao'

describe('usuários da demonstração', () => {
  it('há um de cada perfil, para mostrar o que cada um enxerga', () => {
    const perfis = new Set(USUARIOS_DA_DEMONSTRACAO.map((u) => u.perfil))
    expect([...perfis].sort()).toEqual(Object.values(Perfil).sort())
  })

  it('aceita só e-mail da lista, sem diferença de caixa ou espaço', () => {
    expect(usuarioDaDemonstracao(' Bia@AUVP.com.br ')?.perfil).toBe(Perfil.admin)
    expect(usuarioDaDemonstracao('qualquer@auvp.com.br')).toBeNull()
    expect(usuarioDaDemonstracao(undefined)).toBeNull()
  })
})
