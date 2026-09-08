import { cn } from '@/lib/utils'

/**
 * Bloco de carregamento.
 *
 * Existe para **reservar espaço**, não para enfeitar: cada esqueleto tem a
 * altura exata do conteúdo que vai substituí-lo, então a troca não empurra
 * nada na página. É o que faz a navegação parecer contínua em vez de saltar.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('bg-muted animate-pulse rounded-md', className)}
      {...props}
    />
  )
}
