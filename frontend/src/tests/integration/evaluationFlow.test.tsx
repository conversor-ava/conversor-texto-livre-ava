import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { EvaluationProvider } from '../../hooks/useEvaluation'
import { ExportPage } from '../../pages/ExportPage'
import { GeneratePage } from '../../pages/GeneratePage'
import { ReviewPage } from '../../pages/ReviewPage'
import { exportMoodleXml, suggestQuestions } from '../../services/api'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(), suggestQuestions: vi.fn(), exportMoodleXml: vi.fn(), health: vi.fn(),
}))

describe('integração do fluxo de avaliação', () => {
  it('cria, revisa e exporta XML sem chamar Ollama', async () => {
    vi.mocked(exportMoodleXml).mockResolvedValue()
    render(<MemoryRouter initialEntries={['/']}><EvaluationProvider><Routes>
      <Route path="/" element={<GeneratePage />} />
      <Route path="/revisao" element={<ReviewPage />} />
      <Route path="/exportacao" element={<ExportPage />} />
    </Routes></EvaluationProvider></MemoryRouter>)

    fireEvent.click(screen.getByRole('button', { name: /Criar manualmente/i }))
    expect(await screen.findByLabelText('Enunciado *')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Enunciado *'), { target: { value: 'Qual número é par?' } })
    for (const [index, value] of ['2', '3', '5', '7'].entries()) {
      fireEvent.change(screen.getByLabelText(`Alternativa ${index + 1} da questão 1`), { target: { value } })
      fireEvent.change(screen.getByLabelText(`Feedback da alternativa ${index + 1} da questão 1`), { target: { value: `Justificativa ${index + 1}` } })
    }
    fireEvent.click(screen.getByRole('button', { name: /Validar e continuar/i }))
    expect(await screen.findByRole('button', { name: /Baixar Moodle XML/i })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: /Baixar Moodle XML/i }))
    await waitFor(() => expect(exportMoodleXml).toHaveBeenCalledTimes(1))
    expect(suggestQuestions).not.toHaveBeenCalled()
  })
})
