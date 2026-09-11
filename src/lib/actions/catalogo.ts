'use server'

import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { autorizarAction } from '@/lib/auth-guards'
import { salvarFoto } from '@/lib/arquivos'
import { produtoSchema, categoriaSchema } from '@/lib/validators/produto'
import { comoErro, primeiroErro, type ResultadoDaAction } from './comuns'

/**
 * CRUD do catálogo.
 *
 * Requisito de primeira ordem da spec: a área de Relacionamento cadastra,
 * edita e desativa produto sem passar pelo time técnico.
 *
 * Produto **nunca é excluído**. Uma solicitação antiga precisa continuar
 * legível como foi criada, e o item aponta para o produto. Desativar tira do
 * catálogo do consultor e deixa o histórico intacto.
 */

function revalidarCatalogo() {
  revalidatePath('/admin/catalogo')
  revalidatePath('/catalogo')
  revalidatePath('/solicitacoes/nova')
}

/**
 * Lê a foto do formulário.
 *
 * São dois caminhos no mesmo campo: o arquivo enviado agora, que é gravado e
 * vira URL, ou a URL que já estava lá, inclusive vazia, quando a pessoa
 * removeu a foto.
 */
async function resolverFoto(
  dados: FormData,
  usuarioId: string,
): Promise<{ ok: true; url: string | null } | { ok: false; erro: string }> {
  const arquivo = dados.get('foto')

  if (arquivo instanceof File && arquivo.size > 0) {
    const salvo = await salvarFoto(arquivo, usuarioId)
    if (!salvo.ok) return { ok: false, erro: salvo.erro }
    return { ok: true, url: salvo.url }
  }

  const atual = String(dados.get('fotoUrl') ?? '').trim()
  return { ok: true, url: atual || null }
}

/** Campos do formulário, já no formato que o schema espera. */
function comoProduto(dados: FormData, fotoUrl: string | null) {
  return {
    nome: String(dados.get('nome') ?? ''),
    descricao: dados.get('descricao'),
    categoriaId: String(dados.get('categoriaId') ?? ''),
    fotoUrl,
    valor: String(dados.get('valor') ?? ''),
    tipoValor: String(dados.get('tipoValor') ?? 'exato'),
    origem: String(dados.get('origem') ?? 'mediante_pedido'),
    controlaEstoque: dados.get('controlaEstoque') === 'on',
    estoque: dados.get('estoque'),
    urlCompra: dados.get('urlCompra'),
    notaDeCompra: dados.get('notaDeCompra'),
    exigeAcompanhamento: dados.get('exigeAcompanhamento'),
    serveComoAcompanhamento: dados.get('serveComoAcompanhamento'),
    ativo: dados.get('ativo') !== 'off',
    skuTiny: dados.get('skuTiny'),
  }
}

export async function salvarProduto(dados: FormData): Promise<ResultadoDaAction<{ id: string }>> {
  try {
    const usuario = await autorizarAction('catalogo.gerenciar')

    const foto = await resolverFoto(dados, usuario.id)
    if (!foto.ok) return { ok: false, erro: foto.erro, campo: 'foto' }

    // A URL interna não passa por `urlOpcional`, que exige URL absoluta.
    const urlRelativa = foto.url?.startsWith('/') ? foto.url : null

    const validado = produtoSchema.safeParse(comoProduto(dados, urlRelativa ? null : foto.url))
    if (!validado.success) return primeiroErro(validado.error)

    const id = String(dados.get('id') ?? '')
    const valores = {
      ...validado.data,
      fotoUrl: urlRelativa ?? validado.data.fotoUrl,
      // Nulo é "a área ainda não informou", e segue nulo até ela informar.
      valor: validado.data.valor === null ? null : new Prisma.Decimal(validado.data.valor),
      // Produto que não controla estoque não guarda quantidade: um número
      // parado ali seria lido como disponibilidade real.
      estoque: validado.data.controlaEstoque ? validado.data.estoque : null,
    }

    const produto = id
      ? await db.produto.update({ where: { id }, data: valores, select: { id: true } })
      : await db.produto.create({ data: valores, select: { id: true } })

    revalidarCatalogo()
    return { ok: true, dados: { id: produto.id } }
  } catch (e) {
    return comoErro(e)
  }
}

/**
 * Ativa ou desativa um produto.
 *
 * É o que existe no lugar de excluir. O desativado some do catálogo do
 * consultor e continua aparecendo nas solicitações que já o usaram.
 */
export async function alternarProduto(id: string, ativo: boolean): Promise<ResultadoDaAction> {
  try {
    await autorizarAction('catalogo.gerenciar')
    await db.produto.update({ where: { id }, data: { ativo } })
    revalidarCatalogo()
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}

export async function salvarCategoria(dados: FormData): Promise<ResultadoDaAction> {
  try {
    await autorizarAction('catalogo.gerenciar')

    const validado = categoriaSchema.safeParse({
      nome: String(dados.get('nome') ?? ''),
      ativo: dados.get('ativo') !== 'off',
    })
    if (!validado.success) return primeiroErro(validado.error)

    const id = String(dados.get('id') ?? '')
    if (id) {
      await db.categoria.update({ where: { id }, data: validado.data })
    } else {
      await db.categoria.create({ data: validado.data })
    }

    revalidarCatalogo()
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}

/**
 * Desativa a categoria.
 *
 * Categoria com produto ativo não é desativada: os produtos sumiriam do
 * catálogo sem que ninguém tivesse pedido isso.
 */
export async function alternarCategoria(id: string, ativo: boolean): Promise<ResultadoDaAction> {
  try {
    await autorizarAction('catalogo.gerenciar')

    if (!ativo) {
      const ativos = await db.produto.count({ where: { categoriaId: id, ativo: true } })
      if (ativos > 0) {
        return {
          ok: false,
          erro: `Esta categoria tem ${ativos} ${ativos === 1 ? 'produto ativo' : 'produtos ativos'}. Desative os produtos antes.`,
        }
      }
    }

    await db.categoria.update({ where: { id }, data: { ativo } })
    revalidarCatalogo()
    return { ok: true, dados: undefined }
  } catch (e) {
    return comoErro(e)
  }
}
