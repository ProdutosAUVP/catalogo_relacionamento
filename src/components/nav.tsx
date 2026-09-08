'use client'

import { useState } from 'react'
import Link, { useLinkStatus } from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import type { Perfil } from '@prisma/client'
import {
  ChevronDown,
  Gift,
  ListChecks,
  Package,
  ShoppingCart,
  Users,
  UserSquare,
  Table2,
  type LucideIcon,
} from 'lucide-react'
import { Olho } from '@/components/marca/olho'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { pode, ROTULO_PERFIL, type Acao } from '@/lib/permissions'
import { cn } from '@/lib/utils'

/**
 * Navegação superior, no padrão do `GlobalNav` da Central: barra clara com
 * blur, o olho solto sobre o fundo, itens em Anek com sublinhado fino no ativo
 * e um balão de descrição no hover.
 *
 * O menu é montado a partir da matriz de permissões, mas **não é controle de
 * acesso** — cada rota tem a própria guarda de servidor. Ele existe para não
 * oferecer um caminho que terminaria em redirect.
 *
 * Client Component por três coisas: `usePathname` marca o item ativo,
 * `useLinkStatus` acende o item enquanto a rota carrega, e o balão de hover
 * precisa de estado. Perfil e nome chegam prontos do servidor.
 */

type ItemDeMenu = {
  id: string
  href: Route
  rotulo: string
  descricao: string
  icone: LucideIcon
  acao: Acao
}

const ITENS: readonly ItemDeMenu[] = [
  {
    id: 'catalogo',
    href: '/catalogo',
    rotulo: 'Catálogo',
    descricao: 'Os presentes disponíveis, com valor e estoque',
    icone: Gift,
    acao: 'catalogo.ver',
  },
  {
    id: 'minhas',
    href: '/solicitacoes',
    rotulo: 'Minhas solicitações',
    descricao: 'O que você pediu e o status de cada envio',
    icone: ListChecks,
    acao: 'solicitacao.verProprias',
  },
  {
    id: 'compras',
    href: '/financeiro/compras',
    rotulo: 'Fila de compras',
    descricao: 'Itens enviados para compra, com valor e site',
    icone: ShoppingCart,
    acao: 'compras.verFila',
  },
  {
    id: 'gestao',
    href: '/admin/solicitacoes',
    rotulo: 'Gestão',
    descricao: 'Fluxo completo, mudança de status e exportação',
    icone: Table2,
    acao: 'solicitacao.verTodas',
  },
  {
    id: 'produtos',
    href: '/admin/catalogo',
    rotulo: 'Produtos',
    descricao: 'Cadastro, edição e ativação do catálogo',
    icone: Package,
    acao: 'catalogo.gerenciar',
  },
  {
    id: 'clientes',
    href: '/admin/clientes',
    rotulo: 'Clientes',
    descricao: 'Cadastro manual e importação por CSV',
    icone: UserSquare,
    acao: 'cliente.gerenciar',
  },
  {
    id: 'usuarios',
    href: '/admin/usuarios',
    rotulo: 'Usuários',
    descricao: 'Perfil de acesso e limite mensal',
    icone: Users,
    acao: 'usuario.gerenciar',
  },
] as const

/**
 * Ponto que pulsa dentro do item clicado enquanto a rota carrega.
 *
 * Precisa ser um componente separado: `useLinkStatus` só lê o estado do `Link`
 * que o contém. Ocupa largura fixa em todo estado, para que acender e apagar
 * não empurre os vizinhos.
 */
function Pendente() {
  const { pending } = useLinkStatus()

  return (
    <span
      aria-hidden="true"
      className={cn(
        'ease-apple inline-block w-2 text-center transition-opacity duration-200',
        pending ? 'opacity-100' : 'opacity-0',
      )}
    >
      <span className="inline-block size-1 animate-pulse rounded-full bg-current align-middle" />
    </span>
  )
}

