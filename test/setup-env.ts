/**
 * Ambiente dos testes unitários.
 *
 * `env.ts` derruba o processo quando falta variável obrigatória — comportamento
 * desejado em runtime, mas que quebraria qualquer teste que importe, mesmo
 * indiretamente, um módulo que leia configuração. Os valores abaixo são
 * fictícios: nenhum teste desta suíte abre conexão com banco ou rede.
 *
 * A escrita usa `Object.assign` porque `NODE_ENV` é somente leitura no tipo de
 * `process.env`.
 */

Object.assign(process.env, {
  NODE_ENV: process.env.NODE_ENV ?? 'test',
  DATABASE_URL:
    process.env.DATABASE_URL ?? 'postgresql://teste:teste@localhost:5432/teste?schema=public',
  AUTH_SECRET: process.env.AUTH_SECRET ?? 'segredo-de-teste',
})
