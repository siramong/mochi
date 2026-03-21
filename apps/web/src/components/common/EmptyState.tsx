import { MochiCompanion } from '@/components/common/MochiCompanion'

type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6 text-center">
      <MochiCompanion mood="thinking" size={84} className="mb-3" />
      <p className="text-base font-bold text-purple-900">{title}</p>
      <p className="mt-1 text-sm text-purple-700">{description}</p>
    </div>
  )
}
