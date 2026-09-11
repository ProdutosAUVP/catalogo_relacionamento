import type { TipoValor } from '@prisma/client'
import { formatarBRL } from '@/lib/money'
import type { Dinheiro } from '@/lib/money'
import { cn } from '@/lib/utils'

/**
 * Preço de um produto do catálogo.
 *
 * Nulo não é zero. Parte dos brindes personalizados chegou da área sem preço —
 * eles são comprados em lote e o custo unitário não está na planilha. Exibir
 * "R$ 0,00" ali se leria como grátis, e a soma do mês passaria a mentir sem
 * ninguém perceber.
 *
 * Então o vazio é dito: "valor a definir". É também o convite para a área
 * preencher, já que o CRUD de catálogo é dela.
 */
export function ValorDoProduto({
  valor,
  tipoValor,
  className,
  classeDoValor,
}: {
  valor: Dinheiro | null
  tipoValor: TipoValor
  className?: string
  classeDoValor?: string
}) {
  if (valor === null) {
    return <span className={cn('text-muted-foreground text-sm', className)}>valor a definir</span>
  }

  return (
    <span className={cn('inline-flex items-baseline gap-1.5', className)}>
      {tipoValor === 'medio' ? (
        <span className="text-muted-foreground text-xs">a partir de</span>
      ) : null}
      <span className={classeDoValor}>{formatarBRL(valor)}</span>
    </span>
  )
}
