import { CLASSES_DE_TOM, visualDaCategoria } from '@/lib/categorias'
import { cn } from '@/lib/utils'

/** Selo de categoria: ícone e nome, como na Central. */
export function CategoriaBadge({
  categoria,
  className,
}: {
  categoria: string
  className?: string
}) {
  const { tom, icone: Icone } = visualDaCategoria(categoria)

  return (
    <span
      className={cn(
        'font-roboto inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold tracking-wider uppercase',
        CLASSES_DE_TOM[tom],
        className,
      )}
    >
      <Icone className="h-3 w-3 shrink-0" strokeWidth={2.5} aria-hidden="true" />
      {categoria}
    </span>
  )
}
