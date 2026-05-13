import { cn } from '../../utils/cn'

const tones = {
  neutral: 'border-black/10 bg-white/70 text-brand-muted',
  success: 'border-emerald-500/20 bg-emerald-50 text-emerald-700',
  danger: 'border-red-500/20 bg-red-50 text-red-700',
  warning: 'border-amber-500/20 bg-amber-50 text-amber-700',
  info: 'border-sky-500/20 bg-sky-50 text-sky-700',
  coral: 'border-brand-coral/20 bg-brand-coral/10 text-brand-coral',
  orange: 'border-brand-orange/30 bg-brand-orange/15 text-[#9a6100]',
}

export function Badge({ className, tone = 'neutral', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
