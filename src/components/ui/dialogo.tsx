'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Modal sobre o `<dialog>` nativo.
 *
 * Nativo por três coisas que uma reimplementação em React costuma perder e que
 * aqui importam: o foco fica preso dentro do modal, Esc fecha, e o conteúdo
 * sobe para a top layer — não há `z-index` competindo com a barra de navegação.
 *
 * O conteúdo só é montado quando aberto, para que um formulário reaberto volte
 * com os valores do registro e não com o rascunho da vez anterior.
 */
export function Dialogo({
  aberto,
  aoFechar,
  titulo,
  descricao,
  children,
  className,
}: {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao?: string
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return

    if (aberto && !dialogo.open) dialogo.showModal()
    if (!aberto && dialogo.open) dialogo.close()
  }, [aberto])

  return (
    <dialog
      ref={ref}
      onClose={aoFechar}
      // O clique no backdrop chega ao próprio `<dialog>`, e não a um filho.
      onClick={(e) => e.target === ref.current && aoFechar()}
      aria-labelledby="titulo-do-dialogo"
      // `text-left` explícito: o `<dialog>` sobe para a top layer, mas continua
      // herdando CSS do lugar onde está no DOM — e o gatilho costuma ser um
      // botão numa célula alinhada à direita, que jogava o formulário inteiro
      // para a direita.
      className={cn(
        'bg-card text-foreground animar-entrada m-auto w-[min(38rem,calc(100vw-2rem))] rounded-xl border p-0 text-left shadow-lg backdrop:bg-black/40',
        className,
      )}
    >
      {aberto ? (
        <div className="max-h-[85vh] overflow-y-auto">
          <div className="bg-card sticky top-0 flex items-start justify-between gap-4 border-b px-6 py-4">
            <div>
              <h2 id="titulo-do-dialogo" className="font-display text-lg font-semibold">
                {titulo}
              </h2>
              {descricao ? <p className="text-muted-foreground mt-1 text-sm">{descricao}</p> : null}
            </div>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="text-muted-foreground hover:bg-muted hover:text-foreground -mr-2 rounded-md p-1.5 transition-colors"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="px-6 py-5">{children}</div>
        </div>
      ) : null}
    </dialog>
  )
}
