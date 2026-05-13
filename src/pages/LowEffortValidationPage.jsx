import { motion } from 'framer-motion'
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Globe2,
  Landmark,
  Link2Off,
  MapPin,
  Sparkles,
  Store,
  XCircle,
} from 'lucide-react'
import { useMemo } from 'react'
import { DataTable } from '../components/data/DataTable'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { EmptyState } from '../components/ui/empty-state'
import { ConfidenceMeter } from '../components/workflow/ConfidenceMeter'
import { StatusBadge } from '../components/workflow/StatusBadge'
import { useLeadStore } from '../store/useLeadStore'
import { cn } from '../utils/cn'

function ValidationResultCard({ card }) {
  const Icon = card.result === 'Pass' ? CheckCircle2 : card.result === 'Fail' ? XCircle : AlertTriangle
  const tone = card.result === 'Pass' ? 'success' : card.result === 'Fail' ? 'danger' : 'warning'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-black/[0.06] bg-white/75 p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              card.result === 'Pass'
                ? 'bg-emerald-50 text-emerald-700'
                : card.result === 'Fail'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-amber-50 text-amber-700',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-extrabold text-brand-ink">{card.type}</h3>
              <Badge tone={tone}>{card.result}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-brand-muted">{card.reasoning}</p>
          </div>
        </div>
        <div className="min-w-28">
          <ConfidenceMeter value={card.confidence} />
        </div>
      </div>
      <ul className="mt-4 grid gap-2 text-sm text-brand-muted sm:grid-cols-3">
        {card.details.map((detail) => (
          <li key={detail} className="rounded-xl bg-brand-card/80 px-3 py-2">
            {detail}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

const validationSignals = [
  { title: 'Company website', description: 'Exists, live, and business-facing', Icon: Globe2 },
  { title: 'Business type', description: 'Real SMB versus chain or suspicious entity', Icon: Store },
  { title: 'Location & language', description: 'Region, language, and geo consistency', Icon: MapPin },
  { title: 'Social presence', description: 'LinkedIn, Instagram, and Google Business', Icon: Sparkles },
  { title: 'Domain ownership', description: 'Marketplace, aggregator, or unrelated service', Icon: Link2Off },
  { title: 'Too-big enterprise', description: 'Česká Pošta, Żabka, Carrefour-style chains', Icon: Landmark },
]

function failedReason(lead) {
  return lead.lowEffortResults.find((result) => result.result === 'Fail')?.type ?? 'None'
}

export function LowEffortValidationPage() {
  const leads = useLeadStore((state) => state.leads)
  const setCurrentStep = useLeadStore((state) => state.setCurrentStep)
  const runLowEffortValidation = useLeadStore((state) => state.runLowEffortValidation)
  const processingLeadIds = useLeadStore((state) => state.processingLeadIds)
  const addToast = useLeadStore((state) => state.addToast)

  const queue = useMemo(
    () =>
      leads.filter(
        (lead) =>
          lead.status === 'Uploaded' ||
          lead.status === 'Low Effort Validation Passed' ||
          lead.status === 'Low Effort Validation Failed',
      ),
    [leads],
  )
  const pendingLeads = queue.filter((lead) => lead.status === 'Uploaded')
  const processedLeads = queue.filter((lead) => lead.status !== 'Uploaded')
  const passedLeads = processedLeads.filter((lead) => lead.status === 'Low Effort Validation Passed')
  const failedLeads = processedLeads.filter((lead) => lead.status === 'Low Effort Validation Failed')
  const isRunning = processingLeadIds.length > 0

  const runBulkValidation = async () => {
    if (!pendingLeads.length) {
      addToast({
        title: 'No pending leads',
        description: 'Every lead in this queue has already been validated.',
        variant: 'info',
      })
      return
    }

    await Promise.all(pendingLeads.map((lead) => runLowEffortValidation(lead.id)))
  }

  const leadColumns = useMemo(
    () => [
      {
        accessorKey: 'companyName',
        header: 'Company',
        cell: ({ row }) => <span className="font-extrabold text-brand-ink">{row.original.companyName}</span>,
      },
      { accessorKey: 'region', header: 'Region' },
      { accessorKey: 'industry', header: 'Industry' },
      { accessorKey: 'websiteDomainName', header: 'Website' },
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

          return (
            <Button
              type="button"
              size="sm"
              isLoading={processing}
              disabled={lead.status !== 'Uploaded' || processing}
              onClick={() => void runLowEffortValidation(lead.id)}
              leftIcon={<BrainCircuit className="h-4 w-4" aria-hidden="true" />}
            >
              {lead.status === 'Uploaded' ? 'Run LLM' : 'Validated'}
            </Button>
          )
        },
      },
    ],
    [processingLeadIds, runLowEffortValidation],
  )

  const resultColumns = useMemo(
    () => [
      {
        accessorKey: 'companyName',
        header: 'Company',
        cell: ({ row }) => <span className="font-extrabold text-brand-ink">{row.original.companyName}</span>,
      },
      { accessorKey: 'region', header: 'Region' },
      {
        accessorKey: 'status',
        header: 'Result',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'category',
        header: 'Category',
        cell: ({ row }) =>
          row.original.disqualificationCategory ? (
            <Badge tone="danger">{row.original.disqualificationCategory}</Badge>
          ) : (
            <Badge tone="success">Passed</Badge>
          ),
      },
      {
        id: 'failedReason',
        header: 'Failed Step',
        cell: ({ row }) => failedReason(row.original),
      },
      {
        id: 'confidence',
        header: 'Avg Confidence',
        cell: ({ row }) => {
          const results = row.original.lowEffortResults
          const average = results.length
            ? results.reduce((total, result) => total + result.confidence, 0) / results.length
            : 0

          return <span className="font-extrabold text-brand-ink">{Math.round(average)}%</span>
        },
      },
    ],
    [],
  )

  if (!queue.length) {
    return (
      <EmptyState
        title="No uploaded leads waiting"
        description="Upload a lead before running low effort enrichment."
        action={<Button onClick={() => setCurrentStep('upload')}>Go to upload</Button>}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="text-2xl">Low effort enrichment</CardTitle>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone="neutral">{pendingLeads.length} pending</Badge>
                <Badge tone="success">{passedLeads.length} passed</Badge>
                <Badge tone="danger">{failedLeads.length} failed</Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => void runBulkValidation()}
                isLoading={isRunning}
                disabled={!pendingLeads.length || isRunning}
                leftIcon={<BrainCircuit className="h-4 w-4" aria-hidden="true" />}
              >
                Run LLM Validation
              </Button>
              <Button
                type="button"
                variant="success"
                onClick={() => setCurrentStep('manual')}
                disabled={!passedLeads.length}
                rightIcon={<ChevronRight className="h-4 w-4" aria-hidden="true" />}
              >
                Move Passed Leads to Manual Validation
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {validationSignals.map(({ title, description, Icon }) => (
              <div key={title} className="rounded-3xl border border-black/[0.06] bg-white/70 p-4">
                <Icon className="h-5 w-5 text-brand-coral" aria-hidden="true" />
                <p className="mt-3 font-extrabold text-brand-ink">{title}</p>
                <p className="mt-1 text-sm leading-5 text-brand-muted">{description}</p>
              </div>
            ))}
          </div>

          <DataTable
            data={queue}
            columns={leadColumns}
            searchPlaceholder="Search leads to validate"
            pageSize={6}
            renderExpanded={(lead) =>
              lead.lowEffortResults.length ? (
                <div className="space-y-3">
                  {lead.lowEffortResults.map((result) => (
                    <ValidationResultCard key={result.id} card={result} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl bg-white/70 p-4 text-sm font-semibold text-brand-muted">
                  LLM validation has not run for this lead yet.
                </div>
              )
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation results</CardTitle>
          <CardDescription>Passed leads are available on the manual validation page. Failed leads remain stopped with DQ or AISDR.</CardDescription>
        </CardHeader>
        <CardContent>
          {processedLeads.length ? (
            <DataTable
              data={processedLeads}
              columns={resultColumns}
              searchPlaceholder="Search passed or failed leads"
              pageSize={5}
              renderExpanded={(lead) => (
                <div className="space-y-3">
                  {lead.lowEffortResults.map((result) => (
                    <ValidationResultCard key={result.id} card={result} />
                  ))}
                </div>
              )}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white/60 p-10 text-center">
              <p className="text-lg font-extrabold text-brand-ink">No validation results yet</p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Run bulk validation or use an individual row action to populate passed and failed leads here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
