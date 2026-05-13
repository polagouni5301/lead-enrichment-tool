import { Badge } from '../ui/badge'
import type { LeadStatus } from '../../types/lead'
import { statusTone } from '../../utils/format'

export function StatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>
}
