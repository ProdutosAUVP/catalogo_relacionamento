import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDeTabela } from '@/components/esqueletos'
import { Skeleton } from '@/components/ui/skeleton'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho />
      <EsqueletoDeStats />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="mb-3 h-3 w-40" />
          <EsqueletoDeTabela linhas={5} />
        </div>
        <div>
          <Skeleton className="mb-3 h-3 w-20" />
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[108px] rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
