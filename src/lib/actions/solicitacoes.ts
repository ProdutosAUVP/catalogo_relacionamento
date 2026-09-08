'use server'

import { revalidatePath } from 'next/cache'
import { Prisma, StatusSolicitacao } from '@prisma/client'
import { db } from '@/lib/db'
import { autorizarAction, SemPermissaoError } from '@/lib/auth-guards'
import { proximoCodigo } from '@/lib/codigo'
import { totalDosItens } from '@/lib/money'
import { normalizarCpf } from '@/lib/cpf'
import { validarMudancaDeStatus } from '@/lib/status'
import { solicitacaoSchema, mudancaDeStatusSchema } from '@/lib/validators/solicitacao'
import { clienteSchema } from '@/lib/validators/cliente'

/**
 * Escritas de solicitação.
 *
 * Toda ação começa por `autorizarAction`: esconder um botão não é controle de
 * acesso, e estas funções são endpoints acessíveis diretamente.
 */

export type ResultadoDaAction<T = undefined> =
  { ok: true; dados: T } | { ok: false; erro: string; campo?: string }

function comoErro(e: unknown): { ok: false; erro: string } {
  if (e instanceof SemPermissaoError) return { ok: false, erro: e.message }

  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
    return { ok: false, erro: 'Já existe um registro com esse valor.' }
  }

  console.error(e)
  return { ok: false, erro: 'Não foi possível concluir. Tente de novo.' }
}

export type ClienteEncontrado = {
  id: string
  nome: string
  cpf: string
  telefone: string | null
  email: string | null
}

/**
 * Busca um cliente por CPF.
 *
 * O CPF é a chave de deduplicação: a tela usa isto para oferecer o cliente
 * existente em vez de criar duplicata.
 */
export async function buscarClientePorCpf(
  cpf: string,
): Promise<ResultadoDaAction<ClienteEncontrado | null>> {
  try {
    await autorizarAction('solicitacao.criar')

    const limpo = normalizarCpf(cpf)
    if (limpo.length !== 11) return { ok: true, dados: null }

    const cliente = await db.cliente.findUnique({
      where: { cpf: limpo },
      select: { id: true, nome: true, cpf: true, telefone: true, email: true },
    })

    return { ok: true, dados: cliente }
  } catch (e) {
    return comoErro(e)
  }
}

/** Cadastra um cliente novo a partir do formulário de solicitação. */
export async function criarCliente(entrada: unknown): Promise<ResultadoDaAction<{ id: string }>> {
  try {
    const usuario = await autorizarAction('solicitacao.criar')

    const validado = clienteSchema.safeParse(entrada)
    if (!validado.success) {
      const primeiro = validado.error.issues[0]
      return {
        ok: false,
        erro: primeiro?.message ?? 'Dados inválidos.',
        campo: String(primeiro?.path[0] ?? ''),
      }
    }

    // CPF repetido não vira erro: devolve quem já existe, que é o que a tela
    // precisa para oferecer o cliente em vez de duplicar.
    const existente = await db.cliente.findUnique({
      where: { cpf: validado.data.cpf },
      select: { id: true },
    })
    if (existente) return { ok: true, dados: { id: existente.id } }

    const cliente = await db.cliente.create({
      data: { ...validado.data, criadoPor: usuario.id },
      select: { id: true },
    })

    revalidatePath('/admin/clientes')
    return { ok: true, dados: { id: cliente.id } }
  } catch (e) {
    return comoErro(e)
  }
}

/**
 * Cria a solicitação.
 *
 * Tudo numa transação: o código sequencial, os itens, o total e a primeira
 * linha do histórico. Se qualquer parte falhar, não sobra código reservado sem
 * solicitação nem solicitação sem histórico.
 *
 * O valor unitário do item de catálogo é **relido do banco e copiado agora**,
 * nunca aceito do cliente — e congela. Reajuste de preço depois não mexe nesta
 * solicitação.
 */
