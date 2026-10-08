import { redirect } from 'next/navigation'
import { signIn } from '@/lib/auth'
import { usuarioAtual } from '@/lib/auth-guards'
import { devBypassHabilitado, env, modoDemonstracao, ssoConfigurado } from '@/lib/env'
import { USUARIOS_DA_DEMONSTRACAO } from '@/lib/demonstracao'
import { ROTULO_PERFIL } from '@/lib/permissions'
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
/**
 * O NextAuth devolve só um código. `AccessDenied` é o `signIn` recusando:
 * conta de fora dos domínios permitidos, e-mail não verificado ou usuário
 * desativado pelo Admin. Não diz qual dos três, para não confirmar a quem
 * está de fora quais contas existem.
 */
function mensagemDeErro(codigo: string | undefined): string | null {
  if (!codigo) return null
  if (codigo === 'AccessDenied') {
    return 'Esta conta não tem acesso à ferramenta. Entre com o seu e-mail AUVP ou fale com o Admin da área.'
  }
  return 'Não foi possível entrar agora. Tente de novo em instantes.'
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  if (await usuarioAtual()) redirect('/')
  const erro = mensagemDeErro((await searchParams).error)

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
          {erro ? (
            <p role="alert" className="text-destructive text-sm">
              {erro}
            </p>
          ) : null}
          {modoDemonstracao ? (
            // Um formulário por perfil: o e-mail vai escondido e o servidor
            // ainda confere que ele é da lista, então editar o HTML não abre
            // porta para nenhuma outra conta.
            <div className="space-y-3">
              <div>
                <p className="font-medium">Demonstração com dados fictícios</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Escolha um perfil para ver a ferramenta com os olhos dele. Nada aqui é dado real.
                </p>
              </div>
              <ul className="space-y-2">
                {USUARIOS_DA_DEMONSTRACAO.map((u) => (
                  <li key={u.email}>
                    <form
                      action={async () => {
                        'use server'
                        await signIn('demonstracao', { email: u.email, redirectTo: '/' })
                      }}
                    >
                      <button
                        type="submit"
                        className="hover:border-foreground/30 hover:bg-muted focus-visible:ring-ring w-full rounded-lg border px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2"
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">{u.nome}</span>
                          <span className="text-muted-foreground text-xs">
                            {ROTULO_PERFIL[u.perfil]}
                          </span>
                        </span>
                        <span className="text-muted-foreground mt-0.5 block text-sm">
                          {u.oQueVe}
                        </span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ) : ssoConfigurado ? (
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
