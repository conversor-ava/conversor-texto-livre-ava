import {
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import {
  MemoryRouter,
  Route,
  Routes
} from 'react-router-dom'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import { Toast } from '../../components/ui/Toast'
import {
  EvaluationProvider,
  useEvaluation
} from '../../hooks/useEvaluation'
import { GeneratePage } from '../../pages/GeneratePage'
import { suggestQuestions } from '../../services/api'
import { emptyQuestion } from '../../types/question'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(),
  suggestQuestions: vi.fn(),
  exportMoodleXml: vi.fn(),
  health: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function TestNotice() {
  const { notice, dismiss } = useEvaluation()

  if (!notice) {
    return null
  }

  return (
    <Toast
      notice={notice}
      onClose={dismiss}
    />
  )
}

function ReviewFixture() {
  const { questions } = useEvaluation()

  return (
    <div>
      <h1>REVISÃO ABERTA</h1>
      <span data-testid="total-questions">
        {questions.length}
      </span>
    </div>
  )
}

function setup() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <EvaluationProvider>
        <Routes>
          <Route
            path="/"
            element={<GeneratePage />}
          />

          <Route
            path="/revisao"
            element={<ReviewFixture />}
          />
        </Routes>

        <TestNotice />
      </EvaluationProvider>
    </MemoryRouter>
  )
}

function selectSimpleMode() {
  fireEvent.click(
    screen.getByRole('button', {
      name: /Receber sugestões/i
    })
  )
}

function selectRagMode() {
  fireEvent.click(
    screen.getByRole('button', {
      name: /Sugestões direcionadas/i
    })
  )
}

function continuePreparation() {
  fireEvent.click(
    screen.getByRole('button', {
      name: /Gerar sugestões|Continuar/i
    })
  )
}

describe('página de preparação do material', () => {
  it('segue para revisão sem chamar IA no modo manual', async () => {
    setup()

    // O modo manual já é selecionado por padrão.
    continuePreparation()

    expect(
      await screen.findByText('REVISÃO ABERTA')
    ).toBeInTheDocument()

    expect(suggestQuestions).not.toHaveBeenCalled()
  })

  it('não cria questões automaticamente no modo manual', async () => {
    setup()

    continuePreparation()

    expect(
      await screen.findByText('REVISÃO ABERTA')
    ).toBeInTheDocument()

    expect(
      screen.getByTestId('total-questions')
    ).toHaveTextContent('0')

    expect(suggestQuestions).not.toHaveBeenCalled()
  })

  it('não tenta gerar sugestões sem conteúdo', async () => {
    setup()

    selectSimpleMode()

    continuePreparation()

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent(
      'Adicione um texto ou documento para receber sugestões de questões.'
    )

    expect(suggestQuestions).not.toHaveBeenCalled()

    expect(
      screen.queryByText('REVISÃO ABERTA')
    ).not.toBeInTheDocument()
  })

  it('envia parâmetros para IA simples e navega após sucesso', async () => {
    const question = emptyQuestion(1, 4)

    question.text = 'Qual é a função da fotossíntese?'

    vi.mocked(suggestQuestions).mockResolvedValue({
      questions: [question]
    })

    setup()

    fireEvent.change(
      screen.getByLabelText('Conteúdo do material'),
      {
        target: {
          value: 'A fotossíntese permite a produção de glicose.'
        }
      }
    )

    selectSimpleMode()

    continuePreparation()

    await waitFor(() => {
      expect(suggestQuestions).toHaveBeenCalledWith(
        'simple',
        expect.objectContaining({
          texto: 'A fotossíntese permite a produção de glicose.'
        })
      )
    })

    expect(
      await screen.findByText('REVISÃO ABERTA')
    ).toBeInTheDocument()

    expect(
      screen.getByTestId('total-questions')
    ).toHaveTextContent('1')
  })

  it('não avança quando a IA retorna uma lista vazia', async () => {
    vi.mocked(suggestQuestions).mockResolvedValue({
      questions: []
    })

    setup()

    fireEvent.change(
      screen.getByLabelText('Conteúdo do material'),
      {
        target: {
          value: 'Conteúdo de exemplo'
        }
      }
    )

    selectSimpleMode()

    continuePreparation()

    await waitFor(() => {
      expect(suggestQuestions).toHaveBeenCalledTimes(1)
    })

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent(
      'Não encontramos sugestões de questões desta vez.'
    )

    expect(
      screen.queryByText('REVISÃO ABERTA')
    ).not.toBeInTheDocument()
  })

  it('exige assunto para sugestões direcionadas', async () => {
    setup()

    fireEvent.change(
      screen.getByLabelText('Conteúdo do material'),
      {
        target: {
          value: 'Conteúdo'
        }
      }
    )

    selectRagMode()

    continuePreparation()

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent(
      'Informe o assunto que deseja explorar no seu material.'
    )

    expect(suggestQuestions).not.toHaveBeenCalled()

    expect(
      screen.queryByText('REVISÃO ABERTA')
    ).not.toBeInTheDocument()
  })
})