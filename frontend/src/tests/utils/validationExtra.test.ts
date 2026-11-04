import { describe, expect, it } from 'vitest'
import { emptyQuestion } from '../../types/question'
import {
  validateDocument,
  validateQuestions
} from '../../utils/validation'

function validQuestion() {
  const question = emptyQuestion(1, 2)

  question.text = 'Questão de exemplo?'

  question.answers = [
    {
      text: 'Sim',
      is_correct: true,
      feedback: 'Correta.'
    },
    {
      text: 'Não',
      is_correct: false,
      feedback: 'Incorreta.'
    }
  ]

  return question
}

describe('limites estruturais de questões', () => {
  it('exige nome preenchido', () => {
    const question = validQuestion()

    question.name = ' '

    expect(
      validateQuestions([question])
    ).toContain('informe um nome')
  })

  it('limita o nome da questão a 255 caracteres', () => {
    const question = validQuestion()

    question.name = 'X'.repeat(255)

    expect(
      validateQuestions([question])
    ).toBeNull()

    question.name = 'X'.repeat(256)

    expect(
      validateQuestions([question])
    ).toContain('255 caracteres')
  })

  it('exige enunciado não vazio', () => {
    const question = validQuestion()

    question.text = ' '

    expect(
      validateQuestions([question])
    ).toMatch(/enunciado/i)
  })

  it('exige pelo menos duas alternativas', () => {
    const question = validQuestion()

    question.answers = question.answers.slice(0, 1)

    expect(
      validateQuestions([question])
    ).toContain('entre 2 e 8 alternativas')
  })

  it('permite no máximo oito alternativas', () => {
    const question = validQuestion()

    question.answers = Array.from(
      { length: 9 },
      (_, index) => ({
        text: `Alternativa ${index + 1}`,
        is_correct: index === 0,
        feedback: 'Comentário'
      })
    )

    expect(
      validateQuestions([question])
    ).toContain('entre 2 e 8 alternativas')
  })

  it('aceita exatamente oito alternativas', () => {
    const question = validQuestion()

    question.answers = Array.from(
      { length: 8 },
      (_, index) => ({
        text: `Alternativa ${index + 1}`,
        is_correct: index === 0,
        feedback: 'Comentário'
      })
    )

    expect(
      validateQuestions([question])
    ).toBeNull()
  })

  it('limita o tamanho da categoria', () => {
    const question = validQuestion()

    question.category = 'X'.repeat(256)

    expect(
      validateQuestions([question])
    ).toMatch(/categoria/i)
  })
})

describe('formatos de arquivo aceitos', () => {
  it('aceita arquivos PDF e DOCX', () => {
    const pdf = new File(
      ['a'],
      'capitulo.pdf',
      { type: 'application/pdf' }
    )

    const docx = new File(
      ['a'],
      'capitulo.docx',
      {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    )

    expect(
      validateDocument(pdf)
    ).toBeNull()

    expect(
      validateDocument(docx)
    ).toBeNull()
  })

  it('aceita extensões em maiúsculas', () => {
    const file = new File(
      ['a'],
      'CAPITULO.PDF',
      { type: 'application/pdf' }
    )

    expect(
      validateDocument(file)
    ).toBeNull()
  })
})