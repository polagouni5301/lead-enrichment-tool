import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-28 w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-brand-ink shadow-sm transition placeholder:text-brand-gray/70 hover:border-brand-coral/30 focus:border-brand-coral',
        className,
      )}
      {...props}
    />
  ),
)

Textarea.displayName = 'Textarea'
