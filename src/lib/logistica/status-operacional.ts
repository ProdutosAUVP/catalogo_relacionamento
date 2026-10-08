import type { SituacaoOperacional } from '@prisma/client'

/**
 * Status geral da operação na semana (proposta, item 6; relatório, item 1).
 *
 * Duas fontes, como no protótipo: a Logística pode **definir à mão**, e,
 * enquanto não define, o painel **sugere** a partir dos números. A sugestão
 * sempre diz o porquê, para que ninguém leia "Risco de atraso" sem saber de
 * onde saiu.
 */

export const ROTULO_SITUACAO: Record<SituacaoOperacional, string> = {
  normal: 'Operação normal',
  alto_volume: 'Alto volume',
  risco_de_atraso: 'Risco de atraso',
  critica: 'Operação crítica',
}

/** Da mais leve para a mais grave; a ordem do seletor manual. */
export const SITUACOES: readonly SituacaoOperacional[] = [
  'normal',
  'alto_volume',
  'risco_de_atraso',
  'critica',
]

/**
 * Os limiares da sugestão automática. **Suposição**: a área não definiu
 * números, e estes são o ponto de partida. Mudar aqui muda o painel inteiro.
 * Ver docs/05-perguntas-em-aberto.md.
 */
export const LIMIARES = {
  /** Volume da semana contra a média das semanas anteriores. */
  altoVolumeFator: 1.5,
  /** Abaixo disso, nenhum volume é "alto": 3 contra uma média de 1 não é pico. */
  altoVolumeMinimo: 10,
  /** Atrasadas a partir das quais a operação é crítica... */
  criticaAtrasadas: 3,
  /** ...ou a fração das abertas que já está atrasada... */
  criticaFracaoAtrasadas: 0.25,
  /** ...desde que sejam ao menos estas: 1 de 3 é um atraso, não uma crise. */
  criticaFracaoMinimoAtrasadas: 2,
  /** Semanas anteriores que entram na média. */
  semanasNaMedia: 8,
} as const

export type NumerosDaSemana = {
  /** Demandas pedidas na semana. */
  volume: number
  /** Média de demandas pedidas por semana nas semanas anteriores. */
  mediaAnterior: number
  /** Abertas no fim da semana, ou agora, se a semana não terminou. */
  abertas: number
  /** Dessas, as que já passaram da previsão. */
  atrasadas: number
}

export type Sugestao = { situacao: SituacaoOperacional; motivo: string }

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

/**
 * A situação sugerida pelos números, a mais grave que se aplica.
 *
 * Atraso pesa mais que volume: semana cheia com tudo em dia é "alto volume";
 * uma demanda atrasada já é "risco", com qualquer volume.
 */
export function sugerirSituacao(n: NumerosDaSemana): Sugestao {
  const fracao = n.abertas > 0 ? n.atrasadas / n.abertas : 0

  if (
    n.atrasadas >= LIMIARES.criticaAtrasadas ||
    (n.atrasadas >= LIMIARES.criticaFracaoMinimoAtrasadas &&
      fracao >= LIMIARES.criticaFracaoAtrasadas)
  ) {
    return {
      situacao: 'critica',
      motivo: `${plural(n.atrasadas, 'demanda atrasada', 'demandas atrasadas')} de ${plural(n.abertas, 'aberta', 'abertas')}.`,
    }
  }

  if (n.atrasadas > 0) {
    return {
      situacao: 'risco_de_atraso',
      motivo: `${plural(n.atrasadas, 'demanda passou', 'demandas passaram')} da previsão.`,
    }
  }

  const fator = n.mediaAnterior > 0 ? n.volume / n.mediaAnterior : null
  if (
    n.volume >= LIMIARES.altoVolumeMinimo &&
    (fator === null || fator >= LIMIARES.altoVolumeFator)
  ) {
    return {
      situacao: 'alto_volume',
      motivo:
        fator === null
          ? `${plural(n.volume, 'pedido', 'pedidos')} na semana, sem histórico para comparar.`
          : `${plural(n.volume, 'pedido', 'pedidos')}, ${fator.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}× a média das semanas anteriores.`,
    }
  }

  return { situacao: 'normal', motivo: 'Volume dentro do habitual e nada atrasado.' }
}

export type StatusDaSemana = {
  situacao: SituacaoOperacional
  origem: 'manual' | 'automatico'
  motivo: string
  observacao: string | null
  definidoPor: string | null
  definidoEm: Date | null
  /** A sugestão dos números, mesmo quando a Logística definiu outra. */
  sugestao: Sugestao
}

/** O que vale: a definição manual, quando existe; senão, a sugestão. */
export function statusDaSemana(
  manual: {
    situacao: SituacaoOperacional | null
    observacao: string | null
    definidoPor: string | null
    definidoEm: Date
  } | null,
  sugestao: Sugestao,
): StatusDaSemana {
  if (manual?.situacao) {
    return {
      situacao: manual.situacao,
      origem: 'manual',
      motivo: manual.observacao ?? 'Definido pela Logística.',
      observacao: manual.observacao,
      definidoPor: manual.definidoPor,
      definidoEm: manual.definidoEm,
      sugestao,
    }
  }
  return {
    situacao: sugestao.situacao,
    origem: 'automatico',
    motivo: sugestao.motivo,
    observacao: null,
    definidoPor: null,
    definidoEm: null,
    sugestao,
  }
}
