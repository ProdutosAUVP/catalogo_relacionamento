import { EsqueletoDeCabecalho, EsqueletoDeDetalhe } from '@/components/esqueletos'
import { Skeleton } from '@/components/ui/skeleton'

export default function Carregando() {
  return (
    <>
      {/* Altura do link "voltar", que fica acima do cabeçalho. */}
      <Skeleton className="mb-4 h-5 w-56" />
      <EsqueletoDeCabecalho comAcoes />
      <EsqueletoDeDetalhe />
    </>
  )
}
