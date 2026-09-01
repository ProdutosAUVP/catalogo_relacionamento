import NextAuth, { type NextAuthConfig } from 'next-auth'
import type { Provider } from 'next-auth/providers'
import Credentials from 'next-auth/providers/credentials'
import { Perfil } from '@prisma/client'
import { db } from './db'
import { devBypassHabilitado, env, ssoConfigurado } from './env'

/**
 * Autenticação por SSO da AUVP (OIDC). Não existe senha própria.
 *
 * Duas decisões de desenho:
 *
 * 1. Sessão em JWT, sem adapter de banco. O provedor de identidade é a
 *    autoridade sobre quem é a pessoa; o banco é a autoridade sobre perfil e
 *    limite mensal. Misturar os dois num adapter faria a área depender de TI
 *    para mudar um perfil, que é exatamente o que a spec quer evitar.
 *
 * 2. O perfil é relido do banco a cada renovação do token, e não fixado no
 *    login. Assim, promover alguém a Admin passa a valer na próxima navegação,
 *    sem exigir que a pessoa saia e entre de novo.
 *
 * Pendência: confirmar o provedor (Google Workspace, Entra ID, Keycloak ou
 * outro) e se ele devolve grupos mapeáveis para perfil.
 * Ver docs/07-perguntas-em-aberto.md.
 */

function montarProviders(): Provider[] {
  const providers: Provider[] = []

  if (ssoConfigurado) {
    providers.push({
      id: 'auvp',
      name: env.AUTH_OIDC_NAME,
      type: 'oidc',
      issuer: env.AUTH_OIDC_ISSUER,
      clientId: env.AUTH_OIDC_CLIENT_ID,
      clientSecret: env.AUTH_OIDC_CLIENT_SECRET,
      authorization: { params: { scope: 'openid profile email' } },
      checks: ['pkce', 'state'],
    })
  }

  // Atalho de desenvolvimento: entrar informando um e-mail, sem SSO.
  // `devBypassHabilitado` já exige NODE_ENV=development, e `env.ts` derruba o
  // boot se alguém tentar ligar a flag em produção.
  if (devBypassHabilitado) {
    providers.push(
      Credentials({
        id: 'dev',
        name: 'Desenvolvimento (sem SSO)',
        credentials: {
          email: { label: 'E-mail', type: 'email' },
          nome: { label: 'Nome', type: 'text' },
        },
        authorize: async (credenciais) => {
          const email = String(credenciais?.email ?? '')
            .trim()
            .toLowerCase()
          if (!email) return null

          return {
            id: email,
            email,
            name: String(credenciais?.nome ?? '') || email.split('@')[0]!,
          }
        },
      }),
    )
  }

  return providers
}

/**
 * Cria ou atualiza o espelho local do usuário do SSO.
 *
 * O primeiro login cria com perfil `consultor`. A exceção é
 * `BOOTSTRAP_ADMIN_EMAILS`: sem ela o primeiro usuário do ambiente entraria
 * como consultor e não haveria ninguém com poder de promover ninguém.
 */
export async function sincronizarUsuario(dados: {
  email: string
  nome: string
  ssoSubject?: string | null
}) {
  const email = dados.email.trim().toLowerCase()
  const ehBootstrapAdmin = env.BOOTSTRAP_ADMIN_EMAILS.includes(email)

  return db.usuario.upsert({
    where: { email },
    create: {
      email,
      nome: dados.nome || email,
      ssoSubject: dados.ssoSubject ?? null,
      perfil: ehBootstrapAdmin ? Perfil.admin : Perfil.consultor,
    },
    update: {
      // O nome acompanha o provedor de identidade. Perfil e limite mensal, não:
      // são geridos pelo Admin dentro da ferramenta.
      nome: dados.nome || undefined,
      ssoSubject: dados.ssoSubject ?? undefined,
      ...(ehBootstrapAdmin ? { perfil: Perfil.admin } : {}),
    },
    select: { id: true, perfil: true, ativo: true, nome: true, email: true },
  })
}

export const authConfig: NextAuthConfig = {
  providers: montarProviders(),
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  callbacks: {
    async signIn({ user, profile }) {
      const email = (user.email ?? profile?.email)?.toLowerCase()
      if (!email) return false

      const registro = await sincronizarUsuario({
        email,
        nome: user.name ?? profile?.name ?? '',
        ssoSubject: profile?.sub ?? null,
      })

      // Usuário desativado pelo Admin não entra, mesmo com SSO válido.
      return registro.ativo
    },

    async jwt({ token }) {
      if (!token.email) return token

      const usuario = await db.usuario.findUnique({
        where: { email: token.email.toLowerCase() },
        select: { id: true, perfil: true, ativo: true, nome: true },
      })

      if (usuario) {
        token.usuarioId = usuario.id
        token.perfil = usuario.perfil
        token.ativo = usuario.ativo
        token.name = usuario.nome
      }

      return token
    },

    async session({ session, token }) {
      if (token.usuarioId) {
        session.user.id = token.usuarioId
        session.user.perfil = token.perfil ?? Perfil.consultor
        session.user.ativo = token.ativo ?? true
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
