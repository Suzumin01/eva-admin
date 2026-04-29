import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDoctors, getClinics, getSpecializations, createDoctor, updateDoctor, deactivateDoctor, createDoctorAccount } from '@/api/endpoints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { Plus, Trash2, UserPlus, UserCheck, Pencil } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import { getApiError } from '@/lib/utils'

const PAGE_SIZE = 20

type Doctor = {
  doctorId: number; userId: string | null; fullName: string
  clinicId: number; clinicName: string
  specializationId: number; specializationName: string
  bio: string | null; photoUrl: string | null
  rating: string | null; reviewsCount: number; experienceYears: number | null
}

export function DoctorsPage() {
  const qc = useQueryClient()
  const [search,          setSearch]          = useState('')
  const [page,            setPage]            = useState(1)
  const [showCreate,      setShowCreate]      = useState(false)
  const [editDoctor,      setEditDoctor]      = useState<Doctor | null>(null)
  const [accountDoctorId, setAccountDoctorId] = useState<number | null>(null)

  const { data: doctorsData, isLoading } = useQuery({
    queryKey: ['doctors', search, page],
    queryFn: () => getDoctors({ search: search || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  })
  const { data: clinics } = useQuery({ queryKey: ['clinics'],         queryFn: getClinics })
  const { data: specs   } = useQuery({ queryKey: ['specializations'], queryFn: getSpecializations })

  const deactivate = useMutation({
    mutationFn: (id: number) => deactivateDoctor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['doctors'] }),
  })

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Врачи</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Добавить</Button>
      </div>

      <Input placeholder="Поиск по имени..." value={search} onChange={e => handleSearch(e.target.value)} className="max-w-sm" />

      <Card>
        <CardHeader><CardTitle>Всего: {doctorsData?.total ?? '—'}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-gray-500">Загрузка...</div> : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Врач</th>
                    <th className="px-4 py-3 text-left">Клиника</th>
                    <th className="px-4 py-3 text-left">Специализация</th>
                    <th className="px-4 py-3 text-left">Рейтинг</th>
                    <th className="px-4 py-3 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {doctorsData?.doctors?.map((d: Doctor) => (
                    <tr key={d.doctorId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{d.fullName}</td>
                      <td className="px-4 py-3 text-gray-500">{d.clinicName}</td>
                      <td className="px-4 py-3"><Badge label={d.specializationName} /></td>
                      <td className="px-4 py-3">{d.rating ? `★ ${d.rating}` : '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button title="Редактировать" onClick={() => setEditDoctor(d)} className="text-gray-400 hover:text-blue-600">
                            <Pencil size={15} />
                          </button>
                          {d.userId ? (
                            <span title="Аккаунт уже создан" className="text-green-500 cursor-default"><UserCheck size={15} /></span>
                          ) : (
                            <button
                              title="Создать логин/пароль для входа в панель врача"
                              onClick={() => setAccountDoctorId(d.doctorId)}
                              className="text-teal-600 hover:text-teal-800"
                            ><UserPlus size={15} /></button>
                          )}
                          <button
                            title="Деактивировать"
                            onClick={() => { if (confirm(`Деактивировать ${d.fullName}?`)) deactivate.mutate(d.doctorId) }}
                            className="text-red-500 hover:text-red-700"
                          ><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={page} total={doctorsData?.total ?? 0} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {showCreate && clinics && specs && (
        <CreateDoctorModal
          clinics={clinics}
          specs={specs}
          onClose={() => setShowCreate(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['doctors'] }); setShowCreate(false) }}
        />
      )}

      {editDoctor && clinics && specs && (
        <EditDoctorModal
          doctor={editDoctor}
          clinics={clinics}
          specs={specs}
          onClose={() => setEditDoctor(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['doctors'] }); setEditDoctor(null) }}
        />
      )}

      {accountDoctorId !== null && (
        <CreateAccountModal
          doctorId={accountDoctorId}
          onClose={() => setAccountDoctorId(null)}
          onCreated={() => setAccountDoctorId(null)}
        />
      )}
    </div>
  )
}

