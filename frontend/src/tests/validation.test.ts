import { describe, expect, it } from 'vitest'
import { emptyQuestion } from '../types/question'
import { validateDocument, validateQuestions } from '../utils/validation'

describe('validação de questões', () => {
  it('não permite conjunto vazio', () => { expect(validateQuestions([])).toMatch(/pelo menos uma/) })
  it('aceita questão completa', () => {
    const question = emptyQuestion(1, 2)
    question.text = 'Qual alternativa está correta?'
    question.answers = [
      { text: 'Certa', feedback: 'Esta é correta.', is_correct: true },
      { text: 'Errada', feedback: 'Esta é incorreta.', is_correct: false },
    ]
    expect(validateQuestions([question])).toBeNull()
  })
  it('exige feedback em todas as alternativas', () => {
    const question = emptyQuestion(1, 2)
    question.text = 'Enunciado'
    question.answers[0].text = 'A'
    question.answers[1].text = 'B'
    expect(validateQuestions([question])).toContain('feedback')
  })
  it('bloqueia alternativas duplicadas', () => {
    const question = emptyQuestion(1, 2)
    question.text = 'Enunciado'
    question.answers = [
      { text: 'Igual', feedback: 'Correta', is_correct: true },
      { text: 'igual', feedback: 'Incorreta', is_correct: false },
    ]
    expect(validateQuestions([question])).toContain('duplicadas')
  })
  it('exige exatamente uma resposta correta', () => {
    const question = emptyQuestion(1, 2)
    question.text = 'Enunciado'
    question.answers = [
      { text: 'A', feedback: 'A', is_correct: true },
      { text: 'B', feedback: 'B', is_correct: true },
    ]
    expect(validateQuestions([question])).toContain('exatamente uma')
  })
})

describe('validação de upload', () => {
  it('aceita arquivo txt', () => expect(validateDocument(new File(['abc'], 'material.txt'))).toBeNull())
  it('bloqueia extensão inválida', () => expect(validateDocument(new File(['abc'], 'material.exe'))).toContain('PDF'))
  it('bloqueia arquivo acima de 5 MB', () => expect(validateDocument(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grande.pdf'))).toContain('5 MB'))
})
