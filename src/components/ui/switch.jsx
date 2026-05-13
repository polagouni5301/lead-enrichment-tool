import { cn } from '../../utils/cn'

export function Switch({ checked, onCheckedChange, label, className, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cn(
        'relative inline-flex h-7 w-12 items-center rounded-full border border-black/10 transition',
        checked ? 'bg-emerald-500' : 'bg-brand-gray/25',
        className,
      )}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
