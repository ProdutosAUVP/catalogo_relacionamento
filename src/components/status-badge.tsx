import type { StatusSolicitacao } from '@prisma/client'
import { Badge, type BadgeProps } from '@/components/ui/badge'
import { ROTULO_STATUS } from '@/lib/status'
import { cn } from '@/lib/utils'

/**
 * Selo de status, nas cores semânticas do Design System AUVP.
 *
 * Antes usava a paleta crua do Tailwind (`bg-amber-100`), que não passa pelas
 * travas de contraste do DS e não acompanha o tema escuro. Agora cada status
 * mapeia para um token semântico (`success`, `warning`, `info`, `error`),
 * que já vem com o par fundo/texto resolvido nos dois temas.
 *
 * O agrupamento é o que o painel precisa comunicar numa varredura:
 *
 * - cinza    → ainda não começou
 * - âmbar    → parado esperando alguém agir
 * - azul     → em andamento
 * - verde    → terminou bem
 * - vermelho → deu errado (sólido enquanto aberto, vazado quando encerrado)
 */
type Estilo = { variant: BadgeProps['variant']; className?: string }

const ESTILO: Record<StatusSolicitacao, Estilo> = {
  pendente: { variant: 'muted' },
  aguardando_aprovacao: { variant: 'warning' },
  aguardando_compra: { variant: 'warning' },
  comprado: { variant: 'info' },
  organizando_envio: { variant: 'info' },
  entregue: { variant: 'success' },
  // Desfecho ideal: recebe o verde cheio da marca, e não o verde de status.
  cliente_confirmou: { variant: 'default' },
  deu_problema: { variant: 'error' },
  // Vazado: também é desfecho negativo, mas encerrado, não pede ação como
  // "deu problema", que segue aberto.
  devolvido: { variant: 'outline', className: 'border-error text-error' },
  cancelado: { variant: 'outline', className: 'text-muted-foreground' },
}

export function StatusBadge({
  status,
  className,
}: {
  status: StatusSolicitacao
  className?: string
}) {
  const estilo = ESTILO[status]

  return (
    <Badge variant={estilo.variant} className={cn(estilo.className, className)}>
      {ROTULO_STATUS[status]}
    </Badge>
  )
}
