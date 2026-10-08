import { exigirPermissao } from '@/lib/auth-guards'
import { lerPeriodo } from '@/lib/periodo'
import { CabecalhoDaPagina, EstadoVazio } from '@/components/pagina'
import { SeletorDePeriodo } from './seletor-de-periodo'

/**
 * Dashboard Logístico.
 *
 * Leitura rápida da operação para a empresa inteira, da operação à diretoria;
 * o detalhe de cada envio continua no ClickUp. Ver docs/11-logistica.md.
 */
export default async function LogisticaPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; ref?: string; de?: string; ate?: string }>
}) {
  await exigirPermissao('logistica.ver')
  const periodo = lerPeriodo(await searchParams)

  return (
    <>
      <CabecalhoDaPagina
        sobrancelha="Logística"
        titulo="Dashboard Logístico"
        descricao="Status da operação, volume de pedidos e a trilha de demandas do período."
      />

      <SeletorDePeriodo periodo={periodo} />

      {periodo.aviso ? (
        <p role="status" className="text-muted-foreground -mt-3 mb-6 text-sm">
          {periodo.aviso} Mostrando a semana atual.
        </p>
      ) : null}

      <EstadoVazio
        titulo="Painel em montagem"
        descricao="Os blocos de status, volume e demandas entram em seguida. O filtro de período acima já é o que vai valer para o painel inteiro."
      />
    </>
  )
}
