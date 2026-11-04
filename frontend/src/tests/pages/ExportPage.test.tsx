import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EvaluationProvider, useEvaluation } from '../../hooks/useEvaluation'
import { ExportPage } from '../../pages/ExportPage'
import { exportMoodleXml } from '../../services/api'
import { emptyQuestion } from '../../types/question'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(), suggestQuestions: vi.fn(), exportMoodleXml: vi.fn(), health: vi.fn(),
}))

function Seed() {
  const { setQuestions } = useEvaluation()
  function seed() {
    const question = emptyQuestion(1, 2)
    question.text = 'Qual é a correta?'
    question.answers = [
      { text: 'Sim', feedback: 'Correta', is_correct: true },
      { text: 'Não', feedback: 'Incorreta', is_correct: false },
    ]
    setQuestions([question])
  }
  return <><button onClick={seed}>Questão válida</button><ExportPage /></>
}

beforeEach(() => vi.clearAllMocks())

function setup() {
  render(<MemoryRouter initialEntries={['/exportacao']}><EvaluationProvider><Routes>
    <Route path="/exportacao" element={<Seed />} />
    <Route path="/" element={<div>INÍCIO</div>} />
  </Routes></EvaluationProvider></MemoryRouter>)
}

describe('página de exportação', () => {
  it('bloqueia download de conjunto vazio', () => {
    setup()
    expect(screen.getByRole('button', { name: /Baixar Moodle XML/i })).toBeDisabled()
    expect(exportMoodleXml).not.toHaveBeenCalled()
  })

  it('envia questões válidas ao conversor sem solicitar IA', async () => {
    vi.mocked(exportMoodleXml).mockResolvedValue()
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Questão válida' }))
    fireEvent.click(screen.getByRole('button', { name: /Baixar Moodle XML/i }))
    await waitFor(() => expect(exportMoodleXml).toHaveBeenCalledWith(expect.objectContaining({ questions: expect.arrayContaining([expect.objectContaining({ text: 'Qual é a correta?' })]) })))
  })

  it('permite começar nova avaliação', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Nova avaliação/i }))
    expect(screen.getByText('INÍCIO')).toBeInTheDocument()
  })
})
