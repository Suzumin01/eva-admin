import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDoctorAppointments, updateDoctorAppointmentStatus, saveDoctorConclusion } from '@/api/endpoints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { APPOINTMENT_STATUS_OPTIONS } from '@/lib/constants'

type DoctorAppt = {
  appointmentId: string; patientName: string | null; slotDate: string; slotTime: string;
  status: string; notes: string | null; doctorConclusion: string | null; patientHealthInfo: string | null
}

export function DoctorAppointmentsPage() {
  const qc = useQueryClient()
  const [status, setStatus]   = useState('')
  const [selected, setSelected] = useState<DoctorAppt | null>(null)
  const [conclusion, setConclusion] = useState('')
  const [notes, setNotes]           = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-appointments', status],
    queryFn: () => getDoctorAppointments({ status: status || undefined }),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, s }: { id: string; s: string }) => updateDoctorAppointmentStatus(id, s),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctor-appointments'] }); setSelected(null) },
  })

  const conclusionMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => saveDoctorConclusion(id, { conclusion: conclusion || undefined, notes: notes || undefined }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctor-appointments'] }); setSelected(null) },
  })

  const openDetail = (a: DoctorAppt) => {
    setSelected(a)
    setConclusion(a.doctorConclusion ?? '')
    setNotes(a.notes ?? '')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Мои записи</h1>

      <Select options={APPOINTMENT_STATUS_OPTIONS} value={status} onChange={e => setStatus(e.target.value)} className="w-48" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-0">
            {isLoading ? <div className="p-6 text-gray-500">Загрузка...</div> : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Пациент</th>
                    <th className="px-4 py-3 text-left">Дата</th>
                    <th className="px-4 py-3 text-left">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.map((a: DoctorAppt) => (
                    <tr
                      key={a.appointmentId}
                      className="cursor-pointer hover:bg-blue-50"
                      onClick={() => openDetail(a)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{a.patientName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{a.slotDate} {a.slotTime.slice(0, 5)}</td>
                      <td className="px-4 py-3"><Badge label={a.status} variant={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {selected && (
          <Card>
            <CardHeader>
              <CardTitle>Детали записи</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Пациент:</span>
                <span className="font-medium">{selected.patientName ?? '—'}</span>
                <span className="text-gray-500">Дата/время:</span>
                <span>{selected.slotDate} {selected.slotTime.slice(0, 5)}</span>
                <span className="text-gray-500">Статус:</span>
                <Badge label={selected.status} variant={selected.status} />
              </div>

              {selected.patientHealthInfo && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500 uppercase">Данные пациента</p>
                  <p className="rounded bg-gray-50 p-2 text-sm text-gray-700">{selected.patientHealthInfo}</p>
                </div>
              )}

              {selected.status === 'scheduled' && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => statusMutation.mutate({ id: selected.appointmentId, s: 'completed' })}>
                    ✓ Завершить
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => statusMutation.mutate({ id: selected.appointmentId, s: 'cancelled' })}>
                    ✕ Отменить
                  </Button>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 uppercase">Заметки</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Заметки к приёму..." rows={2} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 uppercase">Заключение</label>
                <Textarea value={conclusion} onChange={e => setConclusion(e.target.value)} placeholder="Заключение врача..." rows={3} />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Закрыть</Button>
                <Button size="sm" disabled={!conclusion && !notes} onClick={() => conclusionMutation.mutate({ id: selected.appointmentId })}>
                  Сохранить
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
