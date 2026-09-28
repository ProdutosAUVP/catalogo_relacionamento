import { describe, expect, it } from 'vitest'
import { ehCookieDeSessao, urlDeSaidaDoSso } from './sessao-sso'

describe('ehCookieDeSessao', () => {
  it('reconhece o cookie inteiro, com e sem HTTPS', () => {
    expect(ehCookieDeSessao('authjs.session-token')).toBe(true)
    expect(ehCookieDeSessao('__Secure-authjs.session-token')).toBe(true)
  })

  it('reconhece o cookie partido em pedaços, que é o de quem entra pelo SSO', () => {
    expect(ehCookieDeSessao('authjs.session-token.0')).toBe(true)
    expect(ehCookieDeSessao('__Secure-authjs.session-token.1')).toBe(true)
  })

  it('não confunde com os outros cookies do Auth.js', () => {
    expect(ehCookieDeSessao('authjs.csrf-token')).toBe(false)
    expect(ehCookieDeSessao('authjs.callback-url')).toBe(false)
    expect(ehCookieDeSessao('authjs.session-token-falso')).toBe(false)
  })
})

describe('urlDeSaidaDoSso', () => {
  const base = {
    endSessionEndpoint: 'https://sso.auvp.com.br/realms/master/protocol/openid-connect/logout',
    idToken: 'token.de.id',
    clientId: 'catalogo_relacionamento',
    voltarPara: 'https://catalogo-relacionamento.prod.auvp.net/login',
  }

  it('manda ao provedor o token, o client e para onde voltar', () => {
    const url = new URL(urlDeSaidaDoSso(base)!)

    expect(url.origin + url.pathname).toBe(base.endSessionEndpoint)
    expect(url.searchParams.get('id_token_hint')).toBe('token.de.id')
    expect(url.searchParams.get('client_id')).toBe('catalogo_relacionamento')
    expect(url.searchParams.get('post_logout_redirect_uri')).toBe(base.voltarPara)
  })

  it('sem token, quem entrou pelo bypass volta direto para o login', () => {
    expect(urlDeSaidaDoSso({ ...base, idToken: undefined })).toBeNull()
    expect(urlDeSaidaDoSso({ ...base, idToken: null })).toBeNull()
  })

  it('sem o endereço do provedor, sai só da ferramenta', () => {
    expect(urlDeSaidaDoSso({ ...base, endSessionEndpoint: null })).toBeNull()
  })
})
