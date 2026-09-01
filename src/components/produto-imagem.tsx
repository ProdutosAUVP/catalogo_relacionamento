import { ilustracaoDoProduto } from '@/lib/ilustracoes'
import { cn } from '@/lib/utils'

/**
 * Imagem do card de produto.
 *
 * Com foto cadastrada, mostra a foto. Sem foto, mostra a ilustração da
 * categoria sobre um fundo em degradê da marca — estado de repouso, não aviso
 * de erro. É o que impede a grade do catálogo de parecer um sistema com
 * conteúdo faltando enquanto o upload de foto não existe.
 */
export function ProdutoImagem({
  fotoUrl,
  nome,
  categoria,
  className,
}: {
  fotoUrl?: string | null
  nome: string
  categoria?: string | null
  className?: string
}) {
  if (fotoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fotoUrl}
        alt={nome}
        loading="lazy"
        className={cn('bg-muted aspect-4/3 w-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'from-muted to-accent/8 relative aspect-4/3 w-full bg-gradient-to-br',
        className,
      )}
    >
      <svg
        viewBox="0 0 200 150"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="text-primary/45 group-hover:text-primary/70 h-full w-full transition-colors duration-300"
        dangerouslySetInnerHTML={{ __html: ilustracaoDoProduto(nome, categoria) }}
      />
    </div>
  )
}
