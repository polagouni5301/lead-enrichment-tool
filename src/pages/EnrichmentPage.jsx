import { motion } from 'framer-motion'
import { ChevronDown, Clipboard, DatabaseZap, Download, RefreshCcw, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '../components/data/DataTable'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { EmptyState } from '../components/ui/empty-state'
import { ConfidenceMeter } from '../components/workflow/ConfidenceMeter'
import { StatusBadge } from '../components/workflow/StatusBadge'
import { exportLeads } from '../services/exportService'
import { useLeadStore } from '../store/useLeadStore'
import { cn } from '../utils/cn'

function valueOrFallback(value) {
  return value && value.trim() ? value : 'No information found'
}

export function EnrichmentPage() {
  const [selectedIds, setSelectedIds] = useState([])
  const leads = useLeadStore((state) => state.leads)
  const setCurrentStep = useLeadStore((state) => state.setCurrentStep)
  const runEnrichment = useLeadStore((state) => state.runEnrichment)
  const markExported = useLeadStore((state) => state.markExported)
  const addToast = useLeadStore((state) => state.addToast)
  const processingLeadIds = useLeadStore((state) => state.processingLeadIds)

  const queue = useMemo(
    () =>
      leads.filter(
        (lead) =>
          lead.status === 'Manual Validation Passed' ||
          lead.status === 'Enrichment Complete' ||
          lead.status === 'Exported',
      ),
    [leads],
  )

  const pendingLeads = queue.filter((lead) => lead.status === 'Manual Validation Passed')
  const processedLeads = queue.filter((lead) => lead.enrichment)
  const selectedLeads = processedLeads.filter((lead) => selectedIds.includes(lead.id))
  const isRunning = processingLeadIds.some((leadId) => queue.some((lead) => lead.id === leadId))

  function toggleSelected(leadId, checked) {
    setSelectedIds((current) => (checked ? [...new Set([...current, leadId])] : current.filter((id) => id !== leadId)))
  }

  function toggleSelectAll(checked) {
    if (checked) {
      setSelectedIds(processedLeads.map((lead) => lead.id))
    } else {
      setSelectedIds([])
    }
  }

  async function copy(value) {
    await navigator.clipboard.writeText(value)
    addToast({ title: 'Copied', description: value, variant: 'success' })
  }

  async function runBulkEnrichment() {
    if (!pendingLeads.length) {
      addToast({
        title: 'No pending enrichment',
        description: 'Every approved lead has already been enriched or exported.',
        variant: 'info',
      })
      return
    }

    await Promise.all(pendingLeads.map((lead) => runEnrichment(lead.id)))
  }

  function exportSelection(format) {
    const exportable = selectedLeads.length ? selectedLeads : processedLeads
    if (!exportable.length) {
      addToast({ title: 'No enriched records', description: 'Run enrichment before exporting results.', variant: 'error' })
      return
    }
    void exportLeads(exportable, format)
    markExported(exportable.map((lead) => lead.id))
  }

  const queueColumns = useMemo(
    () => [
      {
        accessorKey: 'companyName',
        header: 'Company',
        cell: ({ row }) => <span className="font-extrabold text-brand-ink">{row.original.companyName}</span>,
      },
      { accessorKey: 'region', header: 'Region' },
      { accessorKey: 'industry', header: 'Industry' },
      { accessorKey: 'websiteDomainName', header: 'Website' },
      { accessorKey: 'emailDomainName', header: 'Email Domain' },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => {
          const lead = row.original
          const processing = processingLeadIds.includes(lead.id)
          const canRun = lead.status !== 'Exported'

          return (
            <Button
              type="button"
              size="sm"
              variant={lead.enrichment ? 'outline' : 'primary'}
              isLoading={processing}
              disabled={!canRun || processing}
              onClick={() => void runEnrichment(lead.id)}
              leftIcon={lead.enrichment ? <RefreshCcw className="h-4 w-4" aria-hidden="true" /> : <DatabaseZap className="h-4 w-4" aria-hidden="true" />}
            >
              {lead.enrichment ? 'Retry' : 'Enrich'}
            </Button>
          )
        },
      },
    ],
    [processingLeadIds, runEnrichment],
  )

  const resultColumns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all"
            checked={selectedIds.length === processedLeads.length && processedLeads.length > 0}
            onChange={(event) => toggleSelectAll(event.target.checked)}
            className="h-4 w-4 rounded border-black/20 accent-brand-coral"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.companyName}`}
            checked={selectedIds.includes(row.original.id)}
            onChange={(event) => toggleSelected(row.original.id, event.target.checked)}
            className="h-4 w-4 rounded border-black/20 accent-brand-coral"
          />
        ),
      },
      {
        accessorKey: 'companyName',
        header: 'Company',
        cell: ({ row }) => <span className="font-extrabold text-brand-ink">{row.original.companyName}</span>,
      },
      {
        id: 'decisionMaker',
        header: 'Decision Maker',
        cell: ({ row }) => valueOrFallback(row.original.enrichment?.keyDecisionMakerName),
      },
      {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => {
          const email = valueOrFallback(row.original.enrichment?.emailAddress)
          return (
            <button
              type="button"
              className="inline-flex items-center gap-2 font-semibold text-brand-coral disabled:text-brand-muted"
              onClick={() => void copy(email)}
              disabled={email === 'No information found'}
            >
              {email}
              {email !== 'No information found' ? <Clipboard className="h-3.5 w-3.5" aria-hidden="true" /> : null}
            </button>
          )
        },
      },
      {
        id: 'phone',
        header: 'Phone',
        cell: ({ row }) => valueOrFallback(row.original.enrichment?.phoneNumber),
      },
      {
        id: 'position',
        header: 'Position',
        cell: ({ row }) => valueOrFallback(row.original.enrichment?.position),
      },
      {
        id: 'otherContacts',
        header: 'Other Contacts',
        cell: ({ row }) => {
          const contacts = row.original.enrichment?.additionalContacts ?? []
          if (contacts.length === 0) return 'No other contacts'
          return (
            <div className="group relative">
              <span className="cursor-help font-bold text-brand-coral underline decoration-dotted">
                {contacts.length} found
              </span>
              <div className="absolute left-0 top-full z-50 mt-2 hidden w-64 rounded-xl border border-black/10 bg-white p-3 shadow-xl group-hover:block">
                <ul className="space-y-2">
                  {contacts.map((contact) => (
                    <li key={contact.id} className="text-xs">
                      <p className="font-bold text-brand-ink">{contact.name}</p>
                      <p className="text-brand-muted">{contact.title}</p>
                      <p className="text-brand-coral">{contact.email}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        },
      },
      {
        id: 'llmComments',
        header: 'LLM Comments',
        cell: ({ row }) => {
          const results = row.original.lowEffortResults
          const lastPass = results.filter((r) => r.result === 'Pass').pop()
          return lastPass ? lastPass.reasoning : 'No comments'
        },
      },
      {
        id: 'confidence',
        header: 'Confidence',
        cell: ({ row }) =>
          row.original.enrichment ? (
            <div className="w-24">
              <ConfidenceMeter value={row.original.enrichment.confidenceScore} label="" />
            </div>
          ) : (
            <Badge tone="neutral">Pending</Badge>
          ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const lead = row.original
          const statusOptions = ['Enrichment Complete', 'Ready to contact', 'Not enrichable']
          const currentStatus = lead.status === 'Exported' ? 'Enrichment Complete' : lead.status

          return (
            <div className="relative inline-block w-40">
              <select
                value={currentStatus}
                onChange={(e) => useLeadStore.getState().updateLeadStatus(lead.id, e.target.value)}
                className={cn(
                  'w-full appearance-none rounded-xl border-black/10 bg-white px-3 py-1.5 pr-8 text-xs font-bold transition focus:ring-2 focus:ring-brand-coral/20',
                  lead.status === 'Not enrichable' ? 'text-red-600' : 'text-brand-ink',
                )}
              >
                {!statusOptions.includes(currentStatus) && (
                  <option value={currentStatus}>{currentStatus}</option>
                )}
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 'Enrichment Complete' ? 'enrichment complete' : opt === 'Ready to contact' ? 'ready to contact' : 'not enrichable'}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-muted" />
            </div>
          )
        },
      },
    ],
    [selectedIds, processedLeads],
  )

  if (!queue.length) {
    return (
      <EmptyState
        title="No leads approved for enrichment"
        description="Manual validation must pass before enrichment can run."
        action={<Button onClick={() => setCurrentStep('manual')}>Open manual validation</Button>}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-2xl">Medium/high effort enrichment</CardTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="warning">{pendingLeads.length} waiting</Badge>
                <Badge tone="success">{processedLeads.length} processed</Badge>
                <Badge tone="orange">{queue.filter((lead) => lead.status === 'Exported').length} exported</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void runBulkEnrichment()}
                isLoading={isRunning}
                disabled={!pendingLeads.length || isRunning}
                leftIcon={<DatabaseZap className="h-4 w-4" aria-hidden="true" />}
              >
                Bulk Enrichment
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={() => setCurrentStep('dashboard')}
                disabled={!processedLeads.length}
              >
                Mark Complete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={queue}
            columns={queueColumns}
            searchPlaceholder="Search enrichment queue"
            pageSize={6}
            renderExpanded={(lead) => (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase text-brand-gray">Company LinkedIn</p>
                  <a className="mt-1 block break-all font-semibold text-brand-coral" href={lead.companyLinkedInUrl} target="_blank" rel="noreferrer">
                    {lead.companyLinkedInUrl}
                  </a>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase text-brand-gray">Employee LinkedIn</p>
                  <a className="mt-1 block break-all font-semibold text-brand-coral" href={lead.employeeLinkedInUrl} target="_blank" rel="noreferrer">
                    {lead.employeeLinkedInUrl}
                  </a>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase text-brand-gray">Owner</p>
                  <p className="mt-1 font-extrabold text-brand-ink">{lead.owner}</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-xs font-bold uppercase text-brand-gray">Contacts Found</p>
                  <p className="mt-1 font-extrabold text-brand-ink">
                    {lead.enrichment ? lead.enrichment.additionalContacts.length + 1 : 0}
                  </p>
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Processed enrichment results</CardTitle>
              <CardDescription>Export all processed rows or select specific records from the table.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => exportSelection('xlsx')} leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}>
                XLSX
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => exportSelection('csv')} leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}>
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {processedLeads.length ? (
            <DataTable
              data={processedLeads}
              columns={resultColumns}
              searchPlaceholder="Filter processed enrichment results"
              pageSize={5}
              renderExpanded={(lead) => (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-white/70 p-4">
                    <p className="text-xs font-bold uppercase text-brand-gray">Position</p>
                    <p className="mt-1 font-extrabold text-brand-ink">{valueOrFallback(lead.enrichment?.position)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4">
                    <p className="text-xs font-bold uppercase text-brand-gray">Phone</p>
                    <p className="mt-1 font-extrabold text-brand-ink">{valueOrFallback(lead.enrichment?.phoneNumber)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4">
                    <p className="text-xs font-bold uppercase text-brand-gray">Additional Contacts</p>
                    <p className="mt-1 font-extrabold text-brand-ink">{lead.enrichment?.additionalContacts.length ?? 0}</p>
                  </div>
                </div>
              )}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white/60 p-10 text-center">
              <p className="text-lg font-extrabold text-brand-ink">No processed enrichment yet</p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Run bulk enrichment or enrich an individual row to populate export-ready results.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
