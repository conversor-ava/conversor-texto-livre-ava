import { useState } from 'react'
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

function stripControlChars(value: string): string {
  return Array.from(value)
    .filter(ch => {
      const code = ch.charCodeAt(0)
      if (code === 9 || code === 10 || code === 13) {
        return true
      }
      return code >= 32 && code !== 127
    })
    .join('')
    .trim()
}

function escapeXmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildMoodleDescriptionXml(title: string, text: string): string {
  const sanitizedText = escapeXmlText(stripControlChars(text)).replace(
    /]]>/g,
    ']]]]><![CDATA[>'
  )
  const sanitizedTitle = escapeXmlText(stripControlChars(title))

  return `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="description">
    <name>
      <text>${sanitizedTitle || 'Material de Estudo'}</text>
    </name>
    <questiontext format="html">
      <text><![CDATA[<div style="font-family: sans-serif; line-height: 1.6; white-space: pre-wrap;">${sanitizedText}</div>]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text></text>
    </generalfeedback>
    <defaultgrade>0.0000000</defaultgrade>
    <penalty>0.0000000</penalty>
    <hidden>0</hidden>
  </question>
</quiz>`
}

function downloadXmlDirect(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  try {
    anchor.click()
  } finally {
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
}

export function ExportPage() {
  const { questions, exportXml, busy, config } = useEvaluation()
  const [exportingLocal, setExportingLocal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasQuestions = questions.length > 0
  const hasTextContent = Boolean(config.text && config.text.trim().length > 0)

  const validationProblem = hasQuestions ? validateQuestions(questions) : null
  const isReady = hasQuestions ? !validationProblem : hasTextContent
  const isExporting = busy === 'export' || exportingLocal

  async function download() {
    if (!isReady || isExporting) {
      return
    }

    setErrorMessage(null)

    if (hasQuestions) {
      await exportXml()
      return
    }

    if (hasTextContent) {
      setExportingLocal(true)
      try {
        const descriptionXml = buildMoodleDescriptionXml(
          config.filename || 'Material de Estudo',
          config.text
        )
        downloadXmlDirect(descriptionXml, 'material_moodle.xml')
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMessage(err.message)
        } else {
          setErrorMessage('Não foi possível gerar o arquivo para o Moodle.')
        }
      } finally {
        setExportingLocal(false)
      }
    }
  }

  const statusTitle = isReady
    ? 'Tudo pronto para baixar!'
    : hasQuestions
      ? 'Vamos conferir alguns detalhes?'
      : 'Nenhum conteúdo para exportar'

  const statusMessage = isReady
    ? hasQuestions
      ? 'Seu material com questões foi conferido e está pronto para ser utilizado no Moodle.'
      : 'Seu material em texto foi convertido para o formato de descrição Moodle XML e está pronto para download.'
    : validationProblem || 'Adicione um texto ou questões na etapa de preparação antes de exportar.'

  const fileLabel = hasQuestions
    ? `${questions.length} ${questions.length === 1 ? 'questão' : 'questões'} · Moodle XML`
    : hasTextContent
      ? 'Material em texto · Moodle XML'
      : '0 questões · Moodle XML'

  const fileName = hasQuestions ? 'questoes_moodle.xml' : 'material_moodle.xml'

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
                    ? hasQuestions
                      ? 'Material conferido'
                      : 'Texto convertido para AVA'
                    : 'Atenção'}
                </span>

                <h2>{statusTitle}</h2>

                <p>{statusMessage}</p>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '0.9rem',
                  margin: '16px 0 0'
                }}
              >
                {errorMessage}
              </div>
            )}

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
                  <strong>{fileName}</strong>
                  <small>{fileLabel}</small>
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
                As questões e conteúdos são organizados em um arquivo
                compatível com o Moodle, sem dependência obrigatória
                de inteligência artificial.
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