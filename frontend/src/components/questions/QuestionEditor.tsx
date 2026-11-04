import { Check, Plus, Trash2, X } from 'lucide-react'
import { useEvaluation } from '../../hooks/useEvaluation'
import type { Answer, Question } from '../../types/question'
import './QuestionEditor.css'

interface QuestionEditorProps {
  question: Question
  index: number
}

export function QuestionEditor({
  question,
  index
}: QuestionEditorProps) {
  const { setQuestions, notify } = useEvaluation()

  function update(changes: Partial<Question>) {
    setQuestions(previous =>
      previous.map((item, number) =>
        number === index
          ? { ...item, ...changes }
          : item
      )
    )
  }

  function updateAnswer(
    answerIndex: number,
    changes: Partial<Answer>
  ) {
    update({
      answers: question.answers.map((answer, number) =>
        number === answerIndex
          ? { ...answer, ...changes }
          : answer
      )
    })
  }

  function selectCorrect(answerIndex: number) {
    update({
      answers: question.answers.map((answer, number) => ({
        ...answer,
        is_correct: number === answerIndex
      }))
    })
  }

  function addAnswer() {
    if (question.answers.length >= 8) {
      notify('error', 'Limite de 8 alternativas por questão.')
      return
    }

    update({
      answers: [
        ...question.answers,
        {
          text: '',
          feedback: '',
          is_correct: false
        }
      ]
    })
  }

  function removeAnswer(answerIndex: number) {
    if (question.answers.length <= 2) {
      notify(
        'error',
        'Cada questão precisa de pelo menos 2 alternativas.'
      )
      return
    }

    const answers = question.answers.filter(
      (_, number) => number !== answerIndex
    )

    if (!answers.some(answer => answer.is_correct)) {
      answers[0] = {
        ...answers[0],
        is_correct: true
      }
    }

    update({ answers })
  }

  function removeQuestion() {
    setQuestions(previous =>
      previous.filter((_, number) => number !== index)
    )
  }

  return (
    <article
      className="panel question-editor"
      aria-label={`Questão ${index + 1}`}
    >
      <header className="editor-header">
        <span className="question-badge">
          {String(index + 1).padStart(2, '0')}
        </span>

        <div>
          <h3>
            {question.name || `Questão ${index + 1}`}
          </h3>

          <p>
            Edite o enunciado, as alternativas e os feedbacks.
          </p>
        </div>

        <button
          type="button"
          className="icon-button danger"
          aria-label={`Excluir questão ${index + 1}`}
          onClick={removeQuestion}
        >
          <Trash2 size={18} />
        </button>
      </header>

      <div className="editor-grid">
        <div className="control-row">
          <label htmlFor={`name-${index}`}>
            Nome da questão
          </label>

          <input
            id={`name-${index}`}
            value={question.name}
            maxLength={255}
            onChange={event =>
              update({ name: event.target.value })
            }
          />
        </div>

        <div className="control-row">
          <label htmlFor={`category-${index}`}>
            Categoria (opcional)
          </label>

          <input
            id={`category-${index}`}
            value={question.category ?? ''}
            maxLength={255}
            placeholder="Ex.: Biologia / Fotossíntese"
            onChange={event =>
              update({
                category: event.target.value || null
              })
            }
          />
        </div>
      </div>

      <div className="control-row full">
        <label htmlFor={`statement-${index}`}>
          Enunciado *
        </label>

        <textarea
          id={`statement-${index}`}
          rows={3}
          placeholder="Escreva sua pergunta..."
          value={question.text}
          onChange={event =>
            update({ text: event.target.value })
          }
        />
      </div>

      <div className="answers-label">
        <h4>Alternativas</h4>

        <span>
          <Check size={15} />
          Marque a alternativa correta
        </span>
      </div>

      <div className="answer-items">
        {question.answers.map((answer, answerIndex) => (
          <div
            key={answerIndex}
            className={`answer-item ${
              answer.is_correct ? 'correct' : ''
            }`}
          >
            <div className="answer-main">
              <button
                type="button"
                className={`radio-button ${
                  answer.is_correct ? 'checked' : ''
                }`}
                aria-label={
                  `Marcar alternativa ${answerIndex + 1} ` +
                  `como correta da questão ${index + 1}`
                }
                aria-pressed={answer.is_correct}
                onClick={() => selectCorrect(answerIndex)}
              >
                {answer.is_correct && <Check size={15} />}
              </button>

              <span className="answer-letter">
                {String.fromCharCode(65 + answerIndex)}
              </span>

              <input
                aria-label={
                  `Alternativa ${answerIndex + 1} ` +
                  `da questão ${index + 1}`
                }
                placeholder="Texto da alternativa"
                value={answer.text}
                onChange={event =>
                  updateAnswer(answerIndex, {
                    text: event.target.value
                  })
                }
              />

              <button
                type="button"
                className="icon-button small"
                aria-label={
                  `Remover alternativa ${answerIndex + 1} ` +
                  `da questão ${index + 1}`
                }
                onClick={() => removeAnswer(answerIndex)}
              >
                <X size={17} />
              </button>
            </div>

            <div className="answer-feedback">
              <span>Feedback</span>

              <input
                aria-label={
                  `Feedback da alternativa ${answerIndex + 1} ` +
                  `da questão ${index + 1}`
                }
                value={answer.feedback}
                placeholder={
                  'Explique por que esta resposta está ' +
                  'correta ou incorreta...'
                }
                onChange={event =>
                  updateAnswer(answerIndex, {
                    feedback: event.target.value
                  })
                }
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="button button-dashed"
        onClick={addAnswer}
        disabled={question.answers.length >= 8}
      >
        <Plus size={17} />
        Adicionar alternativa
      </button>

      <div className="control-row full extra-feedback">
        <label htmlFor={`general-${index}`}>
          Feedback geral (opcional)
        </label>

        <textarea
          id={`general-${index}`}
          rows={2}
          value={question.general_feedback ?? ''}
          placeholder="Explicação geral da questão"
          onChange={event =>
            update({
              general_feedback: event.target.value
            })
          }
        />
      </div>
    </article>
  )
}