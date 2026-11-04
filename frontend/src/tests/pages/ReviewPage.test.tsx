import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { EvaluationProvider } from '../../hooks/useEvaluation'
import { ReviewPage } from '../../pages/ReviewPage'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(), suggestQuestions: vi.fn(), exportMoodleXml: vi.fn(), health: vi.fn(),
}))

function setup() {
  render(<MemoryRouter initialEntries={['/revisao']}><EvaluationProvider><Routes>
    <Route path="/revisao" element={<ReviewPage />} />
    <Route path="/exportacao" element={<div>EXPORTAÇÃO ABERTA</div>} />
  </Routes></EvaluationProvider></MemoryRouter>)
}

describe('página de revisão', () => {
  it('permite adicionar questões sem IA', () => {
    setup()
    expect(screen.getByText('Nenhuma questão ainda')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /Nova questão|Criar questão/ })[0])
    expect(screen.getByLabelText('Enunciado *')).toBeInTheDocument()
  })

  it('não permite avançar com questões incompletas', () => {
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: /Nova questão|Criar questão/ })[0])
    fireEvent.click(screen.getByRole('button', { name: /Validar e continuar/i }))
    expect(screen.queryByText('EXPORTAÇÃO ABERTA')).not.toBeInTheDocument()
  })

  it('permite avançar após preencher uma questão válida', () => {
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: /Nova questão|Criar questão/ })[0])
    fireEvent.change(screen.getByLabelText('Enunciado *'), { target: { value: 'Quanto é 2 + 2?' } })
    const answers = ['4', '3', '5', '6']
    answers.forEach((answer, index) => {
      fireEvent.change(screen.getByLabelText(`Alternativa ${index + 1} da questão 1`), { target: { value: answer } })
      fireEvent.change(screen.getByLabelText(`Feedback da alternativa ${index + 1} da questão 1`), { target: { value: 'Explicação' } })
    })
    fireEvent.click(screen.getByRole('button', { name: /Validar e continuar/i }))
    expect(screen.getByText('EXPORTAÇÃO ABERTA')).toBeInTheDocument()
  })
})
