import {
  ArrowDownToLine,
  ArrowLeft,
  CheckCircle2,
  Code2,
  FileCheck,
  FileWarning,
  GraduationCap,
  LoaderCircle,
  ShieldCheck
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { StepIndicator } from '../components/layout/StepIndicator'
import { useEvaluation } from '../hooks/useEvaluation'
import { validateQuestions } from '../utils/validation'
import './ExportPage.css'

export function ExportPage() {
  const { questions, exportXml, busy } = useEvaluation()

  const hasQuestions = questions.length > 0

  const problem = hasQuestions
    ? validateQuestions(questions)
    : 'A exportação de materiais sem questões ainda não está disponível.'

  const isReady = !problem
  const isExporting = busy === 'export'

  async function download() {
    if (isReady) {
      await exportXml()
    }
  }

  const statusMessage = !hasQuestions
    ? 'Você pode preparar materiais sem incluir questões. A opção de baixar apenas o texto estará disponível em uma próxima atualização.'
    : problem
      ? problem
      : 'Seu material foi conferido e está pronto para ser baixado e utilizado no Moodle.'

  return (
    <div className="export-page">
      <header className="page-heading">
        <div className="eyebrow">
          <FileCheck size={15} />
          FINALIZAÇÃO DO MATERIAL
        </div>

        <h1>Seu material para o Moodle</h1>

        <p>
          Confira as informações do seu material e,
          quando estiver pronto, baixe o arquivo para
          utilizar no Moodle.
        </p>
      </header>

      <StepIndicator current={3} />

      <div className="export-layout">
        <div className="export-content">
          <section className="panel ready-panel">
            <div className="export-status">
              <div
                className={`ready-icon ${
                  isReady ? '' : 'not-ready'
                }`}
              >
                {isReady ? (
                  <FileCheck size={28} />
                ) : (
                  <FileWarning size={28} />
                )}
              </div>

              <div className="export-status-content">
                <span
                  className={`ready-pill ${
                    isReady ? '' : 'not-ready'
                  }`}
                >
                  {isReady ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <FileWarning size={15} />
                  )}

                  {isReady
                    ? 'Material conferido'
                    : hasQuestions
                      ? 'Falta só mais um passo'
                      : 'Material sem questões'}
                </span>

                <h2>
                  {isReady
                    ? 'Tudo pronto para baixar!'
                    : hasQuestions
                      ? 'Vamos conferir alguns detalhes?'
                      : 'Seu material está preparado'}
                </h2>

                <p>
                  {statusMessage}
                </p>
              </div>
            </div>

            <div className="export-file-section">
              <div className="export-file-heading">
                <h3>Arquivo para download</h3>

                <span>Formato Moodle XML</span>
              </div>

              <div className="download-file">
                <div className="xml-icon">
                  <Code2 size={23} />
                </div>

                <div className="download-file-info">
                  <strong>questoes_moodle.xml</strong>

                  <small>
                    {questions.length}{' '}
                    {questions.length === 1
                      ? 'questão'
                      : 'questões'}{' '}
                    · Moodle XML
                  </small>
                </div>

                {isReady && (
                  <CheckCircle2
                    size={19}
                    className="export-file-check"
                  />
                )}
              </div>
            </div>

            <div className="export-actions">
              <button
                type="button"
                className="button button-primary button-download"
                onClick={() => void download()}
                disabled={!isReady || busy !== null}
              >
                {isExporting ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="spin"
                    />
                    Preparando arquivo...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={19} />
                    Baixar arquivo para o Moodle
                  </>
                )}
              </button>

              <Link
                to="/revisao"
                className="button button-outline"
              >
                <ArrowLeft size={17} />
                Voltar para revisão
              </Link>
            </div>
          </section>

          <section className="export-information">
            <ShieldCheck size={19} />

            <div>
              <h3>Você mantém o controle do conteúdo</h3>

              <p>
                As questões são organizadas em um arquivo
                compatível com o Moodle, sem necessidade
                de utilizar inteligência artificial.
              </p>
            </div>
          </section>
        </div>

        <aside className="export-aside">
          <section className="panel import-panel">
            <div className="section-title">
              <div className="icon-bubble">
                <GraduationCap size={21} />
              </div>

              <div>
                <h2>Como importar no Moodle</h2>

                <p>
                  Siga estas etapas para adicionar
                  suas questões ao Moodle.
                </p>
              </div>
            </div>

            <div className="import-steps">
              <div className="import-step">
                <span>01</span>

                <p>
                  Entre no seu curso no Moodle
                  e abra o <strong>Banco de questões</strong>.
                </p>
              </div>

              <div className="import-step">
                <span>02</span>

                <p>
                  Escolha a opção <strong>Importar</strong>
                  {' '}e selecione o formato{' '}
                  <strong>Moodle XML</strong>.
                </p>
              </div>

              <div className="import-step">
                <span>03</span>

                <p>
                  Selecione o arquivo que você
                  baixou nesta página.
                </p>
              </div>

              <div className="import-step">
                <span>04</span>

                <p>
                  Confirme a importação e confira
                  o conteúdo no Moodle.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}