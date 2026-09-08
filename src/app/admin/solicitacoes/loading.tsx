import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDeTabela } from '@/components/esqueletos'
import { Skeleton } from '@/components/ui/skeleton'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho comAcoes />
      <EsqueletoDeStats />
      <div className="bg-card mb-6 flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <EsqueletoDeTabela linhas={8} />
    </>
  )
}
