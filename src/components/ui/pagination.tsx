export function Pagination({ page, total, pageSize, onChange }: {
  page: number
  total: number
  pageSize: number
  onChange: (page: number) => void
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null
  const from = Math.min((page - 1) * pageSize + 1, total)
  const to   = Math.min(page * pageSize, total)
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
      <span>{from}–{to} из {total}</span>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="rounded px-2 py-1 hover:bg-gray-100 disabled:cursor-default disabled:opacity-40"
        >←</button>
        <span className="px-2 tabular-nums">{page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded px-2 py-1 hover:bg-gray-100 disabled:cursor-default disabled:opacity-40"
        >→</button>
      </div>
    </div>
  )
}