export function Nav({ perfil, nome }: { perfil: Perfil; nome: string }) {
  const caminho = usePathname()
  const [emHover, setEmHover] = useState<string | null>(null)
  const visiveis = ITENS.filter((item) => pode(perfil, item.acao))

  const ativo = (href: Route) => caminho === href || caminho.startsWith(`${href}/`)
  const atual = visiveis.find((item) => ativo(item.href))

  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 md:h-16 md:px-8">
        <div className="flex items-center gap-3">
          {/* O olho fica solto sobre o fundo da navegação, sem caixa. Como usa
              `currentColor`, ele acompanha o tema sozinho — escuro no claro,
              claro no escuro, que é a regra do Design System. */}
          <Link
            href="/"
            aria-label="Ir para a página inicial"
            className="focus-visible:ring-ring shrink-0 rounded-lg outline-none focus-visible:ring-2"
          >
            <Olho className="text-foreground w-8 md:w-10" />
          </Link>

          <span className="font-roboto shrink-0 rounded-full border border-amber-500/30 bg-amber-500/15 px-1.5 py-0.5 text-[9px] leading-none font-bold tracking-wider text-amber-600 uppercase dark:text-amber-400">
            v1
          </span>

          {/* Celular: o nome da seção atual vira o gatilho de um menu. */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="hover:bg-muted -mx-2 flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors outline-none">
                <span className="text-left">
                  <span className="font-display text-foreground block text-sm leading-tight font-bold">
                    {atual?.rotulo ?? 'Presentes'}
                  </span>
                  <span className="text-muted-foreground font-roboto block text-[10px] leading-tight tracking-wider uppercase">
                    AUVP
                  </span>
                </span>
                <ChevronDown
                  className="text-muted-foreground h-4 w-4 shrink-0"
                  aria-hidden="true"
                />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" className="w-72">
                {visiveis.map((item) => {
                  const Icone = item.icone
                  const estaAtivo = ativo(item.href)

                  return (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link href={item.href}>
                        <span
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                            estaAtivo
                              ? 'bg-foreground text-background border-foreground'
                              : 'bg-card text-foreground',
                          )}
                        >
                          <Icone className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="font-display text-foreground block text-sm leading-tight font-bold">
                            {item.rotulo}
                          </span>
                          <span className="text-muted-foreground font-roboto mt-0.5 block text-xs leading-snug">
                            {item.descricao}
                          </span>
                        </span>
                        {estaAtivo ? (
                          <span className="bg-background font-roboto mt-1 shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                            Atual
                          </span>
                        ) : null}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop: navegação horizontal com balão de descrição no hover. */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {visiveis.map((item) => {
              const Icone = item.icone
              const estaAtivo = ativo(item.href)
              const aberto = emHover === item.id

              return (
                <div
                  key={item.id}
                  className="relative"
                  onMouseEnter={() => setEmHover(item.id)}
                  onMouseLeave={() => setEmHover(null)}
                >
                  <Link
                    href={item.href}
                    aria-current={estaAtivo ? 'page' : undefined}
                    className={cn(
                      'font-display relative flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-normal transition-colors duration-200',
                      estaAtivo
                        ? 'text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {item.rotulo}
                    <Pendente />
                    {estaAtivo ? (
                      <span className="bg-foreground/30 absolute right-3 bottom-1 left-3 h-px rounded-full" />
                    ) : null}
                  </Link>

                  {/* O balão fica sempre no DOM e entra por opacidade e
                      deslocamento: montar e desmontar no hover causaria
                      recálculo de layout a cada passagem do mouse. */}
                  <div
                    aria-hidden={!aberto}
                    className="pointer-events-none absolute top-full left-1/2 z-50 mt-1.5 w-56"
                    style={{
                      transform: aberto
                        ? 'translateX(-50%) translateY(0)'
                        : 'translateX(-50%) translateY(-5px)',
                      opacity: aberto ? 1 : 0,
                      transition:
                        'opacity 200ms cubic-bezier(0.22,1,0.36,1), transform 200ms cubic-bezier(0.22,1,0.36,1)',
                    }}
                  >
                    <div className="bg-popover relative rounded-xl border p-3 shadow-lg">
                      <div className="bg-popover absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-sm border-t border-l" />
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                            estaAtivo
                              ? 'bg-foreground text-background border-foreground'
                              : 'bg-card text-foreground',
                          )}
                        >
                          <Icone className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display text-foreground text-sm leading-tight font-medium">
                            {item.rotulo}
                          </p>
                          <p className="text-muted-foreground font-roboto mt-0.5 text-xs leading-snug">
                            {item.descricao}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <div className="bg-border mx-0.5 hidden h-4 w-px md:block" />
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-foreground text-sm">{nome}</p>
            <p className="text-muted-foreground text-xs">{ROTULO_PERFIL[perfil]}</p>
          </div>
          <span
            className="bg-muted text-foreground font-ui grid size-9 place-items-center rounded-full text-xs font-semibold"
            aria-hidden="true"
          >
            {iniciais}
          </span>
        </div>
      </div>
    </header>
  )
}
