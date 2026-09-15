import { MotivoEnvio } from '@prisma/client'

/**
 * A carta que vai junto do presente.
 *
 * A área escreve uma carta por envio, e a maioria delas repete a mesma
 * estrutura: uma saudação pelo primeiro nome, o recado do motivo, e a
 * assinatura de quem mandou. O que muda de verdade é o meio.
 *
 * Por isso duas coisas moram aqui: os modelos que o consultor usa como ponto
 * de partida, e a montagem da folha que ele vê antes de enviar. A impressão
 * continua sendo feita fora do sistema (ver `docs/05-perguntas-em-aberto.md`),
 * mas o que a pessoa lê na tela precisa ser a carta inteira, e não só o campo
 * de texto: é lendo a saudação junto do corpo que se percebe que o nome ficou
 * errado ou que a mensagem começa repetindo o "Olá".
 */

/** O nome pelo qual se trata alguém numa carta. */
export function primeiroNome(nomeCompleto: string): string {
  const limpo = nomeCompleto.trim().replace(/\s+/g, ' ')
  if (!limpo) return ''

  const primeiro = limpo.split(' ')[0]!

  // "de", "da", "dos" nunca são o primeiro nome de ninguém, mas podem ser a
  // primeira palavra quando o cadastro veio invertido ("de Souza, Ana").
  if (primeiro.length <= 3 && /^(de|da|do|das|dos|e)$/i.test(primeiro)) {
    return limpo.split(' ')[1] ?? primeiro
  }

  return primeiro
}

/**
 * Modelos por motivo.
 *
 * São ponto de partida, não texto final: o consultor escolhe e edita. Ficam
 * aqui, e não na tela, porque a área vai querer ajustar as frases sem que
 * ninguém precise caçar em qual componente elas estavam.
 *
 * O `{nome}` é substituído pelo primeiro nome do cliente na hora de aplicar.
 */
export const MODELOS_DE_CARTA: Record<MotivoEnvio, readonly string[]> = {
  aniversario: [
    'Feliz aniversário, {nome}! Que este novo ano venha com saúde, conquistas e boas decisões. Obrigado por caminhar com a gente.',
    'Parabéns, {nome}! Um brinde a mais um ano e a tudo o que você vem construindo.',
  ],
  casamento: [
    'Parabéns pelo casamento, {nome}! Que a vida a dois seja tão bem planejada quanto os sonhos de vocês.',
    'Felicidades, {nome}! Que este novo capítulo venha cheio de planos e de realizações conjuntas.',
  ],
  nascimento: [
    'Parabéns pela chegada do bebê, {nome}! Que venha muita saúde e um futuro bem preparado.',
    'Seja bem-vindo ao mundo! Parabéns, {nome}, por esse novo começo.',
  ],
  reforco_relacionamento: [
    'Oi, {nome}! Passando para agradecer pela confiança. Seguimos juntos e à disposição sempre que precisar.',
    '{nome}, obrigado por fazer parte da nossa história. Este presente é um lembrete de que estamos por perto.',
  ],
  primeiro_milhao: [
    'Parabéns pelo primeiro milhão, {nome}! É o resultado de consistência e de boas escolhas, e foi uma alegria acompanhar de perto.',
    '{nome}, o primeiro milhão é um marco que poucos alcançam. Que venham os próximos.',
  ],
  outro: ['Oi, {nome}! Este presente é um jeito de dizer que a gente lembra de você.'],
}

/** Troca o `{nome}` do modelo pelo primeiro nome de quem recebe. */
export function aplicarModelo(modelo: string, nomeDoCliente: string): string {
  const nome = primeiroNome(nomeDoCliente)
  // Sem nome cadastrado, "Oi, {nome}!" viraria "Oi, !". Melhor cortar a
  // saudação e deixar a frase começar no recado.
  if (!nome) return modelo.replace(/^[^{]*\{nome\}[,!.\s]*/u, '').trim()
  return modelo.replaceAll('{nome}', nome)
}

export type DadosDaCarta = {
  /** Quem recebe, como escrito na entrega. */
  destinatario: string
  motivo: MotivoEnvio
  motivoOutro: string
  mensagem: string
  /** Quem assina: o consultor que está pedindo. */
  remetente: string
}

export type PreviaDaCarta = {
  saudacao: string
  corpo: string
  assinatura: string
  /** O motivo por extenso, para o cabeçalho da folha. */
  ocasiao: string
}

/** O motivo como a carta o nomeia: "Outro" vira o que a pessoa escreveu. */
export function ocasiaoDaCarta(motivo: MotivoEnvio, motivoOutro: string): string {
  if (motivo !== MotivoEnvio.outro) return ROTULO_DA_OCASIAO[motivo]
  return motivoOutro.trim() || 'Uma lembrança'
}

const ROTULO_DA_OCASIAO: Record<MotivoEnvio, string> = {
  aniversario: 'Aniversário',
  casamento: 'Casamento',
  nascimento: 'Nascimento',
  reforco_relacionamento: 'Um obrigado',
  primeiro_milhao: 'Primeiro milhão',
  outro: 'Uma lembrança',
}

/**
 * Monta a folha como ela será lida.
 *
 * A saudação some quando a primeira frase já chama a pessoa pelo nome. Não é
 * só o "Oi, Marina": "Feliz aniversário, Marina!" também já cumprimenta, e
 * imprimir "Olá, Marina," logo acima disso repete o nome duas vezes em duas
 * linhas. Por isso a checagem é a frase inteira, e não o começo dela.
 */
export function previaDaCarta(dados: DadosDaCarta): PreviaDaCarta {
  const nome = primeiroNome(dados.destinatario)
  const corpo = dados.mensagem.trim()

  // A primeira frase: até o primeiro ponto final, de exclamação ou de
  // interrogação. Sem pontuação nenhuma, a mensagem inteira é uma frase só.
  const primeiraFrase = corpo.split(/[.!?]/, 1)[0] ?? ''
  const jaCumprimenta =
    nome.length > 0 && new RegExp(`\\b${escapar(nome)}\\b`, 'iu').test(primeiraFrase)

  return {
    saudacao: !nome || jaCumprimenta ? '' : `Olá, ${nome},`,
    corpo,
    assinatura: dados.remetente.trim(),
    ocasiao: ocasiaoDaCarta(dados.motivo, dados.motivoOutro),
  }
}

const escapar = (texto: string) => texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Quanto cabe numa carta.
 *
 * Não é limite do banco, é limite de folha: a carta é impressa num cartão
 * pequeno, e um texto muito longo sai em corpo ilegível ou não sai. O número
 * veio da carta mais longa que a área já mandou, com folga.
 */
export const LIMITE_DA_MENSAGEM = 600

/** Quanto ainda cabe, e se já passou. */
export function espacoRestante(mensagem: string): { restam: number; excedeu: boolean } {
  const restam = LIMITE_DA_MENSAGEM - mensagem.length
  return { restam, excedeu: restam < 0 }
}
