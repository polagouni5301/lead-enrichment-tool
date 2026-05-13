import { create } from 'zustand'
import { enrichLeadApi, uploadLeadsApi, validateLeadApi } from '../services/mockApi'
import { sampleLeads } from '../services/mockData'
import { makeId, normalizeDomain } from '../utils/format'

const stepOrder = ['upload', 'lowEffort', 'manual', 'enrichment', 'dashboard']

function audit(actor, action, note) {
  return {
    id: makeId('audit'),
    actor,
    action,
    timestamp: new Date().toISOString(),
    note,
  }
}

function allManualChecksComplete(checks) {
  return Object.values(checks).every(Boolean)
}

function computeMetrics(leads) {
  const processed = leads.filter((lead) => lead.status !== 'Uploaded').length
  const dropped = leads.filter((lead) => lead.status.includes('Failed')).length
  const enriched = leads.filter((lead) => lead.status === 'Enrichment Complete' || lead.status === 'Exported').length
  const passed = leads.filter(
    (lead) =>
      lead.status === 'Manual Validation Passed' ||
      lead.status === 'Enrichment Complete' ||
      lead.status === 'Exported',
  ).length
  const averageConfidence =
    enriched === 0
      ? 0
      : leads
          .filter((lead) => lead.enrichment)
          .reduce((total, lead) => total + (lead.enrichment?.confidenceScore ?? 0), 0) / enriched

  return {
    totalUploaded: leads.length,
    leadsProcessed: processed,
    leadsDropped: dropped,
    leadsEnriched: enriched,
    passRate: processed === 0 ? 0 : (passed / processed) * 100,
    failureRate: processed === 0 ? 0 : (dropped / processed) * 100,
    completionRate: leads.length === 0 ? 0 : (enriched / leads.length) * 100,
    averageConfidence,
  }
}

