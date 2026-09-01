import { db } from '@/lib/db'
import { normalizarCpf } from '@/lib/cpf'
import type { ClienteEncontrado, ClienteProvider } from '../types'

/** Implementação do V1: clientes cadastrados e importados no próprio Postgres. */

const CAMPOS = {
  id: true,
  nome: true,
  cpf: true,
  telefone: true,
  email: true,
  salesforceId: true,
  origem: true,
} as const

export const clientesLocal: ClienteProvider = {
  nome: 'local',

  async buscarPorCpf(cpf: string): Promise<ClienteEncontrado | null> {
    const limpo = normalizarCpf(cpf)
    if (limpo.length !== 11) return null

    return db.cliente.findUnique({ where: { cpf: limpo }, select: CAMPOS })
  },

  async buscarPorTexto(termo: string, limite = 10): Promise<ClienteEncontrado[]> {
    const busca = termo.trim()
    if (busca.length < 3) return []

    // Um termo só de dígitos é tratado como CPF parcial; o resto, como nome.
    const somenteDigitos = normalizarCpf(busca)
    const where =
      somenteDigitos.length >= 3 && somenteDigitos.length === busca.replace(/[.\-\s]/g, '').length
        ? { cpf: { startsWith: somenteDigitos } }
        : { nome: { contains: busca, mode: 'insensitive' as const } }

    return db.cliente.findMany({
      where,
      select: CAMPOS,
      orderBy: { nome: 'asc' },
      take: limite,
    })
  },

  async obter(id: string): Promise<ClienteEncontrado | null> {
    return db.cliente.findUnique({ where: { id }, select: CAMPOS })
  },
}
