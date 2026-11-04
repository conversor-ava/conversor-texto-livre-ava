import { describe, expect, it } from 'vitest'
import { emptyQuestion } from '../types/question'
import {
  validateDocument,
  validateQuestions
} from '../utils/validation'

const MAX_FILE_SIZE = 25 * 1024 * 1024

function createValidQuestion() {
  const question = emptyQuestion(1, 2)

  question.text = 'Qual alternativa está correta?'

  question.answers = [
    {
      text: 'Certa',
      feedback: 'Esta é correta.',
      is_correct: true
    },
    {
      text: 'Errada',
      feedback: 'Esta é incorreta.',
      is_correct: false
    }
  ]

  return question
}

describe('validação de questões', () => {
  it('não permite exportar um conjunto vazio', () => {
    expect(
      validateQuestions([])
    ).toMatch(/pelo menos uma/i)
  })

  it('aceita uma questão completa', () => {
    const question = createValidQuestion()

    expect(
      validateQuestions([question])
    ).toBeNull()
  })

  it('exige feedback em todas as alternativas', () => {
    const question = createValidQuestion()

    question.answers[0].feedback = ''

    expect(
      validateQuestions([question])
    ).toMatch(/comentário/i)
  })

  it('bloqueia alternativas duplicadas', () => {
    const question = createValidQuestion()

    question.answers = [
      {
        text: 'Igual',
        feedback: 'Correta',
        is_correct: true
      },
      {
        text: 'igual',
        feedback: 'Incorreta',
        is_correct: false
      }
    ]

    expect(
      validateQuestions([question])
    ).toMatch(/mesmo texto/i)
  })

  it('exige exatamente uma resposta correta', () => {
    const question = createValidQuestion()

    question.answers = [
      {
        text: 'A',
        feedback: 'Correta',
        is_correct: true
      },
      {
        text: 'B',
        feedback: 'Incorreta',
        is_correct: true
      }
    ]

    expect(
      validateQuestions([question])
    ).toMatch(/uma única resposta correta/i)
  })
})

describe('validação de upload', () => {
  it('aceita arquivos TXT', () => {
    const file = new File(
      ['abc'],
      'material.txt',
      { type: 'text/plain' }
    )

    expect(
      validateDocument(file)
    ).toBeNull()
  })

  it('bloqueia extensões incompatíveis', () => {
    const file = new File(
      ['abc'],
      'material.exe'
    )

    expect(
      validateDocument(file)
    ).toMatch(/PDF/i)
  })

  it('aceita arquivos menores que 25 MB', () => {
    const file = new File(
      [new Uint8Array(1024)],
      'material.pdf',
      { type: 'application/pdf' }
    )

    expect(
      validateDocument(file)
    ).toBeNull()
  })

  it('aceita arquivos com exatamente 25 MB', () => {
    const file = new File(
      [new Uint8Array(MAX_FILE_SIZE)],
      'material.pdf',
      { type: 'application/pdf' }
    )

    expect(
      validateDocument(file)
    ).toBeNull()
  })

  it('bloqueia arquivos maiores que 25 MB', () => {
    const file = new File(
      [new Uint8Array(MAX_FILE_SIZE + 1)],
      'grande.pdf',
      { type: 'application/pdf' }
    )

    expect(
      validateDocument(file)
    ).toMatch(/25 MB/i)
  })
})