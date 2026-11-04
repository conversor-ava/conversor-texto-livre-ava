import {
  useRef,
  type ChangeEvent,
  type DragEvent
} from 'react'
import {
  CloudUpload,
  FileCheck,
  FileText,
  LoaderCircle,
  X
} from 'lucide-react'
import { useEvaluation } from '../../hooks/useEvaluation'

export function DocumentInput() {
  const { config, updateConfig, loadFile, busy } = useEvaluation()
  const inputRef = useRef<HTMLInputElement>(null)

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      void loadFile(file)
    }

    event.target.value = ''
  }

  function dropFile(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()

    if (busy !== null) {
      return
    }

    const file = event.dataTransfer.files[0]

    if (file) {
      void loadFile(file)
    }
  }

  return (
    <section className="panel">
      <div className="section-title">
        <div className="icon-bubble blue">
          <FileText size={21} />
        </div>

        <div>
          <h2>Material de referência</h2>

          <p>
            Cole um texto ou extraia conteúdo de um documento.
          </p>
        </div>
      </div>

      <div
        className="dropzone"
        onDragOver={event => event.preventDefault()}
        onDrop={dropFile}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          aria-label="Selecionar arquivo"
          className="visually-hidden"
          onChange={selectFile}
        />

        <div className="upload-icon">
          {busy === 'extract' ? (
            <LoaderCircle size={25} className="spin" />
          ) : (
            <CloudUpload size={26} />
          )}
        </div>

        <strong>
          {busy === 'extract'
            ? 'Extraindo texto...'
            : 'Arraste um arquivo aqui ou selecione'}
        </strong>

        <span>
          PDF, DOCX ou TXT · Até 5 MB
        </span>

        <button
          type="button"
          className="button button-outline"
          disabled={busy !== null}
          onClick={() => inputRef.current?.click()}
        >
          Selecionar arquivo
        </button>
      </div>

      {config.filename && (
        <div className="selected-file">
          <FileCheck size={18} />

          <span>{config.filename}</span>

          <button
            type="button"
            aria-label="Limpar arquivo"
            onClick={() =>
              updateConfig({
                filename: null,
                text: ''
              })
            }
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="input-separator">
        <span>OU COLE O CONTEÚDO</span>
      </div>

      <label
        htmlFor="source-text"
        className="field-label"
      >
        Texto-base
      </label>

      <textarea
        id="source-text"
        className="source-textarea"
        value={config.text}
        onChange={event =>
          updateConfig({
            text: event.target.value,
            filename: null
          })
        }
        placeholder="Cole aqui o material didático que será utilizado para criar questões..."
        rows={8}
      />

      <div className="field-footer">
        {config.text.length.toLocaleString('pt-BR')} caracteres
      </div>
    </section>
  )
}