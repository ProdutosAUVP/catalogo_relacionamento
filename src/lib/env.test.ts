import { describe, expect, it } from 'vitest'
import { carregarEnv, semVazias } from './env'

const BANCO = 'postgresql://teste:teste@localhost:5432/teste?schema=public'

const PRODUCAO_COMPLETA = {
  NODE_ENV: 'production',
  DATABASE_URL: BANCO,
  AUTH_SECRET: 'segredo',
  AUTH_OIDC_ISSUER: 'https://sso.auvp.com.br/realms/master',
  AUTH_OIDC_CLIENT_ID: 'catalogo_relacionamento',
  AUTH_OIDC_CLIENT_SECRET: 'segredo-do-client',
  AUTH_ALLOWED_EMAIL_DOMAINS: 'auvp.com.br',
}

describe('variável vazia é variável ausente', () => {
  it('tira chave vazia ou só com espaço', () => {
    expect(semVazias({ A: '', B: '  ', C: 'x', D: undefined })).toEqual({ C: 'x' })
  })

  it('o painel da plataforma com chaves vazias cai nos valores padrão', () => {
    // O que a Vercel mandou: chaves criadas, sem valor.
    const env = carregarEnv({
      NODE_ENV: 'development',
      DATABASE_URL: BANCO,
      AUTH_URL: '',
      AUTH_DEV_BYPASS: '',
      CATALOG_PROVIDER: '',
      CLIENT_PROVIDER: '',
    })
    expect(env.AUTH_URL).toBeUndefined()
    expect(env.AUTH_DEV_BYPASS).toBe(false)
    expect(env.CATALOG_PROVIDER).toBe('local')
    expect(env.CLIENT_PROVIDER).toBe('local')
  })

  it('valor de verdade continua sendo validado', () => {
    expect(() =>
      carregarEnv({ NODE_ENV: 'development', DATABASE_URL: BANCO, AUTH_URL: 'não é url' }),
    ).toThrow(/AUTH_URL/)
  })
})

describe('o banco no build e fora dele', () => {
  it('o build compila sem banco nem segredos', () => {
    expect(() =>
      carregarEnv({ NODE_ENV: 'production', DATABASE_URL: '' }, 'phase-production-build'),
    ).not.toThrow()
  })

  it('o processo que serve a aplicação exige o banco', () => {
    expect(() => carregarEnv({ NODE_ENV: 'development' })).toThrow(/DATABASE_URL/)
  })

  it('produção continua exigindo o SSO inteiro e a lista de domínios', () => {
    expect(() => carregarEnv({ ...PRODUCAO_COMPLETA, AUTH_ALLOWED_EMAIL_DOMAINS: '' })).toThrow(
      /AUTH_ALLOWED_EMAIL_DOMAINS/,
    )
    expect(() => carregarEnv(PRODUCAO_COMPLETA)).not.toThrow()
  })

  it('produção recusa o login sem SSO', () => {
    expect(() => carregarEnv({ ...PRODUCAO_COMPLETA, AUTH_DEV_BYPASS: 'true' })).toThrow(
      /AUTH_DEV_BYPASS/,
    )
  })
})
