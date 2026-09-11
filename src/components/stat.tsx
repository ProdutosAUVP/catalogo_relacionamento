import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Bloco de número: o cartão de métrica do painel.
 *
 * Duas decisões de tipografia que valem registrar:
 *
 * - o número usa a fonte de corpo, não a de display. Fonte de título em
 *   número grande lê como decoração, e o dado é o conteúdo;
 * - sem `tabular-nums`. A largura fixa do dígito serve a coluna de tabela, que
 *   precisa alinhar verticalmente; num número solto e grande ela abre espaços
 *   e o número parece frouxo.
 */
export function Stat({
  rotulo,
  valor,
  apoio,
  destaque,
  className,
}: {
  rotulo: string
  valor: ReactNode
  apoio?: ReactNode
  /** Número principal da tela. No máximo um por visão. */
  destaque?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-card rounded-lg border p-5 shadow-[0_1px_2px_rgba(11,41,5,0.04)]',
        className,
      )}
    >
      <p className="text-muted-foreground text-sm">{rotulo}</p>
      <p
        className={cn(
          'font-body mt-1.5 font-semibold tracking-tight',
          destaque ? 'text-4xl sm:text-5xl' : 'text-3xl',
        )}
      >
        {valor}
      </p>
      {apoio ? <div className="text-muted-foreground mt-1.5 text-sm">{apoio}</div> : null}
    </div>
  )
}

/** Linha de métricas. Usa grade automática para não quebrar com 2, 3 ou 4. */
export function LinhaDeStats({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>{children}</div>
}
