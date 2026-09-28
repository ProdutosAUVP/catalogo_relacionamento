/**
 * O cookie é da sessão da ferramenta?
 *
 * Acima de 4 KB o Auth.js parte o cookie em `.0`, `.1`..., e o JWT de quem
 * entra pelo SSO carrega o id_token do Keycloak. Olhar só o nome inteiro
 * mandaria essa pessoa de volta ao login em loop.
 */
export function ehCookieDeSessao(nome: string): boolean {
  return /^(__Secure-)?authjs\.session-token(\.\d+)?$/.test(nome)
}

/**
 * Saída pelo SSO (logout iniciado pela aplicação, OIDC RP-Initiated Logout).
 *
 * Apagar só o cookie da ferramenta não tira ninguém: a sessão do Keycloak
 * continua viva, e o próximo "Entrar" volta logado sem pedir senha, o que num
 * computador compartilhado é o mesmo que não ter saído. Por isso "Sair" passa
 * pelo `end_session_endpoint` do provedor e só então volta para `/login`.
 */

/**
 * Monta a URL de saída no provedor.
 *
 * Sem `id_token_hint` não há como o provedor saber de qual sessão se trata, e
 * o Keycloak mostra uma tela de confirmação em inglês. Então quem entrou sem
 * SSO (bypass de desenvolvimento) não tem token, e volta direto para o login.
 */
export function urlDeSaidaDoSso(dados: {
  endSessionEndpoint: string | null
  idToken: string | null | undefined
  clientId: string
  voltarPara: string
}): string | null {
  if (!dados.endSessionEndpoint || !dados.idToken) return null

  const url = new URL(dados.endSessionEndpoint)
  url.searchParams.set('id_token_hint', dados.idToken)
  url.searchParams.set('client_id', dados.clientId)
  url.searchParams.set('post_logout_redirect_uri', dados.voltarPara)
  return url.toString()
}

let descoberta: Promise<string | null> | null = null

/**
 * Lê o `end_session_endpoint` da descoberta OIDC, uma vez por processo.
 *
 * Não é montado à mão a partir do issuer porque o caminho muda entre versões
 * do Keycloak. Falha de rede não pode impedir alguém de sair: sem o endereço,
 * a pessoa sai só da ferramenta, e a próxima tentativa consulta de novo.
 */
export function endSessionEndpoint(issuer: string): Promise<string | null> {
  if (!issuer) return Promise.resolve(null)

  descoberta ??= fetch(`${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`)
    .then((r) => (r.ok ? r.json() : null))
    .then((config: { end_session_endpoint?: string } | null) => {
      const endereco = config?.end_session_endpoint ?? null
      if (!endereco) descoberta = null
      return endereco
    })
    .catch((e: unknown) => {
      console.error('Descoberta OIDC falhou; saída só da ferramenta.', e)
      descoberta = null
      return null
    })

  return descoberta
}
