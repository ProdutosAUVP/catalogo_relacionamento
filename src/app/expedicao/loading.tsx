import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDePedidos } from '@/components/esqueletos'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho comAcoes acoes={2} />
      <EsqueletoDeStats />
      {/* Mesma altura da barra de filtros da tela, com a margem inferior. */}
      <div className="mb-6 h-10" />
      {/*
        Um cartão, e não dois, por causa do rodapé.
        O `<main>` tem `flex-1`: com o conteúdo mais curto que a janela, o rodapé
        fica colado no fim da tela e não sai do lugar quando o conteúdo chega.
        Dois cartões estouram a janela, empurram o rodapé para fora do campo de
        visão, e ele volta a aparecer quando a fila tem um pedido só — que é o
        deslocamento medido. Um cartão cabe, e a fila da expedição drena todo dia.
      */}
      <EsqueletoDePedidos cards={1} />
    </>
  )
}
