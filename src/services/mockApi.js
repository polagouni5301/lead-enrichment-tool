import { makeId, normalizeDomain } from '../utils/format'

const enterpriseNames = ['carrefour', 'żabka', 'zabka', 'česká pošta', 'ceska posta', 'poste', 'tesco']
const marketplaceTerms = ['marketplace', 'aggregator', 'directory', 'booking', 'portal', 'listing']
const unrelatedServices = ['wixsite', 'squarespace', 'shopify', 'facebook', 'instagram', 'linkedin', 'google']
const offlineTerms = ['offline', 'inactive', 'dead', 'localhost', 'example', 'test']

const regionSignals = {
  poland: { tlds: ['pl', 'com'], languages: ['Polish', 'English'] },
  czechia: { tlds: ['cz', 'com'], languages: ['Czech', 'English'] },
  france: { tlds: ['fr', 'com'], languages: ['French', 'English'] },
  germany: { tlds: ['de', 'com'], languages: ['German', 'English'] },
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function uploadLeadsApi(leads) {
  await wait(450)
  return leads.map((lead) => ({
    ...lead,
    id: makeId('lead'),
    websiteDomainName: normalizeDomain(lead.websiteDomainName),
    emailDomainName: normalizeDomain(lead.emailDomainName),
    status: 'Uploaded',
    owner: 'Ava Patel',
    disqualificationCategory: null,
    lowEffortResults: [],
    manualChecks: {
      duplicateCheck: false,
      internalOwnership: false,
      industryValidation: false,
      previousDisqualification: false,
      tagEnrichment: false,
    },
    manualNotes: '',
    validationHistory: [
      {
        id: makeId('audit'),
        actor: 'Ava Patel',
        action: 'Lead uploaded',
        timestamp: new Date().toISOString(),
      },
    ],
    processingTimeMinutes: Math.floor(Math.random() * 28) + 8,
    slaHours: 18,
    createdAt: new Date().toISOString(),
  }))
}

export async function validateLeadApi(lead) {
  await wait(1500)

  const company = lead.companyName.toLowerCase()
  const domain = lead.websiteDomainName.toLowerCase()
  const emailDomain = lead.emailDomainName.toLowerCase()
  const tld = domain.split('.').pop() ?? ''
  const regionSignal = regionSignals[lead.region.toLowerCase()]
  const isEnterprise = enterpriseNames.some((name) => company.includes(name) || domain.includes(name))
  const marketplaceOrAggregator = marketplaceTerms.some((term) => domain.includes(term) || company.includes(term))
  const unrelatedService = unrelatedServices.some((term) => domain.includes(term))
  const websiteUnavailable = !domain.includes('.') || offlineTerms.some((term) => domain.includes(term) || company.includes(term))
  const domainMismatch = normalizeDomain(domain) !== normalizeDomain(emailDomain)
  const locationMismatch = Boolean(regionSignal && tld && !regionSignal.tlds.includes(tld))
  const missingSocialPresence =
    !lead.companyLinkedInUrl.includes('linkedin.com') ||
    company.includes('stealth') ||
    company.includes('unknown')
  const suspiciousEntity = company.includes('shell') || company.includes('placeholder') || company.includes('fake')

  const stopCategory =
    isEnterprise || marketplaceOrAggregator
      ? 'DQ'
      : websiteUnavailable || unrelatedService || domainMismatch || locationMismatch || missingSocialPresence || suspiciousEntity
        ? 'AISDR'
        : null

  const results = [
    {
      id: makeId('val'),
      type: 'Company website',
      result: websiteUnavailable ? 'Fail' : 'Pass',
      confidence: websiteUnavailable ? 39 : 94,
      reasoning: websiteUnavailable
        ? 'LLM could not confirm that the company website exists and is live.'
        : 'LLM confirms the website exists, appears live, and has a valid business-facing domain.',
      details: websiteUnavailable
        ? ['Website existence failed', 'Live-site signal missing', 'Stop immediately as AISDR']
        : ['Website exists', 'Website appears live', 'Business pages found'],
    },
    {
      id: makeId('val'),
      type: 'Business type',
      result: isEnterprise || suspiciousEntity ? 'Fail' : 'Pass',
      confidence: isEnterprise ? 98 : suspiciousEntity ? 51 : 88,
      reasoning: isEnterprise
        ? 'LLM classified the company as an enterprise chain, not a real SMB target.'
        : suspiciousEntity
          ? 'LLM detected suspicious business identity signals.'
          : 'LLM classified the company as a real SMB or mid-market business.',
      details: isEnterprise
        ? ['Enterprise-chain signal', 'Not SMB', 'Stop immediately as DQ']
        : suspiciousEntity
          ? ['Suspicious entity wording', 'Weak business identity', 'Stop immediately as AISDR']
          : ['Real business signal', 'SMB/mid-market footprint', 'No suspicious-entity pattern'],
    },
    {
      id: makeId('val'),
      type: 'Location & language match',
      result: locationMismatch ? 'Fail' : 'Pass',
      confidence: locationMismatch ? 49 : 87,
      reasoning: locationMismatch
        ? `LLM found a mismatch between ${lead.region} and the website domain/language signals.`
        : `LLM found region, language, and geo signals consistent with ${lead.region}.`,
      details: locationMismatch
        ? ['Region mismatch', 'Language/geo inconsistency', 'Stop immediately as AISDR']
        : ['Region match', `Expected language: ${regionSignal?.languages.join(' or ') ?? 'local language'}`, 'Geo consistency scored'],
    },
    {
      id: makeId('val'),
      type: 'Social presence',
      result: missingSocialPresence ? 'Fail' : 'Pass',
      confidence: missingSocialPresence ? 46 : 84,
      reasoning: missingSocialPresence
        ? 'LLM could not validate enough social/business presence for the company.'
        : 'LLM validated LinkedIn and found supporting Instagram or Google Business-style signals.',
      details: missingSocialPresence
        ? ['LinkedIn missing or weak', 'Instagram/Google Business not corroborated', 'Stop immediately as AISDR']
        : ['LinkedIn detected', 'Instagram signal checked', 'Google Business signal checked'],
    },
    {
      id: makeId('val'),
      type: 'Marketplace / aggregator / unrelated domain',
      result: marketplaceOrAggregator || unrelatedService || domainMismatch ? 'Fail' : 'Pass',
      confidence: marketplaceOrAggregator || unrelatedService || domainMismatch ? 92 : 89,
      reasoning:
        marketplaceOrAggregator || unrelatedService || domainMismatch
          ? 'LLM determined the domain may belong to a marketplace, aggregator, unrelated hosted service, or a mismatched email domain.'
          : 'LLM determined the domain appears to belong to the company and not a marketplace, aggregator, or unrelated service.',
      details:
        marketplaceOrAggregator || unrelatedService || domainMismatch
          ? [
              marketplaceOrAggregator ? 'Marketplace or aggregator detected' : 'No marketplace wording',
              unrelatedService ? 'Unrelated hosted/service domain detected' : 'No unrelated service domain',
              domainMismatch ? 'Website and email domains differ' : 'Website and email domains align',
            ]
          : ['Owned-domain signal', 'No marketplace/aggregator signal', 'Website and email domains align'],
    },
    {
      id: makeId('val'),
      type: 'Too-big enterprise detection',
      result: isEnterprise ? 'Fail' : 'Pass',
      confidence: isEnterprise ? 99 : 90,
      reasoning: isEnterprise
        ? 'LLM matched the lead against obvious enterprise-chain examples and stopped the workflow.'
        : 'LLM found no obvious too-big enterprise-chain pattern.',
      details: isEnterprise
        ? ['Enterprise list match', 'Examples include Česká Pošta, Żabka, Carrefour', 'Stop immediately as DQ']
        : ['No Carrefour / Żabka / Česká Pošta-style signal', 'Branch count appears constrained', 'SMB motion remains eligible'],
    },
  ]

  const failed = results.some((result) => result.result === 'Fail')

  return {
    status: failed ? 'Low Effort Validation Failed' : 'Low Effort Validation Passed',
    category: failed ? stopCategory ?? 'AISDR' : null,
    results,
  }
}

export async function enrichLeadApi(lead) {
  await wait(1800)

  const domain = normalizeDomain(lead.emailDomainName)
  const firstName = lead.companyName.split(' ')[0]
  const primaryName = lead.employeeLinkedInUrl.includes('/in/')
    ? lead.employeeLinkedInUrl
        .split('/in/')[1]
        .replace(/\/$/, '')
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : `${firstName} Operator`

  const contacts = [
    {
      id: makeId('contact'),
      name: primaryName || 'No information found',
      title: lead.industry === 'Hospitality' ? 'Managing Partner' : 'Commercial Director',
      email: domain ? `${primaryName.split(' ')[0]?.toLowerCase() || 'contact'}@${domain}` : 'No information found',
      phone: '+48 22 410 88 21',
      confidence: 88,
      source: 'LinkedIn profile + domain pattern',
    },
    {
      id: makeId('contact'),
      name: `${firstName} Revenue Lead`,
      title: 'Head of Sales',
      email: domain ? `sales@${domain}` : 'No information found',
      phone: 'No information found',
      confidence: 73,
      source: 'Website contact page',
    },
  ]

  return {
    keyDecisionMakerName: contacts[0]?.name ?? 'No information found',
    position: contacts[0]?.title ?? 'No information found',
    emailAddress: contacts[0]?.email ?? 'No information found',
    phoneNumber: contacts[0]?.phone ?? 'No information found',
    confidenceScore: contacts[0]?.confidence ?? 0,
    additionalContacts: contacts.slice(1),
    completedAt: new Date().toISOString(),
  }
}
