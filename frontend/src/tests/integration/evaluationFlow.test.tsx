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

import { EvaluationProvider } from '../../hooks/useEvaluation'
import { ExportPage } from '../../pages/ExportPage'
import { GeneratePage } from '../../pages/GeneratePage'
import { ReviewPage } from '../../pages/ReviewPage'
import {
  exportMoodleXml,
  suggestQuestions
} from '../../services/api'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(),
  suggestQuestions: vi.fn(),
  exportMoodleXml: vi.fn(),
  health: vi.fn()
}))

beforeEach(() => {
  vi.clearAllMocks()
})

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
            element={<ReviewPage />}
          />

          <Route
            path="/exportacao"
            element={<ExportPage />}
          />
        </Routes>
      </EvaluationProvider>
    </MemoryRouter>
  )
}

describe('integração do fluxo do conversor', () => {
  it('permite criar, revisar e exportar questões sem utilizar IA', async () => {
    vi.mocked(exportMoodleXml).mockResolvedValue()

    setup()

    // O modo manual é selecionado por padrão.
    // Continuar não deve solicitar sugestões à IA.
    fireEvent.click(
      screen.getByRole('button', {
        name: /Continuar/i
      })
    )

    expect(
      await screen.findByText('Questões do material')
    ).toBeInTheDocument()

    // Nenhuma questão deve ser criada automaticamente.
    expect(
      screen.getByText('Deseja adicionar questões?')
    ).toBeInTheDocument()

    expect(suggestQuestions).not.toHaveBeenCalled()

    // O professor decide adicionar uma questão.
    fireEvent.click(
      screen.getAllByRole('button', {
        name: /Adicionar questão/i
      })[0]
    )

    expect(
      screen.getByLabelText('Enunciado *')
    ).toBeInTheDocument()

    fireEvent.change(
      screen.getByLabelText('Enunciado *'),
      {
        target: {
          value: 'Qual número é par?'
        }
      }
    )

    const answers = ['2', '3', '5', '7']

    for (const [index, value] of answers.entries()) {
      fireEvent.change(
        screen.getByLabelText(
          `Alternativa ${index + 1} da questão 1`
        ),
        {
          target: {
            value
          }
        }
      )

      fireEvent.change(
        screen.getByLabelText(
          `Feedback da alternativa ${index + 1} da questão 1`
        ),
        {
          target: {
            value: `Justificativa ${index + 1}`
          }
        }
      )
    }

    fireEvent.click(
      screen.getByRole('button', {
        name: /Conferir e continuar/i
      })
    )

    const downloadButton = await screen.findByRole(
      'button',
      {
        name: /Baixar arquivo para o Moodle/i
      }
    )

    expect(downloadButton).toBeEnabled()

    fireEvent.click(downloadButton)

    await waitFor(() => {
      expect(exportMoodleXml).toHaveBeenCalledTimes(1)
    })

    expect(exportMoodleXml).toHaveBeenCalledWith(
      expect.objectContaining({
        questions: expect.arrayContaining([
          expect.objectContaining({
            text: 'Qual número é par?'
          })
        ])
      })
    )

    expect(suggestQuestions).not.toHaveBeenCalled()
  })

  it('permite continuar sem questões, mas mantém a exportação indisponível', async () => {
    setup()

    // Avança na preparação sem gerar questões.
    fireEvent.click(
      screen.getByRole('button', {
        name: /Continuar/i
      })
    )

    expect(
      await screen.findByText('Deseja adicionar questões?')
    ).toBeInTheDocument()

    // Avança sem adicionar questões.
    fireEvent.click(
      screen.getByRole('button', {
        name: /Continuar sem questões/i
      })
    )

    expect(
      await screen.findByText('Seu material está preparado')
    ).toBeInTheDocument()

    const downloadButton = screen.getByRole(
      'button',
      {
        name: /Baixar arquivo para o Moodle/i
      }
    )

    expect(downloadButton).toBeDisabled()

    expect(exportMoodleXml).not.toHaveBeenCalled()
    expect(suggestQuestions).not.toHaveBeenCalled()
  })
})