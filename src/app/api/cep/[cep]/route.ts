import { NextResponse } from 'next/server'
import { usuarioAtual } from '@/lib/auth-guards'
import { buscarCep } from '@/lib/viacep'

/**
 * Consulta de CEP para o autopreenchimento do endereço de entrega.
 *
 * Passa pelo servidor, e não direto do navegador para o ViaCEP, por dois
 * motivos: o cache do Next é compartilhado entre usuários, e a rota fica atrás
 * da sessão, sem virar proxy aberto de consulta de CEP.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ cep: string }> }) {
  if (!(await usuarioAtual())) {
    return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })
  }

  const { cep } = await params
  const resultado = await buscarCep(cep)

  if (!resultado.ok) {
    return NextResponse.json({ erro: resultado.erro }, { status: 404 })
  }

  return NextResponse.json(resultado.endereco)
}
