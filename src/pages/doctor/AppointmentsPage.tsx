import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getDoctorAppointments, updateDoctorAppointmentStatus,
  saveDoctorConclusion, getDoctorAppointmentDocuments, downloadBlob,
} from '@/api/endpoints'
import { SERVER_ROOT } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { APPOINTMENT_STATUS_OPTIONS } from '@/lib/constants'
import { hashColor, initials } from '@/lib/utils'
import { FileText, Image, File, Download } from 'lucide-react'

type DoctorAppt = {
  appointmentId: string; patientName: string | null; patientId: string
  slotDate: string; slotTime: string; status: string
  notes: string | null; doctorConclusion: string | null
  patientHealthInfo: string | null
  patientDateOfBirth: string | null
  patientAllergies: string | null
  patientChronicDiseases: string | null
  patientAvatarUrl: string | null
}

type Document = {
  documentId: string; fileName: string; fileType: string
  fileSize: number; category: string; description: string | null
  createdAt: string; downloadUrl: string
}

function calcAge(dob: string): number {
  const d = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  if (today.getMonth() < d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() < d.getDate())) age--
  return age
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU')
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} Б`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} КБ`
  return `${(b / 1024 / 1024).toFixed(1)} МБ`
}

const CATEGORY_LABELS: Record<string, string> = {
  analysis: 'Анализы', prescription: 'Рецепт', xray: 'Снимки', other: 'Прочее',
}
function categoryLabel(c: string) { return CATEGORY_LABELS[c] ?? c }

function DocIcon({ fileType }: { fileType: string }) {
  if (fileType === 'pdf') return <FileText size={14} className="text-red-500 flex-shrink-0" />
  if (fileType === 'image') return <Image size={14} className="text-blue-500 flex-shrink-0" />
  return <File size={14} className="text-gray-400 flex-shrink-0" />
}

export function DoctorAppointmentsPage() {
  const qc = useQueryClient()
  const [status,     setStatus]     = useState('')
  const [selected,   setSelected]   = useState<DoctorAppt | null>(null)
  const [conclusion, setConclusion] = useState('')
  const [notes,      setNotes]      = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['doctor-appointments', status],
    queryFn: () => getDoctorAppointments({ status: status || undefined }),
  })

  const { data: documents } = useQuery({
    queryKey: ['doctor-appt-docs', selected?.appointmentId],
    queryFn: () => getDoctorAppointmentDocuments(selected!.appointmentId),
    enabled: !!selected,
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

  const avatarSrc = selected?.patientAvatarUrl ? `${SERVER_ROOT}${selected.patientAvatarUrl}` : null
  const patientName = selected?.patientName ?? '—'

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
                      className={`cursor-pointer hover:bg-blue-50 ${selected?.appointmentId === a.appointmentId ? 'bg-blue-50' : ''}`}
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                     style={{ background: hashColor(patientName) }}>
                  {avatarSrc
                    ? <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white text-sm font-bold">{initials(patientName)}</span>
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-900">{patientName}</p>
                  <p className="text-xs text-gray-400">{selected.slotDate} {selected.slotTime.slice(0, 5)}</p>
                </div>
                <div className="ml-auto"><Badge label={selected.status} variant={selected.status} /></div>
              </div>

              <div className="rounded-md bg-amber-50 border border-amber-100 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Данные пациента</p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Возраст: </span>
                  {selected.patientDateOfBirth
                    ? <>{calcAge(selected.patientDateOfBirth)} лет <span className="text-gray-400">({formatDate(selected.patientDateOfBirth)})</span></>
                    : '—'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Аллергии: </span>
                  {selected.patientAllergies || '—'}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Хрон. заболевания: </span>
                  {selected.patientChronicDiseases || '—'}
                </p>
              </div>

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

              {documents && documents.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 uppercase">Документы пациента</p>
                  <div className="space-y-1">
                    {(documents as Document[]).map(doc => (
                      <div key={doc.documentId}
                           className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50 group">
                        <DocIcon fileType={doc.fileType} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-gray-700">{doc.fileName}</p>
                          <p className="text-xs text-gray-400">
                            {categoryLabel(doc.category)}
                            {doc.description && ` · ${doc.description}`}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">{formatBytes(doc.fileSize)}</span>
                        <button
                          title="Скачать"
                          onClick={() => downloadBlob(doc.downloadUrl, doc.fileName)}
                          className="text-gray-400 hover:text-blue-600 flex-shrink-0">
                          <Download size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {documents && documents.length === 0 && (
                <p className="text-xs text-gray-400">Документы не загружены</p>
              )}

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
