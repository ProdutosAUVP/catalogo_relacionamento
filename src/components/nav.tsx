'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { usePathname } from 'next/navigation'
import type { Perfil } from '@prisma/client'
import { Olho } from '@/components/marca/olho'
import { pode, ROTULO_PERFIL, type Acao } from '@/lib/permissions'
import { cn } from '@/lib/utils'

/**
 * Navegação montada a partir da matriz de permissões.
 *
 * O menu não é controle de acesso — cada rota tem a própria guarda de servidor.
 * Ele existe para não oferecer à pessoa um caminho que terminaria em redirect.
 *
 * É um Client Component só por causa do `usePathname`, que marca o item ativo.
 * Perfil e nome chegam prontos do servidor; nada de sessão é resolvido aqui.
 */

type ItemDeMenu = { href: Route; rotulo: string; acao: Acao }

const ITENS: readonly ItemDeMenu[] = [
  { href: '/catalogo', rotulo: 'Catálogo', acao: 'catalogo.ver' },
  { href: '/solicitacoes', rotulo: 'Minhas solicitações', acao: 'solicitacao.verProprias' },
  { href: '/financeiro/compras', rotulo: 'Fila de compras', acao: 'compras.verFila' },
  { href: '/admin/solicitacoes', rotulo: 'Gestão', acao: 'solicitacao.verTodas' },
  { href: '/admin/catalogo', rotulo: 'Catálogo (admin)', acao: 'catalogo.gerenciar' },
  { href: '/admin/clientes', rotulo: 'Clientes', acao: 'cliente.gerenciar' },
  { href: '/admin/usuarios', rotulo: 'Usuários', acao: 'usuario.gerenciar' },
] as const

export function Nav({ perfil, nome }: { perfil: Perfil; nome: string }) {
  const caminho = usePathname()
  const visiveis = ITENS.filter((item) => pode(perfil, item.acao))

  const iniciais = nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')

  return (
    // A barra é escura nos dois temas, então as cores aqui são literais: os
    // tokens de texto do tema claro sumiriam sobre o verde da marca.
    <header className="bg-brand-dark dark:bg-card sticky top-0 z-40 border-b border-white/10">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-white">
          <Olho className="w-8" />
          <span className="font-display text-base leading-none font-semibold tracking-tight">
            Presentes
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          {visiveis.map((item) => {
            const ativo = caminho === item.href || caminho.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                  ativo
                    ? 'bg-white/15 font-medium text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                {item.rotulo}
              </Link>
            )
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2.5">
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm text-white">{nome}</p>
            <p className="text-xs text-white/55">{ROTULO_PERFIL[perfil]}</p>
          </div>
          <span
            className="font-ui grid size-9 place-items-center rounded-full bg-white/15 text-xs font-semibold text-white"
            aria-hidden="true"
          >
            {iniciais}
          </span>
        </div>
      </nav>
    </header>
  )
}
