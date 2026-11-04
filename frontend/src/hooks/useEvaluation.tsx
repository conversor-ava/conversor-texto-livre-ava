import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type SetStateAction
} from 'react'
import {
  extractDocument,
  exportMoodleXml,
  suggestQuestions
} from '../services/api'
import {
  emptyQuestion,
  type BusyAction,
  type GenerationConfig,
  type Question
} from '../types/question'
import {
  validateDocument,
  validateQuestions
} from '../utils/validation'

const initialConfig: GenerationConfig = {
  mode: 'manual',
  text: '',
  filename: null,
  topic: '',
  quantity: 3,
  difficulty: 'medio',
  alternatives: 4,
  topK: 3
}

type Notice = {
  kind: 'success' | 'error' | 'info'
  text: string
} | null

export type EvaluationQuestion = Question & {
  clientId?: string
}

type EvaluationContextValue = {
  config: GenerationConfig
  updateConfig: (update: Partial<GenerationConfig>) => void
  questions: EvaluationQuestion[]
  setQuestions: (value: SetStateAction<Question[]>) => void
  busy: BusyAction
  notice: Notice
  dismiss: () => void
  notify: (kind: NonNullable<Notice>['kind'], text: string) => void
  loadFile: (file: File) => Promise<void>
  generate: () => Promise<boolean>
  exportXml: () => Promise<boolean>
  reset: () => void
}

const EvaluationContext = createContext<EvaluationContextValue | null>(null)

function prepareQuestions(questions: Question[]): EvaluationQuestion[] {
  return questions.map(question => ({
    ...question,
    clientId:
      (question as EvaluationQuestion).clientId ??
      crypto.randomUUID()
  }))
}

function prepareExport(questions: EvaluationQuestion[]): Question[] {
  return questions.map(question => ({
    name: question.name,
    text: question.text,
    answers: question.answers,
    category: question.category,
    general_feedback: question.general_feedback
  }))
}

export function EvaluationProvider({
  children
}: {
  children: ReactNode
}) {
  const [config, setConfig] = useState<GenerationConfig>(initialConfig)
  const [questions, setQuestionState] = useState<EvaluationQuestion[]>([])
  const [busy, setBusy] = useState<BusyAction>(null)
  const [notice, setNotice] = useState<Notice>(null)

  const busyRef = useRef<BusyAction>(null)
  const revisionRef = useRef(0)

  const updateConfig = useCallback(
    (update: Partial<GenerationConfig>) => {
      setConfig(previous => ({
        ...previous,
        ...update
      }))
    },
    []
  )

  const setQuestions = useCallback(
    (value: SetStateAction<Question[]>) => {
      setQuestionState(previous => {
        const next =
          typeof value === 'function'
            ? value(previous)
            : value

        return prepareQuestions(next)
      })
    },
    []
  )

  const notify = useCallback(
    (kind: NonNullable<Notice>['kind'], text: string) => {
      setNotice({ kind, text })
    },
    []
  )

  const dismiss = useCallback(() => {
    setNotice(null)
  }, [])

  function startOperation(action: Exclude<BusyAction, null>) {
    if (busyRef.current !== null) {
      return false
    }

    busyRef.current = action
    setBusy(action)

    return true
  }

  function finishOperation(revision: number) {
    if (revision !== revisionRef.current) {
      return
    }

    busyRef.current = null
    setBusy(null)
  }

  async function loadFile(file: File): Promise<void> {
    if (busyRef.current !== null) {
      return
    }

    const error = validateDocument(file)

    if (error) {
      notify('error', error)
      return
    }

    if (!startOperation('extract')) {
      return
    }

    const revision = revisionRef.current

    try {
      const result = await extractDocument(file)

      if (revision !== revisionRef.current) {
        return
      }

      updateConfig({
        text: result.text,
        filename: result.filename
      })

      notify(
        'success',
        `${result.filename}: ${result.characters} caracteres extraídos.`
      )
    } catch (cause) {
      if (revision !== revisionRef.current) {
        return
      }

      notify(
        'error',
        cause instanceof Error
          ? cause.message
          : 'Erro na extração do arquivo.'
      )
    } finally {
      finishOperation(revision)
    }
  }

  async function generate(): Promise<boolean> {
    if (busyRef.current !== null) {
      return false
    }

    if (config.mode === 'manual') {
      if (questions.length === 0) {
        setQuestions([
          emptyQuestion(1, config.alternatives)
        ])
      }

      return true
    }

    if (!config.text.trim()) {
      notify(
        'error',
        'Informe um texto-base antes de gerar sugestões.'
      )
      return false
    }

    if (config.mode === 'rag' && !config.topic.trim()) {
      notify(
        'error',
        'Informe o tema para a busca semântica.'
      )
      return false
    }

    if (!startOperation('generate')) {
      return false
    }

    const revision = revisionRef.current

    try {
      const result = await suggestQuestions(config.mode, {
        texto: config.text,
        tema: config.topic,
        quantidade: config.quantity,
        dificuldade: config.difficulty,
        alternativas: config.alternatives,
        top_k: config.topK
      })

      if (revision !== revisionRef.current) {
        return false
      }

      if (!result.questions.length) {
        notify(
          'error',
          'A IA não retornou questões. Tente novamente.'
        )
        return false
      }

      setQuestions(
        result.questions.map(question => ({
          ...question,
          category: question.category ?? null,
          general_feedback: question.general_feedback ?? ''
        }))
      )

      notify(
        'success',
        `${result.questions.length} questões sugeridas. Revise todas antes de exportar.`
      )

      return true
    } catch (cause) {
      if (revision !== revisionRef.current) {
        return false
      }

      notify(
        'error',
        cause instanceof Error
          ? cause.message
          : 'Erro ao gerar sugestões.'
      )

      return false
    } finally {
      finishOperation(revision)
    }
  }

  async function exportXml(): Promise<boolean> {
    if (busyRef.current !== null) {
      return false
    }

    const error = validateQuestions(questions)

    if (error) {
      notify('error', error)
      return false
    }

    if (!startOperation('export')) {
      return false
    }

    const revision = revisionRef.current

    try {
      await exportMoodleXml({
        questions: prepareExport(questions)
      })

      if (revision !== revisionRef.current) {
        return false
      }

      notify(
        'success',
        'Arquivo Moodle XML baixado com sucesso.'
      )

      return true
    } catch (cause) {
      if (revision !== revisionRef.current) {
        return false
      }

      notify(
        'error',
        cause instanceof Error
          ? cause.message
          : 'Erro ao exportar o XML.'
      )

      return false
    } finally {
      finishOperation(revision)
    }
  }

  function reset() {
    revisionRef.current += 1
    busyRef.current = null

    setConfig(initialConfig)
    setQuestionState([])
    setBusy(null)
    setNotice(null)
  }

  const value: EvaluationContextValue = {
    config,
    updateConfig,
    questions,
    setQuestions,
    busy,
    notice,
    dismiss,
    notify,
    loadFile,
    generate,
    exportXml,
    reset
  }

  return (
    <EvaluationContext.Provider value={value}>
      {children}
    </EvaluationContext.Provider>
  )
}

export function useEvaluation(): EvaluationContextValue {
  const context = useContext(EvaluationContext)

  if (!context) {
    throw new Error(
      'useEvaluation deve ser utilizado dentro de EvaluationProvider.'
    )
  }

  return context
}