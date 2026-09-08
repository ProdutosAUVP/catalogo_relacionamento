import { redirect } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { usuarioAtual } from '@/lib/auth-guards'
import { devBypassHabilitado, env, ssoConfigurado } from '@/lib/env'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Olho } from '@/components/marca/olho'

/**
 * Login exclusivamente por SSO. Não existe cadastro nem senha própria.
 *
 * Enquanto o client OIDC não estiver configurado, a tela diz o que falta em vez
 * de mostrar um botão que não funciona.
 */
export default async function LoginPage() {
  if (await usuarioAtual()) redirect('/')

  return (
    // Tela cheia com a marca sobre o verde AUVP: é a primeira coisa que a
    // pessoa vê da ferramenta, e um card solto no meio do branco não diz de
    // quem é o sistema.
    <div className="bg-brand-dark fixed inset-0 flex flex-col items-center justify-center overflow-auto px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center text-white">
          <Olho className="mx-auto w-20" />
          <h1 className="font-display mt-6 text-2xl font-semibold tracking-tight">
            Catálogo de Presentes
          </h1>
          <p className="mt-2 text-sm text-white/60">Relacionamento AUVP</p>
        </div>

        <div className="bg-card space-y-6 rounded-lg p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]">
          {ssoConfigurado ? (
            <form
              action={async () => {
                'use server'
                await signIn('auvp', { redirectTo: '/' })
              }}
              className="space-y-3"
            >
              <Button type="submit" size="lg" className="w-full">
                Entrar com {env.AUTH_OIDC_NAME}
              </Button>
              <p className="text-muted-foreground text-center text-xs">
                O acesso usa sua conta AUVP. Não há senha própria.
              </p>
            </form>
          ) : (
            <div className="text-muted-foreground text-sm">
              <p className="text-foreground font-medium">SSO ainda não configurado.</p>
              <p className="mt-2">
                Faltam <code>AUTH_OIDC_ISSUER</code>, <code>AUTH_OIDC_CLIENT_ID</code> e{' '}
                <code>AUTH_OIDC_CLIENT_SECRET</code>. Ver{' '}
                <code>docs/05-perguntas-em-aberto.md</code>.
              </p>
            </div>
          )}

          {devBypassHabilitado ? (
            <form
              action={async (dados: FormData) => {
                'use server'
                await signIn('dev', {
                  email: String(dados.get('email') ?? ''),
                  nome: String(dados.get('nome') ?? ''),
                  redirectTo: '/',
                })
              }}
              className="space-y-3 border-t pt-6"
            >
              <p className="text-muted-foreground text-xs">
                Atalho de desenvolvimento. Indisponível fora de <code>NODE_ENV=development</code>.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="voce@auvp.com.br"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" name="nome" placeholder="Seu nome" />
              </div>
              <Button type="submit" variant="outline" className="w-full">
                Entrar sem SSO
              </Button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
