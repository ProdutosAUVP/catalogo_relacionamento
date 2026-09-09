import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDeTabela } from '@/components/esqueletos'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho />
      <EsqueletoDeStats />
      {/* O time de Relacionamento cabe numa tela. */}
      <EsqueletoDeTabela linhas={6} />
    </>
  )
}
