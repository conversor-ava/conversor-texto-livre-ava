import {
  BrainCircuit,
  Pencil,
  Settings2,
  Sparkles
} from 'lucide-react'
import { useEvaluation } from '../../hooks/useEvaluation'
import type {
  Difficulty,
  GenerationMode
} from '../../types/question'

const modes: {
  value: GenerationMode
  title: string
  subtitle: string
  Icon: typeof Pencil
}[] = [
  {
    value: 'manual',
    title: 'Manual',
    subtitle: 'Sem inteligência artificial',
    Icon: Pencil
  },
  {
    value: 'simple',
    title: 'IA simples',
    subtitle: 'Sugestões com Ollama',
    Icon: Sparkles
  },
  {
    value: 'rag',
    title: 'IA + RAG',
    subtitle: 'Busca semântica + Ollama',
    Icon: BrainCircuit
  }
]

export function GenerationOptions() {
  const { config, updateConfig } = useEvaluation()
  const isAI = config.mode !== 'manual'

  return (
    <section className="panel">
      <div className="section-title">
        <div className="icon-bubble purple">
          <Settings2 size={21} />
        </div>

        <div>
          <h2>Como criar as questões?</h2>

          <p>
            Escolha a forma de trabalho. A IA é opcional.
          </p>
        </div>
      </div>

      <div
        className="mode-grid"
        role="group"
        aria-label="Modo de criação"
      >
        {modes.map(({ value, title, subtitle, Icon }) => (
          <button
            key={value}
            type="button"
            className={`mode-card ${
              config.mode === value ? 'selected' : ''
            }`}
            aria-pressed={config.mode === value}
            onClick={() => updateConfig({ mode: value })}
          >
            <Icon size={23} />

            <strong>{title}</strong>

            <span>{subtitle}</span>
          </button>
        ))}
      </div>

      {isAI && (
        <div className="options-fields">
          <div className="control-row">
            <label htmlFor="quantity">
              Quantidade de questões
            </label>

            <input
              id="quantity"
              type="number"
              min={1}
              max={20}
              value={config.quantity}
              onChange={event =>
                updateConfig({
                  quantity: Math.min(
                    20,
                    Math.max(1, Number(event.target.value) || 1)
                  )
                })
              }
            />
          </div>

          <div className="control-row">
            <label htmlFor="difficulty">
              Dificuldade
            </label>

            <select
              id="difficulty"
              value={config.difficulty}
              onChange={event =>
                updateConfig({
                  difficulty: event.target.value as Difficulty
                })
              }
            >
              <option value="facil">Fácil</option>
              <option value="medio">Médio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
        </div>
      )}

      <div className="options-fields">
        <div className="control-row">
          <label htmlFor="alternatives">
            Alternativas por questão
          </label>

          <select
            id="alternatives"
            value={config.alternatives}
            onChange={event =>
              updateConfig({
                alternatives: Number(event.target.value)
              })
            }
          >
            {[2, 3, 4, 5, 6, 7, 8].map(number => (
              <option
                key={number}
                value={number}
              >
                {number}
              </option>
            ))}
          </select>
        </div>

        {config.mode === 'rag' && (
          <div className="control-row">
            <label htmlFor="top-k">
              Trechos recuperados (Top-K)
            </label>

            <input
              id="top-k"
              type="number"
              min={1}
              max={20}
              value={config.topK}
              onChange={event =>
                updateConfig({
                  topK: Math.min(
                    20,
                    Math.max(1, Number(event.target.value) || 1)
                  )
                })
              }
            />
          </div>
        )}
      </div>

      {config.mode === 'rag' && (
        <div className="control-row full">
          <label htmlFor="rag-topic">
            Tema para busca semântica
          </label>

          <input
            id="rag-topic"
            value={config.topic}
            onChange={event =>
              updateConfig({
                topic: event.target.value
              })
            }
            placeholder="Ex.: fotossíntese e cloroplastos"
          />
        </div>
      )}

      <div className="notice-box">
        {isAI
          ? 'O Ollama precisa estar em execução para sugerir questões. Você sempre poderá revisar o resultado.'
          : 'Neste modo, você pode criar, editar e exportar questões sem Ollama e sem RAG.'}
      </div>
    </section>
  )
}