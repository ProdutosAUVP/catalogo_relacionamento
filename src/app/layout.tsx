import type { Metadata } from 'next'
import { usuarioAtual } from '@/lib/auth-guards'
import { Nav } from '@/components/nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catálogo de Presentes',
  description: 'Catálogo e solicitação de presentes — Relacionamento AUVP',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // A navegação depende do perfil, então é montada no servidor a cada request.
  const usuario = await usuarioAtual()

  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        {usuario ? <Nav perfil={usuario.perfil} nome={usuario.nome} /> : null}
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
