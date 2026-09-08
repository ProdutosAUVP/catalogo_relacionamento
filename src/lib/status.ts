import { StatusSolicitacao } from '@prisma/client'

/**
 * Máquina de estados do fluxo de solicitação (seção 5 da spec).
 *
 * O fluxo feliz é linear. Fora dele existem três regras:
 *
 * - `deu_problema` pode ser acionado a partir de qualquer status vivo;
 * - `devolvido` só a partir de `entregue` em diante;
 * - de `deu_problema` a solicitação volta para qualquer status anterior do
 *   fluxo linear, ou é cancelada.
 *
 * `cliente_confirmou`, `devolvido` e `cancelado` são terminais.
 */

/** Ordem do fluxo linear. O índice é o que define "status anterior". */
export const FLUXO_LINEAR: readonly StatusSolicitacao[] = [
  StatusSolicitacao.pendente,
  StatusSolicitacao.aguardando_aprovacao,
  StatusSolicitacao.aguardando_compra,
  StatusSolicitacao.comprado,
  StatusSolicitacao.organizando_envio,
  StatusSolicitacao.entregue,
  StatusSolicitacao.cliente_confirmou,
] as const

/**
 * Atalhos que saem do fluxo linear.
 *
 * Solicitação cujos itens já estão em estoque não passa pelo Financeiro: da
 * aprovação ela vai direto para a expedição. Quem decide se o atalho aparece é
 * a tela, olhando os itens (`precisaDeCompra`); aqui só se declara que ele é
 * uma transição válida.
 */
const ATALHOS: Partial<Record<StatusSolicitacao, readonly StatusSolicitacao[]>> = {
  [StatusSolicitacao.aguardando_aprovacao]: [StatusSolicitacao.organizando_envio],
}

/** Status a partir dos quais uma devolução faz sentido. */
const A_PARTIR_DE_ENTREGUE: readonly StatusSolicitacao[] = [
  StatusSolicitacao.entregue,
  StatusSolicitacao.cliente_confirmou,
] as const

export const STATUS_TERMINAIS: readonly StatusSolicitacao[] = [
  StatusSolicitacao.cliente_confirmou,
  StatusSolicitacao.devolvido,
  StatusSolicitacao.cancelado,
] as const

/** Status que exigem motivo preenchido, gravado no histórico. */
export const STATUS_QUE_EXIGEM_MOTIVO: readonly StatusSolicitacao[] = [
  StatusSolicitacao.deu_problema,
  StatusSolicitacao.devolvido,
  StatusSolicitacao.cancelado,
] as const

/**
 * Status que não contam para o saldo gasto no mês.
 *
 * Vazio de propósito. A spec dizia para excluir cancelados e devolvidos, mas a
 * área corrigiu: uma devolução normalmente vira reenvio, então o dinheiro
 * continua comprometido e tirar esses casos da conta subestimaria o gasto.
 *
 * Mantido como lista, e não removido, porque a pergunta "isto conta no saldo?"
 * segue sendo uma decisão de negócio: se um dia algum status deixar de contar,
 * ele entra aqui e vale para o saldo, para o painel e para a exportação de uma
 * vez só.
 */
export const STATUS_FORA_DO_SALDO: readonly StatusSolicitacao[] = [] as const

export const ROTULO_STATUS: Record<StatusSolicitacao, string> = {
  pendente: 'Pendente',
  aguardando_aprovacao: 'Aguardando aprovação',
  aguardando_compra: 'Aguardando compra',
  comprado: 'Comprado',
  organizando_envio: 'Organizando envio',
  entregue: 'Entregue / rastreio finalizado',
  cliente_confirmou: 'Cliente confirmou recebimento',
  deu_problema: 'Deu problema',
  devolvido: 'Devolvido',
  cancelado: 'Cancelado',
}

export function ehTerminal(status: StatusSolicitacao): boolean {
  return STATUS_TERMINAIS.includes(status)
}

export function exigeMotivo(status: StatusSolicitacao): boolean {
  return STATUS_QUE_EXIGEM_MOTIVO.includes(status)
}

export function contaNoSaldo(status: StatusSolicitacao): boolean {
  return !STATUS_FORA_DO_SALDO.includes(status)
}

