import { exigirPermissao } from '@/lib/auth-guards'
import { Card } from '@/components/ui/card'
import { CabecalhoDaPagina, AConstruir } from '@/components/pagina'

const ETAPAS = [
  {
    nome: 'Cliente',
    texto:
      'Busca por CPF. Se o CPF já existir, a tela oferece o cliente encontrado em vez de criar uma duplicata.',
  },
  {
    nome: 'Itens',
    texto:
      'Produto do catálogo ou presente específico, com descrição e o link onde comprar. O valor congela no momento da criação.',
  },
  {
    nome: 'Entrega',
    texto:
      'O CEP preenche logradouro, bairro, cidade e UF. O endereço é gravado como cópia na solicitação.',
  },
  {
    nome: 'Carta e motivo',
    texto:
      'A mensagem que acompanha o presente e o motivo do envio, com descrição obrigatória quando for “outro”.',
  },
  {
    nome: 'Revisão',
    texto:
      'Confere itens e valores, gera o código SOL-AAAA-NNNN e abre o histórico da solicitação.',
  },
] as const

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
        sobrancelha="Nova solicitação"
        titulo="Como funciona o pedido"
        descricao="Cinco etapas, do cliente à revisão. Nada é enviado antes da última."
      />

      <Card className="p-6 sm:p-8">
        <ol className="relative">
          {ETAPAS.map((etapa, indice) => (
            <li key={etapa.nome} className="relative flex gap-5 pb-8 last:pb-0">
              {indice < ETAPAS.length - 1 ? (
                <span
                  className="bg-border absolute top-10 left-[19px] h-[calc(100%-2.5rem)] w-px"
                  aria-hidden="true"
                />
              ) : null}

              <span className="bg-primary text-primary-foreground font-ui relative grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold">
                {indice + 1}
              </span>

              <div className="pt-1.5">
                <p className="font-display font-semibold">{etapa.nome}</p>
                <p className="text-muted-foreground mt-1 max-w-prose text-sm text-pretty">
                  {etapa.texto}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="mt-6">
        <AConstruir>
          <p>
            O formulário ainda não foi construído. As regras que ele aplica já existem e estão
            cobertas por testes: item é de catálogo <em>ou</em> específico com link, o valor congela
            na criação e o motivo “outro” exige descrição.
          </p>
        </AConstruir>
      </div>
    </>
  )
}
