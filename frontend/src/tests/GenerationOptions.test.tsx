import {
  fireEvent,
  render,
  screen
} from '@testing-library/react'
import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { GenerationOptions } from '../components/forms/GenerationOptions'
import {
  EvaluationProvider,
  useEvaluation
} from '../hooks/useEvaluation'

vi.mock('../services/api', () => ({
  health: vi.fn(async () => true),
  extractDocument: vi.fn(),
  suggestQuestions: vi.fn(),
  exportMoodleXml: vi.fn()
}))

function ModeIndicator() {
  const { config } = useEvaluation()

  return (
    <span data-testid="selected-mode">
      {config.mode}
    </span>
  )
}

function setup() {
  return render(
    <EvaluationProvider>
      <GenerationOptions />
      <ModeIndicator />
    </EvaluationProvider>
  )
}

describe('opções de preparação do material', () => {
  it('inicia no modo manual, sem exigir inteligência artificial', () => {
    setup()

    expect(
      screen.getByRole('button', {
        name: /Criar manualmente/i
      })
    ).toHaveAttribute('aria-pressed', 'true')

    expect(
      screen.getByTestId('selected-mode')
    ).toHaveTextContent('manual')

    expect(
      screen.queryByLabelText(/Sobre qual assunto deseja criar questões\?/i)
    ).not.toBeInTheDocument()
  })

  it('permite selecionar sugestões de questões', () => {
    setup()

    fireEvent.click(
      screen.getByRole('button', {
        name: /Receber sugestões/i
      })
    )

    expect(
      screen.getByTestId('selected-mode')
    ).toHaveTextContent('simple')

    expect(
      screen.getByRole('button', {
        name: /Receber sugestões/i
      })
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('apresenta configurações adicionais para sugestões direcionadas', () => {
    setup()

    fireEvent.click(
      screen.getByRole('button', {
        name: /Sugestões direcionadas/i
      })
    )

    expect(
      screen.getByTestId('selected-mode')
    ).toHaveTextContent('rag')

    expect(
      screen.getByRole('button', {
        name: /Sugestões direcionadas/i
      })
    ).toHaveAttribute('aria-pressed', 'true')

    expect(
      screen.getByLabelText(/Sobre qual assunto deseja criar questões/i)
    ).toBeInTheDocument()
  })

  it('permite retornar ao modo manual', () => {
    setup()

    fireEvent.click(
      screen.getByRole('button', {
        name: /Sugestões direcionadas/i
      })
    )

    expect(
      screen.getByTestId('selected-mode')
    ).toHaveTextContent('rag')

    fireEvent.click(
      screen.getByRole('button', {
        name: /Criar manualmente/i
      })
    )

    expect(
      screen.getByTestId('selected-mode')
    ).toHaveTextContent('manual')

    expect(
      screen.getByRole('button', {
        name: /Criar manualmente/i
      })
    ).toHaveAttribute('aria-pressed', 'true')

    expect(
      screen.queryByLabelText(/Sobre qual assunto deseja criar questões\?/i)
    ).not.toBeInTheDocument()
  })
})