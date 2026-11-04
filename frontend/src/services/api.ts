import type {
  ExtractedDocument,
  GenerationMode,
  QuestionSet,
  SuggestionParams
} from '../types/question'

const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const TIMEOUT = {
  health: 10000,
  extract: 60000,
  generate: 180000,
  export: 60000
}

async function apiError(response: Response): Promise<never> {
  let detail: unknown

  try {
    const body: unknown = await response.json()

    if (body && typeof body === 'object' && 'detail' in body) {
      detail = body.detail
    }
  } catch {
    detail = undefined
  }

  if (typeof detail === 'string') {
    throw new Error(detail)
  }

  if (Array.isArray(detail)) {
    const messages = detail.map(entry => {
      if (
        entry &&
        typeof entry === 'object' &&
        'msg' in entry &&
        typeof entry.msg === 'string'
      ) {
        return entry.msg
      }

      return 'Algumas informações precisam ser corrigidas.'
    })

    throw new Error(messages.join('; '))
  }

  if (response.status === 413) {
    throw new Error(
      'O documento é maior do que o tamanho permitido pelo serviço.'
    )
  }

  if (response.status === 429) {
    throw new Error(
      'Muitas solicitações foram realizadas. Aguarde um momento e tente novamente.'
    )
  }

  if (response.status >= 500) {
    throw new Error(
      'Não conseguimos concluir sua solicitação neste momento. Tente novamente em instantes.'
    )
  }

  throw new Error(
    'Não foi possível concluir a operação. Confira as informações e tente novamente.'
  )
}

async function request(
  url: string,
  init: RequestInit = {},
  timeout = 30000
): Promise<Response> {
  const controller = new AbortController()

  const timer = window.setTimeout(() => {
    controller.abort()
  }, timeout)

  try {
    const response = await fetch(`${base}${url}`, {
      ...init,
      signal: controller.signal
    })

    if (!response.ok) {
      await apiError(response)
    }

    return response
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        'A solicitação está demorando mais que o esperado. Tente novamente em alguns instantes.'
      )
    }

    if (error instanceof TypeError) {
      throw new Error(
        'Não conseguimos acessar o serviço neste momento. Verifique sua conexão e tente novamente.'
      )
    }

    throw error
  } finally {
    window.clearTimeout(timer)
  }
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T
  } catch {
    throw new Error(
      'Não foi possível interpretar as informações recebidas. Tente novamente.'
    )
  }
}

export async function health(): Promise<boolean> {
  try {
    await request('/health', {}, TIMEOUT.health)
    return true
  } catch {
    return false
  }
}

export async function extractDocument(
  file: File
): Promise<ExtractedDocument> {
  const data = new FormData()

  data.append('file', file)

  const response = await request(
    '/api/extract-text',
    {
      method: 'POST',
      body: data
    },
    TIMEOUT.extract
  )

  return readJson<ExtractedDocument>(response)
}

export async function suggestQuestions(
  mode: Exclude<GenerationMode, 'manual'>,
  params: SuggestionParams
): Promise<QuestionSet> {
  const endpoint =
    mode === 'rag'
      ? '/api/rag/suggestions'
      : '/api/suggestions'

  const payload =
    mode === 'rag'
      ? params
      : {
          texto: params.texto,
          quantidade: params.quantidade,
          dificuldade: params.dificuldade,
          alternativas: params.alternativas
        }

  const response = await request(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    },
    TIMEOUT.generate
  )

  return readJson<QuestionSet>(response)
}

export async function exportMoodleXml(
  set: QuestionSet
): Promise<void> {
  const response = await request(
    '/api/convert',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(set)
    },
    TIMEOUT.export
  )

  const blob = await response.blob()

  if (blob.size === 0) {
    throw new Error(
      'O arquivo gerado está vazio. Tente realizar a exportação novamente.'
    )
  }

  const address = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = address
  anchor.download = 'questoes_moodle.xml'

  document.body.append(anchor)

  try {
    anchor.click()
  } finally {
    anchor.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(address)
    }, 1000)
  }
}