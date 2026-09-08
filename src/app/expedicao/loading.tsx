import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDePedidos } from '@/components/esqueletos'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho comAcoes />
      <EsqueletoDeStats />
      {/* Mesma altura da barra de filtros da tela, com a margem inferior. */}
      <div className="mb-6 h-10" />
      <EsqueletoDePedidos />
    </>
  )
}
