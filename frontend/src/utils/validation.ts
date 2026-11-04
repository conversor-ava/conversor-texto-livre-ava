import type { Question } from '../types/question'

const MAX_FILE_SIZE_MB = 25
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export function validateQuestions(
  questions: Question[]
): string | null {
  if (questions.length === 0) {
    return 'Adicione pelo menos uma questão.'
  }

  for (const [index, question] of questions.entries()) {
    const label = `Questão ${index + 1}`

    if (!question.name.trim() || question.name.length > 255) {
      return `${label}: informe um nome com até 255 caracteres.`
    }

    if (!question.text.trim()) {
      return `${label}: informe o enunciado.`
    }

    if ((question.category?.length ?? 0) > 255) {
      return `${label}: a categoria deve ter até 255 caracteres.`
    }

    if (
      question.answers.length < 2 ||
      question.answers.length > 8
    ) {
      return `${label}: escolha entre 2 e 8 alternativas.`
    }

    const correctAnswers = question.answers.filter(
      answer => answer.is_correct
    )

    if (correctAnswers.length !== 1) {
      return `${label}: selecione uma única resposta correta.`
    }

    const unique = new Set<string>()

    for (const answer of question.answers) {
      const text = answer.text
        .trim()
        .toLocaleLowerCase('pt-BR')

      if (!text || !answer.feedback.trim()) {
        return `${label}: preencha o texto e o comentário de cada alternativa.`
      }

      if (unique.has(text)) {
        return `${label}: há alternativas com o mesmo texto. Revise as respostas.`
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
    return 'Escolha um documento nos formatos PDF, DOCX ou TXT.'
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `O arquivo ultrapassa o limite de ${MAX_FILE_SIZE_MB} MB. Escolha um documento menor para continuar.`
  }

  return null
}