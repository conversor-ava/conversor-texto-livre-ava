import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Info,
  LoaderCircle,
  PenTool,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DocumentInput } from '../components/forms/DocumentInput'
import { GenerationOptions } from '../components/forms/GenerationOptions'
import { StepIndicator } from '../components/layout/StepIndicator'
import { useEvaluation } from '../hooks/useEvaluation'
import './GeneratePage.css'

const EXEMPLO_QUESTOES = `1) Qual a principal característica da linguagem Python?
a) Compilada estaticamente
b) Interpretada e de alto nível (correta)
c) Utilizada apenas para desenvolvimento mobile
d) Executada exclusivamente em navegadores
Feedback: Python é uma linguagem interpretada e de tipagem dinâmica.

2) No contexto de banco de dados relacionais, qual comando é utilizado para consultar registros?
a) INSERT
b) UPDATE
c) SELECT (correta)
d) DELETE`

export function GeneratePage() {
  const { config, questions, updateConfig, generate, busy } = useEvaluation()
  const navigate = useNavigate()

  const isManual = config.mode === 'manual'
  const isGenerating = busy === 'generate'

  async function handleContinue() {
    if (busy !== null) {
      return
    }

    if (questions.length > 0) {
      const confirmed = window.confirm(
        'Já existem questões carregadas na revisão. Continuar irá substituir suas questões e edições atuais. Deseja prosseguir?'
      )
      if (!confirmed) {
        return
      }
    }

    const success = await generate()

    if (success) {
      navigate('/revisao')
    }
  }

  function handleInsertExample() {
    updateConfig({ text: EXEMPLO_QUESTOES })
  }

  return (
    <div className="generate-page">
      <header className="page-heading">
        <div className="eyebrow">
          <FileText size={15} />
          PREPARAÇÃO DO MATERIAL
        </div>

        <h1>Prepare seu conteúdo para o Moodle</h1>

        <p>
          Adicione seu texto ou documento para converter diretamente em Moodle XML
          ou, se desejar, crie novas questões manualmente ou com apoio de inteligência artificial.
        </p>
      </header>

      <StepIndicator current={1} />

      <div className="generate-layout">
        <div className="generate-workspace">
          <div className="generate-toolbar">
            <button
              type="button"
              className="button button-outline generate-example-btn"
              disabled={busy !== null}
              onClick={handleInsertExample}
            >
              <PenTool size={14} />
              Inserir exemplo de questões
            </button>
          </div>

          <DocumentInput />

          <GenerationOptions />

          <div className="generate-actions">
            <div className="generate-security">
              <ShieldCheck size={18} />
              <span>Você poderá revisar o conteúdo antes de finalizar.</span>
            </div>

            <button
              type="button"
              className="button button-primary generate-submit"
              disabled={busy !== null}
              onClick={() => void handleContinue()}
            >
              {isGenerating ? (
                <>
                  <LoaderCircle size={18} className="spin" />
                  Preparando...
                </>
              ) : isManual ? (
                <>
                  Continuar
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Criar sugestões e continuar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="generate-aside">
          <section className="panel generate-guide">
            <div className="generate-guide-heading">
              <BookOpen size={19} />
              <h2>Como funciona</h2>
            </div>

            <div className="generate-guide-steps">
              <div className="generate-guide-step">
                <span className="generate-guide-number">01</span>
                <div>
                  <h3>Adicione seu material</h3>
                  <p>
                    Cole questões prontas em texto ou envie arquivos PDF, DOCX ou TXT.
                  </p>
                </div>
              </div>

              <div className="generate-guide-step">
                <span className="generate-guide-number">02</span>
                <div>
                  <h3>Converta ou use IA</h3>
                  <p>
                    Aproveite questões em texto ou crie sugestões com IA.
                  </p>
                </div>
              </div>

              <div className="generate-guide-step">
                <span className="generate-guide-number">03</span>
                <div>
                  <h3>Revise o material</h3>
                  <p>
                    Ajuste enunciados, alternativas e feedbacks com validação estrutural.
                  </p>
                </div>
              </div>

              <div className="generate-guide-step">
                <span className="generate-guide-number">04</span>
                <div>
                  <h3>Importe no Moodle</h3>
                  <p>
                    Baixe o arquivo XML e importe diretamente no banco de questões.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="generate-info">
            <div className="generate-info-heading">
              <Info size={19} />
              <h2>Conversão determinística</h2>
            </div>

            <p>
              O sistema converte questões em texto diretamente para Moodle XML.
              A inteligência artificial é apenas um apoio opcional.
            </p>

            <div className="generate-info-divider" />

            <div className="generate-info-item">
              <CheckCircle2 size={16} />
              <span>
                Conversão e exportação funcionam sem depender de IA ou banco.
              </span>
            </div>

            <div className="generate-info-item">
              <CheckCircle2 size={16} />
              <span>
                Validação estrutural contra erros de importação no Moodle.
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}