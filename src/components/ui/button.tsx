import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-coral text-white shadow-lift hover:-translate-y-0.5 hover:bg-[#ec3f4b] disabled:bg-brand-coral/50',
  secondary:
    'bg-brand-orange text-brand-ink shadow-sm hover:-translate-y-0.5 hover:bg-[#f5a01c] disabled:bg-brand-orange/50',
  ghost: 'bg-transparent text-brand-muted hover:bg-brand-cream/70',
  outline:
    'border border-black/10 bg-white/70 text-brand-ink shadow-sm hover:-translate-y-0.5 hover:border-brand-coral/40 hover:bg-white',
  danger: 'bg-red-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-700',
  success: 'bg-emerald-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-emerald-700',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 gap-2 rounded-xl px-3 text-sm',
  md: 'h-11 gap-2 rounded-2xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-2xl px-5 text-base',
  icon: 'h-10 w-10 rounded-2xl p-0',
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap font-semibold transition-all duration-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-70',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : leftIcon}
      {size !== 'icon' ? children : <span className="sr-only">{children}</span>}
      {!isLoading ? rightIcon : null}
    </button>
  )
}
