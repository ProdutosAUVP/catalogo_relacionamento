import type { StatusSolicitacao } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { ROTULO_STATUS } from '@/lib/status'
import { cn } from '@/lib/utils'

/**
 * Cor por status. O painel de gestão é lido em varredura, então a cor precisa
 * separar três coisas de longe: o que está andando, o que terminou bem e o que
 * precisa de atenção.
 */
const CLASSE: Record<StatusSolicitacao, string> = {
  pendente: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  aguardando_aprovacao: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  aguardando_compra: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  comprado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  organizando_envio: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  entregue: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  cliente_confirmou: 'bg-emerald-600 text-white dark:bg-emerald-700',
  deu_problema: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  devolvido: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  cancelado: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
}

export function StatusBadge({
  status,
  className,
}: {
  status: StatusSolicitacao
  className?: string
}) {
  return (
    <Badge variant="secondary" className={cn('border-transparent', CLASSE[status], className)}>
      {ROTULO_STATUS[status]}
    </Badge>
  )
}
