import { db } from '@/lib/db'
import { exigirPermissao } from '@/lib/auth-guards'
import { pode } from '@/lib/permissions'
import { formatarCpf, formatarTelefone, mascararCpf } from '@/lib/cpf'
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
import { Stat } from '@/components/stat'
import { CabecalhoDaPagina, AConstruir, EstadoVazio } from '@/components/pagina'

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
      <CabecalhoDaPagina
        sobrancelha="Administração"
        titulo="Clientes"
        descricao="Cadastro manual ou importação por CSV. O CPF é a chave que evita duplicatas."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat rotulo="Clientes" valor={clientes.length} />
        <Stat
          rotulo="Cadastro manual"
          valor={clientes.filter((c) => c.origem === 'manual').length}
        />
        <Stat
          rotulo="Já presenteados"
          valor={clientes.filter((c) => c._count.solicitacoes > 0).length}
          apoio="Com pelo menos uma solicitação."
        />
      </div>

      <div className="mb-6">
        <AConstruir>
          <p>
            Faltam o formulário de cadastro/edição e a importação por CSV. A validação de cada linha
            já está em <code>linhaImportacaoClienteSchema</code>. O CPF é a chave de deduplicação:
            linha com CPF existente atualiza o cliente em vez de criar outro.
          </p>
        </AConstruir>
      </div>

      {clientes.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum cliente cadastrado"
          descricao="Cadastre manualmente ou importe um CSV. O CPF é a chave que impede duplicatas."
        />
      ) : (
        <Card className="overflow-hidden">
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
              {clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {veDadosCompletos ? formatarCpf(c.cpf) : mascararCpf(c.cpf)}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {c.telefone ? formatarTelefone(c.telefone) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.origem}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c._count.solicitacoes}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatarData(c.criadoEm)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  )
}
