// Aplica as migrations no build da Vercel, só no deploy da homologação.
//
// Na produção da TI quem faz isso é o docker-entrypoint.sh, na subida do
// container. Na Vercel não há container nem etapa de subida: o build é o único
// momento em que dá para rodar algo antes de o tráfego chegar.
//
// Só no ambiente "production" da Vercel, que aqui é a homologação (o deploy do
// main). Os previews de PR compartilhariam o mesmo banco, e uma migration que
// ainda está em revisão não pode alterar a homologação de todo mundo.
// Ver docs/12-homologacao-vercel.md.
import { spawnSync } from 'node:child_process'

if (process.env.VERCEL_ENV !== 'production') {
  console.log(
    `Migrations não rodam em "${process.env.VERCEL_ENV ?? 'fora da Vercel'}": só o deploy da homologação migra o banco.`,
  )
  process.exit(0)
}

// Migration precisa de conexão direta: atrás do pooler, que é o endereço que a
// aplicação usa, o Prisma não segura a trava que impede duas migrations ao
// mesmo tempo. O Postgres da Vercel (Neon) entrega os dois endereços.
const direta =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL

if (!direta) {
  console.error('DATABASE_URL não está configurada no ambiente de homologação da Vercel.')
  process.exit(1)
}

const resultado = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DATABASE_URL: direta },
})

process.exit(resultado.status ?? 1)
