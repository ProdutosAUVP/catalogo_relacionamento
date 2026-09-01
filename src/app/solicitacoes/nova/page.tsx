import { exigirPermissao } from '@/lib/auth-guards'
import { CabecalhoDaPagina, AConstruir } from '@/components/pagina'

/**
 * Fluxo em etapas: cliente → itens → entrega → carta e motivo → revisão.
 *
 * As regras que este formulário aplica já existem e estão testadas em
 * `src/lib/validators/solicitacao.ts`; o que falta é a interface das etapas.
 */
export default async function NovaSolicitacaoPage() {
  await exigirPermissao('solicitacao.criar')

  return (
    <>
      <CabecalhoDaPagina
        titulo="Nova solicitação"
        descricao="Cliente, itens, entrega, carta e revisão."
      />
      <AConstruir>
        <p className="text-foreground font-medium">Formulário em construção.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>
            Etapa <strong>cliente</strong>: busca por CPF via <code>clienteProvider</code>; CPF já
            cadastrado oferece o cliente existente em vez de duplicar.
          </li>
          <li>
            Etapa <strong>itens</strong>: catálogo via <code>catalogoProvider</code> ou presente
            específico com descrição e link. Valor congela no momento da criação.
          </li>
          <li>
            Etapa <strong>entrega</strong>: CEP preenche logradouro, bairro, cidade e UF por{' '}
            <code>/api/cep/[cep]</code>. O endereço é gravado como snapshot.
          </li>
          <li>
            Etapa <strong>carta e motivo</strong>: mensagem e motivo do envio, com descrição
            obrigatória quando o motivo for “outro”.
          </li>
          <li>
            Etapa <strong>revisão</strong>: grava solicitação, itens e a primeira linha do histórico
            numa única transação, junto com o código <code>SOL-AAAA-NNNN</code>.
          </li>
        </ul>
      </AConstruir>
    </>
  )
}
