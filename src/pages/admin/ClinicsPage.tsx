import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClinics, createClinic, updateClinic, deactivateClinic, adminUploadClinicLogo, adminDeleteClinicLogo } from '@/api/endpoints'
import { SERVER_ROOT } from '@/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Plus, Pencil, Trash2, Camera } from 'lucide-react'
import { getApiError, hashColor, initials } from '@/lib/utils'

type Clinic = { clinicId: number; clinicName: string; address: string; phone: string | null; logoUrl: string | null; doctorsCount: number }

function ClinicAvatar({ clinic, size = 36 }: { clinic: Clinic; size?: number }) {
  const src = clinic.logoUrl ? `${SERVER_ROOT}${clinic.logoUrl}` : null
  return (
    <div style={{ width: size, height: size, background: hashColor(clinic.clinicName) }}
         className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
      {src
        ? <img src={src} alt="" className="w-full h-full object-cover" />
        : <span className="text-white font-bold" style={{ fontSize: size * 0.36 }}>{initials(clinic.clinicName)}</span>
      }
    </div>
  )
}

export function ClinicsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [editing,    setEditing]    = useState<Clinic | null>(null)

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
                  <th className="px-4 py-3 text-left w-12">Лого</th>
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
                    <td className="px-4 py-2"><ClinicAvatar clinic={c} /></td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.clinicName}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{c.address}</td>
                    <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                    <td className="px-4 py-3">{c.doctorsCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditing(c)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
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
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ clinicName: clinic?.clinicName ?? '', address: clinic?.address ?? '', phone: clinic?.phone ?? '' })
  const [logoUrl,      setLogoUrl]      = useState(clinic?.logoUrl ?? null)
  const [logoLoading,  setLogoLoading]  = useState(false)

  const mutation = useMutation({
    mutationFn: () => clinic
      ? updateClinic(clinic.clinicId, { clinicName: form.clinicName, address: form.address, phone: form.phone || undefined })
      : createClinic({ clinicName: form.clinicName, address: form.address, phone: form.phone || undefined }),
  })

  const handleUploadLogo = async (file: File) => {
    if (!clinic) return
    setLogoLoading(true)
    try {
      const res = await adminUploadClinicLogo(clinic.clinicId, file)
      setLogoUrl(res.logoUrl)
      qc.invalidateQueries({ queryKey: ['clinics'] })
    } catch {}
    setLogoLoading(false)
  }

  const handleDeleteLogo = async () => {
    if (!clinic || !confirm('Удалить логотип клиники?')) return
    setLogoLoading(true)
    try { await adminDeleteClinicLogo(clinic.clinicId); setLogoUrl(null); qc.invalidateQueries({ queryKey: ['clinics'] }) } catch {}
    setLogoLoading(false)
  }

  const src = logoUrl ? `${SERVER_ROOT}${logoUrl}` : null
  const displayName = form.clinicName || clinic?.clinicName || '?'

  return (
    <Modal title={clinic ? 'Редактировать клинику' : 'Новая клиника'} onClose={onClose}>
      <div className="space-y-3">
        {clinic && (
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 cursor-pointer group"
                 style={{ background: hashColor(displayName) }}
                 onClick={() => inputRef.current?.click()}>
              {src
                ? <img src={`${src}?v=${logoUrl}`} alt="" className="w-full h-full object-cover" />
                : <span className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                    {initials(displayName)}
                  </span>
              }
              <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                <Camera size={18} className="text-white" />
              </div>
              {logoLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>}
            </div>
            <div className="text-xs text-gray-500">
              <p>Нажмите на лого чтобы загрузить</p>
              {src && <button onClick={handleDeleteLogo} className="text-red-500 hover:underline mt-1">Удалить логотип</button>}
            </div>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadLogo(f); e.target.value = '' }} />
          </div>
        )}

        <Input placeholder="Название" value={form.clinicName} onChange={e => setForm(f => ({ ...f, clinicName: e.target.value }))} />
        <Input placeholder="Адрес" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        <Input placeholder="Телефон" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        {mutation.error && <p className="text-sm text-red-600">Ошибка: {getApiError(mutation.error, 'проверьте данные')}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={!form.clinicName.trim() || !form.address.trim() || mutation.isPending}
            onClick={async () => { try { await mutation.mutateAsync(); onSaved() } catch {} }}>
            {mutation.isPending ? 'Сохраняю...' : clinic ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
