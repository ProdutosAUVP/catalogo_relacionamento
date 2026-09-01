import { NextResponse } from 'next/server'
import { autorizarAction, SemPermissaoError } from '@/lib/auth-guards'
import { filtroSolicitacoesSchema } from '@/lib/validators/filtros'
import { gerarXlsx, linhasParaExportar, nomeDoArquivo } from '@/lib/export'

/** Exportação em XLSX, com valores como número para somar na planilha. */
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
  const arquivo = await gerarXlsx(linhas)

  return new NextResponse(new Uint8Array(arquivo), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${nomeDoArquivo('xlsx')}"`,
    },
  })
}
