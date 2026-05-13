import { Badge } from '../ui/badge'
import { statusTone } from '../../utils/format'

export function StatusBadge({ status }) {
  return <Badge tone={statusTone(status)}>{status}</Badge>
}
