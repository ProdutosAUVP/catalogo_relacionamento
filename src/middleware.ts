import { NextResponse, type NextRequest } from 'next/server'

/**
 * Barreira de borda: quem não tem cookie de sessão nem chega a renderizar
 * página autenticada.
 *
 * Não substitui as guardas de `auth-guards.ts`. O middleware roda no edge e só
 * enxerga a existência do cookie, não o perfil; a autorização de verdade é
 * feita no servidor, com o banco em mãos.
 */

const ROTAS_PUBLICAS = ['/login', '/api/auth']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (ROTAS_PUBLICAS.some((rota) => pathname.startsWith(rota))) {
    return NextResponse.next()
  }

  const temSessao =
    req.cookies.has('authjs.session-token') || req.cookies.has('__Secure-authjs.session-token')

  if (temSessao) return NextResponse.next()

  // Rota de API responde 401 em JSON. Redirecionar devolveria HTML de login
  // para um `fetch`, que quebraria ao tentar interpretar a resposta.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  const url = req.nextUrl.clone()
  url.pathname = '/login'
  // Preserva o destino para voltar depois do login.
  url.searchParams.set('callbackUrl', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
