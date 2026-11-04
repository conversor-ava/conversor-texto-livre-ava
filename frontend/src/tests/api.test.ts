import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractDocument, suggestQuestions } from '../services/api'

afterEach(() => vi.unstubAllGlobals())

describe('serviços da API', () => {
  it('usa /api/suggestions sem campos exclusivos de RAG no modo simples', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => ({ ok: true, json: async () => ({ questions: [] }) }))
    vi.stubGlobal('fetch', fetchMock)
    await suggestQuestions('simple', { texto: 'Conteúdo', tema: 'Tema', quantidade: 2, dificuldade: 'medio', alternativas: 4, top_k: 3 })
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('/api/suggestions')
    expect(JSON.parse(init.body as string)).not.toHaveProperty('top_k')
  })
  it('usa endpoint de RAG ao selecionar RAG', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => ({ ok: true, json: async () => ({ questions: [] }) }))
    vi.stubGlobal('fetch', fetchMock)
    await suggestQuestions('rag', { texto: 'Conteúdo', tema: 'Tema', quantidade: 2, dificuldade: 'medio', alternativas: 4, top_k: 3 })
    expect(fetchMock.mock.calls[0][0]).toContain('/api/rag/suggestions')
  })
  it('faz upload como multipart FormData', async () => {
    const fetchMock = vi.fn(async (..._args: unknown[]) => ({ ok: true, json: async () => ({ filename: 'a.txt', text: 'ok', characters: 2 }) }))
    vi.stubGlobal('fetch', fetchMock)
    const result = await extractDocument(new File(['ok'], 'a.txt'))
    expect(result.text).toBe('ok')
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(init.body).toBeInstanceOf(FormData)
  })
})
