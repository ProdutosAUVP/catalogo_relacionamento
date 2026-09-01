import { redirect } from 'next/navigation'
import type { Perfil } from '@prisma/client'
import { auth } from './auth'
import { pode, type Acao } from './permissions'

/**
 * Guardas de servidor.
 *
 * Toda página e toda server action começa por uma destas funções. Esconder um
 * item de menu não é controle de acesso; o controle acontece aqui.
 */

export type UsuarioLogado = {
  id: string
  nome: string
  email: string
  perfil: Perfil
}

/** Usuário da sessão, ou null. Para telas que renderizam diferente sem login. */
export async function usuarioAtual(): Promise<UsuarioLogado | null> {
  const sessao = await auth()
  if (!sessao?.user?.id || !sessao.user.ativo) return null

  return {
    id: sessao.user.id,
    nome: sessao.user.name ?? sessao.user.email ?? '',
    email: sessao.user.email ?? '',
    perfil: sessao.user.perfil,
  }
}

/** Exige sessão. Redireciona para o login quando não houver. */
export async function exigirUsuario(): Promise<UsuarioLogado> {
  const usuario = await usuarioAtual()
  if (!usuario) redirect('/login')
  return usuario
}

/**
 * Exige uma permissão específica. Redireciona para a home em vez de mostrar
 * "acesso negado", porque a rota não deveria estar acessível no menu de quem
 * não pode entrar nela.
 */
export async function exigirPermissao(acao: Acao): Promise<UsuarioLogado> {
  const usuario = await exigirUsuario()
  if (!pode(usuario.perfil, acao)) redirect('/')
  return usuario
}

/**
 * Versão para server actions: lança em vez de redirecionar, porque um redirect
 * dentro de action vira resposta confusa no cliente.
 */
export class SemPermissaoError extends Error {
  constructor(acao: Acao) {
    super(`Você não tem permissão para: ${acao}.`)
    this.name = 'SemPermissaoError'
  }
}

export async function autorizarAction(acao: Acao): Promise<UsuarioLogado> {
  const usuario = await usuarioAtual()
  if (!usuario) throw new SemPermissaoError(acao)
  if (!pode(usuario.perfil, acao)) throw new SemPermissaoError(acao)
  return usuario
}
