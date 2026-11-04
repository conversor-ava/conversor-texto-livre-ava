import { useEffect, useState } from 'react'
import {
  BookOpen,
  CircleCheck,
  FileCode2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Menu,
  ShieldCheck,
  X
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { health } from '../../services/api'
import { useEvaluation } from '../../hooks/useEvaluation'
import { Toast } from '../ui/Toast'

const sections = [
  {
    to: '/',
    label: 'Preparar material',
    Icon: FileText
  },
  {
    to: '/revisao',
    label: 'Revisar questões',
    Icon: CircleCheck
  },
  {
    to: '/exportacao',
    label: 'Exportar Moodle XML',
    Icon: FileCode2
  }
]

export function AppLayout() {
  const [online, setOnline] = useState<boolean | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const { questions, reset, notice, dismiss } = useEvaluation()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    let checking = false

    async function checkConnection() {
      if (checking) return

      checking = true

      try {
        const connected = await health()

        if (active) {
          setOnline(connected)
        }
      } finally {
        checking = false
      }
    }

    void checkConnection()

    const interval = window.setInterval(() => {
      void checkConnection()
    }, 30000)

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

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
          Nova avaliação
        </button>

        <p className="nav-caption section-caption">
          CRIAR AVALIAÇÃO
        </p>

        <nav aria-label="Etapas do conversor">
          {sections.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={19} />

              {label}

              {to === '/revisao' && questions.length > 0 && (
                <span className="nav-count">
                  {questions.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="teacher-card">
          <GraduationCap size={25} />

          <strong>
            Feito para educadores
          </strong>

          <p>
            Você tem controle sobre cada questão.
            O uso da IA é sempre opcional.
          </p>
        </div>

        <div className="api-status">
          <span
            className={`connection-dot ${
              online === true
                ? 'online'
                : online === false
                  ? 'offline'
                  : ''
            }`}
          />

          <span>
            FastAPI{' '}
            {online === null
              ? 'verificando'
              : online
                ? 'conectado'
                : 'desconectado'}
          </span>
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
              Nova avaliação
            </strong>
          </div>

          <div className="topbar-badge">
            <ShieldCheck size={15} />
            IA opcional
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>

        <footer className="main-footer">
          <span>
            AVA Studio · Conversor Inteligente Texto Livre para AVA
          </span>

          <span>
            Engenharia de Software · Moodle XML
          </span>
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