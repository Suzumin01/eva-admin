import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminAppointments, updateAppointmentStatus } from '@/api/endpoints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { APPOINTMENT_STATUS_OPTIONS } from '@/lib/constants'

const PAGE_SIZE = 20

const CHANGE_TO: Record<string, { to: string; label: string }[]> = {
  scheduled: [{ to: 'completed', label: '✓ Завершить' }, { to: 'cancelled', label: '✕ Отменить' }],
  completed: [],
  cancelled: [],
}

export function AppointmentsAdminPage() {
  const qc = useQueryClient()
  const [status,   setStatus]   = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [page,     setPage]     = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-appointments', status, dateFrom, dateTo, page],
    queryFn: () => getAdminAppointments({
      status:   status   || undefined,
      dateFrom: dateFrom || undefined,
      dateTo:   dateTo   || undefined,
      limit:    PAGE_SIZE,
      offset:   (page - 1) * PAGE_SIZE,
    }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => updateAppointmentStatus(id, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-appointments'] }),
  })

  const handleFilter = (fn: () => void) => { fn(); setPage(1) }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Все записи</h1>

      <div className="flex flex-wrap gap-3">
        <Select options={APPOINTMENT_STATUS_OPTIONS} value={status} onChange={e => handleFilter(() => setStatus(e.target.value))} className="w-48" />
        <Input type="date" value={dateFrom} onChange={e => handleFilter(() => setDateFrom(e.target.value))} className="w-40" />
        <Input type="date" value={dateTo}   onChange={e => handleFilter(() => setDateTo(e.target.value))}   className="w-40" />
      </div>

      <Card>
        <CardHeader><CardTitle>Всего: {data?.total ?? '—'}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-gray-500">Загрузка...</div> : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Пациент</th>
                    <th className="px-4 py-3 text-left">Врач</th>
                    <th className="px-4 py-3 text-left">Дата / Время</th>
                    <th className="px-4 py-3 text-left">Статус</th>
                    <th className="px-4 py-3 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.appointments?.map((a: {
                    appointmentId: string; patientName: string | null; doctorName: string;
                    slotDate: string; slotTime: string; status: string
                  }) => (
                    <tr key={a.appointmentId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{a.patientName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{a.doctorName}</td>
                      <td className="px-4 py-3 text-gray-500">{a.slotDate} {a.slotTime.slice(0, 5)}</td>
                      <td className="px-4 py-3"><Badge label={a.status} variant={a.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {CHANGE_TO[a.status]?.map(({ to, label }) => (
                            <button
                              key={to}
                              onClick={() => statusMutation.mutate({ id: a.appointmentId, s: to })}
                              className="text-xs text-blue-600 hover:underline"
                            >{label}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} total={data?.total ?? 0} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
