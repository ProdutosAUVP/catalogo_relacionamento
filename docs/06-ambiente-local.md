# Ambiente local

## Subir do zero

```bash
cp .env.example .env
docker compose up -d          # Postgres em localhost:5432
npm install
npm run db:migrate            # aplica as migrations
npm run db:seed               # dados de exemplo
npm run dev
```

<http://localhost:3000>

## Entrar sem SSO

Enquanto as credenciais do provedor OIDC não chegam, ligue no `.env`:

```
AUTH_DEV_BYPASS="true"
BOOTSTRAP_ADMIN_EMAILS="seu.email@auvp.com.br"
```

A tela de login passa a aceitar um e-mail direto. O e-mail listado em
`BOOTSTRAP_ADMIN_EMAILS` entra como Admin — sem isso, o primeiro usuário do
ambiente entraria como consultor e não haveria ninguém com poder de promover.

O bypass é recusado fora de `NODE_ENV=development`: `env.ts` derruba o boot se
alguém tentar ligá-lo em produção.

## Usuários do seed

| E-mail                   | Perfil     | Limite mensal |
| ------------------------ | ---------- | ------------- |
| `bia@auvp.com.br`        | Admin      | —             |
| `financeiro@auvp.com.br` | Financeiro | —             |
| `carlos@auvp.com.br`     | Consultor  | R$ 5.000      |
| `fernanda@auvp.com.br`   | Consultor  | R$ 3.000      |

O seed é idempotente: pode rodar quantas vezes precisar.

## O que conferir depois de subir

O seed monta situações que valem olhar:

- **`/catalogo`** — a "Caneca personalizada" está desativada e não aparece,
  mas continua visível nas solicitações antigas.
- **`/catalogo`** — "Cesta gourmet" e a placa do primeiro milhão não mostram
  estoque, porque não controlam estoque.
- **`/financeiro/compras`** — a SOL-2026-0003 tem um presente específico com
  link externo, ao lado de um item de catálogo.
- **`/admin/solicitacoes`** — filtros e exportação.

## Trabalhando no banco

```bash
npm run db:studio          # interface visual
npm run db:migrate         # cria migration a partir do schema alterado
npm run db:reset           # apaga tudo, reaplica migrations e roda o seed
```

Depois de alterar `prisma/schema.prisma`, **sempre** gere a migration. A CI
recusa schema que não bate com as migrations.

## Antes de abrir PR

```bash
npm run check    # formato, lint, tipos e testes
```

É exatamente o que a CI roda.

## Vitrine estática

```bash
npm run demo:build        # compila demo/estilo.css
cd demo && python3 -m http.server 8000
```

<http://localhost:8000>

## Postgres sem Docker

Se preferir um Postgres já instalado, aponte `DATABASE_URL` para ele. Só é
preciso que o banco exista e que o usuário possa criar tabelas.
