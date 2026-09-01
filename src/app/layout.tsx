import type { Metadata } from 'next'
import { Anek_Latin, Roboto, Sora } from 'next/font/google'
import { usuarioAtual } from '@/lib/auth-guards'
import { Nav } from '@/components/nav'
import './globals.css'

/*
 * Tipografia do Design System AUVP: Anek Latin nos títulos, Roboto no corpo,
 * Sora nos botões.
 *
 * Servidas pelo `next/font` em vez do @import do Google Fonts que a Central
 * usa: as fontes são baixadas no build e servidas pelo próprio domínio, o que
 * elimina a requisição a terceiro no carregamento e o pulo de layout na troca
 * da fonte de fallback pela definitiva.
 */
const anek = Anek_Latin({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-anek-src',
  display: 'swap',
})

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto-src',
  display: 'swap',
})

const sora = Sora({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-sora-src',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Catálogo de Presentes',
  description: 'Catálogo e solicitação de presentes — Relacionamento AUVP',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A navegação depende do perfil, então é montada no servidor a cada request.
  const usuario = await usuarioAtual()

  return (
    <html lang="pt-BR" className={`${anek.variable} ${roboto.variable} ${sora.variable}`}>
      {/* O fundo da aplicação é levemente tingido para que os cards brancos
          leiam como superfície elevada, e não como recortes do próprio fundo. */}
      <body className="bg-muted/40 min-h-screen antialiased">
        {usuario ? <Nav perfil={usuario.perfil} nome={usuario.nome} /> : null}
        <main className="mx-auto max-w-7xl px-4 py-10">{children}</main>
      </body>
    </html>
  )
}
