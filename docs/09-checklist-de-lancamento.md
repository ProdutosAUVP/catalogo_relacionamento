# Checklist de lançamento

O caminho de hoje até a área usando a ferramenta no dia a dia.

O código está construído e testado. O que falta não é código: é **credencial,
decisão e uma tarde de acompanhamento**. Este documento separa as três coisas e
diz quem faz cada uma.

## O que já está pronto

Não precisa de nada de ninguém:

- catálogo, nova solicitação, aprovação, fila de compras, fila da expedição com
  exportação, rastreio, e os CRUDs de produto, categoria, cliente e usuário;
- os 49 presentes da planilha da área transcritos e com foto, prontos para
  entrar no banco de produção com um comando;
- Dockerfile, `railway.json` e migrations aplicadas na subida;
- a vitrine no GitHub Pages, para mostrar as telas a quem aprova.

## Etapa 1: destravar o SSO

**Esta é a única coisa que bloqueia tudo.** Sem ela ninguém entra, e a
aplicação nem sobe: `env.ts` recusa produção sem o client OIDC completo.

Alguém com acesso ao provedor de identidade da AUVP (Google Workspace, Entra
ID, Keycloak, o que for) precisa criar um client OIDC e entregar três valores:

| O que         | Onde usar                 |
| ------------- | ------------------------- |
| issuer        | `AUTH_OIDC_ISSUER`        |
| client ID     | `AUTH_OIDC_CLIENT_ID`     |
| client secret | `AUTH_OIDC_CLIENT_SECRET` |

E registrar a URL de callback no provedor:

```
https://<dominio-escolhido>/api/auth/callback/auvp
```

**Pergunte junto:** o token devolve grupo ou departamento? Se devolver, dá para
mapear perfil automaticamente em vez de o Admin promover na mão
(`AUTH_OIDC_GROUPS_CLAIM`). Se não devolver, segue o plano atual, que já
funciona.

## Etapa 2: subir

Segue [o passo a passo do deploy](07-deploy.md). Em resumo:

1. projeto no Railway com Postgres e o serviço da aplicação;
2. variáveis de ambiente, incluindo `BOOTSTRAP_ADMIN_EMAILS` com o e-mail de
   quem vai administrar. Sem ela o primeiro usuário entra como consultor e
   ninguém consegue promover ninguém;
3. publicar, e o container aplica as migrations sozinho;
4. `npm run db:catalogo` uma vez, com o `DATABASE_URL` de produção, para o
   catálogo real entrar;
5. entrar pelo SSO com um e-mail da lista de bootstrap. É o primeiro login que
   cria o usuário.

## Etapa 3: o time entra

Cada pessoa entra uma vez pelo SSO, o que a cria como **consultor**. Depois o
Admin abre `/admin/usuarios` e ajusta:

- quem é Admin, quem é Financeiro;
- o **limite mensal** de cada consultor, se houver. O campo é opcional: sem
  ele, a tela some com a barra do mês em vez de mostrar zero.

Não existe convite nem cadastro de usuário: o SSO é a porta.

## Etapa 4: decisões da área

Nenhuma bloqueia o lançamento, todas têm uma suposição registrada em
[perguntas em aberto](05-perguntas-em-aberto.md), e cada uma diz onde mudar.
Vale responder nas primeiras semanas, com a ferramenta rodando.

| Pergunta                                                    | Assumido hoje                           | Custo de mudar                  |
| ----------------------------------------------------------- | --------------------------------------- | ------------------------------- |
| Os seis produtos sem preço têm custo unitário?              | ficam "valor a definir" e somam zero    | preencher no CRUD, zero código  |
| O Financeiro pode ver CPF, telefone e endereço?             | pode, por coerência com a exportação    | uma linha em `permissions.ts`   |
| "Pendente" e "Aguardando aprovação" são momentos distintos? | são                                     | `FLUXO_LINEAR` em `status.ts`   |
| Existe alçada por valor para aprovar?                       | não, qualquer Admin aprova              | regra nova na mudança de status |
| Estourar o limite mensal bloqueia?                          | só sinaliza                             | checagem em `criarSolicitacao`  |
| Como a carta chega ao cliente hoje?                         | digitada aqui, impressa como sempre foi | define se a impressão entra     |
| Há histórico de solicitações a migrar?                      | não                                     | o modelo já aceita carga        |

## Etapa 5: acompanhar a primeira semana

O que vale olhar, e o que fazer se aparecer:

- **primeira solicitação de verdade percorrendo o fluxo inteiro**, do pedido do
  consultor até o rastreio preenchido. É o teste que nenhum ambiente de
  desenvolvimento faz;
- **presente que a área pede e não está no catálogo**: cadastra pelo CRUD, não
  precisa de deploy;
- **foto que ficou ruim na moldura 3:4**: troca pelo CRUD, ou manda o arquivo
  novo para `imgs produtos/` e roda `npm run fotos:preparar`;
- **backup do Postgres**: o Railway faz, vale confirmar a retenção antes de a
  base ter dado real de cliente.

## O que continua fora do V1

Por decisão registrada, não por falta de tempo:

- **geração da carta em formato de impressão.** A prévia existe e é dela que o
  arranjo de impressão vai partir, quando a área disser como a carta chega hoje;
- **integração com o sistema da expedição**, que escreveria rastreio e status
  sem digitação;
- **Tiny e Salesforce** (fase 2). Provider e campos já reservados, ver
  [integrações da fase 2](04-integracoes-fase-2.md);
- **bucket de fotos.** Hoje a foto vai no Postgres, o que destravou o CRUD sem
  depender de infraestrutura. Vira assunto se o catálogo passar de algumas
  centenas de fotos.
