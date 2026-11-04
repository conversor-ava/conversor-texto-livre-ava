import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'

interface ToastProps {
  notice: {
    kind: 'success' | 'error' | 'info'
    text: string
  }
  onClose: () => void
}

export function Toast({ notice, onClose }: ToastProps) {
  const Icon =
    notice.kind === 'success'
      ? CheckCircle
      : notice.kind === 'error'
        ? AlertCircle
        : Info

  return (
    <div
      className={`toast toast-${notice.kind}`}
      role="alert"
    >
      <Icon size={20} />

      <span>{notice.text}</span>

      <button
        type="button"
        aria-label="Fechar aviso"
        onClick={onClose}
      >
        <X size={17} />
      </button>
    </div>
  )
}