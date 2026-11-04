export type Difficulty = 'facil' | 'medio' | 'dificil'

export type GenerationMode = 'manual' | 'simple' | 'rag'

export type BusyAction = 'extract' | 'generate' | 'export' | null

export interface Answer {
  text: string
  is_correct: boolean
  feedback: string
}

export interface Question {
  name: string
  text: string
  answers: Answer[]
  general_feedback?: string | null
  category?: string | null
}

export interface QuestionSet {
  questions: Question[]
}

export interface SuggestionParams {
  texto: string
  tema: string
  quantidade: number
  dificuldade: Difficulty
  alternativas: number
  top_k: number
}

export interface ExtractedDocument {
  filename: string
  text: string
  characters: number
}

export interface GenerationConfig {
  mode: GenerationMode
  text: string
  filename: string | null
  topic: string
  quantity: number
  difficulty: Difficulty
  alternatives: number
  topK: number
}

export function emptyQuestion(
  number: number,
  alternatives = 4
): Question {
  const totalAlternatives = Number.isFinite(alternatives)
    ? Math.min(8, Math.max(2, Math.trunc(alternatives)))
    : 4

  return {
    name: `Questão ${number}`,
    text: '',
    category: null,
    general_feedback: '',
    answers: Array.from(
      { length: totalAlternatives },
      (_, index) => ({
        text: '',
        is_correct: index === 0,
        feedback: ''
      })
    )
  }
}