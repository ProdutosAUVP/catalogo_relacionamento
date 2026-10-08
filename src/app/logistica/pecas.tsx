import type { ReactNode } from 'react'
import type { FaseOperacional } from '@prisma/client'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { ROTULO_FASE } from '@/lib/logistica/demandas'
import { cn } from '@/lib/utils'

/**
 * Peças pequenas do Dashboard Logístico.
 */

/**
 * Cor da fase, no mesmo código do selo de status das solicitações:
 * cinza não começou, âmbar esperando alguém, azul andando, verde terminou.
 */
const VARIANTE_DA_FASE: Record<FaseOperacional, BadgeProps['variant']> = {
  recebido: 'muted',
  em_analise: 'muted',
  aguardando_documentacao: 'warning',
  aguardando_suprimentos: 'warning',
  em_execucao: 'info',
  revisao: 'info',
  finalizacao: 'info',
  concluido: 'success',
}

export function FaseBadge({ fase }: { fase: FaseOperacional }) {
  return (
    <Badge variant={VARIANTE_DA_FASE[fase]} className="whitespace-nowrap">
      {ROTULO_FASE[fase]}
    </Badge>
  )
}

/**
 * Dica que abre no hover e no foco, sem JavaScript.
 *
 * O relatório pede ler as observações "ao passar o mouse". Só hover deixaria
 * de fora teclado e celular, então o gatilho é um botão: o foco abre igual, e
 * no celular o toque foca. O conteúdo está no HTML desde o início, ligado por
 * `aria-describedby`, e anima só opacidade e deslocamento, sem mexer no layout.
 *
 * No celular a dica abre fixa no pé da tela, como um aviso. Ancorada no ícone,
 * ela passaria da borda, e mesmo invisível criaria rolagem horizontal.
 */
export function Dica({
  id,
  gatilho,
  rotulo,
  children,
  className,
}: {
  /** Único na página: liga o botão ao texto para leitores de tela. */
  id: string
  gatilho: ReactNode
  /** O que o botão diz para quem não vê o ícone. */
  rotulo: string
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('group relative inline-flex', className)}>
      <button
        type="button"
        aria-label={rotulo}
        aria-describedby={id}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2"
      >
        {gatilho}
      </button>
      <span
        role="tooltip"
        id={id}
        className="bg-popover text-popover-foreground pointer-events-none fixed inset-x-4 bottom-4 z-30 translate-y-1 rounded-lg border p-3 text-left text-xs leading-relaxed whitespace-pre-wrap opacity-0 shadow-lg transition-[opacity,transform] duration-150 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 sm:absolute sm:inset-x-auto sm:bottom-full sm:left-1/2 sm:mb-2 sm:w-72 sm:-translate-x-1/2"
      >
        {children}
      </span>
    </span>
  )
}

/** Título de bloco do painel, com uma linha de apoio opcional. */
export function TituloDoBloco({
  titulo,
  apoio,
  acoes,
}: {
  titulo: string
  apoio?: ReactNode
  acoes?: ReactNode
}) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold">{titulo}</h2>
        {apoio ? <p className="text-muted-foreground mt-0.5 text-sm">{apoio}</p> : null}
      </div>
      {acoes ? <div className="flex flex-wrap gap-2">{acoes}</div> : null}
    </div>
  )
}