export const useLeadStore = create((set, get) => ({
  leads: sampleLeads,
  currentStep: 'upload',
  activeLeadId: sampleLeads[0]?.id ?? '',
  processingLeadIds: [],
  toasts: [],
  setCurrentStep: (step) => {
    if (get().canAccessStep(step)) {
      set({ currentStep: step })
      return
    }

    get().addToast({
      title: 'Complete the current stage first',
      description: 'Workflow stages unlock after the required validation state is reached.',
      variant: 'error',
    })
  },
  canAccessStep: (step) => {
    const leads = get().leads
    const orderIndex = stepOrder.indexOf(step)
    if (orderIndex <= 0) return true
    if (step === 'lowEffort') {
      return leads.some(
        (lead) =>
          lead.status === 'Uploaded' ||
          lead.status === 'Low Effort Validation Passed' ||
          lead.status === 'Low Effort Validation Failed',
      )
    }
    if (step === 'manual') return leads.some((lead) => lead.status === 'Low Effort Validation Passed')
    if (step === 'enrichment') return leads.some((lead) => lead.status === 'Manual Validation Passed')
    if (step === 'dashboard') return leads.some((lead) => lead.status === 'Enrichment Complete' || lead.status === 'Exported')
    return true
  },
  setActiveLead: (leadId) => set({ activeLeadId: leadId }),
  addToast: (toast) => {
    const id = makeId('toast')
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
    window.setTimeout(() => get().dismissToast(id), 4500)
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  uploadLeads: async (input) => {
    const existingDomains = new Set(get().leads.map((lead) => normalizeDomain(lead.websiteDomainName)))
    const uniqueInput = input.filter((lead) => !existingDomains.has(normalizeDomain(lead.websiteDomainName)))

    if (uniqueInput.length !== input.length) {
      get().addToast({
        title: 'Duplicate leads skipped',
        description: `${input.length - uniqueInput.length} upload record was already in the workspace.`,
        variant: 'info',
      })
    }

    if (uniqueInput.length === 0) return []

    const uploaded = await uploadLeadsApi(uniqueInput)
    set((state) => ({
      leads: [...uploaded, ...state.leads],
      activeLeadId: uploaded[0]?.id ?? state.activeLeadId,
      currentStep: 'lowEffort',
    }))
    get().addToast({
      title: 'Upload validated',
      description: `${uploaded.length} lead${uploaded.length === 1 ? '' : 's'} moved into low effort enrichment.`,
      variant: 'success',
    })
    return uploaded
  },
  runLowEffortValidation: async (leadId) => {
    set((state) => ({ processingLeadIds: [...state.processingLeadIds, leadId] }))
    const lead = get().leads.find((item) => item.id === leadId)
    if (!lead) return

    try {
      const result = await validateLeadApi(lead)
      const failedCheck = result.results.find((item) => item.result === 'Fail')
      set((state) => ({
        leads: state.leads.map((item) =>
          item.id === leadId
            ? {
                ...item,
                status: result.status,
                disqualificationCategory: result.category,
                lowEffortResults: result.results,
                validationHistory: [
                  audit(
                    'AI Validator',
                    result.status === 'Low Effort Validation Passed'
                      ? 'Low effort enrichment validation passed'
                      : 'Low effort enrichment validation failed',
                    result.category
                      ? `${result.category}: stopped at ${failedCheck?.type ?? 'LLM validation gate'}.`
                      : undefined,
                  ),
                  ...item.validationHistory,
                ],
              }
            : item,
        ),
        currentStep: state.currentStep,
      }))
      get().addToast({
        title: result.status === 'Low Effort Validation Passed' ? 'LLM validation passed' : 'Workflow stopped',
        description:
          result.status === 'Low Effort Validation Passed'
            ? 'Lead moved into the manual validation queue.'
            : `Lead categorized as ${result.category} because ${failedCheck?.type ?? 'a required check'} failed.`,
        variant: result.status === 'Low Effort Validation Passed' ? 'success' : 'error',
      })
    } finally {
      set((state) => ({ processingLeadIds: state.processingLeadIds.filter((id) => id !== leadId) }))
    }
  },
  rejectLowEffortLead: (leadId) => {
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: 'Low Effort Validation Failed',
              disqualificationCategory: 'AISDR',
              validationHistory: [audit('Ava Patel', 'Low effort validation rejected', 'Marked AISDR.'), ...lead.validationHistory],
            }
          : lead,
      ),
    }))
    get().addToast({ title: 'Lead rejected', description: 'The lead was stopped at AI validation.', variant: 'error' })
  },
  updateManualChecks: (leadId, checks) =>
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId ? { ...lead, manualChecks: { ...lead.manualChecks, ...checks } } : lead,
      ),
    })),
  updateManualNotes: (leadId, notes) =>
    set((state) => ({
      leads: state.leads.map((lead) => (lead.id === leadId ? { ...lead, manualNotes: notes } : lead)),
    })),
  approveManualValidation: (leadId) => {
    const lead = get().leads.find((item) => item.id === leadId)
    if (!lead || !allManualChecksComplete(lead.manualChecks)) {
      get().addToast({
        title: 'Checklist incomplete',
        description: 'All mandatory manual validations must be complete before enrichment.',
        variant: 'error',
      })
      return
    }

    set((state) => ({
      leads: state.leads.map((item) =>
        item.id === leadId
          ? {
              ...item,
              status: 'Manual Validation Passed',
              validationHistory: [audit('Mila Reyes', 'Manual validation approved', item.manualNotes), ...item.validationHistory],
            }
          : item,
      ),
      currentStep: state.currentStep,
    }))
    get().addToast({
      title: 'Approved for enrichment',
      description: 'Medium/high effort enrichment is now available.',
      variant: 'success',
    })
  },
  rejectManualValidation: (leadId) => {
    set((state) => ({
      leads: state.leads.map((lead) =>
        lead.id === leadId
          ? {
              ...lead,
              status: 'Manual Validation Failed',
              validationHistory: [audit('Mila Reyes', 'Manual validation rejected', lead.manualNotes), ...lead.validationHistory],
            }
          : lead,
      ),
    }))
    get().addToast({ title: 'Manual validation failed', description: 'The lead was removed from enrichment.', variant: 'error' })
  },
  runEnrichment: async (leadId) => {
    set((state) => ({ processingLeadIds: [...state.processingLeadIds, leadId] }))
    const lead = get().leads.find((item) => item.id === leadId)
    if (!lead) return

    try {
      const enrichment = await enrichLeadApi(lead)
      set((state) => ({
        leads: state.leads.map((item) =>
          item.id === leadId
            ? {
                ...item,
                status: 'Enrichment Complete',
                enrichment,
                processingTimeMinutes: item.processingTimeMinutes + 38,
                validationHistory: [audit('AI Enrichment', 'Enrichment completed'), ...item.validationHistory],
              }
            : item,
        ),
        currentStep: state.currentStep,
      }))
      get().addToast({
        title: 'Enrichment complete',
        description: 'Contacts, confidence scores, and export fields are ready.',
        variant: 'success',
      })
    } finally {
      set((state) => ({ processingLeadIds: state.processingLeadIds.filter((id) => id !== leadId) }))
    }
  },
  markExported: (leadIds) => {
    set((state) => ({
      leads: state.leads.map((lead) =>
        leadIds.includes(lead.id)
          ? {
              ...lead,
              status: 'Exported',
              exportedAt: new Date().toISOString(),
              validationHistory: [audit('Ava Patel', 'Lead exported'), ...lead.validationHistory],
            }
          : lead,
      ),
    }))
    get().addToast({ title: 'Export ready', description: `${leadIds.length} lead record exported.`, variant: 'success' })
  },
  getMetrics: () => computeMetrics(get().leads),
}))

export { allManualChecksComplete, stepOrder }
