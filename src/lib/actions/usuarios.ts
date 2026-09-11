'use server'

import { revalidatePath } from 'next/cache'
import { Perfil, Prisma } from '@prisma/client'
import { z } from 'zod'
import { db } from '@/lib/db'
import { autorizarAction } from '@/lib/auth-guards'
import { comoErro, primeiroErro, type ResultadoDaAction } from './comuns'

/**
 * Edição de usuário: perfil, limite mensal e ativação.
 *
 * Usuário não é criado aqui, ele entra sozinho no primeiro login pelo SSO,
 * como consultor. Esta tela é onde o Admin promove e define teto de gasto sem
 * passar por TI.
 */

const usuarioSchema = z.object({
  id: z.string().min(1),
  perfil: z.nativeEnum(Perfil),
  limiteMensal: z.preprocess((v) => {
    if (v === null || v === undefined || v === '') return null
    const texto = String(v).trim().replace(/\./g, '').replace(',', '.')
    const numero = Number(texto)
    return Number.isFinite(numero) ? numero : v
  }, z.number().min(0, 'O limite não pode ser negativo.').nullable()),
  ativo: z.boolean(),
})

export async function salvarUsuario(dados: FormData): Promise<ResultadoDaAction> {
  try {
    const admin = await autorizarAction('usuario.gerenciar')

    const validado = usuarioSchema.safeParse({
      id: String(dados.get('id') ?? ''),
      perfil: String(dados.get('perfil') ?? ''),
      limiteMensal: dados.get('limiteMensal'),
      ativo: dados.get('ativo') !== 'off',
    })
    if (!validado.success) return primeiroErro(validado.error)

    const { id, perfil, limiteMensal, ativo } = validado.data

    // Um Admin que se rebaixa ou se desativa fica sem como voltar atrás.
    if (id === admin.id && (perfil !== Perfil.admin || !ativo)) {
      return {
        ok: false,
        erro: 'Você não pode retirar o próprio acesso de Admin. Peça a outro Admin.',
      }
    }

    // Precisa sobrar alguém capaz de promover: sem Admin ativo, a única saída
    // seria mexer no banco à mão.
    if (perfil !== Perfil.admin || !ativo) {
      const outrosAdmins = await db.usuario.count({
        where: { perfil: Perfil.admin, ativo: true, id: { not: id } },
      })
      if (outrosAdmins === 0) {
        return { ok: false, erro: 'Este é o último Admin ativo. Promova outra pessoa antes.' }
      }
    }

    await db.usuario.update({
      where: { id },
      data: {
        perfil,
        ativo,
        limiteMensal: limiteMensal === null ? null : new Prisma.Decimal(limiteMensal),
      },
    })

    revalidatePath('/admin/usuarios')
    revalidatePath('/')
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}