export async function criarSolicitacao(
  entrada: unknown,
): Promise<ResultadoDaAction<{ id: string; codigo: string }>> {
  try {
    const usuario = await autorizarAction('solicitacao.criar')

    const validado = solicitacaoSchema.safeParse(entrada)
    if (!validado.success) {
      const primeiro = validado.error.issues[0]
      return {
        ok: false,
        erro: primeiro?.message ?? 'Dados inválidos.',
        campo: primeiro?.path.join('.'),
      }
    }
    const dados = validado.data

    const idsDeProdutos = dados.itens.map((i) => i.produtoId).filter((id): id is string => !!id)
    const produtos = idsDeProdutos.length
      ? await db.produto.findMany({
          where: { id: { in: idsDeProdutos }, ativo: true },
          select: { id: true, valor: true },
        })
      : []
    const porId = new Map(produtos.map((p) => [p.id, p]))

    const faltando = idsDeProdutos.find((id) => !porId.has(id))
    if (faltando) {
      return { ok: false, erro: 'Um dos produtos saiu do catálogo. Revise os itens.' }
    }

    const itens = dados.itens.map((item) => {
      if (item.produtoId) {
        return {
          produtoId: item.produtoId,
          descricaoLivre: null,
          urlExterna: null,
          valorUnitario: porId.get(item.produtoId)!.valor,
          quantidade: item.quantidade,
        }
      }
      return {
        produtoId: null,
        descricaoLivre: item.descricaoLivre,
        urlExterna: item.urlExterna,
        valorUnitario: new Prisma.Decimal(item.valorUnitario),
        quantidade: item.quantidade,
      }
    })

    const criada = await db.$transaction(async (tx) => {
      const codigo = await proximoCodigo(tx)

      const solicitacao = await tx.solicitacao.create({
        data: {
          codigo,
          consultorId: usuario.id,
          clienteId: dados.clienteId,
          motivo: dados.motivo,
          motivoOutro: dados.motivoOutro,
          mensagemCarta: dados.mensagemCarta,
          observacoes: dados.observacoes,
          status: StatusSolicitacao.pendente,
          valorTotal: totalDosItens(itens),
          entregaCep: dados.entregaCep,
          entregaLogradouro: dados.entregaLogradouro,
          entregaNumero: dados.entregaNumero,
          entregaComplemento: dados.entregaComplemento,
          entregaBairro: dados.entregaBairro,
          entregaCidade: dados.entregaCidade,
          entregaUf: dados.entregaUf,
          entregaDestinatario: dados.entregaDestinatario,
          itens: { create: itens },
        },
        select: { id: true, codigo: true },
      })

      await tx.solicitacaoHistorico.create({
        data: {
          solicitacaoId: solicitacao.id,
          statusAnterior: null,
          statusNovo: StatusSolicitacao.pendente,
          usuarioId: usuario.id,
        },
      })

      return solicitacao
    })

    revalidatePath('/solicitacoes')
    revalidatePath('/admin/solicitacoes')
    return { ok: true, dados: criada }
  } catch (e) {
    return comoErro(e)
  }
}

/**
 * Muda o status de uma solicitação.
 *
 * A transição e a exigência de motivo passam por `validarMudancaDeStatus` — a
 * mesma função que a tela usa para montar as opções, para que o que é oferecido
 * e o que é aceito nunca divirjam.
 */
export async function alterarStatus(entrada: unknown): Promise<ResultadoDaAction> {
  try {
    const usuario = await autorizarAction('solicitacao.alterarStatus')

    const validado = mudancaDeStatusSchema.safeParse(entrada)
    if (!validado.success) {
      return { ok: false, erro: validado.error.issues[0]?.message ?? 'Dados inválidos.' }
    }
    const { solicitacaoId, statusNovo, motivo } = validado.data

    const solicitacao = await db.solicitacao.findUnique({
      where: { id: solicitacaoId },
      select: { id: true, status: true },
    })
    if (!solicitacao) return { ok: false, erro: 'Solicitação não encontrada.' }

    const checagem = validarMudancaDeStatus(solicitacao.status, statusNovo, motivo)
    if (!checagem.ok) return { ok: false, erro: checagem.erro }

    await db.$transaction([
      db.solicitacao.update({ where: { id: solicitacao.id }, data: { status: statusNovo } }),
      db.solicitacaoHistorico.create({
        data: {
          solicitacaoId: solicitacao.id,
          statusAnterior: solicitacao.status,
          statusNovo,
          usuarioId: usuario.id,
          motivo,
        },
      }),
    ])

    revalidatePath(`/admin/solicitacoes/${solicitacao.id}`)
    revalidatePath('/admin/solicitacoes')
    revalidatePath('/financeiro/compras')
    revalidatePath('/expedicao')
    revalidatePath('/solicitacoes')
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}
