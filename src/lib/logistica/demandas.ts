import type { ComplexidadeDemanda, FaseOperacional, PrioridadeDemanda } from '@prisma/client'
import type { Fatia } from '@/lib/periodo'

/**
 * Regras das demandas da Logística: o que a trilha mostra, em que ordem, e
 * como o painel soma.
 *
 * Tudo aqui é função pura sobre os campos da demanda, para que a tela, a
 * exportação e os testes contem do mesmo jeito.
 */

/** As fases da proposta, na ordem em que a demanda anda. */
export const FASES: readonly FaseOperacional[] = [
  'recebido',
  'em_analise',
  'aguardando_documentacao',
  'aguardando_suprimentos',
  'em_execucao',
  'revisao',
  'finalizacao',
  'concluido',
]

export const ROTULO_FASE: Record<FaseOperacional, string> = {
  recebido: 'Recebido',
  em_analise: 'Em análise',
  aguardando_documentacao: 'Aguardando documentação',
  aguardando_suprimentos: 'Aguardando suprimentos',
  em_execucao: 'Em execução',
  revisao: 'Revisão',
  finalizacao: 'Finalização',
  concluido: 'Concluído',
}

export const ROTULO_PRIORIDADE: Record<PrioridadeDemanda, string> = {
  urgente: 'Urgente',
  alta: 'Alta',
  normal: 'Normal',
  baixa: 'Baixa',
}

export const ROTULO_COMPLEXIDADE: Record<ComplexidadeDemanda, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
}

/**
 * A esteira prioritária, agora dentro da trilha (relatório, item 4): o que é
 * urgente ou alta prioridade sobe para o topo e ganha destaque.
 */
export function ehPrioritaria(prioridade: PrioridadeDemanda): boolean {
  return prioridade === 'urgente' || prioridade === 'alta'
}

/**
 * O que está sendo enviado.
 *
 * Regra da área: com mais de um item, a trilha diz "Kit" e a lista completa
 * vai para o detalhe. Sem item informado, vale o produto, que é o que o
 * ClickUp sempre traz.
 */
export function oQueEstaSendoEnviado(
  itens: readonly string[],
  produto: string | null,
): { rotulo: string; itens: string[] } {
  const limpos = itens.map((i) => i.trim()).filter(Boolean)
  if (limpos.length > 1) return { rotulo: 'Kit', itens: limpos }
  if (limpos.length === 1) return { rotulo: limpos[0]!, itens: limpos }
  return { rotulo: produto ?? 'Não informado', itens: [] }
}

type Datas = {
  solicitadaEm: Date
  previsaoConclusao: Date | null
  concluidaEm: Date | null
}

/** Aberta num instante: já tinha sido pedida e ainda não tinha terminado. */
export function estavaAberta(d: Datas, instante: Date): boolean {
  return d.solicitadaEm < instante && (d.concluidaEm === null || d.concluidaEm > instante)
}

/**
 * Atrasada num instante: aberta, e com a previsão de conclusão já vencida.
 *
 * O instante é parâmetro para o status de uma semana passada ser contado
 * como estava no fim daquela semana, e não como está hoje.
 */
export function estavaAtrasada(d: Datas, instante: Date): boolean {
  return estavaAberta(d, instante) && d.previsaoConclusao !== null && d.previsaoConclusao < instante
}

const PESO_DA_PRIORIDADE: Record<PrioridadeDemanda, number> = {
  urgente: 0,
  alta: 1,
  normal: 2,
  baixa: 3,
}

/**
 * Ordem da trilha.
 *
 * Primeiro o que está aberto, porque é o que pede ação; dentro disso, as
 * prioritárias, atrasadas antes; depois pela previsão, a mais próxima antes,
 * e a demanda sem previsão no fim do seu grupo, para não esconder uma que tem
 * data atrás de uma que não tem. Concluídas descem, as mais recentes primeiro.
 */
export function compararNaTrilha<
  T extends Datas & { prioridade: PrioridadeDemanda; fase: FaseOperacional },
>(agora: Date) {
  return (a: T, b: T): number => {
    const concluidaA = a.fase === 'concluido' ? 1 : 0
    const concluidaB = b.fase === 'concluido' ? 1 : 0
    if (concluidaA !== concluidaB) return concluidaA - concluidaB
    if (concluidaA === 1) {
      return (b.concluidaEm?.getTime() ?? 0) - (a.concluidaEm?.getTime() ?? 0)
    }

    const prioritariaA = ehPrioritaria(a.prioridade) ? 0 : 1
    const prioritariaB = ehPrioritaria(b.prioridade) ? 0 : 1
    if (prioritariaA !== prioritariaB) return prioritariaA - prioritariaB

    const atrasadaA = estavaAtrasada(a, agora) ? 0 : 1
    const atrasadaB = estavaAtrasada(b, agora) ? 0 : 1
    if (atrasadaA !== atrasadaB) return atrasadaA - atrasadaB

    if (a.prioridade !== b.prioridade) {
      return PESO_DA_PRIORIDADE[a.prioridade] - PESO_DA_PRIORIDADE[b.prioridade]
    }

    const previsaoA = a.previsaoConclusao?.getTime() ?? Infinity
    const previsaoB = b.previsaoConclusao?.getTime() ?? Infinity
    if (previsaoA !== previsaoB) return previsaoA - previsaoB

    return a.solicitadaEm.getTime() - b.solicitadaEm.getTime()
  }
}

