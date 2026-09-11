# Deploy

Dois destinos, com propósitos diferentes.

|                | Aplicação          | Vitrine                       |
| -------------- | ------------------ | ----------------------------- |
| Onde           | Railway            | GitHub Pages                  |
| O que é        | o sistema real     | demonstração navegável        |
| Dados          | Postgres           | fictícios, no próprio arquivo |
| Login          | SSO da AUVP        | nenhum                        |
| Publica quando | manual ou por push | push em `demo/`               |

**A aplicação não roda no GitHub Pages.** O Pages serve arquivos estáticos, e o
V1 depende de servidor em quase tudo que o define: banco, sessão, permissões
por perfil, geração de CSV e XLSX.

## Aplicação: Railway

### Primeira vez

1. Crie o projeto no Railway e adicione o serviço **Postgres**.
2. Adicione o serviço da aplicação apontando para este repositório. O
   [`railway.json`](../railway.json) já manda usar o `Dockerfile`.
3. Preencha as variáveis de ambiente (abaixo).
4. Publique. O container aplica as migrations pendentes na subida, pelo
   `docker-entrypoint.sh`, antes de aceitar tráfego.

### Variáveis de ambiente

| Variável                  | Valor                                                           |
| ------------------------- | --------------------------------------------------------------- |
| `DATABASE_URL`            | referência ao Postgres do projeto: `${{Postgres.DATABASE_URL}}` |
| `AUTH_SECRET`             | `openssl rand -base64 32`                                       |
| `AUTH_URL`                | URL pública, ex. `https://presentes.auvp.com.br`                |
| `AUTH_OIDC_ISSUER`        | issuer do SSO da AUVP                                           |
| `AUTH_OIDC_CLIENT_ID`     | client OIDC                                                     |
| `AUTH_OIDC_CLIENT_SECRET` | segredo do client                                               |
| `BOOTSTRAP_ADMIN_EMAILS`  | e-mails que entram como Admin no primeiro login                 |
| `NODE_ENV`                | `production`                                                    |

Storage das fotos (`STORAGE_*`) entra quando o upload for construído.

`env.ts` recusa produção sem `AUTH_SECRET` e sem o client OIDC completo, e
recusa `AUTH_DEV_BYPASS` ligado. A checagem roda no `instrumentation.ts`, ou
seja, na subida do servidor e não na primeira requisição: o log traz
`Failed to prepare server` com a lista do que falta, o healthcheck não passa e
o Railway marca o deploy como falho. Sem isso, um deploy mal configurado
subiria "saudável" e só quebraria na tela de login.

### Registrar no provedor de SSO

A URL de callback é:

```
https://<seu-dominio>/api/auth/callback/auvp
```

### Migrations

Aplicadas na subida do container, com `prisma migrate deploy`, só executa o
que ainda não rodou e nunca gera migration nova. Seguro em toda subida e com
múltiplas réplicas.

O seed **não** roda em produção: ele carrega dados fictícios.

### Healthcheck

`/login`, porque é a única rota que responde sem sessão.

## Vitrine: GitHub Pages

### Habilitar

No repositório: **Settings → Pages → Source: GitHub Actions**. Só isso; o
workflow [`pages.yml`](../.github/workflows/pages.yml) faz o resto.

### Como publica

Todo push em `main` que toque `demo/` dispara o workflow, que compila o CSS com
o Tailwind e publica a pasta. Dá para disparar à mão em **Actions → Vitrine →
Run workflow**.

A URL fica em **Settings → Pages**, no formato
`https://<org>.github.io/<repositorio>/`.

### O que a vitrine mostra

Catálogo, etapas da nova solicitação, lista do consultor, painel de gestão,
detalhe com histórico, fila de compras do Financeiro e os CRUDs. O seletor "Ver
como" troca entre Consultor, Admin e Financeiro e reproduz a matriz de
permissões: é a forma mais direta de mostrar que cada perfil enxerga um
conjunto diferente de telas.

Os dados são fictícios e espelham o seed. Nenhum dado real de cliente entra
ali, e os CPFs aparecem mascarados.

## CI

[`ci.yml`](../.github/workflows/ci.yml) roda em todo push e PR:

- formato, lint, tipos e testes;
- build de produção;
- migrations do zero contra um Postgres real, conferência de que o schema bate
  com as migrations, e o seed rodando duas vezes para provar que é idempotente.
