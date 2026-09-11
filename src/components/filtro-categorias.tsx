import Link from 'next/link'
import type { Route } from 'next'
import { LayoutGrid } from 'lucide-react'
import { CLASSES_DE_TOM, visualDaCategoria } from '@/lib/categorias'
import { cn } from '@/lib/utils'

/**
 * Seletor de categorias: cards com ícone e contagem, como na Central, no
 * lugar de um `select` solto.
 *
 * São links, e não botões com estado no cliente: o filtro já vive na URL, o
 * Next pré-carrega cada destino ao passar o mouse, e a navegação continua
 * funcionando com JavaScript desligado. A contagem ao lado do nome evita o
 * clique que leva a uma lista vazia.
 */
export type OpcaoDeCategoria = { id: string; nome: string; total: number }

export function FiltroCategorias({
  opcoes,
  selecionada,
  total,
  href,
}: {
  opcoes: readonly OpcaoDeCategoria[]
  selecionada?: string
  total: number
  /** Monta a URL de cada opção preservando os demais filtros da tela. */
  href: (categoriaId?: string) => Route
}) {
  return (
    <div
      role="group"
      aria-label="Filtrar por categoria"
      className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1"
    >
      <Opcao
        ativo={!selecionada}
        href={href()}
        Icone={LayoutGrid}
        tom="bg-primary/10 text-primary"
        rotulo="Todos"
        total={total}
      />
      {opcoes.map((opcao) => {
        const { tom, icone } = visualDaCategoria(opcao.nome)
        return (
          <Opcao
            key={opcao.id}
            ativo={selecionada === opcao.id}
            href={href(opcao.id)}
            Icone={icone}
            tom={CLASSES_DE_TOM[tom]}
            rotulo={opcao.nome}
            total={opcao.total}
          />
        )
      })}
    </div>
  )
}

function Opcao({
  ativo,
  href,
  Icone,
  tom,
  rotulo,
  total,
}: {
  ativo: boolean
  href: Route
  Icone: React.ElementType
  tom: string
  rotulo: string
  total: number
}) {
  return (
    <Link
      href={href}
      aria-current={ativo ? 'true' : undefined}
      className={cn(
        'bg-card ease-apple group flex shrink-0 items-center gap-2.5 rounded-xl border py-2 pr-3.5 pl-2 text-left transition-[border-color,box-shadow,background-color] duration-300',
        ativo
          ? 'border-primary ring-primary/25 bg-primary/5 ring-2'
          : 'sm:hover:border-primary/40 sm:hover:shadow-sm',
      )}
    >
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', tom)}>
        <Icone className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="font-display text-foreground block text-xs leading-tight font-bold whitespace-nowrap">
          {rotulo}
        </span>
        <span className="text-muted-foreground font-roboto mt-0.5 block text-[10px] leading-tight">
          {total} {total === 1 ? 'item' : 'itens'}
        </span>
      </span>
    </Link>
  )
}
