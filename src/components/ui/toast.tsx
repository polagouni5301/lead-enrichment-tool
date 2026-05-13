import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useLeadStore } from '../../store/useLeadStore'
import { cn } from '../../utils/cn'
import { Button } from './button'

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const tones = {
  success: 'border-emerald-500/20 bg-emerald-50 text-emerald-700',
  error: 'border-red-500/20 bg-red-50 text-red-700',
  info: 'border-sky-500/20 bg-sky-50 text-sky-700',
}

export function ToastViewport() {
  const toasts = useLeadStore((state) => state.toasts)
  const dismissToast = useLeadStore((state) => state.dismissToast)

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const variant = toast.variant ?? 'info'
          const Icon = icons[variant]

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.96 }}
              className={cn(
                'pointer-events-auto rounded-3xl border p-4 shadow-soft backdrop-blur',
                tones[variant],
              )}
            >
              <div className="flex gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-1 text-sm leading-5 text-brand-muted">{toast.description}</p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-xl"
                  onClick={() => dismissToast(toast.id)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  Dismiss notification
                </Button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
