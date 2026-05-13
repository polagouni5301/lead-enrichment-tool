import { Bell, Download, Search, ShieldCheck, UserRound } from 'lucide-react'
import { exportLeads } from '../../services/exportService'
import { useLeadStore } from '../../store/useLeadStore'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

export function Header() {
  const leads = useLeadStore((state) => state.leads)
  const exportable = leads.filter((lead) => lead.status === 'Enrichment Complete' || lead.status === 'Exported')

  return (
    <header className="border-b border-black/[0.06] bg-brand-background/80 px-4 py-4 backdrop-blur-xl lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-brand-gray">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            Enterprise workspace
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-brand-ink sm:text-3xl">Lead Enrichment & Validation</h1>
        </div>

        <div className="flex flex-1 flex-col gap-3 md:max-w-2xl md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-gray" />
            <Input aria-label="Search leads" placeholder="Search company, domain, owner..." className="bg-white/80 pl-9" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <Bell className="h-5 w-5" aria-hidden="true" />
              Notifications
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
              onClick={() => void exportLeads(exportable, 'xlsx')}
              disabled={exportable.length === 0}
            >
              Export
            </Button>
            <div className="flex h-11 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 shadow-sm">
              <UserRound className="h-5 w-5 text-brand-coral" aria-hidden="true" />
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-extrabold text-brand-ink">Ava Patel</p>
                <p className="text-xs font-semibold text-brand-muted">Revenue Ops</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
