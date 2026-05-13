import ExcelJS from 'exceljs'
import type { DashboardMetrics, Lead } from '../types/lead'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function flattenLead(lead: Lead) {
  return {
    Company: lead.companyName,
    Region: lead.region,
    Industry: lead.industry,
    Status: lead.status,
    Owner: lead.owner,
    Website: lead.websiteDomainName,
    'Email Domain': lead.emailDomainName,
    'Decision Maker': lead.enrichment?.keyDecisionMakerName ?? 'No information found',
    Position: lead.enrichment?.position ?? 'No information found',
    Email: lead.enrichment?.emailAddress ?? 'No information found',
    Phone: lead.enrichment?.phoneNumber ?? 'No information found',
    Confidence: lead.enrichment?.confidenceScore ?? 0,
  }
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (value: unknown) => {
    const stringValue = String(value ?? '')
    return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue
  }
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n')
}

async function writeWorkbook(sheets: Array<{ name: string; rows: Record<string, unknown>[] }>, filename: string) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'EnrichIQ'
  workbook.created = new Date()

  sheets.forEach((sheet) => {
    const worksheet = workbook.addWorksheet(sheet.name)
    const headers = Object.keys(sheet.rows[0] ?? { Empty: '' })
    worksheet.columns = headers.map((header) => ({
      header,
      key: header,
      width: Math.min(Math.max(header.length + 8, 16), 32),
    }))
    worksheet.addRows(sheet.rows.length ? sheet.rows : [{ Empty: 'No data' }])
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF0DC' },
    }
  })

  const buffer = await workbook.xlsx.writeBuffer()
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename,
  )
}

export async function exportLeads(leads: Lead[], format: 'xlsx' | 'csv' | 'json') {
  const rows = leads.map(flattenLead)
  const timestamp = new Date().toISOString().slice(0, 10)

  if (format === 'json') {
    downloadBlob(
      new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
      `lead-enrichment-${timestamp}.json`,
    )
    return
  }

  if (format === 'csv') {
    const csv = toCsv(rows)
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `lead-enrichment-${timestamp}.csv`)
    return
  }

  await writeWorkbook([{ name: 'Leads', rows }], `lead-enrichment-${timestamp}.xlsx`)
}

export async function exportDashboardReport(metrics: DashboardMetrics, leads: Lead[]) {
  await writeWorkbook(
    [
      { name: 'Metrics', rows: [metrics as unknown as Record<string, unknown>] },
      { name: 'Pipeline', rows: leads.map(flattenLead) },
    ],
    `lead-dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}

export async function createTemplateWorkbook() {
  await writeWorkbook(
    [
      {
        name: 'Template',
        rows: [
          {
            date: '2026-05-12',
            region: 'Poland',
            industry: 'Hospitality',
            companyName: 'Lumora Bistro',
            companyLinkedInUrl: 'https://www.linkedin.com/company/lumora-bistro',
            employeeLinkedInUrl: 'https://www.linkedin.com/in/marta-kowalska',
            websiteDomainName: 'lumorabistro.pl',
            emailDomainName: 'lumorabistro.pl',
          },
        ],
      },
    ],
    'lead-upload-template.xlsx',
  )
}
