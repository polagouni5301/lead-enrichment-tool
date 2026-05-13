import { cn } from '../../utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-2xl bg-[linear-gradient(110deg,rgba(255,255,255,0.45),rgba(253,78,89,0.08),rgba(255,255,255,0.45))] bg-[length:700px_100%]',
        className,
      )}
    />
  )
}
