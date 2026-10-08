'use client'

import { usePathname } from 'next/navigation'

/**
 * Reproduz a entrada do conteúdo a cada troca de rota.
 *
 * O `key` pelo caminho é o que faz a animação rodar de novo: sem ele, o
 * elemento persiste entre navegações e a animação só aconteceria na primeira
 * carga.
 *
 * A animação é só de `opacity`, fora do cálculo de layout. Nada de
 * `transform` aqui: ele prenderia todo `position: fixed` da página a este div.
 *
 * O esqueleto de `loading.tsx` entra com a mesma transição, então a sequência
 *: esqueleto, depois conteúdo: é contínua, e as duas etapas ocupam
 * exatamente o mesmo espaço.
 */
export function Transicao({ children }: { children: React.ReactNode }) {
  const caminho = usePathname()

  return (
    <div key={caminho} className="animar-entrada">
      {children}
    </div>
  )
}
