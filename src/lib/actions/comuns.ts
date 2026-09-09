import { Prisma } from '@prisma/client'
import type { ZodError } from 'zod'
import { SemPermissaoError } from '@/lib/auth-guards'

/**
 * O que toda server action devolve.
 *
 * Nenhuma delas lança para o cliente: a tela precisa mostrar a mensagem no
 * campo certo, e uma exceção atravessando a fronteira do servidor chega como
 * erro genérico em produção.
 */
export type ResultadoDaAction<T = undefined> =
  { ok: true; dados: T } | { ok: false; erro: string; campo?: string }

export function comoErro(e: unknown): { ok: false; erro: string } {
  if (e instanceof SemPermissaoError) return { ok: false, erro: e.message }

  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === 'P2002') return { ok: false, erro: 'Já existe um registro com esse valor.' }
    if (e.code === 'P2025') return { ok: false, erro: 'Registro não encontrado.' }
    if (e.code === 'P2003') {
      return { ok: false, erro: 'Este registro está em uso e não pode ser removido.' }
    }
  }

  console.error(e)
  return { ok: false, erro: 'Não foi possível concluir. Tente de novo.' }
}

/** Primeiro erro do Zod, com o campo, para a tela destacar onde foi. */
export function primeiroErro(erro: ZodError): { ok: false; erro: string; campo?: string } {
  const primeiro = erro.issues[0]
  return {
    ok: false,
    erro: primeiro?.message ?? 'Dados inválidos.',
    campo: primeiro?.path.join('.'),
  }
}
