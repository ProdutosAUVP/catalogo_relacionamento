import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDeTabela } from '@/components/esqueletos'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho />
      <EsqueletoDeStats />
      <EsqueletoDeTabela linhas={8} />
    </>
  )
}
