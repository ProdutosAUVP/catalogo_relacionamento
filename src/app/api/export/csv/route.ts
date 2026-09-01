import { NextResponse } from 'next/server'
import { autorizarAction, SemPermissaoError } from '@/lib/auth-guards'
import { filtroSolicitacoesSchema } from '@/lib/validators/filtros'
import { gerarCsv, linhasParaExportar, nomeDoArquivo } from '@/lib/export'

/**
 * Exportação em CSV do resultado filtrado.
 *
 * Os parâmetros são os mesmos da tela de gestão, lidos pelo mesmo schema — é o
 * que garante que o arquivo traga exatamente o que está na tela.
 */
export async function GET(req: Request) {
  try {
    await autorizarAction('exportar')
  } catch (erro) {
    if (erro instanceof SemPermissaoError) {
      return NextResponse.json({ erro: erro.message }, { status: 403 })
    }
    throw erro
  }

  const params = Object.fromEntries(new URL(req.url).searchParams)
  const filtro = filtroSolicitacoesSchema.parse(params)

  const linhas = await linhasParaExportar(filtro)
  const csv = gerarCsv(linhas)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeDoArquivo('csv')}"`,
    },
  })
}
