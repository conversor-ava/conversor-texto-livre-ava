import {
  ArrowDownToLine,
  ArrowLeft,
  CheckCircle2,
  Code2,
  FileCheck,
  FileWarning,
  GraduationCap,
  LoaderCircle,
  Plus,
  ShieldCheck
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { StepIndicator } from '../components/layout/StepIndicator'
import { useEvaluation } from '../hooks/useEvaluation'
import { validateQuestions } from '../utils/validation'
import './ExportPage.css'

export function ExportPage() {
  const { questions, exportXml, busy, reset } = useEvaluation()
  const navigate = useNavigate()

  const problem = validateQuestions(questions)
  const isReady = !problem
  const isExporting = busy === 'export'

  async function download() {
    if (!problem) {
      await exportXml()
    }
  }

  function newEvaluation() {
    reset()
    navigate('/')
  }

  return (
    <div className="export-page">
      <header className="page-heading">
        <div className="eyebrow">
          <FileCheck size={15} />
          EXPORTAÇÃO DE AVALIAÇÕES
        </div>

        <h1>Exportação Moodle XML</h1>

        <p>
          Finalize sua avaliação e obtenha um arquivo
          estruturado para importação no Moodle.
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
                    ? 'Questões validadas'
                    : 'Revisão necessária'}
                </span>

                <h2>
                  {isReady
                    ? 'Avaliação pronta para exportação'
                    : 'Há ajustes pendentes'}
                </h2>

                <p>
                  {problem ??
                    'Suas questões passaram pela validação estrutural e podem ser exportadas no formato Moodle XML.'}
                </p>
              </div>
            </div>

            <div className="export-file-section">
              <div className="export-file-heading">
                <h3>Arquivo de exportação</h3>

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
                disabled={Boolean(problem) || busy !== null}
              >
                {isExporting ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="spin"
                    />
                    Gerando arquivo...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={19} />
                    Baixar Moodle XML
                  </>
                )}
              </button>

              <Link
                to="/revisao"
                className="button button-outline"
              >
                <ArrowLeft size={17} />
                Editar questões
              </Link>
            </div>
          </section>

          <section className="export-information">
            <ShieldCheck size={19} />

            <div>
              <h3>Conversão independente da IA</h3>

              <p>
                O arquivo é produzido pelo conversor
                determinístico do backend. Não é necessário
                utilizar Ollama ou RAG para exportar questões.
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
                <h2>Importação no Moodle</h2>

                <p>
                  Siga as etapas para importar sua avaliação.
                </p>
              </div>
            </div>

            <div className="import-steps">
              <div className="import-step">
                <span>01</span>

                <p>
                  Abra seu curso no Moodle e acesse
                  o <strong>Banco de questões</strong>.
                </p>
              </div>

              <div className="import-step">
                <span>02</span>

                <p>
                  Selecione <strong>Importar</strong> e escolha
                  o formato <strong>Moodle XML</strong>.
                </p>
              </div>

              <div className="import-step">
                <span>03</span>

                <p>
                  Selecione o arquivo XML gerado
                  pelo conversor.
                </p>
              </div>

              <div className="import-step">
                <span>04</span>

                <p>
                  Confirme a importação e confira
                  as questões no Moodle.
                </p>
              </div>
            </div>
          </section>

          <section className="export-new-evaluation">
            <h3>Precisa criar outra avaliação?</h3>

            <p>
              Inicie um novo conjunto de questões
              a partir de outro material didático.
            </p>

            <button
              type="button"
              className="button button-outline"
              onClick={newEvaluation}
            >
              <Plus size={17} />
              Nova avaliação
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}