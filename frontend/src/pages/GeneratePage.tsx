import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Info,
  LoaderCircle,
  Pencil,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DocumentInput } from '../components/forms/DocumentInput'
import { GenerationOptions } from '../components/forms/GenerationOptions'
import { StepIndicator } from '../components/layout/StepIndicator'
import { useEvaluation } from '../hooks/useEvaluation'
import './GeneratePage.css'

export function GeneratePage() {
  const { config, generate, busy } = useEvaluation()
  const navigate = useNavigate()

  const isManual = config.mode === 'manual'
  const isGenerating = busy === 'generate'

  async function handleContinue() {
    const success = await generate()

    if (success) {
      navigate('/revisao')
    }
  }

  return (
    <div className="generate-page">
      <header className="page-heading">
        <div className="eyebrow">
          <FileText size={15} />
          PREPARAÇÃO DE AVALIAÇÕES
        </div>

        <h1>Criar questões para o Moodle</h1>

        <p>
          Utilize seu material didático para elaborar questões de múltipla
          escolha. Você pode criar questões manualmente ou utilizar
          inteligência artificial como apoio.
        </p>
      </header>

      <StepIndicator current={1} />

      <div className="generate-layout">
        <div className="generate-workspace">
          <DocumentInput />

          <GenerationOptions />

          <div className="generate-actions">
            <div className="generate-security">
              <ShieldCheck size={18} />

              <span>
                As questões poderão ser revisadas antes da exportação.
              </span>
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
                  Gerando...
                </>
              ) : isManual ? (
                <>
                  <Pencil size={18} />
                  Criar manualmente
                  <ArrowRight size={18} />
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Gerar sugestões
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
                  <h3>Prepare o conteúdo</h3>

                  <p>
                    Insira o texto-base ou envie um documento
                    PDF, DOCX ou TXT.
                  </p>
                </div>
              </div>

              <div className="generate-guide-step">
                <span className="generate-guide-number">02</span>

                <div>
                  <h3>Escolha o método</h3>

                  <p>
                    Crie questões manualmente ou utilize
                    sugestões geradas por IA.
                  </p>
                </div>
              </div>

              <div className="generate-guide-step">
                <span className="generate-guide-number">03</span>

                <div>
                  <h3>Revise as questões</h3>

                  <p>
                    Confira os enunciados, as alternativas,
                    os gabaritos e os feedbacks.
                  </p>
                </div>
              </div>

              <div className="generate-guide-step">
                <span className="generate-guide-number">04</span>

                <div>
                  <h3>Exporte para o Moodle</h3>

                  <p>
                    Gere o arquivo XML após finalizar
                    a revisão das questões.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="generate-info">
            <div className="generate-info-heading">
              <Info size={19} />

              <h2>Sobre a inteligência artificial</h2>
            </div>

            <p>
              O uso do Ollama é opcional. Você pode criar
              e editar questões sem utilizar modelos de IA.
            </p>

            <div className="generate-info-divider" />

            <div className="generate-info-item">
              <CheckCircle2 size={16} />

              <span>
                A conversão para Moodle XML é realizada
                pelo backend, independentemente da IA.
              </span>
            </div>

            <div className="generate-info-item">
              <CheckCircle2 size={16} />

              <span>
                O professor mantém o controle sobre
                o conteúdo final das questões.
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}