import { Progress } from '../ui/progress'

export function ConfidenceMeter({ value, label = 'Confidence' }: { value: number; label?: string }) {
  const color =
    value >= 85 ? 'from-emerald-500 to-teal-400' : value >= 70 ? 'from-brand-orange to-amber-400' : 'from-red-500 to-rose-400'

  return <Progress value={value} label={label} indicatorClassName={`bg-gradient-to-r ${color}`} />
}
