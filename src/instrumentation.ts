/**
 * Executado uma vez na subida do servidor, antes de atender qualquer request.
 *
 * Sem isto, `env.ts` só seria avaliado quando a primeira rota que o importa
 * fosse acessada: um deploy sem credencial de SSO subiria "saudável" e passaria
 * a devolver 500 por requisição. Validar aqui faz o processo morrer na subida,
 * com a mensagem dizendo o que falta — que é o comportamento que a
 * documentação de deploy promete.
 */
export async function register() {
  // Só no runtime Node: o edge runtime não tem as mesmas variáveis nem executa
  // as rotas que dependem delas.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/env')
  }
}
