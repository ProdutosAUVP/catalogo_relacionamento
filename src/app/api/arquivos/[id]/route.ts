import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { usuarioAtual } from '@/lib/auth-guards'

/**
 * Serve a foto de produto guardada no banco.
 *
 * Fica atrás da sessão como todo o resto: é uma ferramenta interna, e uma URL
 * de imagem aberta seria o único endereço público do sistema.
 *
 * O cache é longo e imutável porque o id nunca é reaproveitado, trocar a foto
 * de um produto cria outro arquivo, com outra URL.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await usuarioAtual())) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  const { id } = await params
  const arquivo = await db.arquivo.findUnique({
    where: { id },
    select: { tipo: true, dados: true },
  })

  if (!arquivo) return NextResponse.json({ erro: 'Arquivo não encontrado.' }, { status: 404 })

  return new NextResponse(new Uint8Array(arquivo.dados), {
    headers: {
      'Content-Type': arquivo.tipo,
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
