import Link from 'next/link'
import type { Route } from 'next'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { catalogoProvider } from '@/lib/providers'
import { versoDaFoto } from '@/lib/fotos'
import { formatarBRL } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProdutoImagem } from '@/components/produto-imagem'
import { CategoriaBadge } from '@/components/categoria-badge'
import { FiltroCategorias } from '@/components/filtro-categorias'
import { CabecalhoDaPagina, EstadoVazio } from '@/components/pagina'

/**
 * Catálogo do consultor.
 *
 * Lê pelo `catalogoProvider`, nunca pelo Prisma diretamente: quando o Tiny
 * entrar na fase 2, esta tela não muda. A contagem por categoria é a exceção —
 * é agregação de tela, não leitura de catálogo.
 */
export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; categoria?: string }>
}) {
  const usuario = await exigirPermissao('catalogo.ver')
  const { busca, categoria } = await searchParams

  const [pagina, categorias, contagem] = await Promise.all([
    catalogoProvider.listar({ busca, categoriaId: categoria, apenasAtivos: true, porPagina: 48 }),
    db.categoria.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
    db.produto.groupBy({ by: ['categoriaId'], where: { ativo: true }, _count: { _all: true } }),
  ])

  const porCategoria = new Map(contagem.map((c) => [c.categoriaId, c._count._all]))
  const totalAtivos = contagem.reduce((acc, c) => acc + c._count._all, 0)

  const opcoes = categorias
    .map((c) => ({ id: c.id, nome: c.nome, total: porCategoria.get(c.id) ?? 0 }))
    .filter((c) => c.total > 0)

  // Preserva a busca ao trocar de categoria: o filtro é composto, não exclusivo.
  const hrefDaCategoria = (categoriaId?: string): Route => {
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (categoriaId) params.set('categoria', categoriaId)
    const query = params.toString()
    return (query ? `/catalogo?${query}` : '/catalogo') as Route
  }

  const filtrando = Boolean(busca || categoria)

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Presentes"
        titulo="Catálogo"
        descricao="Escolha o presente e siga para a solicitação. Produtos desativados não aparecem aqui."
        acoes={
          pode(usuario.perfil, 'solicitacao.criar') ? (
            <Button asChild>
              <Link href="/solicitacoes/nova">Nova solicitação</Link>
            </Button>
          ) : null
        }
      />

      <form
        method="get"
        className="bg-card mb-4 flex flex-wrap items-center gap-2 rounded-lg border p-3"
      >
        {/* A categoria viaja escondida para que buscar não descarte o filtro. */}
        {categoria ? <input type="hidden" name="categoria" value={categoria} /> : null}
        <Input
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por nome ou descrição"
          aria-label="Buscar no catálogo"
          className="w-full max-w-xs flex-1"
        />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {filtrando ? (
          <Button variant="ghost" asChild>
            <Link href="/catalogo">Limpar</Link>
          </Button>
        ) : null}
        <p className="text-muted-foreground ml-auto pr-1 text-sm">
          {pagina.total} {pagina.total === 1 ? 'presente' : 'presentes'}
        </p>
      </form>

      <FiltroCategorias
        opcoes={opcoes}
        selecionada={categoria}
        total={totalAtivos}
        href={hrefDaCategoria}
      />

      {pagina.itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum presente encontrado"
          descricao={
            filtrando
              ? 'Nenhum produto ativo bate com esses filtros. Tente outra busca ou volte para “Todos”.'
              : 'O catálogo ainda não tem produtos ativos. O Admin cadastra em Catálogo (admin).'
          }
          acao={
            filtrando ? (
              <Button variant="outline" asChild>
                <Link href="/catalogo">Limpar filtros</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pagina.itens.map((produto, indice) => {
            const semEstoque = produto.controlaEstoque && !produto.estoque

            return (
              <article
                key={produto.id}
                className="group bg-card ease-apple sm:hover:border-primary/30 flex flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow,border-color] duration-300 sm:hover:-translate-y-1 sm:hover:shadow-xl"
              >
                <ProdutoImagem
                  fotoUrl={produto.fotoUrl}
                  fotoVersoUrl={versoDaFoto(produto.fotoUrl)}
                  nome={produto.nome}
                  categoria={produto.categoriaNome}
                  // A primeira fileira carrega sem lazy: são as fotos que a
                  // pessoa vê antes de rolar.
                  prioridade={indice < 4}
                />

                <div className="flex flex-1 flex-col items-start gap-1.5 p-4">
                  <CategoriaBadge categoria={produto.categoriaNome} />
                  <h2 className="font-display leading-snug font-semibold text-balance">
                    {produto.nome}
                  </h2>
                  {produto.descricao ? (
                    <p className="text-muted-foreground font-roboto line-clamp-2 text-xs leading-relaxed">
                      {produto.descricao}
                    </p>
                  ) : null}

                  <div className="mt-auto flex w-full items-end justify-between gap-3 pt-3">
                    <p className="flex items-baseline gap-1.5 leading-tight">
                      {produto.tipoValor === 'medio' ? (
                        <span className="text-muted-foreground text-xs">a partir de</span>
                      ) : null}
                      <span className="text-lg font-semibold">{formatarBRL(produto.valor)}</span>
                    </p>

                    {/* Produto que não controla estoque não exibe
                        disponibilidade, em vez de exibir zero. */}
                    {produto.controlaEstoque ? (
                      <Badge variant={semEstoque ? 'muted' : 'outline'}>
                        {semEstoque ? 'sem estoque' : `${produto.estoque} un.`}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </>
  )
}
