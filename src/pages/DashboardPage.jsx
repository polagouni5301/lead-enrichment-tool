import { motion } from 'framer-motion'
import { Activity, Clock3, DatabaseZap, Download, Filter, RefreshCw, Trophy, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { exportDashboardReport } from '../services/exportService'
import { useLeadStore } from '../store/useLeadStore'
import { formatPercent } from '../utils/format'

const colors = ['#FD4E59', '#FFAB28', '#0EA5E9', '#10B981', '#6D7069']

function computeFilteredMetrics(leads) {
  const processed = leads.filter((lead) => lead.status !== 'Uploaded').length
  const dropped = leads.filter((lead) => lead.status.includes('Failed')).length
  const enriched = leads.filter((lead) => lead.status === 'Enrichment Complete' || lead.status === 'Exported').length
  const passed = leads.filter(
    (lead) =>
      lead.status === 'Manual Validation Passed' ||
      lead.status === 'Enrichment Complete' ||
      lead.status === 'Exported',
  ).length
  const confidenceTotal = leads.reduce((total, lead) => total + (lead.enrichment?.confidenceScore ?? 0), 0)
  const confidenceCount = leads.filter((lead) => lead.enrichment).length

  return {
    totalUploaded: leads.length,
    leadsProcessed: processed,
    leadsDropped: dropped,
    leadsEnriched: enriched,
    passRate: processed ? (passed / processed) * 100 : 0,
    failureRate: processed ? (dropped / processed) * 100 : 0,
    completionRate: leads.length ? (enriched / leads.length) * 100 : 0,
    averageConfidence: confidenceCount ? confidenceTotal / confidenceCount : 0,
  }
}

export function DashboardPage() {
  const leads = useLeadStore((state) => state.leads)
  const [region, setRegion] = useState('All')
  const [industry, setIndustry] = useState('All')
  const [status, setStatus] = useState('All')
  const [agent, setAgent] = useState('All')
  const [confidence, setConfidence] = useState(0)
  const [dateFrom, setDateFrom] = useState('2026-05-01')
  const [dateTo, setDateTo] = useState('2026-05-12')
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const regions = ['All', ...Array.from(new Set(leads.map((lead) => lead.region)))]
  const industries = ['All', ...Array.from(new Set(leads.map((lead) => lead.industry)))]
  const statuses = ['All', ...Array.from(new Set(leads.map((lead) => lead.status)))]
  const agents = ['All', ...Array.from(new Set(leads.map((lead) => lead.owner)))]

  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const confidenceScore = lead.enrichment?.confidenceScore ?? 0
        return (
          (region === 'All' || lead.region === region) &&
          (industry === 'All' || lead.industry === industry) &&
          (status === 'All' || lead.status === status) &&
          (agent === 'All' || lead.owner === agent) &&
          confidenceScore >= confidence &&
          lead.date >= dateFrom &&
          lead.date <= dateTo
        )
      }),
    [leads, region, industry, status, agent, confidence, dateFrom, dateTo],
  )

  const metrics = computeFilteredMetrics(filteredLeads)
  const funnelData = [
    { name: 'Upload', value: filteredLeads.length, fill: '#FD4E59' },
    { name: 'AI Validation', value: filteredLeads.filter((lead) => lead.status !== 'Uploaded').length, fill: '#FFAB28' },
    {
      name: 'Manual Validation',
      value: filteredLeads.filter(
        (lead) =>
          lead.status === 'Manual Validation Passed' ||
          lead.status === 'Manual Validation Failed' ||
          lead.status === 'Enrichment Complete' ||
          lead.status === 'Exported',
      ).length,
      fill: '#0EA5E9',
    },
    {
      name: 'Enrichment',
      value: filteredLeads.filter((lead) => lead.status === 'Enrichment Complete' || lead.status === 'Exported').length,
      fill: '#10B981',
    },
    { name: 'Export', value: filteredLeads.filter((lead) => lead.status === 'Exported').length, fill: '#6D7069' },
  ]

  const barData = regions
    .filter((item) => item !== 'All')
    .map((item) => ({
      region: item,
      uploaded: filteredLeads.filter((lead) => lead.region === item).length,
      enriched: filteredLeads.filter((lead) => lead.region === item && lead.enrichment).length,
    }))

  const trendData = [
    { day: 'May 8', uploaded: 9, enriched: 3, dropped: 1 },
    { day: 'May 9', uploaded: 13, enriched: 5, dropped: 2 },
    { day: 'May 10', uploaded: 18, enriched: 8, dropped: 2 },
    { day: 'May 11', uploaded: 22, enriched: 11, dropped: 3 },
    { day: 'May 12', uploaded: metrics.totalUploaded, enriched: metrics.leadsEnriched, dropped: metrics.leadsDropped },
  ]

  const pieData = statuses
    .filter((item) => item !== 'All')
    .map((item) => ({ name: item.replace(' Validation ', ' '), value: filteredLeads.filter((lead) => lead.status === item).length }))
    .filter((item) => item.value > 0)

  const leaderboard = ['Ava Patel', 'Mila Reyes', 'Noah Kim', 'Iris Chen'].map((agent) => {
    const owned = filteredLeads.filter((lead) => lead.owner === agent)
    const enriched = owned.filter((lead) => lead.enrichment).length
    return {
      agent,
      reviewed: owned.length,
      enriched,
      score: owned.length ? Math.round((enriched / owned.length) * 100) : 0,
    }
  })

  const averageProcessing =
    filteredLeads.length === 0
      ? 0
      : Math.round(filteredLeads.reduce((total, lead) => total + lead.processingTimeMinutes, 0) / filteredLeads.length)
  const slaMet = filteredLeads.filter((lead) => lead.processingTimeMinutes <= lead.slaHours * 60).length
  const slaRate = filteredLeads.length ? (slaMet / filteredLeads.length) * 100 : 0

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge tone="coral">Screen 5</Badge>
              <CardTitle className="mt-3 text-2xl">Analytics dashboard</CardTitle>
              <CardDescription>Track enrichment performance, validation quality, SLA health, and agent throughput.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">Live · {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Badge>
              <Button
                type="button"
                variant="outline"
                leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setLastRefresh(new Date())}
              >
                Refresh
              </Button>
              <Button
                type="button"
                leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
                onClick={() => void exportDashboardReport(metrics, filteredLeads)}
              >
                Export dashboard reports
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
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
              ['agent', 'Agent', agent, setAgent, agents],
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
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-brand-gray" htmlFor="confidence">Confidence range</label>
              <div className="rounded-2xl border border-black/10 bg-white px-3 py-2">
                <input
                  id="confidence"
                  type="range"
                  min={0}
                  max={100}
                  value={confidence}
                  onChange={(event) => setConfidence(Number(event.target.value))}
                  className="w-full accent-brand-coral"
                />
                <p className="text-xs font-bold text-brand-muted">Min {confidence}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total leads uploaded', value: metrics.totalUploaded, Icon: Users, tone: 'info' },
          { label: 'Leads processed', value: metrics.leadsProcessed, Icon: Activity, tone: 'coral' },
          { label: 'Leads dropped', value: metrics.leadsDropped, Icon: Filter, tone: 'danger' },
          { label: 'Leads enriched', value: metrics.leadsEnriched, Icon: DatabaseZap, tone: 'success' },
        ].map(({ label, value, Icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-brand-muted">{label}</p>
                <p className="mt-2 text-3xl font-extrabold text-brand-ink">{value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-coral/10 text-brand-coral">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <Badge tone={tone} className="mt-4">Current filter</Badge>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Pass rate', formatPercent(metrics.passRate), metrics.passRate],
          ['Failure rate', formatPercent(metrics.failureRate), metrics.failureRate],
          ['Enrichment completion', formatPercent(metrics.completionRate), metrics.completionRate],
          ['Average confidence score', formatPercent(metrics.averageConfidence), metrics.averageConfidence],
        ].map(([label, value, progress]) => (
          <Card key={label} className="p-5">
            <p className="text-sm font-bold text-brand-muted">{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-brand-ink">{value}</p>
            <Progress value={Number(progress)} className="mt-4" />
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workflow funnel</CardTitle>
            <CardDescription>Upload to export conversion across validation stages.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart margin={{ top: 20, right: 120, bottom: 20, left: 20 }}>
                <Tooltip />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList position="right" fill="#6D7069" stroke="none" dataKey="name" fontSize={12} fontWeight={700} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Region processing</CardTitle>
            <CardDescription>Uploaded versus enriched leads by region.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,25,22,0.08)" />
                <XAxis dataKey="region" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="uploaded" fill="#FD4E59" radius={[10, 10, 0, 0]} />
                <Bar dataKey="enriched" fill="#10B981" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Line trends</CardTitle>
            <CardDescription>Daily uploaded, enriched, and dropped lead movement.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(22,25,22,0.08)" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="uploaded" stroke="#FD4E59" strokeWidth={3} />
                <Line type="monotone" dataKey="enriched" stroke="#10B981" strokeWidth={3} />
                <Line type="monotone" dataKey="dropped" stroke="#6D7069" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status mix</CardTitle>
            <CardDescription>Current validation and enrichment state distribution.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={96} paddingAngle={3}>
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-brand-orange" aria-hidden="true" />
              <CardTitle>Enrichment agent leaderboard</CardTitle>
            </div>
            <CardDescription>Agent throughput and enriched-lead conversion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.map((agent, index) => (
              <div key={agent.agent} className="flex items-center justify-between gap-4 rounded-3xl border border-black/[0.06] bg-white/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-orange/15 font-extrabold text-[#9a6100]">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-extrabold text-brand-ink">{agent.agent}</p>
                    <p className="text-sm text-brand-muted">{agent.reviewed} reviewed · {agent.enriched} enriched</p>
                  </div>
                </div>
                <Badge tone={agent.score >= 75 ? 'success' : 'warning'}>{agent.score}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-brand-coral" aria-hidden="true" />
              <CardTitle>SLA and processing analytics</CardTitle>
            </div>
            <CardDescription>Processing time and SLA tracking across the filtered pipeline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-5">
                <p className="text-sm font-bold text-brand-muted">Average processing time</p>
                <p className="mt-2 text-3xl font-extrabold text-brand-ink">{averageProcessing}m</p>
              </div>
              <div className="rounded-3xl border border-black/[0.06] bg-white/70 p-5">
                <p className="text-sm font-bold text-brand-muted">SLA met</p>
                <p className="mt-2 text-3xl font-extrabold text-brand-ink">{formatPercent(slaRate)}</p>
              </div>
            </div>
            <Progress value={slaRate} label="SLA compliance" />
            <div className="rounded-3xl border border-brand-coral/15 bg-brand-coral/5 p-4">
              <p className="font-extrabold text-brand-ink">Real-time refresh active</p>
              <p className="mt-1 text-sm leading-6 text-brand-muted">
                Dashboard filters, exports, charts, and KPI cards recalculate instantly from the workflow store.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
