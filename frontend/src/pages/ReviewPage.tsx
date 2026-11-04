import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  ClipboardList,
  Plus,
  ShieldCheck
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { StepIndicator } from '../components/layout/StepIndicator'
import { QuestionEditor } from '../components/questions/QuestionEditor'
import { useEvaluation } from '../hooks/useEvaluation'
import { emptyQuestion } from '../types/question'
import { validateQuestions } from '../utils/validation'
import './ReviewPage.css'

export function ReviewPage() {
  const { questions, setQuestions, config, notify } = useEvaluation()
  const navigate = useNavigate()

  const hasQuestions = questions.length > 0

  const totalAlternatives = questions.reduce(
    (total, question) => total + question.answers.length,
    0
  )

  const generationOrigin =
    config.mode === 'manual'
      ? 'Criação manual'
      : config.mode === 'rag'
        ? 'Sugestões com base no material'
        : 'Sugestões com inteligência artificial'

  function add() {
    setQuestions(previous => [
      ...previous,
      emptyQuestion(previous.length + 1, config.alternatives)
    ])
  }

  function next() {
    if (hasQuestions) {
      const error = validateQuestions(questions)

      if (error) {
        notify('error', error)
        return
      }
    }

    navigate('/exportacao')
  }

  return (
    <div className="review-page">
      <header className="page-heading">
        <div className="eyebrow">
          <ClipboardList size={15} />
          REVISÃO DO MATERIAL
        </div>

        <h1>Revise seu conteúdo</h1>

        <p>
          Confira seu material antes de finalizar.
          Se desejar, você também pode adicionar questões
          para complementar o conteúdo.
        </p>
      </header>

      <StepIndicator current={2} />

      <div className="review-layout">
        <div className="review-content">
          <div className="review-toolbar">
            <div>
              <div className="review-toolbar-title">
                <h2>Questões do material</h2>

                <span className="counter">
                  {questions.length}
                </span>
              </div>

              <p>
                A inclusão de questões é opcional.
                Você pode adicioná-las, editá-las ou continuar
                sem criar nenhuma.
              </p>
            </div>

            <button
              type="button"
              className="button button-outline"
              onClick={add}
            >
              <Plus size={17} />
              Adicionar questão
            </button>
          </div>

          <div className="review-questions">
            {!hasQuestions && (
              <section className="panel empty-state">
                <ClipboardList size={36} />

                <h2>Deseja adicionar questões?</h2>

                <p>
                  Você pode complementar seu material com
                  perguntas e respostas, mas isso não é
                  obrigatório. Se preferir, continue sem
                  adicionar questões.
                </p>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={add}
                >
                  <Plus size={17} />
                  Adicionar questão
                </button>
              </section>
            )}

            {questions.map((question, index) => (
              <QuestionEditor
                key={question.clientId}
                index={index}
                question={question}
              />
            ))}
          </div>

          <div className="review-actions">
            <Link
              className="button button-outline"
              to="/"
            >
              <ArrowLeft size={17} />
              Voltar
            </Link>

            <button
              type="button"
              className="button button-primary"
              onClick={next}
            >
              {hasQuestions ? (
                <>
                  <CheckCheck size={18} />
                  Conferir e continuar
                </>
              ) : (
                <>
                  Continuar sem questões
                </>
              )}

              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        <aside className="review-aside">
          <section className="panel summary-panel">
            <div className="review-summary-heading">
              <ClipboardList size={19} />

              <h3>Resumo do material</h3>
            </div>

            <div className="review-summary-row">
              <span>Questões adicionadas</span>

              <strong>{questions.length}</strong>
            </div>

            <div className="review-summary-row">
              <span>Total de alternativas</span>

              <strong>{totalAlternatives}</strong>
            </div>

            <div className="review-summary-row">
              <span>Forma de preparação</span>

              <strong>{generationOrigin}</strong>
            </div>
          </section>

          <section className="review-guidance">
            <div className="review-guidance-heading">
              <ShieldCheck size={19} />

              <h3>Você decide como preparar</h3>
            </div>

            <p>
              O material pode ser preparado com ou sem
              questões. Você escolhe o que faz sentido
              para sua atividade.
            </p>

            <p>
              Caso tenha incluído questões, confira os
              enunciados, as alternativas e as respostas
              antes de continuar.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}