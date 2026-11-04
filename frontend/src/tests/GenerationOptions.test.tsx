import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GenerationOptions } from '../components/forms/GenerationOptions'
import { EvaluationProvider } from '../hooks/useEvaluation'

vi.mock('../services/api', () => ({
  health: vi.fn(async () => true), extractDocument: vi.fn(), suggestQuestions: vi.fn(), exportMoodleXml: vi.fn(),
}))

describe('opções de geração', () => {
  it('inicia no modo manual, sem exigir IA', () => {
    render(<EvaluationProvider><GenerationOptions/></EvaluationProvider>)
    expect(screen.getByRole('button', { name: /Manual Sem inteligência artificial/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/sem Ollama e sem RAG/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Tema para busca semântica')).not.toBeInTheDocument()
  })
  it('mostra parâmetros específicos do RAG quando selecionado', () => {
    render(<EvaluationProvider><GenerationOptions/></EvaluationProvider>)
    fireEvent.click(screen.getByRole('button', { name: /IA \+ RAG/i }))
    expect(screen.getByLabelText('Tema para busca semântica')).toBeInTheDocument()
    expect(screen.getByLabelText('Trechos recuperados (Top-K)')).toBeInTheDocument()
  })
})