// ---------------------------------------------------------------------------
// Agregações do painel
// ---------------------------------------------------------------------------

export type LinhaDeVolume = {
  subsidiaria: string
  departamento: string
  quantidade: number
  /** De 0 a 100. */
  percentual: number
}

export const SEM_DEPARTAMENTO = 'Sem departamento'
export const SEM_SUBSIDIARIA = 'Sem subsidiária'
export const SEM_PRODUTO = 'Sem produto'

/**
 * "Volume de Pedidos por Departamento" (relatório, item 2), na hierarquia
 * subsidiária e departamento. Ordem decrescente: o maior volume primeiro,
 * empate pelo nome para a ordem não mudar entre recargas.
 */
export function volumePorDepartamento(
  demandas: readonly { subsidiaria: string | null; departamento: string | null }[],
): LinhaDeVolume[] {
  const contagem = new Map<string, LinhaDeVolume>()
  for (const d of demandas) {
    const subsidiaria = d.subsidiaria?.trim() || SEM_SUBSIDIARIA
    const departamento = d.departamento?.trim() || SEM_DEPARTAMENTO
    const chave = `${subsidiaria}\u0000${departamento}`
    const linha = contagem.get(chave) ?? { subsidiaria, departamento, quantidade: 0, percentual: 0 }
    linha.quantidade++
    contagem.set(chave, linha)
  }

  const total = demandas.length
  return [...contagem.values()]
    .map((l) => ({ ...l, percentual: total ? (l.quantidade / total) * 100 : 0 }))
    .sort(
      (a, b) =>
        b.quantidade - a.quantidade || a.departamento.localeCompare(b.departamento, 'pt-BR'),
    )
}

export type LinhaDeHoras = {
  produto: string
  minutos: number
  envios: number
  /** Nulo quando não há envio, para a tela não mostrar "0 min" de média. */
  mediaPorEnvio: number | null
}

/**
 * Horas por produto e tempo médio por envio (proposta, item 2). Ordena pelo
 * esforço, que é a pergunta: onde o time gasta o tempo. Produto sem nenhum
 * apontamento fica de fora, senão a tabela vira lista de zeros.
 */
export function horasPorProduto(
  demandas: readonly { produto: string | null; minutosApontados: number }[],
): LinhaDeHoras[] {
  const soma = new Map<string, { minutos: number; envios: number }>()
  for (const d of demandas) {
    const produto = d.produto?.trim() || SEM_PRODUTO
    const atual = soma.get(produto) ?? { minutos: 0, envios: 0 }
    atual.minutos += d.minutosApontados
    atual.envios++
    soma.set(produto, atual)
  }

  return [...soma.entries()]
    .filter(([, s]) => s.minutos > 0)
    .map(([produto, s]) => ({
      produto,
      minutos: s.minutos,
      envios: s.envios,
      mediaPorEnvio: s.envios ? Math.round(s.minutos / s.envios) : null,
    }))
    .sort((a, b) => b.minutos - a.minutos || a.produto.localeCompare(b.produto, 'pt-BR'))
}

/** "18h", "1h42", "26 min", como a proposta escreve. */
export function formatarDuracao(minutos: number): string {
  const total = Math.round(minutos)
  if (total < 60) return `${total} min`
  const horas = Math.floor(total / 60)
  const resto = total % 60
  return resto === 0 ? `${horas}h` : `${horas}h${String(resto).padStart(2, '0')}`
}

/** Quantas demandas foram pedidas em cada fatia do gráfico de evolução. */
export function volumePorFatia(
  demandas: readonly { solicitadaEm: Date }[],
  fatias: readonly Fatia[],
): number[] {
  return fatias.map(
    (f) => demandas.filter((d) => d.solicitadaEm >= f.inicio && d.solicitadaEm < f.fim).length,
  )
}

/**
 * Variação contra o período anterior. Sem base, não há percentual: "de 0 para
 * 5" não é "+∞%", é "5 a mais".
 */
export function variacao(
  atual: number,
  anterior: number,
): { diferenca: number; percentual: number | null } {
  return {
    diferenca: atual - anterior,
    percentual: anterior > 0 ? ((atual - anterior) / anterior) * 100 : null,
  }
}
