import { cn } from '@/lib/utils'

const variants: Record<string, string> = {
  default:   'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  admin:     'bg-purple-100 text-purple-800',
  doctor:    'bg-teal-100 text-teal-800',
  patient:   'bg-gray-100 text-gray-700',
  hidden:    'bg-yellow-100 text-yellow-800',
}

export function Badge({ label, variant = 'default' }: { label: string; variant?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant] ?? variants.default)}>
      {label}
    </span>
  )
}
