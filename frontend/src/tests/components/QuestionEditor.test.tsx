import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QuestionEditor } from '../../components/questions/QuestionEditor'
import { EvaluationProvider, useEvaluation } from '../../hooks/useEvaluation'
import { emptyQuestion } from '../../types/question'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(), suggestQuestions: vi.fn(), exportMoodleXml: vi.fn(), health: vi.fn(),
}))

function Fixture() {
  const { questions, setQuestions } = useEvaluation()
  return <>
    <button onClick={() => setQuestions([emptyQuestion(1, 2)])}>Preparar</button>
    <span data-testid="total">{questions.length}</span>
    {questions.map((question, index) => <QuestionEditor key={index} question={question} index={index} />)}
  </>
}

function setup() {
  render(<EvaluationProvider><Fixture /></EvaluationProvider>)
  fireEvent.click(screen.getByRole('button', { name: 'Preparar' }))
}

describe('edição de questões', () => {
  it('edita nome, enunciado e alternativas', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Nome da questão'), { target: { value: 'Questão de Biologia' } })
    fireEvent.change(screen.getByLabelText('Enunciado *'), { target: { value: 'O que é clorofila?' } })
    fireEvent.change(screen.getByLabelText('Alternativa 1 da questão 1'), { target: { value: 'Pigmento' } })
    expect(screen.getByLabelText('Nome da questão')).toHaveValue('Questão de Biologia')
    expect(screen.getByLabelText('Enunciado *')).toHaveValue('O que é clorofila?')
    expect(screen.getByLabelText('Alternativa 1 da questão 1')).toHaveValue('Pigmento')
  })

  it('mantém somente um gabarito correto ao selecionar outra alternativa', () => {
    setup()
    const first = screen.getByRole('button', { name: 'Marcar alternativa 1 como correta da questão 1' })
    const second = screen.getByRole('button', { name: 'Marcar alternativa 2 como correta da questão 1' })
    expect(first).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(second)
    expect(first).toHaveAttribute('aria-pressed', 'false')
    expect(second).toHaveAttribute('aria-pressed', 'true')
  })

  it('permite adicionar alternativa e impede remover abaixo do mínimo', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar alternativa' }))
    expect(screen.getByLabelText('Alternativa 3 da questão 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remover alternativa 3 da questão 1' }))
    expect(screen.queryByLabelText('Alternativa 3 da questão 1')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Remover alternativa 1 da questão 1' }))
    expect(screen.getAllByPlaceholderText('Texto da alternativa')).toHaveLength(2)
  })

  it('remove a questão selecionada', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir questão 1' }))
    expect(screen.getByTestId('total')).toHaveTextContent('0')
  })
})
