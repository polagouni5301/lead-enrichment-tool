import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { Download, FileSpreadsheet, Save, ShieldCheck, UploadCloud } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import ExcelJS from 'exceljs'
import { z } from 'zod'
import { DataTable } from '../components/data/DataTable'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Progress } from '../components/ui/progress'
import { createTemplateWorkbook } from '../services/exportService'
import { useLeadStore } from '../store/useLeadStore'
import { normalizeDomain } from '../utils/format'

const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

const uploadSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  region: z.string().min(2, 'Region is required'),
  industry: z.string().min(2, 'Industry is required'),
  companyName: z.string().min(2, 'Company name is required'),
  companyLinkedInUrl: z.string().url('Enter a valid URL').includes('linkedin.com', {
    message: 'Company LinkedIn URL must be a LinkedIn URL',
  }),
  employeeLinkedInUrl: z.string().url('Enter a valid URL').includes('linkedin.com/in/', {
    message: 'Employee LinkedIn URL must be a profile URL',
  }),
  websiteDomainName: z
    .string()
    .transform(normalizeDomain)
    .refine((value) => domainRegex.test(value), 'Enter a valid website domain'),
  emailDomainName: z
    .string()
    .transform(normalizeDomain)
    .refine((value) => domainRegex.test(value), 'Enter a valid email domain'),
})

const defaultValues = {
  date: new Date().toISOString().slice(0, 10),
  region: 'Poland',
  industry: 'Hospitality',
  companyName: '',
  companyLinkedInUrl: '',
  employeeLinkedInUrl: '',
  websiteDomainName: '',
  emailDomainName: '',
}

function mapWorkbookRow(row) {
  return {
    date: String(row.date ?? row.Date ?? ''),
    region: String(row.region ?? row.Region ?? ''),
    industry: String(row.industry ?? row.Industry ?? ''),
    companyName: String(row.companyName ?? row['Company Name'] ?? row.company ?? ''),
    companyLinkedInUrl: String(row.companyLinkedInUrl ?? row['Company LinkedIn URL'] ?? ''),
    employeeLinkedInUrl: String(row.employeeLinkedInUrl ?? row['Employee LinkedIn URL'] ?? ''),
    websiteDomainName: normalizeDomain(String(row.websiteDomainName ?? row['Website Domain Name'] ?? '')),
    emailDomainName: normalizeDomain(String(row.emailDomainName ?? row['Email Domain Name'] ?? '')),
  }
}

function cellValueToString(value) {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') return value.text
    if ('hyperlink' in value && typeof value.hyperlink === 'string') return value.hyperlink
    if ('result' in value) return String(value.result ?? '')
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('')
    }
  }
  return String(value)
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean)
  const headers = headerLine.split(',').map((header) => header.trim())
  return lines.map((line) => {
    const values = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''))
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? ''
      return row
    }, {})
  })
}

async function parseWorkbook(file) {
  if (/\.csv$/i.test(file.name)) {
    return parseCsv(await file.text())
  }

  const buffer = await file.arrayBuffer()
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []

  const headerRow = worksheet.getRow(1)
  const headers = []
  headerRow.eachCell((cell, columnNumber) => {
    headers[columnNumber] = cellValueToString(cell.value).trim()
  })

  const rows = []
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const record = {}
    row.eachCell((cell, columnNumber) => {
      const header = headers[columnNumber]
      if (header) record[header] = cellValueToString(cell.value)
    })
    if (Object.keys(record).length) rows.push(record)
  })

  return rows
}

