import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, CircleDot, Lock } from 'lucide-react'
import { useLeadStore } from '../../store/useLeadStore'
import { cn } from '../../utils/cn'

const steps = [
  { id: 'upload', label: 'Upload Leads', short: 'Upload' },
  { id: 'lowEffort', label: 'Low Effort Enrichment', short: 'LLM Gate' },
  { id: 'manual', label: 'Manual Validation', short: 'Manual' },
  { id: 'enrichment', label: 'Enrichment', short: 'Enrich' },
  { id: 'dashboard', label: 'Dashboard', short: 'Dashboard' },
]

export function ProgressStepper() {
  const currentStep = useLeadStore((state) => state.currentStep)
  const setCurrentStep = useLeadStore((state) => state.setCurrentStep)
  const canAccessStep = useLeadStore((state) => state.canAccessStep)
  const activeIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className="sticky top-0 z-30 border-b border-black/[0.06] bg-brand-background/85 px-4 py-3 backdrop-blur-xl lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto scrollbar-thin">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep
          const isComplete = index < activeIndex
          const isUnlocked = canAccessStep(step.id)

          return (
            <div key={step.id} className="flex min-w-max flex-1 items-center">
              <button
                type="button"
                className={cn(
                  'group relative flex min-w-max items-center gap-2 rounded-2xl px-3 py-2 text-left transition',
                  isActive ? 'bg-white shadow-sm' : 'hover:bg-white/70',
                  !isUnlocked && 'cursor-not-allowed opacity-55',
                )}
                onClick={() => setCurrentStep(step.id)}
                aria-current={isActive ? 'step' : undefined}
                aria-disabled={!isUnlocked}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border text-sm font-extrabold',
                    isComplete
                      ? 'border-emerald-500/20 bg-emerald-50 text-emerald-700'
                      : isActive
                        ? 'border-brand-coral/20 bg-brand-coral/10 text-brand-coral'
                        : 'border-black/10 bg-white text-brand-gray',
                  )}
                >
                  {!isUnlocked ? (
                    <Lock className="h-4 w-4" aria-hidden="true" />
                  ) : isComplete ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  ) : isActive ? (
                    <CircleDot className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="hidden sm:block">
                  <span className="block text-sm font-extrabold text-brand-ink">{step.label}</span>
                  <span className="block text-xs font-semibold text-brand-muted">
                    {isUnlocked ? (isComplete ? 'Completed' : isActive ? 'In progress' : 'Ready') : 'Locked'}
                  </span>
                </span>
                <span className="text-sm font-extrabold text-brand-ink sm:hidden">{step.short}</span>
                <AnimatePresence>
                  {isActive ? (
                    <motion.span
                      layoutId="step-pill"
                      className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-brand-coral/20"
                    />
                  ) : null}
                </AnimatePresence>
              </button>
              {index < steps.length - 1 ? <span className="mx-2 h-px min-w-5 flex-1 bg-black/10" /> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
