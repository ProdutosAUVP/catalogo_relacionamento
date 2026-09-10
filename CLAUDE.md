# Orientações para trabalhar neste repositório

Ferramenta interna da área de Relacionamento da AUVP: catálogo de presentes,
solicitação com carta e acompanhamento do envio. O documento de origem é
`catalogo-presentes-spec-v1.md`.

## Antes de escrever código

Leia `docs/05-perguntas-em-aberto.md`. Boa parte das decisões pendentes já tem
uma suposição registrada e o ponto exato onde mudá-la. Não reinvente uma
resposta que já foi assumida em algum lugar.

## Onde as regras moram

Cada regra de negócio tem **um** lugar. Ao mexer numa delas, mexa lá — nunca
duplique numa tela.

| Regra                           | Arquivo                          |
| ------------------------------- | -------------------------------- |
| Quem pode o quê                 | `src/lib/permissions.ts`         |
| Transições, motivos e lote      | `src/lib/status.ts`              |
| Gasto do mês e limite           | `src/lib/saldo.ts`               |
| Fila de compras do Financeiro   | `src/lib/compras.ts`             |
| Fila da expedição               | `src/lib/expedicao.ts`           |
| Fornecedor padrão por categoria | `src/lib/fornecedores.ts`        |
| Upload e leitura de foto        | `src/lib/arquivos.ts`            |
| Leitura do CSV de clientes      | `src/lib/importacao-clientes.ts` |
| Catálogo de presentes da área   | `prisma/catalogo-auvp.ts`        |
| Aritmética de dinheiro          | `src/lib/money.ts`               |
| Colunas e formato da exportação | `src/lib/export/`                |
| Validação de formulário         | `src/lib/validators/`            |
| Leitura de catálogo e clientes  | `src/lib/providers/`             |
| Cores, tipografia e raio        | `src/styles/auvp-tokens.css`     |

## Invariantes

Coisas que o código já garante e que não devem ser afrouxadas:

- **Nada é deletado.** Produto, categoria e usuário são desativados. Uma
  solicitação antiga precisa continuar legível como foi criada.
- **Valores congelam na criação.** `valorUnitario` é cópia, não referência.
  Reajuste de preço não mexe em solicitação já feita.
- **Endereço é snapshot** na solicitação, não no cliente.
- **Dinheiro é `Prisma.Decimal`.** `number` só na fronteira de exibição.
- **Autorização acontece no servidor**, via `auth-guards.ts`. Esconder botão
  não é controle de acesso.
- **Consultor só enxerga as próprias solicitações.** Use
  `filtroDeSolicitacoes`, não um `where` escrito à mão.
- **Preço de item vem do banco na hora de gravar.** `criarSolicitacao` relê o
  produto; valor que chega do navegador não é usado.
- **Tudo conta no saldo do mês**, cancelado e devolvido inclusive — a área
  reenvia. `STATUS_FORA_DO_SALDO` está vazia de propósito.
- **Quem decide a rota é `Produto.origem`**, não a quantidade em estoque. É a
  coluna "Estoque" da planilha da área: `estoque_interno` não passa pelo
  Financeiro, `mediante_pedido` passa. A contagem de peças é refinamento
  opcional, e a área não a mantém hoje.
- **Estoque não passa pelo Financeiro.** Solicitação com tudo em estoque é
  liberada para envio na própria aprovação (`proximoDepoisDaAprovacao`). O
  atalho pula o Financeiro, nunca a aprovação — nada vai do pedido do consultor
  para a expedição sem o OK do Admin.
- **`Produto.valor` nulo não é zero.** Seis produtos vieram sem preço; a tela
  diz "valor a definir". `SolicitacaoItem.valorUnitario` continua obrigatório e
  congela como zero nesses casos.
- **O lote não afrouxa a máquina de estados.** `caminhoDeEncaminhamento` insere
  o passo da aprovação quando ele falta, e cada passo vira uma linha do
  histórico. O que não pode andar volta como ignorado, com o motivo.
- **Rastreio não muda status.** Gravar o código diz que saiu; "entregue" é
  decisão de quem acompanha.
- **Telas leem catálogo e clientes pelos providers**, não pelo Prisma direto.
- **Movimento não pode gerar layout shift.** Anime só `opacity` e `transform`.
  Todo `loading.tsx` reserva as medidas exatas do conteúdo, e toda imagem tem
  proporção e dimensões declaradas. O CLS medido hoje é ≤ 0,0031 — com um
  contexto de navegador novo por rota, porque `addInitScript` é cumulativo e
  medir tudo na mesma página soma o mesmo deslocamento várias vezes.
- **A identidade visual vem do Design System AUVP**, portada de
  `ProdutosAUVP/central`. Use os tokens (`bg-success`, `text-muted-foreground`),
  nunca a paleta crua do Tailwind (`bg-amber-100`) — ela não passa pelas travas
  de contraste do DS nem acompanha o tema escuro. Ver
  `docs/08-identidade-visual.md`.

## Convenções

- Código, comentários e mensagens de commit em português.
- Nomes de domínio em português (`solicitacao`, `consultor`), casando com o
  vocabulário da área e com o schema.
- Tabelas e colunas em `snake_case` via `@map`; modelos Prisma em `PascalCase`.
- Comentário explica **por quê**, não o que a linha faz.

## Ao alterar o banco

1. Edite `prisma/schema.prisma`.
2. `npm run db:migrate` — sempre gere a migration.
3. Regra que não pode ser violada por script vai também como CHECK constraint.

A CI recusa schema que não bate com as migrations.

## Antes de abrir PR

```bash
npm run check
```

Formato, lint, tipos e testes. É o que a CI roda.

Regra de negócio nova entra com teste. Os testes existentes cobrem transições
de status, permissões, aritmética monetária, CPF, fuso horário e exportação —
siga o mesmo padrão.

## O que está construído e o que não está

O caminho principal está construído de ponta a ponta: catálogo, nova
solicitação, mudança de status, fila de compras, fila da expedição com
exportação, CRUD de produto e categoria com upload de foto, CRUD de cliente
com importação CSV e edição de usuário.

O caminho do Admin é por pilha: a gestão encaminha em lote, e a expedição
devolve o rastreio que o consultor lê na própria solicitação.

O que continua fora do V1, por decisão registrada em
`docs/05-perguntas-em-aberto.md`: geração da carta em formato de impressão,
integração com o sistema da expedição (que escreveria rastreio e status sem
digitação) e as integrações da fase 2 (Tiny e Salesforce, que já têm provider e
campos reservados).

## Catálogo e fotos

O catálogo é o de verdade: 49 presentes transcritos da planilha da área em
`prisma/catalogo-auvp.ts`, conferidos campo a campo. Depois de a ferramenta
subir, quem manda é o CRUD — este arquivo é o ponto de partida.

As fotos originais que a área mandou ficam em `imgs produtos/`.
`npm run fotos:preparar` converte para `public/produtos/<slug>.webp`, na
moldura 3:4 que o catálogo serve. Rode de novo quando ela trocar ou
acrescentar foto.

## Vitrine estática

`demo/` é uma demonstração com dados fictícios publicada no GitHub Pages, para
mostrar as telas a quem aprova o V1. **A aplicação real não roda no Pages** —
ela precisa de Postgres, sessão e servidor, e vai para o Railway.

Ao mudar uma tela de forma relevante, vale refletir na vitrine.
