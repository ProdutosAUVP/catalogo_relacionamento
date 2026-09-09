import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDeTabela } from '@/components/esqueletos'
import { Skeleton } from '@/components/ui/skeleton'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho comAcoes acoes={2} />
      <EsqueletoDeStats />
      <div className="bg-card mb-6 flex flex-wrap items-center gap-2 rounded-lg border p-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      {/* A gestão lista o mês inteiro: oito linhas é o tamanho típico, e é o
          que mantém o rodapé do mesmo lado da dobra antes e depois. */}
      <EsqueletoDeTabela linhas={8} />
    </>
  )
}
