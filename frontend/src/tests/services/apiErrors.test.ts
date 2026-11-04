import { afterEach, describe, expect, it, vi } from 'vitest'
import { health, suggestQuestions } from '../../services/api'

const params = {
  texto: 'Texto-base', tema: 'Biologia', quantidade: 2,
  dificuldade: 'medio' as const, alternativas: 4, top_k: 3,
}

afterEach(() => vi.unstubAllGlobals())

describe('falhas de comunicação com o backend', () => {
  it('informa erro de conexão quando o servidor está indisponível', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(suggestQuestions('simple', params)).rejects.toThrow('Não foi possível conectar')
  })

  it('apresenta detalhes de validação retornados pelo FastAPI', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 422,
      json: async () => ({ detail: [{ msg: 'Quantidade inválida' }, { msg: 'Texto ausente' }] }),
    }))
    await expect(suggestQuestions('rag', params)).rejects.toThrow('Quantidade inválida; Texto ausente')
  })

  it('retorna false quando o health check falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')))
    await expect(health()).resolves.toBe(false)
  })
})
