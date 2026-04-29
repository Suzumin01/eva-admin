import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminReviews, getDoctors, hideReview, deleteReview } from '@/api/endpoints'
import { Card, CardContent } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, Eye, EyeOff } from 'lucide-react'

const HIDDEN_OPTIONS = [
  { value: '',      label: 'Все отзывы' },
  { value: 'false', label: 'Видимые' },
  { value: 'true',  label: 'Скрытые' },
]

type Review = {
  reviewId: string; doctorId: number; doctorName: string
  userFullName: string; rating: number; comment: string | null; isHidden: boolean
}

export function ReviewsPage() {
  const qc = useQueryClient()
  const [hiddenFilter,   setHiddenFilter]   = useState('')
  const [doctorIdFilter, setDoctorIdFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', hiddenFilter, doctorIdFilter],
    queryFn: () => getAdminReviews({
      hidden:   hiddenFilter   === '' ? undefined : hiddenFilter === 'true',
      doctorId: doctorIdFilter === '' ? undefined : Number(doctorIdFilter),
    }),
  })

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => getDoctors({ limit: 200 }),
  })

  const doctorOptions = [
    { value: '', label: 'Все врачи' },
    ...(doctorsData?.doctors ?? []).map((d: { doctorId: number; fullName: string }) => ({
      value: String(d.doctorId),
      label: d.fullName,
    })),
  ]

  const hideMutation = useMutation({
    mutationFn: ({ id, h }: { id: string; h: boolean }) => hideReview(id, h),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Отзывы</h1>

      <div className="flex flex-wrap gap-3">
        <Select options={doctorOptions}  value={doctorIdFilter} onChange={e => setDoctorIdFilter(e.target.value)} className="w-56" />
        <Select options={HIDDEN_OPTIONS} value={hiddenFilter}   onChange={e => setHiddenFilter(e.target.value)}   className="w-44" />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-gray-500">Загрузка...</div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Врач</th>
                  <th className="px-4 py-3 text-left">Пациент</th>
                  <th className="px-4 py-3 text-left">Оценка</th>
                  <th className="px-4 py-3 text-left">Комментарий</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                  <th className="px-4 py-3 text-left">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.map((r: Review) => (
                  <tr key={r.reviewId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.doctorName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.userFullName}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.comment ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge label={r.isHidden ? 'Скрыт' : 'Виден'} variant={r.isHidden ? 'hidden' : 'completed'} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          title={r.isHidden ? 'Показать' : 'Скрыть'}
                          onClick={() => hideMutation.mutate({ id: r.reviewId, h: !r.isHidden })}
                          className="text-gray-400 hover:text-gray-700"
                        >{r.isHidden ? <Eye size={15} /> : <EyeOff size={15} />}</button>
                        <button
                          title="Удалить"
                          onClick={() => { if (confirm('Удалить отзыв?')) deleteMutation.mutate(r.reviewId) }}
                          className="text-red-400 hover:text-red-600"
                        ><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
