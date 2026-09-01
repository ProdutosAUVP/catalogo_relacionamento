import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { ROTULO_PERFIL } from '@/lib/permissions'
import { formatarBRL } from '@/lib/money'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CabecalhoDaPagina, AConstruir } from '@/components/pagina'

/**
 * CRUD de usuários: perfil e limite mensal.
 *
 * O usuário é criado no primeiro login pelo SSO, com perfil `consultor`. Esta
 * tela é onde o Admin promove e define limite, sem passar por TI.
 */
export default async function AdminUsuariosPage() {
  await exigirPermissao('usuario.gerenciar')

  const usuarios = await db.usuario.findMany({
    include: { _count: { select: { solicitacoes: true } } },
    orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
  })

  return (
    <>
      <CabecalhoDaPagina titulo="Usuários" descricao={`${usuarios.length} cadastrados`} />

      <AConstruir>
        <p className="text-foreground font-medium">Edição em construção.</p>
        <p className="mt-2">
          Faltam a troca de perfil, a definição do limite mensal e a desativação. Usuários não são
          criados aqui: entram sozinhos no primeiro login pelo SSO, como consultor.
        </p>
      </AConstruir>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-right">Limite mensal</TableHead>
              <TableHead className="text-right">Solicitações</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  Nenhum usuário ainda.
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROTULO_PERFIL[u.perfil]}</Badge>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {u.limiteMensal ? formatarBRL(u.limiteMensal) : '—'}
                  </TableCell>
                  <TableCell className="text-right">{u._count.solicitacoes}</TableCell>
                  <TableCell>
                    <Badge variant={u.ativo ? 'secondary' : 'outline'}>
                      {u.ativo ? 'ativo' : 'desativado'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}
