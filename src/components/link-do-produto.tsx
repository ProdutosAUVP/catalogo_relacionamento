'use client'

import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Link da loja onde o presente é comprado.
 *
 * Vem do cadastro do produto (a coluna "Link" da planilha da área). Serve ao
 * consultor antes da escolha: a foto mostra o presente, o link mostra o
 * produto de verdade, com medida, sabor e o que mais a loja descreve.
 *
 * É client component por causa do `stopPropagation`: o card costuma ser
 * clicável inteiro, e sem ele clicar no link também escolheria o produto.
 * Passar um manipulador de evento de um componente de servidor derruba a
 * página inteira, e não só o link.
 */
export function LinkDoProduto({ url, className }: { url: string | null; className?: string }) {
  if (!url) return null

  const dominio = url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title={url}
      className={cn(
        'text-muted-foreground hover:text-primary-emphasis inline-flex max-w-full items-center gap-1 text-xs underline-offset-4 transition-colors hover:underline',
        className,
      )}
    >
      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{dominio}</span>
    </a>
  )
}
