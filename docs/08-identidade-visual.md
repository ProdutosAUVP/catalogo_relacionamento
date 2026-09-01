# Identidade visual

A identidade não é decidida neste repositório. Ela vem do **Design System AUVP
Capital**, que mora em [`ProdutosAUVP/central`](https://github.com/ProdutosAUVP/central)
e está publicado em <https://produtosauvp.github.io/central/design-system>.

Aqui os tokens são **portados**, não reinventados: os valores HSL são os mesmos
da Central, incluindo as correções de contraste documentadas lá.

## Onde os tokens moram

`src/styles/auvp-tokens.css` — arquivo único, importado por dois consumidores:

- `src/app/globals.css`, a aplicação;
- `demo/tailwind.css`, a vitrine estática.

Ficam juntos de propósito. A identidade não pode divergir entre o que a área
aprova na vitrine e o que ela usa no sistema.

## O que foi traduzido

A Central usa Tailwind 3, com o tema em `tailwind.config.ts`. Aqui é Tailwind 4,
onde o tema mora no CSS, em `@theme inline`. Os **nomes** dos tokens são
idênticos, então um componente copiado de lá funciona sem reescrita.

|          | Central                          | Aqui                       |
| -------- | -------------------------------- | -------------------------- |
| Tailwind | 3, config em TS                  | 4, tema no CSS             |
| Fontes   | `@import` do Google Fonts        | `next/font` (self-hosted)  |
| Temas    | Capital e Escola, claro e escuro | só Capital, claro e escuro |

Duas escolhas merecem explicação:

**Fontes por `next/font`.** As três famílias são as mesmas — Anek Latin nos
títulos, Roboto no corpo, Sora nos botões —, mas são baixadas no build e
servidas pelo próprio domínio. Elimina a requisição a terceiro no carregamento
e o pulo de layout na troca da fonte de fallback pela definitiva. A vitrine, que
não passa pelo Next, continua carregando do Google Fonts como a Central.

**Só o tema Capital.** A Central carrega também a identidade dourada da AUVP
Escola. Esta é uma ferramenta interna da Capital; o tema Escola entraria como
peso morto. Se um dia fizer sentido, o caminho é copiar o bloco `.escola` da
Central para o arquivo de tokens.

## Paleta

Verde AUVP `hsl(155 93% 11%)` como primária no tema claro. No escuro a base é
preto e branco, e o verde `hsl(145 20% 44%)` fica reservado para acentos
pontuais — é decisão da Central, não uma adaptação.

Os status semânticos (`success`, `warning`, `info`, `error`) já vêm com o par
fundo/texto resolvido nos dois temas. **Use-os em vez da paleta crua do
Tailwind**: `bg-amber-100` não passa pelas travas de contraste do DS e não
acompanha o tema escuro.

## O olho

O olho é o símbolo da marca AUVP. Vem de `public/olho-branco.svg` da Central e
mora em `src/components/marca/olho.tsx` como SVG inline com
`fill="currentColor"`, não como dois arquivos de imagem.

A razão é a regra do próprio Design System: versão clara sobre fundo escuro,
escura sobre fundo claro. Com `currentColor`, isso vira consequência da cor do
texto em volta, em vez de uma escolha manual a cada uso.

Aparece na navegação, na tela de login e nos estados vazios. O favicon usa o
mesmo traçado sobre o verde da marca — sem os ~15 KB de metadados C2PA do
arquivo original, que não servem a um ícone de aba.

## Ilustrações de produto

O V1 não tem upload de foto. Um catálogo cheio de retângulos cinza escrito "sem
foto" parece um sistema quebrado, não um sistema em construção — e a vitrine
existe justamente para ser aprovada por quem não vai ler o roadmap.

`src/lib/ilustracoes.ts` guarda um traço por categoria e alguns por produto,
todos no mesmo peso de linha, sobre um degradê da marca. A escolha é por
palavra no nome do produto primeiro, depois por categoria: sem isso, dois itens
de "Gourmet" dividiriam o mesmo desenho e a grade pareceria preenchida por
acaso.

Quando o produto tiver `fotoUrl`, a foto substitui a ilustração. Ela é o estado
de repouso do card, não um aviso de erro.

A vitrine recebe uma cópia gerada no build (`scripts/gerar-ilustracoes.ts`), em
vez de uma segunda lista mantida à mão.

## Componentes

`src/components/ui/` são portes do shadcn/ui da Central. As marcas registradas
do botão AUVP não devem ser suavizadas:

- Sora em caixa alta;
- canto de 5px, mais reto que o `--radius` do resto da interface;
- hover "vazado": o fundo sai e sobra a borda, na cor `*-emphasis`.

Os tokens `*-emphasis` existem porque a cor cheia da marca nem sempre é legível
como texto. É o que o hover vazado usa.

Selo (`Badge`) é cápsula (`rounded-full`), não retângulo.

Duas convenções de tipografia numérica, que o padrão do shadcn não traz:

- **número de destaque usa a fonte de corpo**, não a de título. Fonte de
  display em número grande lê como decoração, e o dado é o conteúdo;
- **`tabular-nums` só em coluna de tabela**, onde os dígitos precisam alinhar
  verticalmente. Num número solto e grande, a largura fixa abre espaços e o
  número parece frouxo.

## Cores literais, quando são necessárias

A barra de navegação tem fundo escuro nos dois temas, então o texto sobre ela é
claro sempre. Nesses casos as cores são literais (`text-white/70`) em vez de
tokens: `text-muted-foreground` é escuro no tema claro e sumiria sobre o verde.

É a exceção, não a regra. Fora de superfícies que fixam o próprio fundo, use os
tokens.

## Ao atualizar a identidade

1. Atualize a Central primeiro — ela é a fonte.
2. Traga os valores para `src/styles/auvp-tokens.css`.
3. `npm run demo:build`, para a vitrine acompanhar.

Nunca o contrário. Um token ajustado só aqui vira divergência silenciosa entre
esta ferramenta e o resto das ferramentas internas.
