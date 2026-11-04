import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Toast } from '../../components/ui/Toast'
import { EvaluationProvider, useEvaluation } from '../../hooks/useEvaluation'
import { GeneratePage } from '../../pages/GeneratePage'
import { suggestQuestions } from '../../services/api'
import { emptyQuestion } from '../../types/question'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(),
  suggestQuestions: vi.fn(),
  exportMoodleXml: vi.fn(),
  health: vi.fn()
}))

beforeEach(() => vi.clearAllMocks())

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

function setup() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <EvaluationProvider>
        <Routes>
          <Route path="/" element={<GeneratePage />} />
          <Route
            path="/revisao"
            element={<div>REVISÃO ABERTA</div>}
          />
        </Routes>

        <TestNotice />
      </EvaluationProvider>
    </MemoryRouter>
  )
}

describe('página de geração', () => {
  it('segue para revisão sem chamar IA no modo manual', async () => {
    setup()

    fireEvent.click(
      screen.getByRole('button', {
        name: /Criar manualmente/i
      })
    )

    expect(
      await screen.findByText('REVISÃO ABERTA')
    ).toBeInTheDocument()

    expect(suggestQuestions).not.toHaveBeenCalled()
  })

  it('não tenta gerar sugestões sem texto-base', async () => {
    setup()

    fireEvent.click(
      screen.getByRole('button', {
        name: /IA simples/i
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /Gerar sugestões/i
      })
    )

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent(
      'Informe um texto-base antes de gerar sugestões.'
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
      screen.getByLabelText('Texto-base'),
      {
        target: {
          value: 'A fotossíntese permite a produção de glicose.'
        }
      }
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /IA simples/i
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /Gerar sugestões/i
      })
    )

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
  })

  it('não avança quando a IA retorna uma lista vazia', async () => {
    vi.mocked(suggestQuestions).mockResolvedValue({
      questions: []
    })

    setup()

    fireEvent.change(
      screen.getByLabelText('Texto-base'),
      {
        target: {
          value: 'Conteúdo de exemplo'
        }
      }
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /IA simples/i
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /Gerar sugestões/i
      })
    )

    await waitFor(() => {
      expect(suggestQuestions).toHaveBeenCalledTimes(1)
    })

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent(
      'A IA não retornou questões. Tente novamente.'
    )

    expect(
      screen.queryByText('REVISÃO ABERTA')
    ).not.toBeInTheDocument()
  })

  it('exige tema para IA com RAG', async () => {
    setup()

    fireEvent.change(
      screen.getByLabelText('Texto-base'),
      {
        target: {
          value: 'Conteúdo'
        }
      }
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /IA \+ RAG/i
      })
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: /Gerar sugestões/i
      })
    )

    expect(
      await screen.findByRole('alert')
    ).toHaveTextContent(
      'Informe o tema para a busca semântica.'
    )

    expect(suggestQuestions).not.toHaveBeenCalled()

    expect(
      screen.queryByText('REVISÃO ABERTA')
    ).not.toBeInTheDocument()
  })
})