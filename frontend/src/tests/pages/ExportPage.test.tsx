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

import { EvaluationProvider, useEvaluation } from '../../hooks/useEvaluation'
import { ExportPage } from '../../pages/ExportPage'
import { exportMoodleXml, suggestQuestions } from '../../services/api'
import { emptyQuestion } from '../../types/question'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(),
  suggestQuestions: vi.fn(),
  exportMoodleXml: vi.fn(),
  health: vi.fn()
}))

function Seed() {
  const { setQuestions } = useEvaluation()

  function seed() {
    const question = emptyQuestion(1, 2)

    question.text = 'Qual é a correta?'

    question.answers = [
      {
        text: 'Sim',
        feedback: 'Correta',
        is_correct: true
      },
      {
        text: 'Não',
        feedback: 'Incorreta',
        is_correct: false
      }
    ]

    setQuestions([question])
  }

  return (
    <>
      <button type="button" onClick={seed}>
        Questão válida
      </button>

      <ExportPage />
    </>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

function setup() {
  return render(
    <MemoryRouter initialEntries={['/exportacao']}>
      <EvaluationProvider>
        <Routes>
          <Route
            path="/exportacao"
            element={<Seed />}
          />

          <Route
            path="/revisao"
            element={<div>REVISÃO ABERTA</div>}
          />
        </Routes>
      </EvaluationProvider>
    </MemoryRouter>
  )
}

describe('página de exportação', () => {
  it('bloqueia o download quando não existem questões', () => {
    setup()

    const downloadButton = screen.getByRole('button', {
      name: /Baixar arquivo para o Moodle/i
    })

    expect(downloadButton).toBeDisabled()

    expect(exportMoodleXml).not.toHaveBeenCalled()
  })

  it('orienta o professor quando o material não possui questões', () => {
    setup()

    expect(
      screen.getByText('Seu material está preparado')
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        /A opção de baixar apenas o texto estará disponível/i
      )
    ).toBeInTheDocument()

    expect(
      screen.getByRole('button', {
        name: /Baixar arquivo para o Moodle/i
      })
    ).toBeDisabled()
  })

  it('envia questões válidas ao conversor sem solicitar IA', async () => {
    vi.mocked(exportMoodleXml).mockResolvedValue()

    setup()

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Questão válida'
      })
    )

    const downloadButton = screen.getByRole('button', {
      name: /Baixar arquivo para o Moodle/i
    })

    expect(downloadButton).toBeEnabled()

    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(exportMoodleXml).toHaveBeenCalledTimes(1)
    })

    expect(exportMoodleXml).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({
            text: 'Qual é a correta?'
          })
        ])
      })
    )

    expect(suggestQuestions).not.toHaveBeenCalled()
  })

  it('permite voltar para a revisão do material', () => {
    setup()

    fireEvent.click(
      screen.getByRole('link', {
        name: /Voltar para revisão/i
      })
    )

    expect(
      screen.getByText('REVISÃO ABERTA')
    ).toBeInTheDocument()
  })

  it('não apresenta o botão duplicado de nova avaliação', () => {
    setup()

    expect(
      screen.queryByRole('button', {
        name: /Nova avaliação/i
      })
    ).not.toBeInTheDocument()
  })
})