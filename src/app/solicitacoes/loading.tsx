import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDeTabela } from '@/components/esqueletos'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho comAcoes />
      <EsqueletoDeStats />
      <EsqueletoDeTabela />
    </>
  )
}
