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

  const totalAlternatives = questions.reduce(
    (total, question) => total + question.answers.length,
    0
  )

  const generationOrigin =
    config.mode === 'manual'
      ? 'Manual'
      : config.mode === 'rag'
        ? 'IA + RAG'
        : 'IA simples'

  function add() {
    setQuestions(previous => [
      ...previous,
      emptyQuestion(previous.length + 1, config.alternatives)
    ])
  }

  function next() {
    const error = validateQuestions(questions)

    if (error) {
      notify('error', error)
      return
    }

    navigate('/exportacao')
  }

  return (
    <div className="review-page">
      <header className="page-heading">
        <div className="eyebrow">
          <ClipboardList size={15} />
          REVISÃO DOCENTE
        </div>

        <h1>Revisão das questões</h1>

        <p>
          Confira os enunciados, revise as alternativas e ajuste
          os feedbacks antes de exportar sua avaliação.
        </p>
      </header>

      <StepIndicator current={2} />

      <div className="review-layout">
        <div className="review-content">
          <div className="review-toolbar">
            <div>
              <div className="review-toolbar-title">
                <h2>Banco de questões</h2>

                <span className="counter">
                  {questions.length}
                </span>
              </div>

              <p>
                Edite e organize as questões da sua avaliação.
              </p>
            </div>

            <button
              type="button"
              className="button button-outline"
              onClick={add}
            >
              <Plus size={17} />
              Nova questão
            </button>
          </div>

          <div className="review-questions">
            {questions.length === 0 && (
              <section className="panel empty-state">
                <ClipboardList size={36} />

                <h2>Nenhuma questão ainda</h2>

                <p>
                  Você pode criar uma questão agora mesmo,
                  sem IA, ou voltar à preparação do material.
                </p>

                <button
                  type="button"
                  className="button button-primary"
                  onClick={add}
                >
                  <Plus size={17} />
                  Criar questão
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
              disabled={questions.length === 0}
            >
              <CheckCheck size={18} />
              Validar e continuar
              <ArrowRight size={17} />
            </button>
          </div>
        </div>

        <aside className="review-aside">
          <section className="panel summary-panel">
            <div className="review-summary-heading">
              <ClipboardList size={19} />
              <h3>Resumo da avaliação</h3>
            </div>

            <div className="review-summary-row">
              <span>Questões</span>
              <strong>{questions.length}</strong>
            </div>

            <div className="review-summary-row">
              <span>Alternativas</span>
              <strong>{totalAlternatives}</strong>
            </div>

            <div className="review-summary-row">
              <span>Origem</span>
              <strong>{generationOrigin}</strong>
            </div>
          </section>

          <section className="review-guidance">
            <div className="review-guidance-heading">
              <ShieldCheck size={19} />
              <h3>Conferência do conteúdo</h3>
            </div>

            <p>
              Todas as questões devem ser revisadas pelo
              docente antes da exportação.
            </p>

            <p>
              Verifique os enunciados, o gabarito e os feedbacks
              para garantir a qualidade da avaliação.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}