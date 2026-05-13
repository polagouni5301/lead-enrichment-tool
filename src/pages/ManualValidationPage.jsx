import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Clock3, FileCheck2, History, Save, ShieldX, UserCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '../components/data/DataTable'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { EmptyState } from '../components/ui/empty-state'
import { Progress } from '../components/ui/progress'
import { Switch } from '../components/ui/switch'
import { Textarea } from '../components/ui/textarea'
import { StatusBadge } from '../components/workflow/StatusBadge'
import { allManualChecksComplete, useLeadStore } from '../store/useLeadStore'
import { formatDateTime } from '../utils/format'

const checklist = [
  {
    key: 'duplicateCheck',
    label: 'Duplicate check',
    description: 'Confirm the lead is not already active in this workspace or CRM ownership queue.',
  },
  {
    key: 'internalOwnership',
    label: 'Internal ownership',
    description: 'Check assigned owner, territory fit, and account conflict rules.',
  },
  {
    key: 'industryValidation',
    label: 'Industry validation',
    description: 'Verify industry alignment with target enrichment campaign criteria.',
  },
  {
    key: 'previousDisqualification',
    label: 'Previous disqualification check',
    description: 'Review historical DQ/AISDR signals before re-approving the lead.',
  },
  {
    key: 'tagEnrichment',
    label: 'Tag enrichment result',
    description: 'Apply qualification tags so downstream enrichment can prioritize contacts.',
  },
]

function checklistProgress(lead) {
  return (Object.values(lead.manualChecks).filter(Boolean).length / checklist.length) * 100
}

