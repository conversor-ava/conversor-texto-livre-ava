import { describe, expect, it } from 'vitest'
import { emptyQuestion } from '../../types/question'
import { validateDocument, validateQuestions } from '../../utils/validation'

function validQuestion() {
  const question = emptyQuestion(1, 2)
  question.text = 'Questão de exemplo?'
  question.answers = [
    { text: 'Sim', is_correct: true, feedback: 'Correta.' },
    { text: 'Não', is_correct: false, feedback: 'Incorreta.' },
  ]
  return question
}

describe('limites estruturais de questões', () => {
  it('exige nome válido e com até 255 caracteres', () => {
    const question = validQuestion()
    question.name = ' '
    expect(validateQuestions([question])).toContain('nome obrigatório')
    question.name = 'X'.repeat(256)
    expect(validateQuestions([question])).toContain('255')
  })

  it('exige enunciado não vazio', () => {
    const question = validQuestion()
    question.text = ' '
    expect(validateQuestions([question])).toContain('enunciado')
  })

  it('limita alternativas entre duas e oito', () => {
    const question = validQuestion()
    question.answers = question.answers.slice(0, 1)
    expect(validateQuestions([question])).toContain('2 a 8')
    question.answers = Array.from({ length: 9 }, (_, index) => ({
      text: `Alternativa ${index}`, is_correct: index === 0, feedback: 'Comentário',
    }))
    expect(validateQuestions([question])).toContain('2 a 8')
  })

  it('limita o tamanho de categoria', () => {
    const question = validQuestion()
    question.category = 'X'.repeat(256)
    expect(validateQuestions([question])).toContain('categoria')
  })
})

describe('formatos de arquivo aceitos', () => {
  it('aceita PDF e DOCX', () => {
    expect(validateDocument(new File(['a'], 'capitulo.pdf'))).toBeNull()
    expect(validateDocument(new File(['a'], 'capitulo.docx'))).toBeNull()
  })

  it('não exige extensão em caixa baixa', () => {
    expect(validateDocument(new File(['a'], 'CAPITULO.PDF'))).toBeNull()
  })
})
