import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDeTabela } from '@/components/esqueletos'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho comAcoes acoes={2} />
      <EsqueletoDeStats />
      {/* A lista de clientes é paginada em 200; oito é a altura típica da primeira tela. */}
      <EsqueletoDeTabela linhas={8} />
    </>
  )
}
