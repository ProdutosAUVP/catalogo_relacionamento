import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EstadoVazio } from '@/components/pagina'

/**
 * Página não encontrada.
 *
 * Também é o que aparece quando alguém tenta abrir uma solicitação que não é
 * dele: o escopo entra no `where`, então o registro não é encontrado em vez de
 * ser carregado e escondido. Por isso o texto não afirma que a página não
 * existe — ela pode existir e não ser sua.
 */
export default function NaoEncontrada() {
  return (
    <EstadoVazio
      titulo="Não encontramos esta página"
      descricao="O endereço pode ter mudado, ou o registro não está no seu alcance. Se você chegou aqui por um link antigo, comece pelo início."
      acao={
        <Button asChild>
          <Link href="/">Voltar ao início</Link>
        </Button>
      }
    />
  )
}
