import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { formatarCpf, mascararCpf } from '@/lib/cpf'
import { formatarData } from '@/lib/datas'
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

/** Lista, edição e importação de clientes por CSV. */
export default async function AdminClientesPage() {
  const usuario = await exigirPermissao('cliente.gerenciar')
  const veDadosCompletos = pode(usuario.perfil, 'cliente.verDadosSensiveis')

  const clientes = await db.cliente.findMany({
    include: { _count: { select: { solicitacoes: true } } },
    orderBy: { nome: 'asc' },
    take: 200,
  })

  return (
    <>
      <CabecalhoDaPagina titulo="Clientes" descricao={`${clientes.length} cadastrados`} />

      <AConstruir>
        <p className="text-foreground font-medium">Cadastro e importação em construção.</p>
        <p className="mt-2">
          Faltam o formulário de cadastro/edição e a importação por CSV. A validação de cada linha
          já está em <code>linhaImportacaoClienteSchema</code>. O CPF é a chave de deduplicação:
          linha com CPF existente atualiza o cliente em vez de criar outro.
        </p>
      </AConstruir>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead className="text-right">Solicitações</TableHead>
              <TableHead>Cadastro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                  Nenhum cliente cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {veDadosCompletos ? formatarCpf(c.cpf) : mascararCpf(c.cpf)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.telefone ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.origem}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{c._count.solicitacoes}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatarData(c.criadoEm)}
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
