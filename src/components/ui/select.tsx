import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Select nativo com a moldura do Design System.
 *
 * `appearance-none` remove o controle padrão do navegador — que é o detalhe
 * que mais denuncia protótipo numa barra de filtros — e a seta volta como
 * fundo SVG, mantendo o comportamento nativo (teclado, mobile, acessibilidade)
 * que um menu reconstruído em JavaScript costuma perder.
 */
const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'border-input bg-background text-foreground focus-visible:ring-ring focus-visible:ring-offset-background h-10 w-full appearance-none rounded-md border bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat py-2 pr-9 pl-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7a70' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'

export { Select }
