import { cn } from '@/lib/utils'
import { Olho } from '@/components/marca/olho'
import type { PreviaDaCarta } from '@/lib/carta'

/**
 * A carta como ela será lida.
 *
 * Aparece duas vezes no fluxo: ao lado do campo, enquanto se escreve, e de
 * novo na revisão. É a mesma folha nos dois lugares de propósito, para que a
 * revisão não mostre um arranjo diferente do que a pessoa aprovou enquanto
 * escrevia.
 *
 * A impressão continua fora do sistema (ver `docs/05-perguntas-em-aberto.md`).
 * O que isto resolve é outra coisa: ler a saudação junto do corpo é o que faz
 * perceber que o nome saiu errado ou que a mensagem repete o "Olá".
 */
export function FolhaDaCarta({
  previa,
  vazioEm,
  className,
}: {
  previa: PreviaDaCarta
  /** O que escrever quando ainda não há mensagem. */
  vazioEm?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'bg-card ring-border/60 flex flex-col rounded-xl p-6 shadow-sm ring-1',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <Olho className="text-primary-emphasis h-5 w-auto" aria-hidden="true" />
        <span className="font-ui text-muted-foreground text-[10px] font-semibold tracking-[0.16em] uppercase">
          {previa.ocasiao}
        </span>
      </div>

      <div className="font-roboto flex-1 space-y-3 pt-5 text-sm leading-relaxed">
        {previa.saudacao ? <p>{previa.saudacao}</p> : null}

        {previa.corpo ? (
          <p className="whitespace-pre-wrap">{previa.corpo}</p>
        ) : (
          <p className="text-muted-foreground/70 italic">
            {vazioEm ?? 'A mensagem aparece aqui conforme você escreve.'}
          </p>
        )}
      </div>

      {previa.assinatura ? (
        <p className="font-display text-muted-foreground mt-6 border-t pt-3 text-sm">
          {previa.assinatura}
          <span className="text-muted-foreground/70 block text-xs">Relacionamento AUVP</span>
        </p>
      ) : null}
    </div>
  )
}
