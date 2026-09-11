# 0006: Identidade vem do Design System AUVP, portada

## Contexto

A ferramenta nasceu com a paleta neutra padrão do shadcn/ui, cinzas, sem
relação com a AUVP. A AUVP já tem um Design System maduro em
`ProdutosAUVP/central`: tokens em HSL, dois temas, correções de contraste
documentadas caso a caso e uma biblioteca de componentes.

Havia três caminhos: manter o neutro, consumir a Central como pacote, ou portar
os tokens.

## Decisão

Portar. Os valores HSL são copiados da Central para
`src/styles/auvp-tokens.css`, com os mesmos nomes de token, e esse arquivo é
importado tanto pela aplicação quanto pela vitrine estática.

Consumir a Central como dependência foi descartado: ela é uma SPA em Vite com
Tailwind 3, publicada no GitHub Pages, sem pacote npm nem versionamento de
tokens. Transformá-la em biblioteca seria mudança grande num repositório que
não é este, para resolver um problema que a cópia resolve.

Manter os nomes de token idênticos aos da Central é o que faz a cópia valer:
um componente copiado de lá funciona sem reescrita, apesar da diferença de
versão do Tailwind.

## Consequências

A ferramenta parece da AUVP, e quem já conhece a Central reconhece os
componentes. Os status ganham cores com contraste garantido nos dois temas, em
vez da paleta crua do Tailwind.

Em troca, cópia diverge. Se a Central mudar o verde, este repositório não fica
sabendo. A mitigação é processo, não código: `docs/08-identidade-visual.md`
manda atualizar a Central primeiro e trazer de lá, e os tokens ficam num
arquivo só, para que a atualização seja uma edição localizada.

Se a divergência virar problema recorrente, o passo seguinte é publicar os
tokens da Central como pacote, o que este porte deixa mais fácil, já que os
nomes já batem.
