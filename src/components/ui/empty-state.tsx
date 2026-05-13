import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { Card } from './card'

type EmptyStateProps = {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-brand-coral/10 text-brand-coral">
        <Sparkles className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="text-xl font-extrabold text-brand-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-brand-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  )
}
