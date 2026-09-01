import { describe, expect, it } from 'vitest'
import { formatarCodigo } from './codigo'

describe('código da solicitação', () => {
  it('usa o formato SOL-AAAA-NNNN', () => {
    expect(formatarCodigo(2026, 1)).toBe('SOL-2026-0001')
    expect(formatarCodigo(2026, 42)).toBe('SOL-2026-0042')
    expect(formatarCodigo(2026, 1234)).toBe('SOL-2026-1234')
  })

  it('não trunca quando o ano passa de 9999 solicitações', () => {
    expect(formatarCodigo(2026, 10000)).toBe('SOL-2026-10000')
  })
})
