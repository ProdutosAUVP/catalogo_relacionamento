'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { autorizarAction } from '@/lib/auth-guards'
import { fotoDoFormulario } from '@/lib/arquivos'
import { membroSchema, perguntaSchema, statusDaSemanaSchema } from '@/lib/validators/logistica'
import { comoErro, primeiroErro, type ResultadoDaAction } from './comuns'

/**
 * O que a Logística mantém à mão no dashboard: o status da semana, a equipe e
 * o FAQ. Nada aqui apaga: membro e pergunta são desativados, e o status manual
 * volta ao automático anulando a situação.
 */

function revalidarLogistica() {
  revalidatePath('/logistica', 'layout')
}

export async function definirStatusDaSemana(dados: FormData): Promise<ResultadoDaAction> {
  try {
    const usuario = await autorizarAction('logistica.gerenciar')

    const validado = statusDaSemanaSchema.safeParse({
      ano: dados.get('ano'),
      semana: dados.get('semana'),
      situacao: dados.get('situacao'),
      observacao: dados.get('observacao'),
    })
    if (!validado.success) return primeiroErro(validado.error)

    const { ano, semana, situacao, observacao } = validado.data
    // Voltar ao automático não leva observação: ela explicava a escolha manual.
    const registro = {
      situacao,
      observacao: situacao ? observacao : null,
      definidoPorId: usuario.id,
      definidoEm: new Date(),
    }

    await db.statusOperacionalSemana.upsert({
      where: { ano_semana: { ano, semana } },
      create: { ano, semana, ...registro },
      update: registro,
    })

    revalidarLogistica()
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}

export async function salvarMembro(dados: FormData): Promise<ResultadoDaAction> {
  try {
    const usuario = await autorizarAction('logistica.gerenciar')

    const foto = await fotoDoFormulario(dados, usuario.id)
    if (!foto.ok) return { ok: false, erro: foto.erro, campo: 'foto' }

    const validado = membroSchema.safeParse({
      nome: dados.get('nome'),
      funcao: dados.get('funcao'),
      descricao: dados.get('descricao'),
      email: dados.get('email'),
      ordem: dados.get('ordem'),
    })
    if (!validado.success) return primeiroErro(validado.error)

    const id = String(dados.get('id') ?? '')
    const registro = { ...validado.data, fotoUrl: foto.url }
    if (id) {
      await db.membroEquipe.update({ where: { id }, data: registro })
    } else {
      await db.membroEquipe.create({ data: registro })
    }

    revalidarLogistica()
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}

export async function alternarMembro(id: string, ativo: boolean): Promise<ResultadoDaAction> {
  try {
    await autorizarAction('logistica.gerenciar')
    await db.membroEquipe.update({ where: { id }, data: { ativo } })
    revalidarLogistica()
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}

export async function salvarPergunta(dados: FormData): Promise<ResultadoDaAction> {
  try {
    await autorizarAction('logistica.gerenciar')

    const validado = perguntaSchema.safeParse({
      pergunta: dados.get('pergunta'),
      resposta: dados.get('resposta'),
      ordem: dados.get('ordem'),
    })
    if (!validado.success) return primeiroErro(validado.error)

    const id = String(dados.get('id') ?? '')
    if (id) {
      await db.perguntaFrequente.update({ where: { id }, data: validado.data })
    } else {
      await db.perguntaFrequente.create({ data: validado.data })
    }

    revalidarLogistica()
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}

export async function alternarPergunta(id: string, ativo: boolean): Promise<ResultadoDaAction> {
  try {
    await autorizarAction('logistica.gerenciar')
    await db.perguntaFrequente.update({ where: { id }, data: { ativo } })
    revalidarLogistica()
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}
