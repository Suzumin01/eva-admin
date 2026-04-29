import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClinics, createClinic, updateClinic, deactivateClinic } from '@/api/endpoints'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getApiError } from '@/lib/utils'

type Clinic = { clinicId: number; clinicName: string; address: string; phone: string | null; doctorsCount: number }

export function ClinicsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<Clinic | null>(null)

  const { data, isLoading } = useQuery({ queryKey: ['clinics'], queryFn: getClinics })

  const deactivate = useMutation({
    mutationFn: (id: number) => deactivateClinic(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clinics'] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Клиники</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Добавить</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-gray-500">Загрузка...</div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Название</th>
                  <th className="px-4 py-3 text-left">Адрес</th>
                  <th className="px-4 py-3 text-left">Телефон</th>
                  <th className="px-4 py-3 text-left">Врачей</th>
                  <th className="px-4 py-3 text-left">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.map((c: Clinic) => (
                  <tr key={c.clinicId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.clinicName}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.address}</td>
                    <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3">{c.doctorsCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditing(c)} className="text-blue-500 hover:text-blue-700"><Pencil size={15} /></button>
                        <button onClick={() => { if (confirm(`Деактивировать ${c.clinicName}?`)) deactivate.mutate(c.clinicId) }} className="text-red-500 hover:text-red-700"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {(showCreate || editing) && (
        <ClinicModal
          clinic={editing}
          onClose={() => { setShowCreate(false); setEditing(null) }}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['clinics'] }); setShowCreate(false); setEditing(null) }}
        />
      )}
    </div>
  )
}

function ClinicModal({ clinic, onClose, onSaved }: { clinic: Clinic | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ clinicName: clinic?.clinicName ?? '', address: clinic?.address ?? '', phone: clinic?.phone ?? '' })
  const mutation = useMutation({
    mutationFn: () => clinic
      ? updateClinic(clinic.clinicId, { clinicName: form.clinicName, address: form.address, phone: form.phone || undefined })
      : createClinic({ clinicName: form.clinicName, address: form.address, phone: form.phone || undefined }),
  })

  const handleSubmit = async () => {
    try { await mutation.mutateAsync(); onSaved() } catch {}
  }

  return (
    <Modal title={clinic ? 'Редактировать клинику' : 'Новая клиника'} onClose={onClose}>
      <div className="space-y-3">
        <Input placeholder="Название" value={form.clinicName} onChange={e => setForm(f => ({ ...f, clinicName: e.target.value }))} />
        <Input placeholder="Адрес" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        <Input placeholder="Телефон" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        {mutation.error && <p className="text-sm text-red-600">Ошибка: {getApiError(mutation.error, 'проверьте данные')}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={!form.clinicName.trim() || !form.address.trim() || mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? 'Сохраняю...' : clinic ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
