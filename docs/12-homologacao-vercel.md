# Homologação na Vercel

Um ambiente para a área de Relacionamento e a Logística testarem a ferramenta
de verdade, com o SSO da AUVP, antes da TI publicar a produção. **Não é a
produção**: essa continua com a TI, em `catalogo-relacionamento.prod.auvp.net`
([entrega para a TI](10-entrega-ti.md)).

|                | Homologação                               | Produção                         |
| -------------- | ----------------------------------------- | -------------------------------- |
| Onde           | Vercel, projeto `catalogo-relacionamento` | infraestrutura da TI, via Docker |
| Publica quando | a cada merge no `main`                    | quando a TI publica              |
| Banco          | Postgres da Vercel (Neon), só para testes | Postgres da TI, com backup       |
| Dados          | fictícios, do seed                        | reais, com a carga do catálogo   |
| Login          | SSO da AUVP, client de homologação        | SSO da AUVP, client de produção  |

Na Vercel, o ambiente que ela chama de **Production** é a homologação: é o
deploy do `main`. Os **Previews**, um por PR, só conferem que o build passa;
ver [Previews](#previews).

## Antes de começar

- O PR que aceita variável vazia (`claude/env-vazias`) precisa estar mesclado.
  Sem ele o build quebra em "Collecting page data", com as variáveis vazias
  que o projeto da Vercel já tem.
- Acesso de administrador ao projeto na Vercel e alguém da TI para o Keycloak.

O repositório já traz o que a Vercel precisa:

- `vercel.json`: build por `npm run vercel-build` e funções em São Paulo
  (`gru1`), perto do banco;
- `npm run vercel-build`: gera o Prisma Client, aplica as migrations (só na
  homologação, ver `scripts/migrar-na-vercel.mjs`) e compila.

## Passo 1: o banco

1. **Antes de tudo, apague a `DATABASE_URL` vazia** em Settings → Environment
   Variables. O projeto já tem essa chave, criada sem valor, e com ela no
   caminho a conexão do banco pode não conseguir gravar a dela.
2. No projeto, **Storage → Create Database → Neon (Postgres)**.
3. Região **AWS São Paulo (sa-east-1)**, a mesma das funções.
4. Em **Connect Project**, marque só o ambiente **Production** e **deixe o
   prefixo das variáveis em branco**. Com prefixo, elas viram `ALGO_DATABASE_URL`
   e a aplicação não as encontra. Os previews ficam sem banco de propósito.

A integração cria sozinha `DATABASE_URL`, com pooler, que a aplicação usa, e
`DATABASE_URL_UNPOOLED`, a conexão direta, que as migrations usam. Não é
preciso copiar nenhuma das duas.

## Passo 2: o client de homologação no Keycloak

Peça à TI um client **separado**, `catalogo_relacionamento_hml`, no mesmo
realm `master`. Separado porque o segredo da produção não deve sair da
infraestrutura da TI: a Vercel é um serviço de fora.

A configuração é a mesma do client de produção
([entrega para a TI, passo 1](10-entrega-ti.md#1-keycloak)), trocando o
endereço pelo da homologação. Primeiro descubra o endereço fixo do projeto em
**Settings → Domains**: algo como `catalogo-relacionamento.vercel.app`, ou um
domínio da AUVP, se a TI apontar um, como `catalogo-relacionamento.hml.auvp.net`.
Com ele, chamado aqui de `<homologacao>`:

| Campo                           | Valor                                          |
| ------------------------------- | ---------------------------------------------- |
| Client authentication           | On                                             |
| Standard flow                   | On                                             |
| Valid redirect URIs             | `https://<homologacao>/api/auth/callback/auvp` |
| Valid post logout redirect URIs | `https://<homologacao>/login`                  |
| Web origins                     | `+`                                            |

A TI entrega o **client secret**, que vai direto para a Vercel no passo 3.

## Passo 3: as variáveis

Em **Settings → Environment Variables**, ambiente **Production**:

| Variável                     | Valor                                                 |
| ---------------------------- | ----------------------------------------------------- |
| `AUTH_SECRET`                | um novo, só da homologação: `openssl rand -base64 32` |
| `AUTH_URL`                   | `https://<homologacao>`                               |
| `AUTH_OIDC_ISSUER`           | `https://sso.auvp.com.br/realms/master`               |
| `AUTH_OIDC_CLIENT_ID`        | `catalogo_relacionamento_hml`                         |
| `AUTH_OIDC_CLIENT_SECRET`    | o secret do passo 2                                   |
| `AUTH_ALLOWED_EMAIL_DOMAINS` | `auvp.com.br`                                         |
| `BOOTSTRAP_ADMIN_EMAILS`     | o e-mail de quem administra a homologação             |

`DATABASE_URL` e `DATABASE_URL_UNPOOLED` já vêm do passo 1. **Apague as
variáveis vazias** que o projeto tem hoje (`AUTH_DEV_BYPASS`,
`CATALOG_PROVIDER`, `CLIENT_PROVIDER` e as outras sem valor): a aplicação já
as trata como ausentes, mas variável vazia num painel engana quem lê depois.

Não crie `AUTH_DEV_BYPASS`: a Vercel roda com `NODE_ENV=production`, e a
aplicação se recusa a subir com o login sem SSO ligado. A homologação existe
justamente para testar o SSO de verdade.

## Passo 4: publicar

Em **Deployments**, faça **Redeploy** do último deploy do `main`, ou mescle
qualquer PR. No log do build aparecem, nesta ordem:

1. `Generated Prisma Client`;
2. a lista de migrations e `All migrations have been successfully applied`;
3. o build do Next.

Se faltar variável obrigatória, o build passa, mas a primeira requisição falha
e o log das funções mostra `Em produção o SSO é obrigatório. Faltam: ...`, com
a lista do que falta.

## Passo 5: os dados

O banco nasce vazio. Para a homologação, o **seed** é o certo: catálogo real,
mais usuários, clientes, solicitações e demandas da Logística fictícios, para
as telas abrirem com conteúdo. De um clone do repositório, com a conexão
direta que a Vercel mostra em **Storage → (o banco) → .env.local**:

```bash
DATABASE_URL="<DATABASE_URL_UNPOOLED da homologação>" npm run db:seed
```

Pode rodar de novo quando quiser os dados de exemplo de volta: o seed é
idempotente, e as datas das demandas acompanham o dia em que ele roda.

**Nunca rode o seed contra o banco de produção.** Lá a carga é
`npm run db:catalogo`, que só cria o catálogo.

## Passo 6: conferir

- [ ] `https://<homologacao>/login` mostra "Entrar com AUVP SSO", e não
      "Entrar sem SSO".
- [ ] O login pelo SSO volta para a ferramenta. "Invalid parameter:
      redirect_uri" no Keycloak quer dizer que o passo 2 não bate com o
      `AUTH_URL`.
- [ ] Quem está em `BOOTSTRAP_ADMIN_EMAILS` vê "Administração" no menu.
- [ ] O catálogo mostra os 49 presentes com foto, e o Dashboard Logístico
      mostra as demandas de exemplo.
- [ ] "Sair" volta para o login, e o "Entrar" seguinte pede a senha.
- [ ] Os demais da área entram, nascem consultores, e o Admin os promove em
      `/admin/usuarios`.

## Previews

Cada PR gera um preview, e ele serve só para conferir que **o build passa**.
Não dá para entrar nele, por dois motivos:

- o endereço muda a cada PR, e o Keycloak não aceita curinga no nome do
  servidor nas redirect URIs;
- os previews não têm banco nem migrations. Um PR que muda o schema não pode
  alterar o banco da homologação antes de ser revisado.

Quem quer testar um PR, mescla e testa na homologação.

## Problemas comuns

| Sintoma                                                     | Causa provável                                                         |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| Build falha em "Collecting page data", variáveis `''`       | o PR de variáveis vazias ainda não foi mesclado                        |
| Build para em "O banco da homologação não está configurado" | passo 1 incompleto; a mensagem lista as variáveis de banco que existem |
| Build falha em `migrate deploy`                             | banco ligado, mas fora do ar ou com a conexão direta errada            |
| Toda página dá erro 500                                     | variável do passo 3 faltando; o log das funções lista quais            |
| Keycloak: `Invalid parameter: redirect_uri`                 | redirect URI do passo 2 diferente do `AUTH_URL`                        |
| Keycloak: `Invalid client credentials`                      | secret de outro client, ou do client de produção                       |
| Erro `prepared statement "s0" already exists`               | acrescente `pgbouncer=true` ao `DATABASE_URL`                          |
| Lento na primeira tela depois de um tempo parado            | o Postgres da Vercel hiberna sem uso; a primeira consulta o acorda     |

## Mais adiante

As integrações com ClickUp e Tiny vão precisar de um agendador
([ADR 0009](adr/0009-integracoes-por-fila.md)). Na homologação ele será o
**Vercel Cron**; no plano gratuito a Vercel só agenda uma vez por dia, o que
basta para testar, mas não para operar.
