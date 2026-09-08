import { Boxes, CupSoda, Gem, Home, NotebookPen, Package, Shirt, Wine } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Identidade de cada categoria: ícone e tom.
 *
 * Portado de `categoriaVisual` em `src/data/produtosFisicos.ts` da Central,
 * junto com `tagToneClasses`. Os tons vêm da paleta categórica do Design
 * System — sempre fundo a 14–16% de opacidade com o texto na cor cheia, que é
 * o que mantém o selo legível nos dois temas.
 */

export type Tom =
  'green' | 'violet' | 'amber' | 'blue' | 'magenta' | 'brick' | 'olive' | 'graphite' | 'neutral'

export const CLASSES_DE_TOM: Record<Tom, string> = {
  green: 'bg-[hsl(var(--chart-1)/0.14)] text-[hsl(var(--chart-1))]',
  violet: 'bg-[hsl(var(--chart-2)/0.14)] text-[hsl(var(--chart-2))]',
  amber: 'bg-[hsl(var(--chart-3)/0.16)] text-[hsl(var(--chart-3))]',
  blue: 'bg-[hsl(var(--chart-4)/0.14)] text-[hsl(var(--chart-4))]',
  magenta: 'bg-[hsl(var(--chart-5)/0.14)] text-[hsl(var(--chart-5))]',
  brick: 'bg-[hsl(var(--chart-6)/0.14)] text-[hsl(var(--chart-6))]',
  olive: 'bg-[hsl(var(--chart-7)/0.16)] text-[hsl(var(--chart-7))]',
  graphite: 'bg-[hsl(var(--chart-8)/0.14)] text-[hsl(var(--chart-8))]',
  neutral: 'bg-muted text-muted-foreground',
}

const VISUAL: Record<string, { tom: Tom; icone: LucideIcon }> = {
  'canecas e garrafas': { tom: 'green', icone: CupSoda },
  vestuário: { tom: 'magenta', icone: Shirt },
  papelaria: { tom: 'blue', icone: NotebookPen },
  acessórios: { tom: 'violet', icone: Gem },
  bebidas: { tom: 'amber', icone: Wine },
  'casa & mesa': { tom: 'olive', icone: Home },
  'sacolas & caixas': { tom: 'graphite', icone: Boxes },
}

const PADRAO = { tom: 'neutral' as const, icone: Package }

/** Categoria nova entra com o visual neutro em vez de quebrar a tela. */
export function visualDaCategoria(nome: string | null | undefined) {
  return VISUAL[(nome ?? '').trim().toLowerCase()] ?? PADRAO
}
