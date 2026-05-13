import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export const Input = forwardRef(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-2xl border border-black/10 bg-white px-4 text-sm text-brand-ink shadow-sm transition placeholder:text-brand-gray/70 hover:border-brand-coral/30 focus:border-brand-coral focus:bg-white',
        className,
      )}
      {...props}
    />
  ),
)

Input.displayName = 'Input'
