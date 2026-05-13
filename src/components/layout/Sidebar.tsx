import {
  BarChart3,
  BrainCircuit,
  CheckSquare,
  DatabaseZap,
  Lock,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react'
import { useMemo } from 'react'
import { useLeadStore } from '../../store/useLeadStore'
import type { WorkflowStep } from '../../types/lead'
import { cn } from '../../utils/cn'

const navItems: Array<{ id: WorkflowStep; label: string; icon: LucideIcon }> = [
  { id: 'upload', label: 'Upload Leads', icon: UploadCloud },
  { id: 'lowEffort', label: 'Low Effort Enrichment', icon: BrainCircuit },
  { id: 'manual', label: 'Manual Validation', icon: CheckSquare },
  { id: 'enrichment', label: 'Enrichment', icon: DatabaseZap },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
]

export function Sidebar() {
  const currentStep = useLeadStore((state) => state.currentStep)
  const setCurrentStep = useLeadStore((state) => state.setCurrentStep)
  const canAccessStep = useLeadStore((state) => state.canAccessStep)
  const leads = useLeadStore((state) => state.leads)
  const metrics = useMemo(() => {
    const processed = leads.filter((lead) => lead.status !== 'Uploaded').length
    const passed = leads.filter(
      (lead) =>
        lead.status === 'Manual Validation Passed' ||
        lead.status === 'Enrichment Complete' ||
        lead.status === 'Exported',
    ).length

    return {
      totalUploaded: leads.length,
      passRate: processed === 0 ? 0 : (passed / processed) * 100,
    }
  }, [leads])

  return (
    <aside className="hidden w-72 shrink-0 border-r border-black/[0.06] bg-white/65 p-5 backdrop-blur-xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-coral to-brand-orange text-white shadow-lift">
          <DatabaseZap className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-extrabold text-brand-ink">EnrichIQ</p>
          <p className="text-xs font-bold uppercase text-brand-gray">AI Sales Intel</p>
        </div>
      </div>

      <nav className="mt-8 space-y-2" aria-label="Primary workflow">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = currentStep === item.id
          const unlocked = canAccessStep(item.id)

          return (
            <button
              type="button"
              key={item.id}
              onClick={() => setCurrentStep(item.id)}
              aria-disabled={!unlocked}
              className={cn(
                'flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-extrabold transition',
                active ? 'bg-brand-coral text-white shadow-lift' : 'text-brand-muted hover:bg-brand-cream/80 hover:text-brand-ink',
                !unlocked && 'cursor-not-allowed opacity-55',
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label}
              </span>
              {!unlocked ? <Lock className="h-4 w-4" aria-hidden="true" /> : null}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-black/[0.06] bg-brand-card p-4">
        <p className="text-xs font-bold uppercase text-brand-gray">Pipeline Pulse</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-2xl font-extrabold text-brand-ink">{metrics.totalUploaded}</p>
            <p className="text-xs font-semibold text-brand-muted">Uploaded</p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-brand-ink">{Math.round(metrics.passRate)}%</p>
            <p className="text-xs font-semibold text-brand-muted">Pass rate</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
