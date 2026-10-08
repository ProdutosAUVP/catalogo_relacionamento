import { Skeleton } from '@/components/ui/skeleton'
import { EsqueletoDeCabecalho } from '@/components/esqueletos'

/**
 * Esqueleto do Dashboard Logístico, nas medidas do conteúdo real, medidas no
 * navegador em 1280 px e em 375 px: seletor, status, números, os dois
 * gráficos e as horas. A trilha fica abaixo da dobra e não entra na conta.
 */
export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho />
      <Skeleton className="mb-6 h-[202px] rounded-lg sm:h-[66px]" />
      <Skeleton className="mb-6 h-[218px] rounded-lg sm:h-[122px]" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[134px] rounded-lg sm:h-[142px]" />
        ))}
      </div>
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[356px] rounded-lg" />
        <Skeleton className="h-[356px] rounded-lg" />
      </div>
      <Skeleton className="h-[181px] rounded-lg" />
    </>
  )
}
