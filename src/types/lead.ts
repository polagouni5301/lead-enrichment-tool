export type WorkflowStep = 'upload' | 'lowEffort' | 'manual' | 'enrichment' | 'dashboard'

export type LeadStatus =
  | 'Uploaded'
  | 'Low Effort Validation Passed'
  | 'Low Effort Validation Failed'
  | 'Manual Validation Passed'
  | 'Manual Validation Failed'
  | 'Enrichment Complete'
  | 'Exported'

export type DisqualificationCategory = 'DQ' | 'AISDR' | null

export type ValidationResult = 'Pass' | 'Fail' | 'Review'

export type ValidationCard = {
  id: string
  type: string
  result: ValidationResult
  confidence: number
  reasoning: string
  details: string[]
}

export type ManualChecks = {
  duplicateCheck: boolean
  internalOwnership: boolean
  industryValidation: boolean
  previousDisqualification: boolean
  tagEnrichment: boolean
}

export type AuditEvent = {
  id: string
  actor: string
  action: string
  timestamp: string
  note?: string
}

export type Contact = {
  id: string
  name: string
  title: string
  email: string
  phone: string
  confidence: number
  source: string
}

export type EnrichmentResult = {
  keyDecisionMakerName: string
  position: string
  emailAddress: string
  phoneNumber: string
  confidenceScore: number
  additionalContacts: Contact[]
  completedAt?: string
}

export type Lead = {
  id: string
  date: string
  region: string
  industry: string
  companyName: string
  companyLinkedInUrl: string
  employeeLinkedInUrl: string
  websiteDomainName: string
  emailDomainName: string
  status: LeadStatus
  owner: string
  disqualificationCategory: DisqualificationCategory
  lowEffortResults: ValidationCard[]
  manualChecks: ManualChecks
  manualNotes: string
  validationHistory: AuditEvent[]
  enrichment?: EnrichmentResult
  processingTimeMinutes: number
  slaHours: number
  createdAt: string
  exportedAt?: string
}

export type DashboardMetrics = {
  totalUploaded: number
  leadsProcessed: number
  leadsDropped: number
  leadsEnriched: number
  passRate: number
  failureRate: number
  completionRate: number
  averageConfidence: number
}

export type ToastMessage = {
  id: string
  title: string
  description?: string
  variant?: 'success' | 'error' | 'info'
}

export type UploadLeadInput = Pick<
  Lead,
  | 'date'
  | 'region'
  | 'industry'
  | 'companyName'
  | 'companyLinkedInUrl'
  | 'employeeLinkedInUrl'
  | 'websiteDomainName'
  | 'emailDomainName'
>
