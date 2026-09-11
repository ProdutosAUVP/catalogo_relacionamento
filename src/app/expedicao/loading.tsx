import { EsqueletoDeCabecalho, EsqueletoDeStats, EsqueletoDePedidos } from '@/components/esqueletos'

export default function Carregando() {
  return (
    <>
      <EsqueletoDeCabecalho comAcoes acoes={2} />
      <EsqueletoDeStats />
      {/* Mesma altura da barra de filtros da tela, com a margem inferior. */}
      <div className="mb-6 h-10" />
      {/*
        Dois cartões, por causa do rodapé.
        O `<main>` tem `flex-1`: enquanto o conteúdo cabe na janela, o rodapé
        fica colado no fim da tela; quando passa, ele sai do campo de visão. O
        deslocamento acontece quando esqueleto e conteúdo caem em lados
        diferentes dessa linha.
        Um cartão deixa o rodapé visível, e qualquer fila com dois ou mais
        pedidos o empurra para fora, que era o deslocamento medido. Com dois,
        esqueleto e conteúdo já nascem do mesmo lado no caso comum, porque a
        fila da expedição raramente tem um pedido só.
      */}
      <EsqueletoDePedidos cards={2} />
    </>
  )
}
