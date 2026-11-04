import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Info,
  LoaderCircle,
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
          PREPARAÇÃO DO MATERIAL
        </div>

        <h1>Prepare seu conteúdo para o Moodle</h1>

        <p>
          Adicione seu texto ou documento para preparar o material
          que será utilizado no Moodle. Se desejar, você também
          poderá criar questões com ou sem ajuda da inteligência artificial.
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
                Você poderá revisar o conteúdo antes de finalizar.
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
                    Digite ou cole seu texto, ou envie um documento
                    PDF, DOCX ou TXT.
                  </p>
                </div>
              </div>

              <div className="generate-guide-step">
                <span className="generate-guide-number">02</span>

                <div>
                  <h3>Escolha como continuar</h3>

                  <p>
                    Você pode preparar apenas o conteúdo ou,
                    se preferir, incluir questões.
                  </p>
                </div>
              </div>

              <div className="generate-guide-step">
                <span className="generate-guide-number">03</span>

                <div>
                  <h3>Revise seu material</h3>

                  <p>
                    Confira o conteúdo e faça os ajustes
                    necessários antes de finalizar.
                  </p>
                </div>
              </div>

              <div className="generate-guide-step">
                <span className="generate-guide-number">04</span>

                <div>
                  <h3>Exporte para o Moodle</h3>

                  <p>
                    Prepare o arquivo para utilizar seu
                    material no ambiente virtual de aprendizagem.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="generate-info">
            <div className="generate-info-heading">
              <Info size={19} />

              <h2>Você tem liberdade para escolher</h2>
            </div>

            <p>
              A criação de questões é opcional. Você pode
              trabalhar com seu próprio conteúdo e utilizar
              a inteligência artificial apenas quando desejar.
            </p>

            <div className="generate-info-divider" />

            <div className="generate-info-item">
              <CheckCircle2 size={16} />

              <span>
                Você não precisa utilizar inteligência
                artificial para preparar seu material.
              </span>
            </div>

            <div className="generate-info-item">
              <CheckCircle2 size={16} />

              <span>
                Você mantém o controle sobre o conteúdo
                e pode revisá-lo antes da exportação.
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}