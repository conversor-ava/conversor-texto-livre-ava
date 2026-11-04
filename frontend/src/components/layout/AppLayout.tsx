import { useEffect, useState } from 'react'
import {
  BookOpen,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  X
} from 'lucide-react'
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate
} from 'react-router-dom'
import { useEvaluation } from '../../hooks/useEvaluation'
import { Toast } from '../ui/Toast'

type Theme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'ava-studio-theme'

const developers = [
  'Kayo dos Santos Tavares de Castro Lima',
  'Luis Filipe Soares Lima',
  'Mellani lyvian de Macedo dos Santos',
  'Maria Eduarda Franklin Barbosa'
]

function getSavedTheme(): Theme | null {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
  } catch {
    // O sistema continua funcionando se o armazenamento estiver indisponível.
  }

  return null
}

function getSystemTheme(): Theme {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark'
  }

  return 'light'
}

function getInitialTheme(): Theme {
  return getSavedTheme() ?? getSystemTheme()
}

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  const { reset, notice, dismiss } = useEvaluation()

  const navigate = useNavigate()
  const location = useLocation()

  const pageTitle =
    location.pathname === '/revisao'
      ? 'Revisar material'
      : location.pathname === '/exportacao'
        ? 'Finalizar material'
        : 'Preparar material'

  // Aplica o tema escolhido à página.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  // Acompanha as mudanças do tema do sistema operacional
  // enquanto o usuário não tiver definido uma preferência.
  useEffect(() => {
    if (!window.matchMedia) {
      return
    }

    const mediaQuery = window.matchMedia(
      '(prefers-color-scheme: dark)'
    )

    function handleSystemThemeChange(event: MediaQueryListEvent) {
      if (getSavedTheme() === null) {
        setTheme(event.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener(
      'change',
      handleSystemThemeChange
    )

    return () => {
      mediaQuery.removeEventListener(
        'change',
        handleSystemThemeChange
      )
    }
  }, [])

  function toggleTheme() {
    const nextTheme: Theme =
      theme === 'light' ? 'dark' : 'light'

    setTheme(nextTheme)

    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // A alternância funciona durante a sessão,
      // mesmo que não seja possível salvar a preferência.
    }
  }

  function startOver() {
    reset()
    navigate('/')
    setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-symbol">
            <BookOpen size={23} />
          </div>

          <div>
            <strong>
              ava<span>studio</span>
            </strong>

            <small>CONVERSOR EDUCACIONAL</small>
          </div>

          <button
            type="button"
            className="mobile-close"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <p className="nav-caption">
          ESPAÇO DE TRABALHO
        </p>

        <button
          type="button"
          className="nav-item overview"
          onClick={startOver}
        >
          <LayoutDashboard size={19} />
          Novo material
        </button>

        <p className="nav-caption section-caption">
          SEU MATERIAL
        </p>

        <nav aria-label="Navegação do conversor">
          <NavLink
            to="/"
            end
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            <FileText size={19} />

            Preparar material
          </NavLink>
        </nav>

        <div className="sidebar-spacer" />

        <div className="teacher-card">
          <GraduationCap size={25} />

          <strong>
            Feito para educadores
          </strong>

          <p>
            Prepare seus materiais didáticos com liberdade.
            Você decide se deseja incluir questões e
            utilizar inteligência artificial.
          </p>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          className="mobile-overlay"
          aria-label="Fechar navegação"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} />
            </button>

            <span className="topbar-crumb">
              AVA Studio
            </span>

            <span className="breadcrumb-divider">
              /
            </span>

            <strong>
              {pageTitle}
            </strong>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={
                theme === 'light'
                  ? 'Ativar modo escuro'
                  : 'Ativar modo claro'
              }
              title={
                theme === 'light'
                  ? 'Ativar modo escuro'
                  : 'Ativar modo claro'
              }
              aria-pressed={theme === 'dark'}
            >
              {theme === 'light' ? (
                <Moon size={19} />
              ) : (
                <Sun size={19} />
              )}
            </button>

            <div className="topbar-badge">
              <ShieldCheck size={15} />
              IA opcional
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>

        <footer className="main-footer academic-footer">
          <div className="academic-footer-header">
            <div className="academic-footer-brand">
              <GraduationCap size={22} />

              <div>
                <strong>AVA Studio</strong>
                <span>Projeto acadêmico</span>
              </div>
            </div>

            <p className="academic-footer-description">
              Projeto desenvolvido por estudantes do curso de
              Engenharia de Software da Universidade de Vassouras.
            </p>
          </div>

          <div className="academic-footer-team">
            <h3>Equipe de desenvolvimento</h3>

            <ul className="academic-footer-members">
              {developers.map(developer => (
                <li key={developer}>
                  {developer}
                </li>
              ))}
            </ul>
          </div>

          <div className="academic-footer-bottom">
            <span>
              Universidade de Vassouras
            </span>
          </div>
        </footer>
      </div>

      {notice && (
        <Toast
          notice={notice}
          onClose={dismiss}
        />
      )}
    </div>
  )
}