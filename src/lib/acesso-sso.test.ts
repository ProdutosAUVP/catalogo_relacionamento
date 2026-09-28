import { describe, expect, it } from 'vitest'
import { dominioDoEmail, emailPodeEntrar } from './acesso-sso'

describe('dominioDoEmail', () => {
  it('separa o domínio em minúsculas', () => {
    expect(dominioDoEmail('Ana@AUVP.com.br')).toBe('auvp.com.br')
  })

  it('não inventa domínio para o que não é e-mail', () => {
    expect(dominioDoEmail('ana')).toBeNull()
    expect(dominioDoEmail('@auvp.com.br')).toBeNull()
    expect(dominioDoEmail('ana@')).toBeNull()
  })
})

describe('emailPodeEntrar', () => {
  const auvp = ['auvp.com.br']

  it('deixa entrar quem é do domínio da AUVP', () => {
    expect(emailPodeEntrar('ana@auvp.com.br', auvp)).toBe(true)
    expect(emailPodeEntrar('Ana@Auvp.Com.Br', auvp)).toBe(true)
  })

  it('barra conta de fora, mesmo com SSO válido', () => {
    expect(emailPodeEntrar('ana@gmail.com', auvp)).toBe(false)
  })

  it('casa o domínio inteiro, não o final do texto', () => {
    expect(emailPodeEntrar('ana@falsoauvp.com.br', auvp)).toBe(false)
    expect(emailPodeEntrar('ana@auvp.com.br.golpe.com', auvp)).toBe(false)
  })

  it('não trata subdomínio como o domínio', () => {
    expect(emailPodeEntrar('ana@mail.auvp.com.br', auvp)).toBe(false)
  })

  it('aceita mais de um domínio', () => {
    expect(emailPodeEntrar('ana@auvp.com', ['auvp.com.br', 'auvp.com'])).toBe(true)
  })

  it('barra e-mail que o provedor diz não ter verificado', () => {
    expect(emailPodeEntrar('ana@auvp.com.br', auvp, false)).toBe(false)
  })

  it('não barra provedor que simplesmente não manda o claim', () => {
    expect(emailPodeEntrar('ana@auvp.com.br', auvp, undefined)).toBe(true)
    expect(emailPodeEntrar('ana@auvp.com.br', auvp, null)).toBe(true)
  })

  it('lista vazia libera, que é o desenvolvimento', () => {
    expect(emailPodeEntrar('ana@gmail.com', [])).toBe(true)
  })
})
