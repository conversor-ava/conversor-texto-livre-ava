import type { Question } from '../types/question'

export function validateQuestions(
  questions: Question[]
): string | null {
  if (questions.length === 0) {
    return 'Adicione pelo menos uma questão.'
  }

  for (const [index, question] of questions.entries()) {
    const label = `Questão ${index + 1}`

    if (!question.name.trim() || question.name.length > 255) {
      return `${label}: nome obrigatório (até 255 caracteres).`
    }

    if (!question.text.trim()) {
      return `${label}: informe o enunciado.`
    }

    if ((question.category?.length ?? 0) > 255) {
      return `${label}: categoria deve ter até 255 caracteres.`
    }

    if (
      question.answers.length < 2 ||
      question.answers.length > 8
    ) {
      return `${label}: use de 2 a 8 alternativas.`
    }

    const correctAnswers = question.answers.filter(
      answer => answer.is_correct
    )

    if (correctAnswers.length !== 1) {
      return `${label}: marque exatamente uma resposta correta.`
    }

    const unique = new Set<string>()

    for (const answer of question.answers) {
      const text = answer.text
        .trim()
        .toLocaleLowerCase('pt-BR')

      if (!text || !answer.feedback.trim()) {
        return `${label}: texto e feedback são obrigatórios em todas as alternativas.`
      }

      if (unique.has(text)) {
        return `${label}: existem alternativas duplicadas.`
      }

      unique.add(text)
    }
  }

  return null
}

export function validateDocument(
  file: File
): string | null {
  const extension = file.name
    .split('.')
    .pop()
    ?.toLowerCase()

  if (
    !extension ||
    !['pdf', 'docx', 'txt'].includes(extension)
  ) {
    return 'Utilize um arquivo PDF, DOCX ou TXT.'
  }

  if (file.size > 5 * 1024 * 1024) {
    return 'O tamanho máximo do arquivo é 5 MB.'
  }

  return null
}