export function UploadPage() {
  const [method, setMethod] = useState('individual')
  const [draftLeads, setDraftLeads] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isParsing, setIsParsing] = useState(false)
  const fileInputRef = useRef(null)
  const leads = useLeadStore((state) => state.leads)
  const uploadLeads = useLeadStore((state) => state.uploadLeads)
  const addToast = useLeadStore((state) => state.addToast)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(uploadSchema),
    defaultValues,
  })

  const duplicateDomains = useMemo(() => new Set(leads.map((lead) => normalizeDomain(lead.websiteDomainName))), [leads])

  const draftColumns = useMemo(
    () => [
      {
        accessorKey: 'companyName',
        header: 'Company',
        cell: ({ row }) => <span className="font-bold text-brand-ink">{row.original.companyName}</span>,
      },
      { accessorKey: 'region', header: 'Region' },
      { accessorKey: 'industry', header: 'Industry' },
      { accessorKey: 'websiteDomainName', header: 'Website' },
      {
        id: 'validity',
        header: 'Validation',
        cell: ({ row }) => {
          const domain = normalizeDomain(row.original.websiteDomainName)
          const duplicate = duplicateDomains.has(domain)
          const valid = uploadSchema.safeParse(row.original).success
          return duplicate ? (
            <Badge tone="danger">Duplicate</Badge>
          ) : valid ? (
            <Badge tone="success">Ready</Badge>
          ) : (
            <Badge tone="warning">Needs review</Badge>
          )
        },
      },
    ],
    [duplicateDomains],
  )

  function saveDraft(values) {
    const parsed = uploadSchema.parse(values)
    setDraftLeads((current) => [parsed, ...current])
    addToast({ title: 'Draft saved', description: 'Lead added to the upload preview.', variant: 'success' })
    reset(defaultValues)
  }

  async function parseFile(file) {
    const validExtension = /\.(xlsx|xls|csv)$/i.test(file.name)
    if (!validExtension) {
      addToast({
        title: 'Unsupported file',
        description: 'Upload an XLSX, XLS, or CSV file.',
        variant: 'error',
      })
      return
    }

    setIsParsing(true)
    setUploadProgress(8)
    const interval = window.setInterval(() => setUploadProgress((value) => Math.min(value + 18, 92)), 240)

    try {
      const rows = await parseWorkbook(file)
      const mappedRows = rows.map(mapWorkbookRow)
      const validRows = mappedRows.filter((row) => uploadSchema.safeParse(row).success)

      if (validRows.length === 0) {
        addToast({
          title: 'No valid rows found',
          description: 'Check mandatory fields, LinkedIn URLs, and domain formatting.',
          variant: 'error',
        })
        return
      }

      setDraftLeads((current) => [...validRows, ...current])
      setUploadProgress(100)
      addToast({
        title: 'File parsed',
        description: `${validRows.length} valid record${validRows.length === 1 ? '' : 's'} added to preview.`,
        variant: 'success',
      })
    } finally {
      window.clearInterval(interval)
      window.setTimeout(() => {
        setIsParsing(false)
        setUploadProgress(0)
      }, 900)
    }
  }

  function validateUpload() {
    const invalidCount = draftLeads.filter((lead) => !uploadSchema.safeParse(lead).success).length
    const duplicateCount = draftLeads.filter((lead) => duplicateDomains.has(normalizeDomain(lead.websiteDomainName))).length

    if (invalidCount || duplicateCount) {
      addToast({
        title: 'Upload needs attention',
        description: `${invalidCount} invalid and ${duplicateCount} duplicate record${invalidCount + duplicateCount === 1 ? '' : 's'} found.`,
        variant: 'error',
      })
      return false
    }

    addToast({
      title: 'Upload validation passed',
      description: 'All preview records are ready for AI validation.',
      variant: 'success',
    })
    return true
  }

  async function proceedToValidation() {
    if (!validateUpload() || draftLeads.length === 0) return
    await uploadLeads(draftLeads)
    setDraftLeads([])
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-black/[0.06] bg-white/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Badge tone="coral">Screen 1</Badge>
                <CardTitle className="mt-3 text-2xl">Lead upload intake</CardTitle>
                <CardDescription>
                  Add single leads or stage a spreadsheet upload with duplicate checks, URL validation, and domain normalization.
                </CardDescription>
              </div>
              <div className="flex rounded-2xl border border-black/10 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  className={`rounded-xl px-3 py-2 text-sm font-extrabold transition ${
                    method === 'individual' ? 'bg-brand-coral text-white' : 'text-brand-muted hover:bg-brand-cream'
                  }`}
                  onClick={() => setMethod('individual')}
                >
                  Individual Entry
                </button>
                <button
                  type="button"
                  className={`rounded-xl px-3 py-2 text-sm font-extrabold transition ${
                    method === 'bulk' ? 'bg-brand-coral text-white' : 'text-brand-muted hover:bg-brand-cream'
                  }`}
                  onClick={() => setMethod('bulk')}
                >
                  Bulk Upload
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {method === 'individual' ? (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(saveDraft)}>
                {[
                  ['date', 'Date', 'date'],
                  ['region', 'Region', 'text'],
                  ['industry', 'Industry', 'text'],
                  ['companyName', 'Company Name', 'text'],
                  ['companyLinkedInUrl', 'Company LinkedIn URL', 'url'],
                  ['employeeLinkedInUrl', 'Employee LinkedIn URL', 'url'],
                  ['websiteDomainName', 'Website Domain Name', 'text'],
                  ['emailDomainName', 'Email Domain Name', 'text'],
                ].map(([name, label, type]) => (
                  <div className="space-y-2" key={name}>
                    <Label htmlFor={name}>{label}</Label>
                    <Input id={name} type={type} {...register(name)} />
                    {errors[name]?.message ? (
                      <p className="text-xs font-semibold text-red-600">
                        {String(errors[name]?.message)}
                      </p>
                    ) : null}
                  </div>
                ))}
                <div className="flex flex-wrap gap-3 sm:col-span-2">
                  <Button
                    type="submit"
                    variant="outline"
                    isLoading={isSubmitting}
                    leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={validateUpload}
                    leftIcon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                    disabled={draftLeads.length === 0}
                  >
                    Validate Upload
                  </Button>
                  <Button
                    type="button"
                    onClick={proceedToValidation}
                    leftIcon={<UploadCloud className="h-4 w-4" aria-hidden="true" />}
                    disabled={draftLeads.length === 0}
                  >
                    Proceed to Validation
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-3xl border-2 border-dashed border-brand-coral/30 bg-white/70 p-8 text-center transition hover:border-brand-coral hover:bg-white"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    const file = event.dataTransfer.files[0]
                    if (file) void parseFile(file)
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void parseFile(file)
                    }}
                  />
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-coral/10 text-brand-coral">
                    <FileSpreadsheet className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-xl font-extrabold text-brand-ink">Drop Excel or CSV leads here</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-brand-muted">
                    Required columns match the individual lead fields. Records are previewed before they enter validation.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Button type="button" onClick={() => fileInputRef.current?.click()}>
                      Choose file
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
                      onClick={() => void createTemplateWorkbook()}
                    >
                      Download Excel template
                    </Button>
                  </div>
                </motion.div>
                {isParsing ? <Progress value={uploadProgress} label="Upload progress" /> : null}
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={validateUpload}
                    leftIcon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                    disabled={draftLeads.length === 0}
                  >
                    Validate Upload
                  </Button>
                  <Button
                    type="button"
                    onClick={proceedToValidation}
                    leftIcon={<UploadCloud className="h-4 w-4" aria-hidden="true" />}
                    disabled={draftLeads.length === 0}
                  >
                    Proceed to Validation
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload quality gates</CardTitle>
            <CardDescription>Validation rules run before leads enter the AI queue.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                ['Mandatory fields', 'Date, region, company, LinkedIn, and domains are required.'],
                ['Proper URL formats', 'Company and employee LinkedIn URLs must pass URL validation.'],
                ['Duplicate uploads', 'Website domains are checked against existing workspace records.'],
                ['Domain formatting', 'Domains are normalized by removing protocol and trailing slashes.'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-2xl border border-black/[0.06] bg-white/70 p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                    <p className="font-extrabold text-brand-ink">{title}</p>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-brand-muted">{description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Preview uploaded records</CardTitle>
              <CardDescription>Review staged leads before confirmation. Pagination is enabled for larger files.</CardDescription>
            </div>
            <Badge tone={draftLeads.length ? 'orange' : 'neutral'}>{draftLeads.length} staged</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {draftLeads.length ? (
            <DataTable data={draftLeads} columns={draftColumns} searchPlaceholder="Search staged leads" pageSize={5} />
          ) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white/60 p-10 text-center">
              <p className="text-lg font-extrabold text-brand-ink">No staged uploads yet</p>
              <p className="mt-2 text-sm text-brand-muted">Save an individual lead or import a spreadsheet to preview records here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
