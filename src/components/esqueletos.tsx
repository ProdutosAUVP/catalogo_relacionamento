import { Skeleton } from '@/components/ui/skeleton'

/**
 * Esqueletos das telas, usados pelos `loading.tsx`.
 *
 * A regra que vale para todos: **mesmas medidas do conteúdo real**. Um
 * esqueleto mais baixo que a tabela que ele antecede produz exatamente o salto
 * que ele deveria evitar — e um mais alto também, porque o rodapé sobe quando
 * o conteúdo chega.
 *
 * A quantidade de linhas de tabela é a única medida que não dá para acertar
 * sempre: ela depende de quantos registros a consulta devolve. Cinco é a
 * aproximação escolhida; o resíduo de deslocamento que sobra vem daí.
 */

export function EsqueletoDeCabecalho({ comAcoes = false }: { comAcoes?: boolean }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Skeleton className="mb-2 h-3 w-24" />
        {/* h-9 = altura do <h1> em text-3xl */}
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      </div>
      {comAcoes ? <Skeleton className="h-10 w-40" /> : null}
    </div>
  )
}

export function EsqueletoDeStats({ quantidade = 3 }: { quantidade?: number }) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: quantidade }).map((_, i) => (
        // h-[132px] = padding do cartão + rótulo + número + linha de apoio
        <Skeleton key={i} className="h-[132px] rounded-lg" />
      ))}
    </div>
  )
}

export function EsqueletoDeTabela({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="bg-muted/40 h-11 border-b" />
      {Array.from({ length: linhas }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function EsqueletoDeCatalogo({ cards = 8 }: { cards?: number }) {
  return (
    <>
      <div className="bg-card mb-4 flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <Skeleton className="h-10 w-full max-w-xs flex-1" />
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="mb-6 flex gap-2 overflow-hidden pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[52px] w-36 shrink-0 rounded-xl" />
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="bg-card overflow-hidden rounded-2xl border">
            {/* Mesma proporção da foto: a troca não muda a altura do card. */}
            <Skeleton className="aspect-3/4 rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="mt-3 h-6 w-24" />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

/**
 * Cartões de pedido da expedição.
 *
 * Altura fixa por cartão porque a coluna do endereço tem sempre as mesmas cinco
 * linhas — é o dado de envio, não texto livre.
 */
export function EsqueletoDePedidos({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: cards }).map((_, i) => (
        <Skeleton key={i} className="h-[248px] rounded-lg" />
      ))}
    </div>
  )
}
