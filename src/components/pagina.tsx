import type { ReactNode } from 'react'

/** Cabeçalho padrão das telas: título, subtítulo e área de ações à direita. */
export function CabecalhoDaPagina({
  titulo,
  descricao,
  acoes,
}: {
  titulo: string
  descricao?: string
  acoes?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao ? <p className="text-muted-foreground mt-1 text-sm">{descricao}</p> : null}
      </div>
      {acoes ? <div className="flex items-center gap-2">{acoes}</div> : null}
    </div>
  )
}

/** Aviso de tela ainda não implementada, com o que falta explicitado. */
export function AConstruir({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
      {children}
    </div>
  )
}
