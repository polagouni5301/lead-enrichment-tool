import { motion } from 'framer-motion'
import { CheckCircle2, Clock3, FileCheck2, History, Save, ShieldX, UserCheck } from 'lucide-react'
import { useMemo } from 'react'
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
  const leads = useLeadStore((state) => state.leads)
  const activeLeadId = useLeadStore((state) => state.activeLeadId)
  const setActiveLead = useLeadStore((state) => state.setActiveLead)
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
              onClick={() => setCurrentStep('enrichment')}
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

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{activeLead.companyName}</CardTitle>
              <StatusBadge status={activeLead.status} />
              <Badge tone="info">{activeLead.owner}</Badge>
            </div>
            <CardDescription>{activeLead.websiteDomainName} · {activeLead.region} · {activeLead.industry}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 text-sm">
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="font-bold text-brand-gray">Company LinkedIn</p>
                <a className="break-all font-semibold text-brand-coral" href={activeLead.companyLinkedInUrl} target="_blank" rel="noreferrer">
                  {activeLead.companyLinkedInUrl}
                </a>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <p className="font-bold text-brand-gray">Employee LinkedIn</p>
                <a className="break-all font-semibold text-brand-coral" href={activeLead.employeeLinkedInUrl} target="_blank" rel="noreferrer">
                  {activeLead.employeeLinkedInUrl}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Validation checklist</CardTitle>
                <CardDescription>All mandatory validations must be complete before enrichment unlocks.</CardDescription>
              </div>
              <Badge tone={allManualChecksComplete(activeLead.manualChecks) ? 'success' : 'warning'}>
                {completedChecks}/{checklist.length} complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Progress value={completion} label="Manual validation progress" />
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4 rounded-3xl border border-black/[0.06] bg-white/70 p-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-coral/10 text-brand-coral">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="font-extrabold text-brand-ink">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-brand-muted">{item.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={activeLead.manualChecks[item.key]}
                    onCheckedChange={(checked) => updateManualChecks(activeLead.id, { [item.key]: checked })}
                    label={item.label}
                  />
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
                onClick={() => rejectManualValidation(activeLead.id)}
                disabled={activeLead.status === 'Manual Validation Failed'}
              >
                Reject Lead
              </Button>
              <Button
                type="button"
                variant="success"
                leftIcon={<UserCheck className="h-4 w-4" aria-hidden="true" />}
                onClick={() => approveManualValidation(activeLead.id)}
                disabled={activeLead.status === 'Manual Validation Passed'}
              >
                Approve for Enrichment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit trail & validation history</CardTitle>
          <CardDescription>Timestamped activity captures agent attribution and system decisions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeLead.validationHistory.map((event) => (
              <div key={event.id} className="rounded-3xl border border-black/[0.06] bg-white/70 p-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-brand-coral" aria-hidden="true" />
                  <p className="font-extrabold text-brand-ink">{event.action}</p>
                </div>
                <p className="mt-2 text-sm text-brand-muted">{event.actor}</p>
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-brand-gray">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDateTime(event.timestamp)}
                </div>
                {event.note ? <p className="mt-3 rounded-2xl bg-brand-card p-3 text-sm text-brand-muted">{event.note}</p> : null}
              </div>
            ))}
            <div className="rounded-3xl border border-dashed border-brand-coral/25 bg-brand-coral/5 p-4">
              <FileCheck2 className="h-5 w-5 text-brand-coral" aria-hidden="true" />
              <p className="mt-3 font-extrabold text-brand-ink">Agent attribution</p>
              <p className="mt-1 text-sm leading-6 text-brand-muted">Current manual owner is Mila Reyes. New approvals write to the lead history.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
