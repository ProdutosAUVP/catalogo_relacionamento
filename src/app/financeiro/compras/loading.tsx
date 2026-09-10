import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDeTabela } from '@/components/esqueletos'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho />
      <EsqueletoDeStats />
      {/* A fila de compras é curta e drena; sete linhas é o tamanho comum. */}
      <EsqueletoDeTabela linhas={7} />
    </>
  )
}
