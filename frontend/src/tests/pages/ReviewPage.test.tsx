import {
  fireEvent,
  render,
  screen
} from '@testing-library/react'
import {
  MemoryRouter,
  Route,
  Routes
} from 'react-router-dom'
import {
  describe,
  expect,
  it,
  vi
} from 'vitest'

import {
  EvaluationProvider,
  useEvaluation
} from '../../hooks/useEvaluation'
import { ReviewPage } from '../../pages/ReviewPage'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(),
  suggestQuestions: vi.fn(),
  exportMoodleXml: vi.fn(),
  health: vi.fn()
}))

function ExportFixture() {
  const { questions } = useEvaluation()

  return (
    <div>
      <h1>EXPORTAÇÃO ABERTA</h1>

      <span data-testid="export-total">
        {questions.length}
      </span>
    </div>
  )
}

function setup() {
  return render(
    <MemoryRouter initialEntries={['/revisao']}>
      <EvaluationProvider>
        <Routes>
          <Route
            path="/revisao"
            element={<ReviewPage />}
          />

          <Route
            path="/exportacao"
            element={<ExportFixture />}
          />
        </Routes>
      </EvaluationProvider>
    </MemoryRouter>
  )
}

function addQuestion() {
  fireEvent.click(
    screen.getAllByRole('button', {
      name: /Adicionar questão/i
    })[0]
  )
}

function continueReview() {
  fireEvent.click(
    screen.getByRole('button', {
      name: /Conferir e continuar/i
    })
  )
}

describe('página de revisão', () => {
  it('permite adicionar questões sem utilizar IA', () => {
    setup()

    expect(
      screen.getByText('Deseja adicionar questões?')
    ).toBeInTheDocument()

    addQuestion()

    expect(
      screen.getByLabelText('Enunciado *')
    ).toBeInTheDocument()
  })

  it('não cria questões automaticamente ao abrir a revisão', () => {
    setup()

    expect(
      screen.getByText('Deseja adicionar questões?')
    ).toBeInTheDocument()

    expect(
      screen.getByText('Questões do material')
    ).toBeInTheDocument()

    expect(
      screen.queryByLabelText('Enunciado *')
    ).not.toBeInTheDocument()
  })

  it('não permite avançar com questões incompletas', () => {
    setup()

    addQuestion()

    expect(
      screen.getByLabelText('Enunciado *')
    ).toBeInTheDocument()

    continueReview()

    expect(
      screen.queryByText('EXPORTAÇÃO ABERTA')
    ).not.toBeInTheDocument()

    expect(
      screen.getByLabelText('Enunciado *')
    ).toBeInTheDocument()
  })

  it('permite avançar após preencher uma questão válida', () => {
    setup()

    addQuestion()

    fireEvent.change(
      screen.getByLabelText('Enunciado *'),
      {
        target: {
          value: 'Quanto é 2 + 2?'
        }
      }
    )

    const answers = ['4', '3', '5', '6']

    answers.forEach((answer, index) => {
      fireEvent.change(
        screen.getByLabelText(
          `Alternativa ${index + 1} da questão 1`
        ),
        {
          target: {
            value: answer
          }
        }
      )

      fireEvent.change(
        screen.getByLabelText(
          `Feedback da alternativa ${index + 1} da questão 1`
        ),
        {
          target: {
            value: 'Explicação'
          }
        }
      )
    })

    continueReview()

    expect(
      screen.getByText('EXPORTAÇÃO ABERTA')
    ).toBeInTheDocument()

    expect(
      screen.getByTestId('export-total')
    ).toHaveTextContent('1')
  })

  it('permite continuar sem adicionar questões', () => {
    setup()

    expect(
      screen.getByText('Deseja adicionar questões?')
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', {
        name: /Continuar sem questões/i
      })
    )

    expect(
      screen.getByText('EXPORTAÇÃO ABERTA')
    ).toBeInTheDocument()

    expect(
      screen.getByTestId('export-total')
    ).toHaveTextContent('0')
  })
})