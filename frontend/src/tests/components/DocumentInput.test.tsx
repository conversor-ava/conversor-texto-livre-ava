import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DocumentInput } from '../../components/forms/DocumentInput'
import { EvaluationProvider } from '../../hooks/useEvaluation'
import { extractDocument } from '../../services/api'

vi.mock('../../services/api', () => ({
  extractDocument: vi.fn(), suggestQuestions: vi.fn(), exportMoodleXml: vi.fn(), health: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

function setup() {
  return render(<EvaluationProvider><DocumentInput /></EvaluationProvider>)
}

describe('entrada de documentos e texto', () => {
  it('permite colar texto-base sem acessar a API', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Texto-base'), { target: { value: 'Fotossíntese' } })
    expect(screen.getByLabelText('Texto-base')).toHaveValue('Fotossíntese')
    expect(extractDocument).not.toHaveBeenCalled()
  })

  it('extrai texto de um TXT via API e apresenta o nome do arquivo', async () => {
    vi.mocked(extractDocument).mockResolvedValue({ filename: 'aula.txt', text: 'Biologia', characters: 8 })
    setup()
    fireEvent.change(screen.getByLabelText('Selecionar arquivo'), {
      target: { files: [new File(['Biologia'], 'aula.txt', { type: 'text/plain' })] },
    })
    await waitFor(() => expect(screen.getByLabelText('Texto-base')).toHaveValue('Biologia'))
    expect(extractDocument).toHaveBeenCalledTimes(1)
    expect(screen.getByText('aula.txt')).toBeInTheDocument()
  })

  it('rejeita arquivos incompatíveis sem requisitar a API', async () => {
    setup()
    fireEvent.change(screen.getByLabelText('Selecionar arquivo'), {
      target: { files: [new File(['x'], 'virus.exe')] },
    })
    await waitFor(() => expect(extractDocument).not.toHaveBeenCalled())
    expect(screen.getByLabelText('Texto-base')).toHaveValue('')
  })

  it('permite limpar documento extraído', async () => {
    vi.mocked(extractDocument).mockResolvedValue({ filename: 'aula.txt', text: 'Biologia', characters: 8 })
    setup()
    fireEvent.change(screen.getByLabelText('Selecionar arquivo'), {
      target: { files: [new File(['Biologia'], 'aula.txt')] },
    })
    await waitFor(() => expect(screen.getByText('aula.txt')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Limpar arquivo' }))
    expect(screen.getByLabelText('Texto-base')).toHaveValue('')
    expect(screen.queryByText('aula.txt')).not.toBeInTheDocument()
  })
})
