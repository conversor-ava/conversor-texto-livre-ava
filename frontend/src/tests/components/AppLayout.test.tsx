import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'
import {
  MemoryRouter,
  Route,
  Routes
} from 'react-router-dom'

import { AppLayout } from '../../components/layout/AppLayout'

vi.mock('../../hooks/useEvaluation', () => ({
  useEvaluation: () => ({
    reset: vi.fn(),
    notice: null,
    dismiss: vi.fn()
  })
}))

const THEME_STORAGE_KEY = 'ava-studio-theme'

let systemDark = false

const mediaListeners = new Set<
  (event: MediaQueryListEvent) => void
>()

function configureMatchMedia() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(
      (query: string): MediaQueryList => {
        return {
          matches:
            query === '(prefers-color-scheme: dark)' &&
            systemDark,

          media: query,

          onchange: null,

          addListener: vi.fn(),
          removeListener: vi.fn(),

          addEventListener: vi.fn(
            (
              event: string,
              listener: (
                event: MediaQueryListEvent
              ) => void
            ) => {
              if (event === 'change') {
                mediaListeners.add(listener)
              }
            }
          ),

          removeEventListener: vi.fn(
            (
              event: string,
              listener: (
                event: MediaQueryListEvent
              ) => void
            ) => {
              if (event === 'change') {
                mediaListeners.delete(listener)
              }
            }
          ),

          dispatchEvent: vi.fn(() => true)
        } as MediaQueryList
      }
    )
  })
}

function changeSystemTheme(dark: boolean) {
  systemDark = dark

  const event = {
    matches: dark
  } as MediaQueryListEvent

  act(() => {
    mediaListeners.forEach(listener => {
      listener(event)
    })
  })
}

function renderAppLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={<AppLayout />}
        >
          <Route
            index
            element={<div>Conteúdo de teste</div>}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('AppLayout - modo escuro', () => {
  beforeEach(() => {
    systemDark = false
    mediaListeners.clear()

    window.localStorage.clear()

    document.documentElement.removeAttribute(
      'data-theme'
    )

    document.documentElement.style.colorScheme = ''

    configureMatchMedia()
  })

  afterEach(() => {
    cleanup()

    mediaListeners.clear()

    vi.restoreAllMocks()
  })

  it('inicia no modo claro quando não existe preferência salva', () => {
    renderAppLayout()

    expect(
      document.documentElement
    ).toHaveAttribute('data-theme', 'light')

    expect(
      screen.getByRole('button', {
        name: 'Ativar modo escuro'
      })
    ).toBeInTheDocument()

    expect(
      localStorage.getItem(THEME_STORAGE_KEY)
    ).toBeNull()
  })

  it('respeita a preferência escura do sistema operacional', () => {
    systemDark = true

    renderAppLayout()

    expect(
      document.documentElement
    ).toHaveAttribute('data-theme', 'dark')

    expect(
      screen.getByRole('button', {
        name: 'Ativar modo claro'
      })
    ).toBeInTheDocument()

    expect(
      localStorage.getItem(THEME_STORAGE_KEY)
    ).toBeNull()
  })

  it('prioriza o tema salvo em relação ao tema do sistema', () => {
    systemDark = true

    localStorage.setItem(
      THEME_STORAGE_KEY,
      'light'
    )

    renderAppLayout()

    expect(
      document.documentElement
    ).toHaveAttribute('data-theme', 'light')

    expect(
      screen.getByRole('button', {
        name: 'Ativar modo escuro'
      })
    ).toBeInTheDocument()
  })

  it('permite alternar entre modo claro e escuro', async () => {
    const user = userEvent.setup()

    renderAppLayout()

    const activateDark = screen.getByRole(
      'button',
      { name: 'Ativar modo escuro' }
    )

    await user.click(activateDark)

    expect(
      document.documentElement
    ).toHaveAttribute('data-theme', 'dark')

    expect(
      localStorage.getItem(THEME_STORAGE_KEY)
    ).toBe('dark')

    const activateLight = screen.getByRole(
      'button',
      { name: 'Ativar modo claro' }
    )

    await user.click(activateLight)

    expect(
      document.documentElement
    ).toHaveAttribute('data-theme', 'light')

    expect(
      localStorage.getItem(THEME_STORAGE_KEY)
    ).toBe('light')
  })

  it('mantém o tema escolhido após remontar o componente', async () => {
    const user = userEvent.setup()

    const firstRender = renderAppLayout()

    await user.click(
      screen.getByRole('button', {
        name: 'Ativar modo escuro'
      })
    )

    expect(
      localStorage.getItem(THEME_STORAGE_KEY)
    ).toBe('dark')

    firstRender.unmount()

    renderAppLayout()

    expect(
      document.documentElement
    ).toHaveAttribute('data-theme', 'dark')

    expect(
      screen.getByRole('button', {
        name: 'Ativar modo claro'
      })
    ).toBeInTheDocument()
  })

  it('acompanha o sistema apenas sem preferência manual', async () => {
    const user = userEvent.setup()

    renderAppLayout()

    expect(
      document.documentElement
    ).toHaveAttribute('data-theme', 'light')

    changeSystemTheme(true)

    expect(
      document.documentElement
    ).toHaveAttribute('data-theme', 'dark')

    expect(
      localStorage.getItem(THEME_STORAGE_KEY)
    ).toBeNull()

    await user.click(
      screen.getByRole('button', {
        name: 'Ativar modo claro'
      })
    )

    expect(
      localStorage.getItem(THEME_STORAGE_KEY)
    ).toBe('light')

    changeSystemTheme(false)
    changeSystemTheme(true)

    expect(
      document.documentElement
    ).toHaveAttribute('data-theme', 'light')

    expect(
      screen.getByRole('button', {
        name: 'Ativar modo escuro'
      })
    ).toBeInTheDocument()
  })
})