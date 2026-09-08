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
import { Stat } from '@/components/stat'
import { CabecalhoDaPagina } from '@/components/pagina'
import { EditorDeUsuario } from './editor-de-usuario'

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
      <CabecalhoDaPagina
        sobrancelha="Administração"
        titulo="Usuários"
        descricao="Perfil e limite mensal são geridos aqui, dentro da ferramenta, sem passar por TI."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat rotulo="Ativos" valor={usuarios.filter((u) => u.ativo).length} />
        <Stat
          rotulo="Consultores"
          valor={usuarios.filter((u) => u.perfil === 'consultor').length}
        />
        <Stat
          rotulo="Com limite definido"
          valor={usuarios.filter((u) => u.limiteMensal).length}
          apoio="Os demais não têm teto mensal."
        />
      </div>

      <p className="text-muted-foreground mb-6 text-sm">
        Usuários não são criados aqui: entram sozinhos no primeiro login pelo SSO, como consultor.
        Esta tela promove, define o teto mensal e desativa quem saiu do time.
      </p>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead className="text-right">Limite mensal</TableHead>
              <TableHead className="text-right">Solicitações</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
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
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {u.limiteMensal ? formatarBRL(u.limiteMensal) : '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{u._count.solicitacoes}</TableCell>
                  <TableCell>
                    <Badge variant={u.ativo ? 'outline' : 'muted'}>
                      {u.ativo ? 'ativo' : 'desativado'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <EditorDeUsuario
                      usuario={{
                        id: u.id,
                        nome: u.nome,
                        email: u.email,
                        perfil: u.perfil,
                        limiteMensal: u.limiteMensal
                          ? u.limiteMensal.toFixed(2).replace('.', ',')
                          : null,
                        ativo: u.ativo,
                      }}
                    />
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
