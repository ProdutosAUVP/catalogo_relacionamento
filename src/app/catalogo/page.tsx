import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { catalogoProvider } from '@/lib/providers'
import { formatarBRL } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CabecalhoDaPagina } from '@/components/pagina'
import Link from 'next/link'

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
  await exigirPermissao('catalogo.ver')

  const { busca, categoria } = await searchParams

  const [pagina, categorias] = await Promise.all([
    catalogoProvider.listar({ busca, categoriaId: categoria, apenasAtivos: true, porPagina: 48 }),
    db.categoria.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } }),
  ])

  return (
    <>
      <CabecalhoDaPagina
        titulo="Catálogo"
        descricao={`${pagina.total} ${pagina.total === 1 ? 'presente disponível' : 'presentes disponíveis'}`}
      />

      <form className="mb-6 flex flex-wrap gap-2" method="get">
        <Input
          name="busca"
          defaultValue={busca}
          placeholder="Buscar por nome ou descrição"
          className="max-w-xs"
        />
        <select
          name="categoria"
          defaultValue={categoria ?? ''}
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="">Todas as categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {busca || categoria ? (
          <Button variant="ghost" asChild>
            <Link href="/catalogo">Limpar</Link>
          </Button>
        ) : null}
      </form>

      {pagina.itens.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Nenhum presente encontrado com esses filtros.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pagina.itens.map((produto) => (
            <Card key={produto.id} className="flex flex-col overflow-hidden">
              {produto.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={produto.fotoUrl}
                  alt={produto.nome}
                  className="bg-muted aspect-4/3 w-full object-cover"
                />
              ) : (
                <div className="bg-muted text-muted-foreground flex aspect-4/3 items-center justify-center text-xs">
                  sem foto
                </div>
              )}

              <CardHeader className="pb-3">
                <Badge variant="outline" className="w-fit">
                  {produto.categoriaNome}
                </Badge>
                <CardTitle className="text-base">{produto.nome}</CardTitle>
              </CardHeader>

              <CardContent className="mt-auto space-y-1">
                <p className="font-medium">
                  {produto.tipoValor === 'medio' ? 'a partir de ' : ''}
                  {formatarBRL(produto.valor)}
                </p>
                {/* Produto que não controla estoque não exibe disponibilidade,
                    em vez de exibir zero. */}
                {produto.controlaEstoque ? (
                  <p className="text-muted-foreground text-xs">
                    {produto.estoque && produto.estoque > 0
                      ? `${produto.estoque} em estoque`
                      : 'sem estoque'}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
