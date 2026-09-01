import { redirect } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { usuarioAtual } from '@/lib/auth-guards'
import { devBypassHabilitado, env, ssoConfigurado } from '@/lib/env'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Login exclusivamente por SSO. Não existe cadastro nem senha própria.
 *
 * Enquanto o client OIDC não estiver configurado, a tela diz o que falta em vez
 * de mostrar um botão que não funciona.
 */
export default async function LoginPage() {
  if (await usuarioAtual()) redirect('/')

  return (
    <div className="mx-auto max-w-md pt-12">
      <Card>
        <CardHeader>
          <CardTitle>Catálogo de Presentes</CardTitle>
          <CardDescription>Acesso com a conta AUVP.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {ssoConfigurado ? (
            <form
              action={async () => {
                'use server'
                await signIn('auvp', { redirectTo: '/' })
              }}
            >
              <Button type="submit" className="w-full">
                Entrar com {env.AUTH_OIDC_NAME}
              </Button>
            </form>
          ) : (
            <div className="text-muted-foreground rounded-md border border-dashed p-4 text-sm">
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
        </CardContent>
      </Card>
    </div>
  )
}
