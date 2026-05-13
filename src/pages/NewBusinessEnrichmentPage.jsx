import { motion } from 'framer-motion'
import { Filter, Search, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DataTable } from '../components/data/DataTable'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { StatusBadge } from '../components/workflow/StatusBadge'
import { useLeadStore } from '../store/useLeadStore'

export function NewBusinessEnrichmentPage() {
  const leads = useLeadStore((state) => state.leads)

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [region, setRegion] = useState('All')
  const [industry, setIndustry] = useState('All')
  const [status, setStatus] = useState('All')
  const [agent, setAgent] = useState('All')

  const regions = ['All', ...Array.from(new Set(leads.map((lead) => lead.region)))]
  const industries = ['All', ...Array.from(new Set(leads.map((lead) => lead.industry)))]
  const statuses = ['All', ...Array.from(new Set(leads.map((lead) => lead.status)))]
  const agents = ['All', ...Array.from(new Set(leads.map((lead) => lead.owner)))]

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      return (
        (region === 'All' || lead.region === region) &&
        (industry === 'All' || lead.industry === industry) &&
        (status === 'All' || lead.status === status) &&
        (agent === 'All' || lead.owner === agent) &&
        (!dateFrom || lead.date >= dateFrom) &&
        (!dateTo || lead.date <= dateTo)
      )
    })
  }, [leads, region, industry, status, agent, dateFrom, dateTo])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'companyName',
        header: 'Company',
        cell: ({ row }) => <span className="font-extrabold text-brand-ink">{row.original.companyName}</span>,
      },
      {
        id: 'decisionMaker',
        header: 'Decision Maker',
        cell: ({ row }) => row.original.enrichment?.keyDecisionMakerName || 'N/A',
      },
      {
        id: 'email',
        header: 'Email',
        cell: ({ row }) => row.original.enrichment?.emailAddress || 'N/A',
      },
      {
        id: 'phone',
        header: 'Phone',
        cell: ({ row }) => row.original.enrichment?.phoneNumber || 'N/A',
      },
      {
        id: 'confidence',
        header: 'Confidence',
        cell: ({ row }) => row.original.enrichment ? `${row.original.enrichment.confidenceScore}%` : 'N/A',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'owner',
        header: 'Agent Name',
        cell: ({ row }) => row.original.owner,
      },
    ],
    []
  )

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">New Business Enrichment data</CardTitle>
          <CardDescription>Filter and view all enrichment data in a tabular format.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-brand-gray" htmlFor="date-from">Date from</label>
              <input id="date-from" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-brand-gray" htmlFor="date-to">Date to</label>
              <input id="date-to" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold" />
            </div>
            {[
              ['region', 'Region', region, setRegion, regions],
              ['industry', 'Industry', industry, setIndustry, industries],
              ['status', 'Validation status', status, setStatus, statuses],
              ['agent', 'Agent name', agent, setAgent, agents],
            ].map(([id, label, value, setter, options]) => (
              <div className="space-y-2" key={id}>
                <label className="text-xs font-bold uppercase text-brand-gray" htmlFor={id}>{label}</label>
                <select
                  id={id}
                  value={value}
                  onChange={(event) => setter(event.target.value)}
                  className="h-11 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold"
                >
                  {options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <DataTable
            data={filteredLeads}
            columns={columns}
            searchPlaceholder="Search enrichment data"
            pageSize={10}
          />
        </CardContent>
      </Card>
    </motion.div>
  )
}
