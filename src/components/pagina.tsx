import type { ReactNode } from 'react'
import { Olho } from '@/components/marca/olho'
import { cn } from '@/lib/utils'

/**
 * Cabeçalho padrão das telas.
 *
 * A "sobrancelha" acima do título dá contexto de seção sem exigir um segundo
 * nível de navegação — o consultor sabe onde está sem migalha de pão.
 */
export function CabecalhoDaPagina({
  sobrancelha,
  titulo,
  descricao,
  acoes,
}: {
  sobrancelha?: string
  titulo: string
  descricao?: string
  acoes?: ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {sobrancelha ? (
          <p className="text-muted-foreground font-ui mb-2 text-xs font-semibold tracking-[0.14em] uppercase">
            {sobrancelha}
          </p>
        ) : null}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance">
          {titulo}
        </h1>
        {descricao ? (
          <p className="text-muted-foreground mt-2 max-w-prose text-sm">{descricao}</p>
        ) : null}
      </div>
      {acoes ? <div className="flex flex-wrap items-center gap-2">{acoes}</div> : null}
    </div>
  )
}

/** Barra de filtros. Agrupada numa superfície para não flutuar solta na página. */
export function BarraDeFiltros({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-card mb-6 flex flex-wrap items-center gap-2 rounded-lg border p-3',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Estado vazio.
 *
 * Uma tabela vazia com "nenhum resultado" em cinza parece defeito. Com a marca,
 * uma frase que explica o porquê e um caminho de saída, parece um estado
 * previsto pelo produto.
 */
export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string
  descricao?: string
  acao?: ReactNode
}) {
  return (
    <div className="bg-card flex flex-col items-center rounded-lg border px-6 py-16 text-center">
      <Olho className="text-muted-foreground/25 w-16" />
      <p className="font-display mt-6 text-lg font-semibold">{titulo}</p>
      {descricao ? (
        <p className="text-muted-foreground mt-2 max-w-sm text-sm text-pretty">{descricao}</p>
      ) : null}
      {acao ? <div className="mt-6">{acao}</div> : null}
    </div>
  )
}
