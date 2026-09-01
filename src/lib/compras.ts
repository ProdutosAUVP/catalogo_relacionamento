import { StatusSolicitacao } from '@prisma/client'
import { db } from './db'
import { subtotal, totalDosItens, type Dinheiro } from './money'

/**
 * Fila de compras do perfil Financeiro.
 *
 * Definição da área: o Financeiro recebe as solicitações enviadas para compra
 * contendo data, produto, valor e site. É uma visão por item, não por
 * solicitação — quem compra compra item a item, e um item de catálogo e um
 * presente específico têm origens diferentes.
 *
 * O "site" é o `url_externa` do item específico. Item de catálogo não tem site
 * porque o produto é comprado pelo canal já estabelecido; nesses casos o campo
 * vem nulo e a tela mostra a categoria no lugar.
 */

export type ItemParaCompra = {
  itemId: string
  solicitacaoId: string
  codigo: string
  /** Data da solicitação — a data que o Financeiro usa para priorizar. */
  data: Date
  consultorNome: string
  clienteNome: string
  /** Nome do produto do catálogo, ou a descrição do presente específico. */
  produto: string
  /** Preenchido só em presente específico; nulo em item de catálogo. */
  site: string | null
  categoria: string | null
  deCatalogo: boolean
  valorUnitario: Dinheiro
  quantidade: number
  valor: Dinheiro
  status: StatusSolicitacao
}

/**
 * Status que colocam a solicitação na fila do Financeiro.
 *
 * `aguardando_compra` é o estado que a área descreveu como "enviada para
 * compra". `comprado` fica visível junto para que o Financeiro confirme o que
 * já resolveu sem perder o item de vista no mesmo dia.
 */
export const STATUS_DA_FILA_DE_COMPRAS: readonly StatusSolicitacao[] = [
  StatusSolicitacao.aguardando_compra,
  StatusSolicitacao.comprado,
] as const

export type FiltroDaFila = {
  status?: StatusSolicitacao[]
  de?: Date
  ate?: Date
  consultorId?: string
}

export async function filaDeCompras(filtro: FiltroDaFila = {}): Promise<ItemParaCompra[]> {
  const status = filtro.status?.length ? filtro.status : [...STATUS_DA_FILA_DE_COMPRAS]

  const solicitacoes = await db.solicitacao.findMany({
    where: {
      status: { in: status },
      ...(filtro.consultorId ? { consultorId: filtro.consultorId } : {}),
      ...(filtro.de || filtro.ate
        ? {
            dataSolicitacao: {
              ...(filtro.de ? { gte: filtro.de } : {}),
              ...(filtro.ate ? { lte: filtro.ate } : {}),
            },
          }
        : {}),
    },
    include: {
      consultor: { select: { nome: true } },
      cliente: { select: { nome: true } },
      itens: {
        include: { produto: { select: { nome: true, categoria: { select: { nome: true } } } } },
      },
    },
    // Mais antigas primeiro: a fila de compra é ordem de chegada.
    orderBy: { dataSolicitacao: 'asc' },
  })

  return solicitacoes.flatMap((s) =>
    s.itens.map((item) => ({
      itemId: item.id,
      solicitacaoId: s.id,
      codigo: s.codigo,
      data: s.dataSolicitacao,
      consultorNome: s.consultor.nome,
      clienteNome: s.cliente.nome,
      produto: item.produto?.nome ?? item.descricaoLivre ?? '—',
      site: item.urlExterna,
      categoria: item.produto?.categoria.nome ?? null,
      deCatalogo: item.produtoId !== null,
      valorUnitario: item.valorUnitario,
      quantidade: item.quantidade,
      valor: subtotal(item.valorUnitario, item.quantidade),
      status: s.status,
    })),
  )
}

/** Total da fila, para o cabeçalho da tela do Financeiro. */
export function totalDaFila(itens: readonly ItemParaCompra[]): Dinheiro {
  return totalDosItens(itens)
}