export function ManualValidationPage() {
  const [isReviewing, setIsReviewing] = useState(false)
  const leads = useLeadStore((state) => state.leads)
  const activeLeadId = useLeadStore((state) => state.activeLeadId)
  const setActiveLead = (id) => {
    useLeadStore.getState().setActiveLead(id)
    setIsReviewing(true)
  }
  const setCurrentStep = useLeadStore((state) => state.setCurrentStep)
  const updateManualChecks = useLeadStore((state) => state.updateManualChecks)
  const updateManualNotes = useLeadStore((state) => state.updateManualNotes)
  const approveManualValidation = useLeadStore((state) => state.approveManualValidation)
  const rejectManualValidation = useLeadStore((state) => state.rejectManualValidation)
  const addToast = useLeadStore((state) => state.addToast)

  const queue = useMemo(
    () =>
      leads.filter(
        (lead) =>
          lead.status === 'Low Effort Validation Passed' ||
          lead.status === 'Manual Validation Passed' ||
          lead.status === 'Manual Validation Failed',
      ),
    [leads],
  )
  const activeLead = queue.find((lead) => lead.id === activeLeadId) ?? queue[0]
  const completedChecks = activeLead ? Object.values(activeLead.manualChecks).filter(Boolean).length : 0
  const completion = activeLead ? checklistProgress(activeLead) : 0

  const columns = useMemo(
    () => [
      {
        accessorKey: 'companyName',
        header: 'Company',
        cell: ({ row }) => (
          <button
            type="button"
            className="text-left font-extrabold text-brand-ink hover:text-brand-coral"
            onClick={() => setActiveLead(row.original.id)}
          >
            {row.original.companyName}
          </button>
        ),
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
        id: 'progress',
        header: 'Checklist',
        cell: ({ row }) => {
          const value = checklistProgress(row.original)
          return <span className="font-extrabold text-brand-ink">{Math.round(value)}%</span>
        },
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <Button type="button" variant="outline" size="sm" onClick={() => setActiveLead(row.original.id)}>
            Review
          </Button>
        ),
      },
    ],
    [setActiveLead],
  )

  if (!activeLead) {
    return (
      <EmptyState
        title="Manual queue is empty"
        description="Only LLM-passed leads can be manually validated."
        action={<Button onClick={() => setCurrentStep('lowEffort')}>Open low effort enrichment</Button>}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <AnimatePresence mode="wait">
        {!isReviewing ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-2xl">Human validation workspace</CardTitle>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="success">
                        {queue.filter((lead) => lead.status === 'Low Effort Validation Passed').length} ready
                      </Badge>
                      <Badge tone="info">
                        {queue.filter((lead) => lead.status === 'Manual Validation Passed').length} approved
                      </Badge>
                      <Badge tone="danger">
                        {queue.filter((lead) => lead.status === 'Manual Validation Failed').length} rejected
                      </Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="success"
                    onClick={() => useLeadStore.getState().setCurrentStep('enrichment')}
                    disabled={!queue.some((lead) => lead.status === 'Manual Validation Passed')}
                  >
                    Open Enrichment Queue
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable data={queue} columns={columns} searchPlaceholder="Search manual validation leads" pageSize={6} />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-black/[0.06] bg-white/50 shadow-sm backdrop-blur-sm hover:bg-white"
                onClick={() => setIsReviewing(false)}
                leftIcon={<ArrowLeft className="h-4 w-4 text-brand-coral" />}
              >
                <span className="font-extrabold text-brand-ink">Back to validation queue</span>
              </Button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="h-fit">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-2xl">{activeLead.companyName}</CardTitle>
                    <StatusBadge status={activeLead.status} />
                    <Badge tone="info">{activeLead.owner}</Badge>
                  </div>
                  <CardDescription className="text-sm font-semibold">{activeLead.websiteDomainName} · {activeLead.region}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-4 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Region</p>
                      <p className="mt-1 font-extrabold text-brand-ink">{activeLead.region}</p>
                    </div>
                    <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-4 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Website</p>
                      <a href={`https://${activeLead.websiteDomainName}`} target="_blank" rel="noreferrer" className="mt-1 block truncate font-extrabold text-brand-coral hover:underline">
                        {activeLead.websiteDomainName}
                      </a>
                    </div>
                    <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-4 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Company LinkedIn</p>
                      <a className="mt-1 block truncate font-extrabold text-brand-coral hover:underline" href={activeLead.companyLinkedInUrl} target="_blank" rel="noreferrer">
                        View Profile
                      </a>
                    </div>
                    <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-4 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Employee LinkedIn</p>
                      <a className="mt-1 block truncate font-extrabold text-brand-coral hover:underline" href={activeLead.employeeLinkedInUrl} target="_blank" rel="noreferrer">
                        View Contact
                      </a>
                    </div>
                    {activeLead.enrichment && (
                      <>
                        <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-4 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Decision Maker</p>
                          <p className="mt-1 font-extrabold text-brand-ink">{activeLead.enrichment.keyDecisionMakerName || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-4 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Position</p>
                          <p className="mt-1 font-extrabold text-brand-ink">{activeLead.enrichment.position || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-4 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Email</p>
                          <p className="mt-1 font-extrabold text-brand-ink">{activeLead.enrichment.emailAddress || 'N/A'}</p>
                        </div>
                        <div className="rounded-2xl border border-black/[0.04] bg-white/60 p-4 shadow-sm">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gray">Phone</p>
                          <p className="mt-1 font-extrabold text-brand-ink">{activeLead.enrichment.phoneNumber || 'N/A'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-2xl">Validation checklist</CardTitle>
                      <CardDescription className="font-medium">All mandatory validations must be complete before enrichment unlocks.</CardDescription>
                    </div>
                    <Badge tone={allManualChecksComplete(activeLead.manualChecks) ? 'success' : 'warning'}>
                      {completedChecks}/{checklist.length} complete
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Progress value={completion} label="Manual validation progress" />
                  <div className="space-y-3">
                    {checklist.map((item) => (
                      <div key={item.key} className="flex items-center justify-between gap-6 rounded-3xl border border-black/[0.06] bg-white/70 p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-coral/10 text-brand-coral">
                            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-brand-ink">{item.label}</p>
                            <p className="truncate text-xs font-medium text-brand-muted">{item.description}</p>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <Switch
                            checked={activeLead.manualChecks[item.key]}
                            onCheckedChange={(checked) => updateManualChecks(activeLead.id, { [item.key]: checked })}
                            label={item.label}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-extrabold text-brand-ink" htmlFor="agent-notes">
                      Agent notes
                    </label>
                    <Textarea
                      id="agent-notes"
                      placeholder="Add validation context, edge cases, or ownership notes..."
                      value={activeLead.manualNotes}
                      onChange={(event) => updateManualNotes(activeLead.id, event.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => addToast({ title: 'Progress saved', description: 'Manual checklist and notes were retained.', variant: 'success' })}
                    >
                      Save Progress
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      leftIcon={<ShieldX className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => {
                        rejectManualValidation(activeLead.id)
                        setIsReviewing(false)
                      }}
                      disabled={activeLead.status === 'Manual Validation Failed'}
                    >
                      Reject Lead
                    </Button>
                    <Button
                      type="button"
                      variant="success"
                      leftIcon={<UserCheck className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => {
                        approveManualValidation(activeLead.id)
                        if (allManualChecksComplete(activeLead.manualChecks)) {
                          setIsReviewing(false)
                        }
                      }}
                      disabled={activeLead.status === 'Manual Validation Passed' || !allManualChecksComplete(activeLead.manualChecks)}
                    >
                      Approve for Enrichment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
