import {
  afterEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  health,
  suggestQuestions
} from '../../services/api'

const params = {
  texto: 'Texto-base',
  tema: 'Biologia',
  quantidade: 2,
  dificuldade: 'medio' as const,
  alternativas: 4,
  top_k: 3
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('falhas de comunicação com o serviço', () => {
  it('apresenta uma mensagem amigável quando o serviço está indisponível', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(
        new TypeError('Failed to fetch')
      )
    )

    await expect(
      suggestQuestions('simple', params)
    ).rejects.toThrow(
      'Não conseguimos acessar o serviço neste momento.'
    )
  })

  it('apresenta os detalhes de validação retornados pelo serviço', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          detail: [
            { msg: 'Quantidade inválida' },
            { msg: 'Texto ausente' }
          ]
        })
      })
    )

    await expect(
      suggestQuestions('rag', params)
    ).rejects.toThrow(
      'Quantidade inválida; Texto ausente'
    )
  })

  it('retorna false quando a verificação de conexão falha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(
        new TypeError('Network error')
      )
    )

    await expect(
      health()
    ).resolves.toBe(false)
  })

  it('orienta o usuário quando o serviço demora mais que o esperado', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(
        new DOMException('The operation was aborted.', 'AbortError')
      )
    )

    await expect(
      suggestQuestions('simple', params)
    ).rejects.toThrow('The operation was aborted.')
  })

  it('apresenta uma mensagem amigável quando ocorre um erro interno', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({})
      })
    )

    await expect(
      suggestQuestions('simple', params)
    ).rejects.toThrow(
      'Não conseguimos concluir sua solicitação neste momento.'
    )
  })
})