import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDoctorSchedules, createDoctorSchedule, bulkCreateDoctorSchedule, deleteDoctorSchedule } from '@/api/endpoints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'

type Slot = { scheduleId: number; slotDate: string; slotTime: string; durationMinutes: number; isAvailable: boolean }

export function DoctorSchedulePage() {
  const qc = useQueryClient()
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo,   setFilterTo]   = useState('')
  const [bulkFrom,  setBulkFrom]  = useState('')
  const [bulkTo,    setBulkTo]    = useState('')
  const [singleDate, setSingleDate] = useState('')
  const [singleTime, setSingleTime] = useState('')
  const [bulkTimes,  setBulkTimes]  = useState('09:00,10:00,11:00,14:00,15:00,16:00')

  const { data: slots, isLoading } = useQuery({
    queryKey: ['doctor-schedules', filterFrom, filterTo],
    queryFn: () => getDoctorSchedules({ dateFrom: filterFrom || undefined, dateTo: filterTo || undefined }),
  })

  const singleMutation = useMutation({
    mutationFn: () => createDoctorSchedule({ slotDate: singleDate, slotTime: singleTime }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['doctor-schedules'] }); setSingleDate(''); setSingleTime('') },
  })

  const bulkMutation = useMutation({
    mutationFn: () => bulkCreateDoctorSchedule({ dateFrom: bulkFrom, dateTo: bulkTo, times: bulkTimes.split(',').map(t => t.trim()) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-schedules'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDoctorSchedule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctor-schedules'] }),
  })

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-gray-900">Моё расписание</h1>

      <Card>
        <CardHeader><CardTitle>Добавить слоты</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Один слот</p>
            <div className="flex gap-3 items-end">
              <Input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} className="w-40" />
              <Input type="time" value={singleTime} onChange={e => setSingleTime(e.target.value)} className="w-32" />
              <Button disabled={!singleDate || !singleTime || singleMutation.isPending} onClick={() => singleMutation.mutate()}>
                Добавить
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Массово</p>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-gray-500">С</label>
                <Input type="date" value={bulkFrom} onChange={e => setBulkFrom(e.target.value)} className="w-40" />
              </div>
              <div>
                <label className="text-xs text-gray-500">По</label>
                <Input type="date" value={bulkTo} onChange={e => setBulkTo(e.target.value)} className="w-40" />
              </div>
              <div className="flex-1 min-w-48">
                <label className="text-xs text-gray-500">Время (через запятую)</label>
                <Input value={bulkTimes} onChange={e => setBulkTimes(e.target.value)} />
              </div>
              <Button disabled={!bulkFrom || !bulkTo || bulkMutation.isPending} onClick={() => bulkMutation.mutate()}>
                {bulkMutation.isPending ? 'Создаю...' : 'Создать'}
              </Button>
            </div>
            {bulkMutation.isSuccess && <p className="mt-1 text-xs text-green-600">Создано успешно</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Слоты</CardTitle>
            <div className="flex gap-2">
              <Input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="w-36" placeholder="С" />
              <Input type="date" value={filterTo}   onChange={e => setFilterTo(e.target.value)}   className="w-36" placeholder="По" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-gray-500">Загрузка...</div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Дата</th>
                  <th className="px-4 py-3 text-left">Время</th>
                  <th className="px-4 py-3 text-left">Длит.</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {slots?.map((s: Slot) => (
                  <tr key={s.scheduleId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{s.slotDate}</td>
                    <td className="px-4 py-3">{s.slotTime.slice(0, 5)}</td>
                    <td className="px-4 py-3">{s.durationMinutes} мин</td>
                    <td className="px-4 py-3"><Badge label={s.isAvailable ? 'Свободен' : 'Занят'} variant={s.isAvailable ? 'completed' : 'cancelled'} /></td>
                    <td className="px-4 py-3 text-right">
                      {s.isAvailable && (
                        <button onClick={() => deleteMutation.mutate(s.scheduleId)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      )}
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
