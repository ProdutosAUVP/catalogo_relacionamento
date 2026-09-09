'use server'

import { revalidatePath } from 'next/cache'
import { OrigemCliente } from '@prisma/client'
import { db } from '@/lib/db'
import { autorizarAction } from '@/lib/auth-guards'
import { clienteSchema } from '@/lib/validators/cliente'
import { lerCsvDeClientes, type ResumoDaImportacao } from '@/lib/importacao-clientes'
import { comoErro, primeiroErro, type ResultadoDaAction } from './comuns'

/**
 * CRUD de cliente e importação por CSV.
 *
 * Cliente não é excluído: ele aparece em solicitações antigas, que precisam
 * continuar legíveis. A tela edita e o histórico permanece.
 */

export async function salvarCliente(dados: FormData): Promise<ResultadoDaAction<{ id: string }>> {
  try {
    const usuario = await autorizarAction('cliente.gerenciar')

    const validado = clienteSchema.safeParse({
      nome: String(dados.get('nome') ?? ''),
      cpf: String(dados.get('cpf') ?? ''),
      telefone: dados.get('telefone'),
      email: dados.get('email'),
      salesforceId: dados.get('salesforceId'),
    })
    if (!validado.success) return primeiroErro(validado.error)

    const id = String(dados.get('id') ?? '')

    // O CPF é a chave de deduplicação: se já existe, a tela está editando esse
    // cliente, não criando outro.
    const existente = await db.cliente.findUnique({
      where: { cpf: validado.data.cpf },
      select: { id: true },
    })
    if (existente && existente.id !== id) {
      return { ok: false, erro: 'Já existe um cliente com esse CPF.', campo: 'cpf' }
    }

    const cliente = id
      ? await db.cliente.update({ where: { id }, data: validado.data, select: { id: true } })
      : await db.cliente.create({
          data: { ...validado.data, criadoPor: usuario.id, origem: OrigemCliente.manual },
          select: { id: true },
        })

    revalidatePath('/admin/clientes')
    return { ok: true, dados: { id: cliente.id } }
  } catch (e) {
    return comoErro(e)
  }
}

/**
 * Importa clientes de um CSV.
 *
 * Linha com CPF que já existe **atualiza** o cadastro em vez de criar outro —
 * o arquivo costuma ser um recorte de planilha, e reimportar não pode duplicar
 * a base. As linhas inválidas não derrubam a importação: elas voltam
 * numeradas, com o motivo, para quem exportou corrigir.
 */
export async function importarClientes(
  dados: FormData,
): Promise<ResultadoDaAction<ResumoDaImportacao>> {
  try {
    const usuario = await autorizarAction('cliente.gerenciar')

    const arquivo = dados.get('arquivo')
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      return { ok: false, erro: 'Escolha um arquivo CSV.', campo: 'arquivo' }
    }
    if (arquivo.size > 2 * 1024 * 1024) {
      return { ok: false, erro: 'O arquivo passa de 2 MB. Divida a planilha.', campo: 'arquivo' }
    }

    const leitura = lerCsvDeClientes(await arquivo.text())

    // Quem já existe é contado antes: depois do upsert não dá mais para
    // distinguir criado de atualizado, e é essa a diferença que a pessoa quer
    // ver ao reimportar uma planilha.
    const jaExistiam = new Set(
      (
        await db.cliente.findMany({
          where: { cpf: { in: leitura.validas.map((l) => l.cpf) } },
          select: { cpf: true },
        })
      ).map((c) => c.cpf),
    )

    for (const linha of leitura.validas) {
      await db.cliente.upsert({
        where: { cpf: linha.cpf },
        // A importação não apaga o que já estava lá: campo vazio na planilha
        // mantém o valor do cadastro.
        update: {
          nome: linha.nome,
          ...(linha.telefone ? { telefone: linha.telefone } : {}),
          ...(linha.email ? { email: linha.email } : {}),
        },
        create: {
          ...linha,
          origem: OrigemCliente.importacao,
          criadoPor: usuario.id,
        },
      })
    }

    revalidatePath('/admin/clientes')
    return {
      ok: true,
      dados: {
        total: leitura.total,
        novas: leitura.validas.filter((l) => !jaExistiam.has(l.cpf)).length,
        atualizadas: leitura.validas.filter((l) => jaExistiam.has(l.cpf)).length,
        erros: leitura.erros,
      },
    }
  } catch (e) {
    return comoErro(e)
  }
}