function CreateDoctorModal({ clinics, specs, onClose, onCreated }: {
  clinics: { clinicId: number; clinicName: string }[]
  specs:   { specializationId: number; name: string }[]
  onClose: () => void
  onCreated: () => void
}) {
  const [form, setForm] = useState({
    fullName: '', clinicId: clinics[0]?.clinicId ?? 0,
    specializationId: specs[0]?.specializationId ?? 0, experienceYears: '',
  })
  const mutation = useMutation({
    mutationFn: () => createDoctor({
      ...form,
      clinicId: Number(form.clinicId),
      specializationId: Number(form.specializationId),
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
    }),
  })

  const handleSubmit = async () => {
    try { await mutation.mutateAsync(); onCreated() } catch {}
  }

  return (
    <Modal title="Новый врач" onClose={onClose}>
      <div className="space-y-3">
        <Input placeholder="ФИО" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
        <Select options={clinics.map(c => ({ value: String(c.clinicId), label: c.clinicName }))} value={String(form.clinicId)} onChange={e => setForm(f => ({ ...f, clinicId: Number(e.target.value) }))} />
        <Select options={specs.map(s => ({ value: String(s.specializationId), label: s.name }))} value={String(form.specializationId)} onChange={e => setForm(f => ({ ...f, specializationId: Number(e.target.value) }))} />
        <Input type="number" placeholder="Опыт (лет)" value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))} />
        {mutation.error && <p className="text-sm text-red-600">Ошибка: {getApiError(mutation.error, 'проверьте данные')}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={form.fullName.trim().length < 2 || mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? 'Создаю...' : 'Создать'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function EditDoctorModal({ doctor, clinics, specs, onClose, onSaved }: {
  doctor: Doctor
  clinics: { clinicId: number; clinicName: string }[]
  specs:   { specializationId: number; name: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    fullName:        doctor.fullName,
    clinicId:        doctor.clinicId,
    specializationId: doctor.specializationId,
    bio:             doctor.bio ?? '',
    experienceYears: doctor.experienceYears !== null ? String(doctor.experienceYears) : '',
  })
  const mutation = useMutation({
    mutationFn: () => updateDoctor(doctor.doctorId, {
      fullName:        form.fullName.trim() || undefined,
      clinicId:        Number(form.clinicId),
      specializationId: Number(form.specializationId),
      bio:             form.bio.trim() || undefined,
      experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
    }),
  })

  const handleSubmit = async () => {
    try { await mutation.mutateAsync(); onSaved() } catch {}
  }

  return (
    <Modal title={`Редактировать: ${doctor.fullName}`} onClose={onClose}>
      <div className="space-y-3">
        <Input placeholder="ФИО" value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} />
        <Select options={clinics.map(c => ({ value: String(c.clinicId), label: c.clinicName }))} value={String(form.clinicId)} onChange={e => setForm(f => ({ ...f, clinicId: Number(e.target.value) }))} />
        <Select options={specs.map(s => ({ value: String(s.specializationId), label: s.name }))} value={String(form.specializationId)} onChange={e => setForm(f => ({ ...f, specializationId: Number(e.target.value) }))} />
        <Input type="number" placeholder="Опыт (лет)" value={form.experienceYears} onChange={e => setForm(f => ({ ...f, experienceYears: e.target.value }))} />
        <Textarea placeholder="Биография (опционально)" value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
        {mutation.error && <p className="text-sm text-red-600">Ошибка: {getApiError(mutation.error, 'не удалось сохранить')}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={form.fullName.trim().length < 2 || mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? 'Сохраняю...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function CreateAccountModal({ doctorId, onClose, onCreated }: { doctorId: number; onClose: () => void; onCreated: () => void }) {
  const qc = useQueryClient()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const mutation = useMutation({
    mutationFn: () => createDoctorAccount(doctorId, { email, password }),
  })

  const handleSubmit = async () => {
    try { await mutation.mutateAsync(); qc.invalidateQueries({ queryKey: ['doctors'] }); onCreated() } catch {}
  }

  return (
    <Modal title="Создать аккаунт врача" onClose={onClose}>
      <div className="space-y-3">
        <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input type="password" placeholder="Пароль (мин. 8 симв.)" value={password} onChange={e => setPassword(e.target.value)} />
        {mutation.error && <p className="text-sm text-red-600">Ошибка: {getApiError(mutation.error, 'не удалось создать аккаунт')}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={!email || password.length < 8 || mutation.isPending} onClick={handleSubmit}>Создать</Button>
        </div>
      </div>
    </Modal>
  )
}
