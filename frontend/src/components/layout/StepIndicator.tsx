import { Check, ChevronRight } from 'lucide-react'

interface StepIndicatorProps {
  current: 1 | 2 | 3
}

const steps = [
  'Preparação',
  'Revisão',
  'Exportação'
]

export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <div
      className="step-indicator"
      aria-label={`Etapa ${current} de 3`}
    >
      {steps.map((label, index) => {
        const stepNumber = index + 1
        const isCurrent = stepNumber === current
        const isDone = stepNumber < current

        return (
          <div
            key={label}
            className={`step-item ${isCurrent ? 'is-current' : ''} ${
              isDone ? 'is-done' : ''
            }`}
          >
            <span className="step-number">
              {isDone ? (
                <Check size={16} />
              ) : (
                stepNumber
              )}
            </span>

            <span>{label}</span>

            {index < steps.length - 1 && (
              <ChevronRight
                size={16}
                className="step-chevron"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}