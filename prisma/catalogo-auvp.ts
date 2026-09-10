import { OrigemProduto, TipoValor } from '@prisma/client'

/**
 * O catálogo de presentes da área, como ela mantém hoje.
 *
 * Transcrição da planilha "Lista de Produtos", coluna a coluna:
 *
 * - **Categoria** → `categoria`;
 * - **Valor** → `valor`, em texto para não passar por ponto flutuante. Seis
 *   produtos vieram sem preço, e continuam sem: nulo é "a área ainda não
 *   informou", e o catálogo diz "valor a definir" em vez de R$ 0,00;
 * - **Estoque** → `origem`. "Estoque interno" é prateleira e não passa pelo
 *   Financeiro; "Mediante pedido" é comprado quando alguém pede;
 * - **Link** → `urlCompra` quando é um endereço, `notaDeCompra` quando é uma
 *   instrução ("Pedido direto ao fornecedor"). Dois kits têm as duas coisas,
 *   porque parte vem de cada lugar;
 * A coluna "Link para a imagem" da planilha apontava para o Drive da área. As
 * fotos vieram depois para o próprio repositório, em `imgs produtos/`, e é de
 * lá que `scripts/preparar-fotos.ts` gera `public/produtos/<slug>.webp` — que é
 * o que o catálogo serve. Link externo quebra; arquivo versionado, não.
 *
 * Este arquivo é a fonte: o seed grava a partir dele e o script de fotos lê
 * dele. Depois de a ferramenta estar no ar, quem manda é o CRUD de catálogo —
 * aqui fica o ponto de partida.
 */

export type ProdutoDoCatalogoAUVP = {
  nome: string
  categoria: string
  /** Em reais, como texto. Nulo quando a planilha veio sem preço. */
  valor: string | null
  tipoValor?: TipoValor
  origem: OrigemProduto
  urlCompra?: string
  notaDeCompra?: string
}

/**
 * Nome do arquivo da foto, derivado do nome do produto.
 *
 * Derivar em vez de guardar uma coluna a mais: o nome já identifica o produto
 * na planilha, e uma segunda chave para manter é uma segunda chave para
 * esquecer de atualizar. `scripts/preparar-fotos.ts` grava com este nome e o
 * seed lê com este nome.
 */
