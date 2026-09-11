import { NextResponse } from 'next/server'
import { autorizarAction, SemPermissaoError } from '@/lib/auth-guards'
import { filaDeExpedicao, linhasDaExpedicao, COLUNAS_DA_EXPEDICAO } from '@/lib/expedicao'
import { gerarCsv, gerarXlsx } from '@/lib/export'

/**
 * A planilha que hoje é montada à mão e enviada para a expedição.
 *
 * Mesmas colunas da tela, geradas da mesma função, enquanto a integração com o
 * sistema da expedição não existe, o arquivo é a ponte, e ele precisa sair
 * pronto para colar sem redigitação.
 */
export async function GET(req: Request) {
  try {
    await autorizarAction('expedicao.verFila')
  } catch (erro) {
    if (erro instanceof SemPermissaoError) {
      return NextResponse.json({ erro: erro.message }, { status: 403 })
    }
    throw erro
  }

  const params = new URL(req.url).searchParams
  const formato = params.get('formato') === 'xlsx' ? 'xlsx' : 'csv'
  const incluirEnviadas = params.get('enviadas') === '1'

  const pedidos = await filaDeExpedicao({ incluirEnviadas })
  const linhas = linhasDaExpedicao(pedidos)

  const nome = `expedicao-${new Date().toISOString().slice(0, 10)}.${formato}`

  if (formato === 'xlsx') {
    const arquivo = await gerarXlsx(linhas, { colunas: COLUNAS_DA_EXPEDICAO, aba: 'Expedição' })
    return new NextResponse(new Uint8Array(arquivo), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nome}"`,
      },
    })
  }

  return new NextResponse(gerarCsv(linhas, COLUNAS_DA_EXPEDICAO), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nome}"`,
    },
  })
}
