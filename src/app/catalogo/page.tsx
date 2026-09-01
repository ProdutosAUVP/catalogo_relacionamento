import Link from 'next/link'
import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { catalogoProvider } from '@/lib/providers'
import { formatarBRL } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ProdutoImagem } from '@/components/produto-imagem'
import { BarraDeFiltros, CabecalhoDaPagina, EstadoVazio } from '@/components/pagina'

/**
 * Catálogo do consultor.
 *
 * Lê pelo `catalogoProvider`, nunca pelo Prisma diretamente: quando o Tiny
 * entrar na fase 2, esta tela não muda.
 */
export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; categoria?: string }>
}) {
  const usuario = await exigirPermissao('catalogo.ver')
  const { busca, categoria } = await searchParams

  const [pagina, categorias] = await Promise.all([
    catalogoProvider.listar({ busca, categoriaId: categoria, apenasAtivos: true, porPagina: 48 }),
    db.categoria.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
  ])

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

      <BarraDeFiltros>
        <form method="get" className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            name="busca"
            defaultValue={busca}
            placeholder="Buscar por nome ou descrição"
            aria-label="Buscar no catálogo"
            className="w-full max-w-xs flex-1"
          />
          <Select
            name="categoria"
            defaultValue={categoria ?? ''}
            aria-label="Filtrar por categoria"
            className="w-auto min-w-52"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
          {filtrando ? (
            <Button variant="ghost" asChild>
              <Link href="/catalogo">Limpar</Link>
            </Button>
          ) : null}
        </form>

        <p className="text-muted-foreground ml-auto pr-1 text-sm">
          {pagina.total} {pagina.total === 1 ? 'presente' : 'presentes'}
        </p>
      </BarraDeFiltros>

      {pagina.itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum presente encontrado"
          descricao={
            filtrando
              ? 'Nenhum produto ativo bate com esses filtros. Tente outra busca ou limpe o filtro de categoria.'
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
          {pagina.itens.map((produto) => {
            const semEstoque = produto.controlaEstoque && !produto.estoque

            return (
              <article
                key={produto.id}
                className="group bg-card flex flex-col overflow-hidden rounded-lg border shadow-[0_1px_2px_rgba(11,41,5,0.04)] transition-shadow duration-200 hover:shadow-[0_8px_24px_-12px_rgba(11,41,5,0.28)]"
              >
                <ProdutoImagem
                  fotoUrl={produto.fotoUrl}
                  nome={produto.nome}
                  categoria={produto.categoriaNome}
                />

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-muted-foreground font-ui text-xs font-semibold tracking-[0.1em] uppercase">
                    {produto.categoriaNome}
                  </p>
                  <h2 className="font-display mt-1.5 leading-snug font-semibold text-balance">
                    {produto.nome}
                  </h2>
                  {produto.descricao ? (
                    <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm">
                      {produto.descricao}
                    </p>
                  ) : null}

                  <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                    {/* O "a partir de" fica na mesma linha do valor: como
                        bloco acima, ele empurrava o preço para baixo e as
                        linhas de preço da grade deixavam de se alinhar. */}
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
                        {semEstoque ? 'sem estoque' : `${produto.estoque} em estoque`}
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
