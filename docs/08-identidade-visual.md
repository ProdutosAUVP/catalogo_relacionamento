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

## Componentes

`src/components/ui/` são portes do shadcn/ui da Central. As marcas registradas
do botão AUVP não devem ser suavizadas:

- Sora em caixa alta;
- canto de 5px, mais reto que o `--radius` do resto da interface;
- hover "vazado": o fundo sai e sobra a borda, na cor `*-emphasis`.

Os tokens `*-emphasis` existem porque a cor cheia da marca nem sempre é legível
como texto. É o que o hover vazado usa.

Selo (`Badge`) é cápsula (`rounded-full`), não retângulo.

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
