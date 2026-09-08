# Perguntas em aberto

O que ainda depende de resposta, onde isso aparece no código, e o que foi
assumido para não travar a construção.

Última atualização: setembro de 2026.

## Respondidas

### Permissões do perfil Financeiro ✅

> Recebe as solicitações enviadas para compra contendo data, produto, valor e
> site. Consegue alterar o status do pedido.

Implementado: tela `/financeiro/compras` e permissão de alterar status. Ver
[perfis e permissões](02-perfis-e-permissoes.md).

### Canceladas e devolvidas contam no saldo do mês ✅

> Devolvidos e cancelados podem entrar na conta sim, porque normalmente
> reenviamos.

Implementado: `STATUS_FORA_DO_SALDO` ficou vazia em `src/lib/status.ts`. A
spec v1 pedia o contrário; a regra da área prevalece. Ver
[fluxo de status](03-fluxo-de-status.md#efeito-no-saldo).

### O que já está em estoque não passa pelo Financeiro ✅

> Os itens que já temos em estoque não passam pelo financeiro, então é preciso
> que haja uma forma deles passarem direto pra expedição — hoje todos esses
> dados vão pra expedição via planilha.

Implementado em duas partes: o atalho de status
(`proximoDepoisDaAprovacao`, de "Aguardando aprovação" direto para
"Organizando envio") e a tela `/expedicao`, que substitui a planilha e exporta
em CSV e XLSX. Ver [fluxo de status](03-fluxo-de-status.md).

### As bebidas vêm sempre do mesmo site ✅

> As bebidas que pedimos são sempre de um site específico:
> `casadabebida.com.br/u`.

Implementado em `src/lib/fornecedores.ts`, como fornecedor padrão da categoria
"Bebidas" — o Financeiro passa a ver o site também em item de catálogo, não só
em presente específico. O `/u` do endereço parece truncado; ficou o domínio.
**Confirmar com a área** se o caminho completo importa, e quais outras
categorias têm fornecedor fixo.

## Para a área de Relacionamento

### O Financeiro pode ver CPF, telefone e endereço do cliente?

A lista pedida para a fila de compras — data, produto, valor, site — não inclui
esses campos. Mas a spec dá ao Financeiro a permissão de exportar, e a
exportação carrega CPF, telefone e endereço.

**Assumido:** pode ver, por coerência com a exportação.
**Onde mudar:** `PENDENTE_CONFIRMACAO.financeiroVeDadosSensiveis` em
`src/lib/permissions.ts`. Uma linha, e vale nos dois lugares.

### "Pendente" e "Aguardando aprovação" são momentos distintos?

Os dois existem no fluxo. Se forem a mesma coisa na prática, o fluxo perde uma
etapa e a solicitação já nasce em "Aguardando aprovação".

**Assumido:** são distintos. "Pendente" é rascunho recém-criado; "Aguardando
aprovação" é o que entrou na fila de quem aprova.
**Onde mudar:** `FLUXO_LINEAR` em `src/lib/status.ts`.

### Quem aprova, e existe alçada por valor?

Hoje qualquer Admin aprova, sem alçada.
**Se houver alçada:** entra como regra na mudança para "Aguardando compra",
comparando `valor_total` com o teto do aprovador.

### Existe limite mensal por consultor? Quem define?

O campo `limite_mensal` existe e é opcional. Quando preenchido, a tela mostra o
consumo contra o limite.

**Assumido:** estourar o limite apenas sinaliza, não bloqueia — é o que a spec
determina para o V1.
**Se for bloquear:** a checagem entra na criação da solicitação, usando
`saldoDoMes`.

### A plaquinha do primeiro milhão é produto de catálogo?

**Assumido:** sim. Está no seed como produto da categoria "Placas e troféus",
com `tipo_valor = medio` porque é personalizada, e "primeiro milhão" existe
como motivo de envio.

### Como a carta chega ao cliente hoje?

Impressa internamente, enviada pelo fornecedor, escrita à mão? A resposta define
se a geração da carta em formato de impressão é urgente ou não.

**Assumido:** a carta é digitada na ferramenta e o processo de impressão segue
como é hoje. A geração em formato de impressão está fora do V1.

### Há histórico de solicitações a migrar?

Se houver, é preciso saber o formato e o volume. O modelo aceita carga
histórica: `origem` distingue o cliente importado, e o código sequencial pode
partir de um número inicial ajustando `contador_codigo`.

### O pedido de expedição deve nascer dentro do sistema deles?

> O pedido que o consultor fizesse no catálogo já geraria o pedido pra
> expedição dentro do sistema que eles usam, com todas as informações pro
> envio, com exceção da carta.

**Assumido para o V1:** a ferramenta produz a lista pronta em `/expedicao`,
com exportação em CSV e XLSX nas mesmas colunas da planilha atual — o dado
deixa de ser redigitado, mas ainda é levado à mão para o outro sistema.

**Para fechar o ciclo** é preciso saber qual é o sistema da expedição e se ele
tem API. Se for o Tiny, o caminho já está previsto na fase 2: os campos
`tiny_pedido_id`, `rastreio` e `transportadora` existem no modelo esperando
isso. Ver [integrações da fase 2](04-integracoes-fase-2.md).
**Onde mudar:** `src/lib/expedicao.ts` ganha um provider de escrita, no mesmo
desenho de `src/lib/providers/`.

### O status ser único por solicitação atende?

Uma solicitação com três itens tem um status só. Se um item der problema, o
Admin usa observações e histórico.

**Se não atender:** o status desce para o item e o da solicitação passa a ser
derivado. É mudança de porte médio, melhor decidida antes de a ferramenta
entrar em uso.

## Técnicas, para começar

### Qual é o provedor de SSO da AUVP, e quem libera as credenciais?

Necessário para ligar a autenticação: `AUTH_OIDC_ISSUER`,
`AUTH_OIDC_CLIENT_ID`, `AUTH_OIDC_CLIENT_SECRET`.

O código já está pronto para qualquer provedor OIDC — Google Workspace, Entra
ID, Keycloak. Sem as credenciais, a tela de login diz o que falta, e o
desenvolvimento roda com `AUTH_DEV_BYPASS`.

**Também é preciso saber:** a URL de callback a registrar no provedor é
`https://<dominio>/api/auth/callback/auvp`.

### O SSO devolve grupo ou departamento?

Se devolver, dá para mapear perfil automaticamente em vez de o Admin promover
na mão. `AUTH_OIDC_GROUPS_CLAIM` está reservado para isso.

**Assumido:** não devolve. O primeiro login cria o usuário como `consultor` e o
Admin promove. `BOOTSTRAP_ADMIN_EMAILS` resolve o problema do primeiro Admin.

### Onde ficam as fotos de produto?

O bucket S3-compatível está previsto em variáveis de ambiente, mas o upload
ainda não foi construído. Falta saber qual bucket usar (Railway, Cloudflare R2,
S3) e quem cria as credenciais.

## Técnicas, para a fase 2

Ver [integrações da fase 2](04-integracoes-fase-2.md):

- quais campos do Salesforce podem ser consultados e por qual chave;
- quem detém as credenciais de API do Tiny;
- como tratar itens externos, que não geram pedido no Tiny.