/**
 * Lista os status para os quais uma solicitação pode ir a partir do atual.
 * É a fonte única: a tela do Admin monta o seletor com isso, e a action de
 * mudança de status valida com isso.
 */
export function transicoesPermitidas(atual: StatusSolicitacao): StatusSolicitacao[] {
  if (ehTerminal(atual)) return []

  // De "deu problema" volta-se para qualquer etapa anterior do fluxo linear,
  // ou cancela-se. Não se sabe de onde veio, então o fluxo inteiro é oferecido
  // e o Admin escolhe; o histórico registra a origem.
  if (atual === StatusSolicitacao.deu_problema) {
    return [...FLUXO_LINEAR, StatusSolicitacao.cancelado]
  }

  const indice = FLUXO_LINEAR.indexOf(atual)
  const proximos: StatusSolicitacao[] = []

  // Próxima etapa do fluxo linear.
  const proximo = indice >= 0 ? FLUXO_LINEAR[indice + 1] : undefined
  if (proximo) proximos.push(proximo)

  // Atalhos declarados — hoje, aprovação direto para expedição.
  for (const atalho of ATALHOS[atual] ?? []) {
    if (!proximos.includes(atalho)) proximos.push(atalho)
  }

  // "Deu problema" é acionável de qualquer status vivo.
  proximos.push(StatusSolicitacao.deu_problema)

  // "Devolvido" só a partir de entregue.
  if (A_PARTIR_DE_ENTREGUE.includes(atual)) {
    proximos.push(StatusSolicitacao.devolvido)
  }

  proximos.push(StatusSolicitacao.cancelado)

  return proximos
}

export function transicaoPermitida(atual: StatusSolicitacao, novo: StatusSolicitacao): boolean {
  return transicoesPermitidas(atual).includes(novo)
}

export type ResultadoValidacao = { ok: true } | { ok: false; erro: string }

/**
 * Valida uma mudança de status completa, motivo incluído.
 * Chamada pela server action antes de qualquer escrita.
 */
export function validarMudancaDeStatus(
  atual: StatusSolicitacao,
  novo: StatusSolicitacao,
  motivo?: string | null,
): ResultadoValidacao {
  if (atual === novo) {
    return { ok: false, erro: 'A solicitação já está nesse status.' }
  }

  if (ehTerminal(atual)) {
    return {
      ok: false,
      erro: `"${ROTULO_STATUS[atual]}" é um status final e não admite mudança.`,
    }
  }

  if (!transicaoPermitida(atual, novo)) {
    return {
      ok: false,
      erro: `Não é possível ir de "${ROTULO_STATUS[atual]}" para "${ROTULO_STATUS[novo]}".`,
    }
  }

  if (exigeMotivo(novo) && !motivo?.trim()) {
    return {
      ok: false,
      erro: `"${ROTULO_STATUS[novo]}" exige o preenchimento do motivo.`,
    }
  }

  return { ok: true }
}

/**
 * Uma solicitação precisa passar pelo Financeiro?
 *
 * Só precisa quando há algo a comprar. Item de catálogo com estoque disponível
 * já está na prateleira e vai direto para a expedição — regra da área, que
 * hoje resolve isso fora do sistema.
 *
 * Precisa de compra:
 * - presente específico (é comprado num site, por definição);
 * - produto que não controla estoque (não dá para afirmar que há);
 * - produto que controla estoque e está sem saldo suficiente.
 */
export type ItemParaDecisao = {
  produtoId: string | null
  quantidade: number
  produto?: { controlaEstoque: boolean; estoque: number | null } | null
}

export function precisaDeCompra(itens: readonly ItemParaDecisao[]): boolean {
  return itens.some((item) => {
    if (!item.produtoId || !item.produto) return true
    if (!item.produto.controlaEstoque) return true
    return (item.produto.estoque ?? 0) < item.quantidade
  })
}

/**
 * Próximo status sugerido depois da aprovação: expedição quando está tudo em
 * estoque, Financeiro quando há o que comprar.
 */
export function proximoDepoisDaAprovacao(itens: readonly ItemParaDecisao[]): StatusSolicitacao {
  return precisaDeCompra(itens)
    ? StatusSolicitacao.aguardando_compra
    : StatusSolicitacao.organizando_envio
}
