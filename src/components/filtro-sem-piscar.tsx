'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import type { Route } from 'next'
import { Button } from '@/components/ui/button'

/**
 * Navegação de filtro que não troca a tela pelo esqueleto.
 *
 * Filtrar é mudar a mesma tela, não ir para outra. Só que uma navegação comum
 * do App Router entrega o segmento ao `loading.tsx` enquanto o servidor
 * responde: a grade de presentes vira blocos cinza e volta, e num servidor
 * rápido isso dura poucos quadros. O olho lê como piscada, e quem filtra
 * clica várias vezes seguidas.
 *
 * `startTransition` resolve: a navegação vira uma transição, o React mantém o
 * conteúdo atual na tela até o novo chegar, e o `loading.tsx` não entra. Ele
 * continua existindo e continua servindo onde faz sentido, na primeira carga
 * de cada rota, onde não há conteúdo anterior para manter.
 *
 * O elemento continua sendo `<a href>` e o formulário continua sendo
 * `method="get"`: o filtro mora na URL, o Next pré-carrega ao passar o mouse,
 * abrir em outra aba funciona, e sem JavaScript tudo ainda navega.
 */

/** Se o clique é do navegador (nova aba, download), não intercepta. */
const cliqueDoNavegador = (e: React.MouseEvent) =>
  e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0

export function LinkDeFiltro({
  href,
  children,
  className,
  ...resto
}: {
  href: Route
  children: React.ReactNode
  className?: string
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href' | 'className' | 'children'>) {
  const router = useRouter()
  const [, iniciar] = useTransition()

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (cliqueDoNavegador(e)) return
        e.preventDefault()
        iniciar(() => router.push(href))
      }}
      {...resto}
    >
      {children}
    </Link>
  )
}

/**
 * Se o filtro desta tela está a caminho.
 *
 * É contexto, e não uma função passada como filho: o formulário é montado por
 * um componente de servidor, e função não atravessa essa fronteira. Assim o
 * botão sabe que está esperando sem que a página precise saber de nada.
 */
const FiltroPendente = createContext(false)

/**
 * Formulário de filtro.
 *
 * Sem o `onSubmit`, `method="get"` recarrega o documento inteiro: a pior
 * piscada das três, porque a aplicação toda é montada de novo. Com ele, o
 * envio vira a mesma transição dos links.
 */
export function FormDeFiltro({
  acao,
  children,
  className,
}: {
  /** A rota de destino, sem query. */
  acao: Route
  children: React.ReactNode
  className?: string
}) {
  const router = useRouter()
  const [pendente, iniciar] = useTransition()

  return (
    <FiltroPendente.Provider value={pendente}>
      <form
        method="get"
        action={acao}
        className={className}
        onSubmit={(e) => {
          e.preventDefault()

          const params = new URLSearchParams()
          for (const [chave, valor] of new FormData(e.currentTarget).entries()) {
            const texto = String(valor).trim()
            // Campo vazio não vira `?busca=` na URL: filtro ausente é ausente.
            if (texto) params.set(chave, texto)
          }

          const query = params.toString()
          iniciar(() => router.push((query ? `${acao}?${query}` : acao) as Route))
        }}
      >
        {children}
      </form>
    </FiltroPendente.Provider>
  )
}

/**
 * O botão que envia o filtro.
 *
 * Mostra que está trabalhando no próprio botão, e não na tela: escurecer ou
 * esvaziar o conteúdo enquanto espera seria trocar uma piscada por outra.
 */
export function BotaoDeFiltro({ children }: { children: React.ReactNode }) {
  const pendente = useContext(FiltroPendente)

  return (
    <Button type="submit" variant="secondary" disabled={pendente}>
      {pendente ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </Button>
  )
}
