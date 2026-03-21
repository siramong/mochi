import { Planet } from 'react-kawaii'

type EmptyStateProps = {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-purple-200 bg-purple-50 p-6 text-center">
      <div className="mx-auto mb-3 w-fit">
        <Planet size={120} mood="blissful" color="#E9D5FF" />
      </div>
      <p className="text-base font-bold text-purple-900">{title}</p>
      <p className="mt-1 text-sm text-purple-700">{description}</p>
    </div>
  )
}
