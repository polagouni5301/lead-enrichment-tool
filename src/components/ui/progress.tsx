import { cn } from '../../utils/cn'

type ProgressProps = {
  value: number
  className?: string
  indicatorClassName?: string
  label?: string
}

export function Progress({ value, className, indicatorClassName, label }: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <div className="flex items-center justify-between text-xs font-bold text-brand-muted">
          <span>{label}</span>
          <span>{Math.round(safeValue)}%</span>
        </div>
      ) : null}
      <div
        className="h-2.5 overflow-hidden rounded-full bg-black/[0.06]"
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r from-brand-coral to-brand-orange transition-all duration-500',
            indicatorClassName,
          )}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}
