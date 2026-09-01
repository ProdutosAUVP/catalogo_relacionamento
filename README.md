# Catálogo e Solicitação de Presentes

Ferramenta interna da área de Relacionamento da AUVP. O consultor escolhe o
cliente, o presente e escreve a carta que acompanha o envio; quem gerencia
acompanha aprovação, compra, envio, entrega e custo por consultor.

O documento de origem está em
[`catalogo-presentes-spec-v1.md`](catalogo-presentes-spec-v1.md).

## Estado atual

A base do V1 está de pé: modelo de dados completo, regras de negócio
implementadas e testadas, telas de leitura navegáveis e deploy configurado.
Os formulários de escrita são o próximo passo — cada tela diz o que falta nela.

| Área                                         | Situação                                       |
| -------------------------------------------- | ---------------------------------------------- |
| Modelo de dados e migrations                 | pronto, com restrições de integridade no banco |
| Permissões por perfil                        | pronto e testado                               |
| Fluxo de status                              | pronto e testado                               |
| Saldo mensal por consultor                   | pronto e testado                               |
| Exportação CSV/XLSX                          | pronto e testado                               |
| Autenticação SSO (OIDC)                      | pronto, aguardando credenciais do provedor     |
| Catálogo, gestão, fila de compras, listagens | telas prontas                                  |
| Formulário de solicitação                    | a construir                                    |
| CRUD de produto, cliente e usuário           | a construir                                    |
| Tiny ERP e Salesforce                        | fase 2, contratos já fixados                   |

## Como rodar

Requisitos: Node 20.11+ e Docker (para o Postgres local).

```bash
cp .env.example .env      # ajuste o que precisar
docker compose up -d      # sobe o Postgres
npm install
npm run db:migrate        # cria o schema
npm run db:seed           # carrega dados de exemplo
npm run dev
```

A aplicação sobe em <http://localhost:3000>.

Sem SSO configurado, ligue `AUTH_DEV_BYPASS="true"` no `.env` para entrar
informando um e-mail. Para entrar como Admin, coloque o mesmo e-mail em
`BOOTSTRAP_ADMIN_EMAILS`. O bypass é recusado fora de `NODE_ENV=development`.

## Comandos

| Comando              | O que faz                                       |
| -------------------- | ----------------------------------------------- |
| `npm run dev`        | servidor de desenvolvimento                     |
| `npm run build`      | build de produção                               |
| `npm run check`      | formato, lint, tipos e testes — o que a CI roda |
| `npm test`           | testes das regras de negócio                    |
| `npm run db:migrate` | cria/aplica migrations em desenvolvimento       |
| `npm run db:seed`    | popula com dados de exemplo (idempotente)       |
| `npm run db:studio`  | interface visual do banco                       |
| `npm run demo:build` | compila o CSS da vitrine estática               |

## Estrutura

```
src/
  app/                    telas e rotas (App Router)
    catalogo/             catálogo do consultor
    solicitacoes/         lista e formulário de solicitação
    financeiro/compras/   fila de compras do Financeiro
    admin/                gestão, catálogo, clientes, usuários
    api/                  auth, consulta de CEP, exportação
  components/             UI compartilhada (shadcn/ui do DS AUVP)
  styles/                 tokens do Design System AUVP
  lib/
    permissions.ts        matriz de permissões — fonte única
    status.ts             máquina de estados do fluxo
    saldo.ts              apuração do gasto mensal
    compras.ts            fila de compras do Financeiro
    money.ts              aritmética monetária em Decimal
    export/               geração de CSV e XLSX
    providers/            camada trocável de catálogo e clientes
    validators/           schemas Zod dos formulários
prisma/                   schema, migrations e seed
demo/                     vitrine estática publicada no GitHub Pages
docs/                     documentação de decisões e operação
```

## Documentação

- [Modelo de dados](docs/01-modelo-de-dados.md)
- [Perfis e permissões](docs/02-perfis-e-permissoes.md)
- [Fluxo de status](docs/03-fluxo-de-status.md)
- [Integrações da fase 2](docs/04-integracoes-fase-2.md)
- [Perguntas em aberto](docs/05-perguntas-em-aberto.md)
- [Ambiente local](docs/06-ambiente-local.md)
- [Deploy](docs/07-deploy.md)
- [Identidade visual](docs/08-identidade-visual.md)
- [Decisões de arquitetura](docs/adr/)

## Onde isso roda

**Aplicação:** Railway, com Postgres no mesmo projeto. Ver
[docs/07-deploy.md](docs/07-deploy.md).

**Vitrine:** GitHub Pages, a partir de `demo/`. É uma demonstração navegável
com dados fictícios, sem login e sem banco, feita para mostrar as telas a quem
aprova o V1. A aplicação real não roda no Pages: ela precisa de servidor.
