import {
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react'
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import { DocumentInput } from '../../components/forms/DocumentInput'
import { EvaluationProvider } from '../../hooks/useEvaluation'
import { extractDocument } from '../../services/api'

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
    <EvaluationProvider>
      <DocumentInput />
    </EvaluationProvider>
  )
}

describe('entrada de documentos e texto', () => {
  it('permite colar conteúdo sem acessar a API', () => {
    setup()

    const textInput = screen.getByLabelText('Conteúdo do material')

    fireEvent.change(textInput, {
      target: {
        value: 'Fotossíntese'
      }
    })

    expect(textInput).toHaveValue('Fotossíntese')
    expect(extractDocument).not.toHaveBeenCalled()
  })

  it('extrai texto de um TXT via API e apresenta o nome do arquivo', async () => {
    vi.mocked(extractDocument).mockResolvedValue({
      filename: 'aula.txt',
      text: 'Biologia',
      characters: 8
    })

    setup()

    const file = new File(
      ['Biologia'],
      'aula.txt',
      { type: 'text/plain' }
    )

    fireEvent.change(
      screen.getByLabelText('Selecionar arquivo'),
      {
        target: {
          files: [file]
        }
      }
    )

    await waitFor(() => {
      expect(
        screen.getByLabelText('Conteúdo do material')
      ).toHaveValue('Biologia')
    })

    expect(extractDocument).toHaveBeenCalledTimes(1)

    expect(
      screen.getByText('aula.txt')
    ).toBeInTheDocument()
  })

  it('rejeita arquivos incompatíveis sem acessar a API', () => {
    setup()

    const file = new File(
      ['x'],
      'virus.exe'
    )

    fireEvent.change(
      screen.getByLabelText('Selecionar arquivo'),
      {
        target: {
          files: [file]
        }
      }
    )

    expect(extractDocument).not.toHaveBeenCalled()

    expect(
      screen.getByLabelText('Conteúdo do material')
    ).toHaveValue('')
  })

  it('permite remover um documento extraído', async () => {
    vi.mocked(extractDocument).mockResolvedValue({
      filename: 'aula.txt',
      text: 'Biologia',
      characters: 8
    })

    setup()

    const file = new File(
      ['Biologia'],
      'aula.txt',
      { type: 'text/plain' }
    )

    fireEvent.change(
      screen.getByLabelText('Selecionar arquivo'),
      {
        target: {
          files: [file]
        }
      }
    )

    await waitFor(() => {
      expect(
        screen.getByText('aula.txt')
      ).toBeInTheDocument()
    })

    expect(
      screen.getByLabelText('Conteúdo do material')
    ).toHaveValue('Biologia')

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Remover documento'
      })
    )

    expect(
      screen.getByLabelText('Conteúdo do material')
    ).toHaveValue('')

    expect(
      screen.queryByText('aula.txt')
    ).not.toBeInTheDocument()
  })
})