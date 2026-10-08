import { z } from 'zod'

/**
 * Validação das variáveis de ambiente no boot.
 *
 * A intenção é falhar cedo e com mensagem legível: uma env faltando derruba o
 * processo na subida, e não no meio de um fluxo do consultor.
 *
 * O que é obrigatório muda por ambiente. Em desenvolvimento só o banco é
 * exigido, para que alguém consiga clonar, subir o Postgres e rodar sem ter
 * credencial de SSO em mãos. Em produção o SSO passa a ser obrigatório.
 */

const booleano = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true')

const listaDeEmails = z
  .string()
  .default('')
  .transform((v) =>
    v
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )

const listaDeDominios = z
  .string()
  .default('')
  .transform((v) =>
    v
      .split(',')
      .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
      .filter(Boolean),
  )

/** A fase em que o Next roda o `next build`. */
const FASE_DE_BUILD = 'phase-production-build'

const schema = (durandoBuild: boolean) =>
  z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // O build não abre conexão: o Next só importa as rotas para coletar
    // metadados. Exigir o banco ali obrigaria todo lugar que compila, CI,
    // imagem Docker, Vercel, a ter um endereço em mãos, mesmo que falso.
    DATABASE_URL: durandoBuild
      ? z.string().default('')
      : z.string().min(1, 'DATABASE_URL é obrigatória'),

    AUTH_SECRET: z.string().default(''),
    AUTH_URL: z.string().url().optional(),
    AUTH_OIDC_ISSUER: z.string().default(''),
    AUTH_OIDC_CLIENT_ID: z.string().default(''),
    AUTH_OIDC_CLIENT_SECRET: z.string().default(''),
    AUTH_OIDC_NAME: z.string().default('AUVP SSO'),
    AUTH_OIDC_GROUPS_CLAIM: z.string().default(''),
    AUTH_DEV_BYPASS: booleano,
    AUTH_ALLOWED_EMAIL_DOMAINS: listaDeDominios,

    BOOTSTRAP_ADMIN_EMAILS: listaDeEmails,

    STORAGE_ENDPOINT: z.string().default(''),
    STORAGE_REGION: z.string().default('us-east-1'),
    STORAGE_BUCKET: z.string().default(''),
    STORAGE_ACCESS_KEY_ID: z.string().default(''),
    STORAGE_SECRET_ACCESS_KEY: z.string().default(''),

    CATALOG_PROVIDER: z.enum(['local', 'tiny']).default('local'),
    CLIENT_PROVIDER: z.enum(['local', 'salesforce']).default('local'),

    TINY_API_TOKEN: z.string().default(''),
    TINY_API_BASE_URL: z.string().default('https://api.tiny.com.br/api2'),
    SALESFORCE_INSTANCE_URL: z.string().default(''),
    SALESFORCE_CLIENT_ID: z.string().default(''),
    SALESFORCE_CLIENT_SECRET: z.string().default(''),

    VIACEP_BASE_URL: z.string().default('https://viacep.com.br/ws'),
  })

/**
 * Variável vazia é variável ausente.
 *
 * Painel de plataforma (Vercel, Railway) e `.env` copiado do exemplo costumam
 * criar a chave sem valor. Sem esta limpeza, `AUTH_URL=""` falha como URL
 * inválida e `CATALOG_PROVIDER=""` como opção desconhecida, em vez de cair no
 * valor padrão que vale quando a variável não existe.
 */
export function semVazias(
  fonte: Record<string, string | undefined>,
): Record<string, string | undefined> {
  return Object.fromEntries(
    Object.entries(fonte).filter(([, valor]) => valor !== undefined && valor.trim() !== ''),
  )
}

/**
 * Lê e valida a configuração. Recebe a fonte e a fase como parâmetros para
 * poder ser testada sem mexer no `process.env` do próprio teste.
 */
export function carregarEnv(
  fonte: Record<string, string | undefined>,
  fase: string | undefined = undefined,
) {
  // Durante `next build` o Next importa cada rota para coletar metadados, com
  // NODE_ENV=production. Exigir credencial de runtime aí obrigaria o build a
  // ter os segredos em mãos, o que quebraria CI e imagem Docker. As exigências
  // de produção valem no processo que serve a aplicação, não no que a compila.
  const durandoBuild = fase === FASE_DE_BUILD
  const parsed = schema(durandoBuild).safeParse(semVazias(fonte))

  if (!parsed.success) {
    const detalhes = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Variáveis de ambiente inválidas:\n${detalhes}`)
  }

  const env = parsed.data

  if (env.NODE_ENV === 'production' && !durandoBuild) {
    const faltando: string[] = []
    if (!env.AUTH_SECRET) faltando.push('AUTH_SECRET')
    if (!env.AUTH_OIDC_ISSUER) faltando.push('AUTH_OIDC_ISSUER')
    if (!env.AUTH_OIDC_CLIENT_ID) faltando.push('AUTH_OIDC_CLIENT_ID')
    if (!env.AUTH_OIDC_CLIENT_SECRET) faltando.push('AUTH_OIDC_CLIENT_SECRET')
    // Sem a lista, quem entra depende só de o client OIDC estar bem
    // configurado no provedor. Ver src/lib/acesso-sso.ts.
    if (env.AUTH_ALLOWED_EMAIL_DOMAINS.length === 0) faltando.push('AUTH_ALLOWED_EMAIL_DOMAINS')

    if (faltando.length > 0) {
      throw new Error(
        `Em produção o SSO é obrigatório. Faltam: ${faltando.join(', ')}. ` +
          'Ver docs/07-deploy.md.',
      )
    }

    if (env.AUTH_DEV_BYPASS) {
      throw new Error('AUTH_DEV_BYPASS não pode ser habilitado em produção.')
    }
  }

  return env
}

export const env = carregarEnv(process.env, process.env.NEXT_PHASE)

/** O SSO só está utilizável quando o client OIDC inteiro foi configurado. */
export const ssoConfigurado =
  Boolean(env.AUTH_OIDC_ISSUER) &&
  Boolean(env.AUTH_OIDC_CLIENT_ID) &&
  Boolean(env.AUTH_OIDC_CLIENT_SECRET)

/** Login sem SSO, apenas em desenvolvimento e apenas se explicitamente ligado. */
export const devBypassHabilitado = env.AUTH_DEV_BYPASS && env.NODE_ENV === 'development'