export function slugDoProduto(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** As categorias, na ordem em que aparecem no catálogo. */
export const CATEGORIAS_AUVP = [
  'Personalizado AUVP',
  'Bebida',
  'Bebês e Crianças',
  'Beleza e Bem estar',
  'Livro',
] as const

const FORNECEDOR = 'Pedido direto ao fornecedor'

export const CATALOGO_AUVP: readonly ProdutoDoCatalogoAUVP[] = [
  // --- Personalizado AUVP ----------------------------------------------------
  {
    nome: 'Agenda e Caneta AUVP',
    categoria: 'Personalizado AUVP',
    valor: null,
    origem: OrigemProduto.estoque_interno,
  },
  {
    nome: 'Boné Capitalismo',
    categoria: 'Personalizado AUVP',
    valor: '35.00',
    origem: OrigemProduto.estoque_interno,
  },
  {
    nome: 'Caneca AUVP',
    categoria: 'Personalizado AUVP',
    valor: null,
    origem: OrigemProduto.estoque_interno,
  },
  {
    nome: 'Caneta e Moleskine AUVP',
    categoria: 'Personalizado AUVP',
    valor: null,
    origem: OrigemProduto.estoque_interno,
  },
  {
    nome: 'Carteira AUVP',
    categoria: 'Personalizado AUVP',
    valor: '35.00',
    origem: OrigemProduto.estoque_interno,
  },
  {
    nome: 'Garrafa AUVP',
    categoria: 'Personalizado AUVP',
    valor: null,
    origem: OrigemProduto.estoque_interno,
  },
  {
    nome: 'Kit Canga AUVP',
    categoria: 'Personalizado AUVP',
    valor: null,
    origem: OrigemProduto.estoque_interno,
  },
  {
    nome: 'Kit Mochila AUVP',
    categoria: 'Personalizado AUVP',
    valor: '135.00',
    origem: OrigemProduto.estoque_interno,
  },
  {
    nome: 'Meia AUVP',
    categoria: 'Personalizado AUVP',
    valor: '25.00',
    origem: OrigemProduto.estoque_interno,
  },
  {
    nome: 'Kit Churrasco AUVP com faca',
    categoria: 'Personalizado AUVP',
    valor: '330.00',
    origem: OrigemProduto.mediante_pedido,
    notaDeCompra: FORNECEDOR,
  },
  {
    nome: 'Kit Churrasco AUVP com Garra e Acessórios',
    categoria: 'Personalizado AUVP',
    valor: '380.00',
    origem: OrigemProduto.mediante_pedido,
    notaDeCompra: FORNECEDOR,
  },

  // --- Bebês e Crianças ------------------------------------------------------
  {
    nome: 'Cadeira de balanço Baby - Menina',
    categoria: 'Bebês e Crianças',
    valor: '199.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/cadeira-de-descanso-musical-funtime-new-maxi-baby-color-rosa/p/MLB35340528',
  },
  {
    nome: 'Cadeira de balanço Baby - Menino',
    categoria: 'Bebês e Crianças',
    valor: '199.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/cadeira-de-descanso-e-balanco-funtime-18kgs-coruja-maxi-baby/p/MLB28318987',
  },
  {
    nome: 'Cadeira de balanço Baby - Unissex',
    categoria: 'Bebês e Crianças',
    valor: '199.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/cadeira-de-descanso-e-balanco-bebe-musical-funtime-maxi-baby-baxter-esquilo/p/MLB38626962',
  },
  {
    nome: 'Tapete Musical Baby - Menina',
    categoria: 'Bebês e Crianças',
    valor: '110.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/tapete-de-atividades-para-bebe-com-piano-musical-removivel/up/MLBU4256984980',
  },
  {
    nome: 'Tapete Musical Baby - Menino',
    categoria: 'Bebês e Crianças',
    valor: '110.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/tapete-de-atividades-para-bebe-com-piano-musical-removivel/up/MLBU4236577373',
  },

  // --- Beleza e Bem estar ----------------------------------------------------
  {
    nome: 'Kit Presente Granado',
    categoria: 'Beleza e Bem estar',
    valor: '150.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/kit-presente-spa-granado-castanha-do-brasil-skincare-caixa/p/MLB2105895362',
  },
  {
    nome: 'Kit Presente Loccitane Romã',
    categoria: 'Beleza e Bem estar',
    valor: '290.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/kit-presente-roma-loccitane-spraygeleiaesfoliante--sacola/up/MLBU4368898303',
  },

  // --- Livro -----------------------------------------------------------------
  {
    nome: 'Livro - A arte de gastar dinheiro',
    categoria: 'Livro',
    valor: '35.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/a-arte-de-gastar-dinheiro-escolhas-simples-para-uma-vida-equilibrada-do-mesmo-autor-de-a-psicologia-financeira-housel-morgan-harper-business-capa-mole/p/MLB53908652',
  },
  {
    nome: 'Livro - A Psicologia Financeira',
    categoria: 'Livro',
    valor: '35.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/a-psicologia-financeira-housel-morgan-harper-business-capa-mole/p/MLB19320442',
  },

  // --- Bebida: kits ----------------------------------------------------------
  {
    nome: 'Caixa MDF para vinho com Acessórios - Escolha o vinho',
    categoria: 'Bebida',
    valor: null,
    origem: OrigemProduto.mediante_pedido,
    notaDeCompra: FORNECEDOR,
  },
  {
    nome: 'Kit Abridor de Garrafas + Cerveja Artesanal',
    categoria: 'Bebida',
    valor: '170.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://colombina-express.lojaintegrada.com.br/cerveja-colombina-ipa-600ml',
    notaDeCompra: `${FORNECEDOR} (abridor)`,
  },
  {
    nome: 'Kit Aperol',
    categoria: 'Bebida',
    valor: '315.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/kit-presente-aperol-spritz-espumante-chandon-brut-taca-vidro/p/MLB2097820350',
  },
  {
    nome: 'Kit Café Constantino',
    categoria: 'Bebida',
    valor: '190.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.mercadolivre.com.br/kit-cafe-500g-moido-presente-barista-singelo-constantino/up/MLBU4355517358',
  },
  {
    nome: 'Kit Café Orfeu com Prensa Francesa',
    categoria: 'Bebida',
    valor: '210.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.robertadecoracoes.com.br/215c2c/cesta-presente-cafe-premium-com-acessorios-o-presente-ideal',
  },
  {
    nome: 'Kit Caneca de Chopp + Cerveja Artesanal',
    categoria: 'Bebida',
    valor: '110.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://colombina-express.lojaintegrada.com.br/kit-colombina-cerrado-01',
    notaDeCompra: `${FORNECEDOR} (caneca)`,
  },
  {
    nome: 'Kit Queijos com Vinho - Escolha o vinho',
    categoria: 'Bebida',
    valor: '165.00',
    origem: OrigemProduto.mediante_pedido,
    notaDeCompra: FORNECEDOR,
  },
  {
    nome: 'Kit Vinho com Abridor Elétrico e Petisqueira - Escolha o vinho',
    categoria: 'Bebida',
    valor: '215.00',
    origem: OrigemProduto.mediante_pedido,
    notaDeCompra: FORNECEDOR,
  },

  // --- Bebida: vinhos --------------------------------------------------------
  {
    nome: 'Vinho Alma Negra',
    categoria: 'Bebida',
    valor: '200.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/vinho/alma-negra-m-blend-750-ml/',
  },
  {
    nome: 'Vinho Angelica Zapata Cabernet Franc',
    categoria: 'Bebida',
    valor: '350.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/vinho/angelica-zapata-cabernet-franc-750-ml/',
  },
  {
    nome: 'Vinho Carnivor Zinfandel',
    categoria: 'Bebida',
    valor: '150.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/vinho/vinho-carnivor-zinfandel-750-ml/',
  },
  {
    nome: 'Vinho DV Catena Cabernet Malbec',
    categoria: 'Bebida',
    valor: '250.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/vinho/vinho-dv-catena-cabernet-malbec-750-ml/',
  },
  {
    nome: 'Vinho El Enemigo',
    categoria: 'Bebida',
    valor: '300.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/vinho/el-enemigo-cabernet-franc-750-ml/',
  },
  {
    nome: 'Vinho Marques de Tomares',
    categoria: 'Bebida',
    valor: '120.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/vinho/marques-de-tomares-crianza-750-ml/',
  },
  {
    nome: 'Vinho Pintas Character Tinto',
    categoria: 'Bebida',
    valor: '350.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/vinho/pintas-character-tinto-750-ml/',
  },
  {
    nome: 'Vinho Poeira Douro 37 Barricas',
    categoria: 'Bebida',
    valor: '450.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/vinho/vinho-poeira-douro-37-barricas-750-ml/',
  },
  {
    nome: 'Vinho Poeme Gran Reserva Cabernet Syrah',
    categoria: 'Bebida',
    valor: '120.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.casadabebida.com.br/vinho/vinho-poeme-gran-reserva-cabernet-syrah-750ml/',
  },
  {
    nome: 'Vinho Premier Rendez Vous Merlot Cabernet',
    categoria: 'Bebida',
    valor: '120.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.casadabebida.com.br/vinho/vinho-premier-rendez-vous-merlot-cabernet-750-ml/',
  },
  {
    nome: 'Vinho Ruben E Flora Cabernet E Carmenere',
    categoria: 'Bebida',
    valor: '120.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.casadabebida.com.br/vinho/vinho-ruben-e-flora-cabernet-e-carmenere-750ml/',
  },
  {
    nome: 'Vinho Silk & Spice',
    categoria: 'Bebida',
    valor: '100.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/vinho/silk-e-spice-750-ml/',
  },
  {
    nome: 'Vinho Soprasasso Amarone Della Valpolicella',
    categoria: 'Bebida',
    valor: '400.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra:
      'https://www.casadabebida.com.br/vinho/vinho-soprasasso-amarone-della-valpolicella-750ml/',
  },
  {
    nome: 'Vinho Telmo E Ruth Cabernet E Merlot',
    categoria: 'Bebida',
    valor: '120.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/chile/vinho-telmo-e-ruth-cabernet-e-merlot-750ml/',
  },

  // --- Bebida: destilados ----------------------------------------------------
  {
    nome: 'Whisky Bulleit Bourbon 750 ml',
    categoria: 'Bebida',
    valor: '250.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/whisky/bulleit-bourbon-750-ml/',
  },
  {
    nome: 'Whisky Eagle Rare 10 anos 750 ml - Bourbon',
    categoria: 'Bebida',
    valor: '250.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/whisky/whiskey-eagle-rare-10-anos-750-ml-bourbon/',
  },
  {
    nome: 'Whisky Gentleman Jack 1000 ml',
    categoria: 'Bebida',
    valor: '250.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/natale/kit-gentleman-jack-1000ml-copo-vidro/',
  },
  {
    nome: 'Whisky Singleton 12 Anos Dufftown 750 ml',
    categoria: 'Bebida',
    valor: '200.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/whisky/singleton-12-anos-of-glen-ord-700-ml/',
  },
  {
    nome: 'Whisky Toki Suntory 700ml',
    categoria: 'Bebida',
    valor: '200.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/whisky/whisky-suntory-toki-700ml/',
  },
  {
    nome: 'Whisky Wild Turkey Rye 700 ml',
    categoria: 'Bebida',
    valor: '300.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/whisky/wild-turkey-rye-700-ml/',
  },
  {
    nome: 'Whisky Woodford Reserve Bourbon',
    categoria: 'Bebida',
    valor: '250.00',
    origem: OrigemProduto.mediante_pedido,
    urlCompra: 'https://www.casadabebida.com.br/blue-week/kit-whisky-woodford-reserve-700ml-copo/',
  },
] as const
