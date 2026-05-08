import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUser, updateUserRole, setUserActive, adminUploadUserPhoto, adminDeleteUserPhoto, getAdminUserDocuments, downloadBlob } from '@/api/endpoints'
import { SERVER_ROOT } from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Pagination } from '@/components/ui/pagination'
import { Ban, RotateCcw, Pencil, Camera, FileText, Image, File, Download } from 'lucide-react'
import { getApiError, hashColor, initials } from '@/lib/utils'

const PAGE_SIZE = 20

const ROLE_FILTER = [
  { value: '',        label: 'Все роли' },
  { value: 'patient', label: 'Пациент' },
  { value: 'doctor',  label: 'Врач' },
  { value: 'admin',   label: 'Admin' },
]

const ROLE_OPTIONS = [
  { value: 'patient', label: 'Пациент' },
  { value: 'doctor',  label: 'Врач' },
  { value: 'admin',   label: 'Admin' },
  { value: 'guest',   label: 'Гость' },
]

type User = {
  userId: string; fullName: string; email: string; phone: string | null
  role: string; isActive: boolean; avatarUrl: string | null
  dateOfBirth: string | null; allergies: string | null; chronicDiseases: string | null
  createdAt: string; lastLoginAt: string | null
}

type Document = {
  documentId: string; fileName: string; fileType: string
  fileSize: number; category: string; description: string | null
  createdAt: string; downloadUrl: string
}

function UserAvatar({ user, size = 36 }: { user: User; size?: number }) {
  const src = user.avatarUrl ? `${SERVER_ROOT}${user.avatarUrl}` : null
  return (
    <div style={{ width: size, height: size, background: hashColor(user.fullName) }}
         className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center">
      {src
        ? <img src={src} alt="" className="w-full h-full object-cover" />
        : <span className="text-white font-bold" style={{ fontSize: size * 0.36 }}>{initials(user.fullName)}</span>
      }
    </div>
  )
}

export function UsersPage() {
  const qc = useQueryClient()
  const [search,       setSearch]       = useState('')
  const [roleFilter,   setRoleFilter]   = useState('')
  const [page,         setPage]         = useState(1)
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({})
  const [editUser,     setEditUser]     = useState<User | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter, page],
    queryFn: () => getUsers({ search: search || undefined, role: roleFilter || undefined, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      setPendingRoles(({ [userId]: _, ...rest }) => rest)
    },
  })

  const activeMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) => setUserActive(userId, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const handleRoleSelect = (userId: string, newRole: string, currentRole: string) => {
    if (newRole === currentRole) setPendingRoles(({ [userId]: _, ...rest }) => rest)
    else setPendingRoles(prev => ({ ...prev, [userId]: newRole }))
  }

  const handleSaveRole = (userId: string, currentRole: string) => {
    const newRole = pendingRoles[userId]
    if (!newRole || newRole === currentRole) return
    if (newRole === 'admin' && !confirm('Дать пользователю права администратора? Это даст полный доступ к панели управления.')) return
    roleMutation.mutate({ userId, role: newRole })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Пользователи</h1>

      <div className="flex gap-3">
        <Input placeholder="Поиск по имени или email..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }} className="max-w-sm" />
        <Select options={ROLE_FILTER} value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }} className="w-40" />
      </div>

      <Card>
        <CardHeader><CardTitle>Всего: {data?.total ?? '—'}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-gray-500">Загрузка...</div> : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">Фото</th>
                    <th className="px-4 py-3 text-left">Имя</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Статус</th>
                    <th className="px-4 py-3 text-left w-64">Роль</th>
                    <th className="px-4 py-3 text-left">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.users?.map((u: User) => {
                    const pending = pendingRoles[u.userId]
                    const displayRole = pending ?? u.role
                    const changed  = pending && pending !== u.role
                    const saving   = roleMutation.isPending && roleMutation.variables?.userId === u.userId
                    const toggling = activeMutation.isPending && activeMutation.variables?.userId === u.userId
                    return (
                      <tr key={u.userId} className="hover:bg-gray-50">
                        <td className="px-4 py-2"><UserAvatar user={u} /></td>
                        <td className="px-4 py-3 font-medium text-gray-900">{u.fullName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge label={u.isActive ? 'Активен' : 'Заблокирован'} variant={u.isActive ? 'completed' : 'cancelled'} />
                            <button
                              title={u.isActive ? 'Заблокировать' : 'Разблокировать'}
                              disabled={toggling}
                              onClick={() => {
                                const msg = u.isActive ? `Заблокировать ${u.fullName}?` : `Разблокировать ${u.fullName}?`
                                if (confirm(msg)) activeMutation.mutate({ userId: u.userId, active: !u.isActive })
                              }}
                              className={toggling ? 'opacity-40 cursor-default' : u.isActive ? 'text-gray-400 hover:text-red-500' : 'text-gray-400 hover:text-green-600'}
                            >
                              {u.isActive ? <Ban size={13} /> : <RotateCcw size={13} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={displayRole}
                              onChange={e => handleRoleSelect(u.userId, e.target.value, u.role)}
                              className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                            >
                              {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            {changed && (
                              <Button size="sm" disabled={saving}
                                onClick={() => handleSaveRole(u.userId, u.role)}
                                className="text-xs h-6 px-2">
                                {saving ? '...' : 'Сохранить'}
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button title="Редактировать" onClick={() => setEditUser(u)} className="text-gray-400 hover:text-blue-600">
                            <Pencil size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <Pagination page={page} total={data?.total ?? 0} pageSize={PAGE_SIZE} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {editUser && (
        <EditUserModal user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setEditUser(null) }} />
      )}
    </div>
  )
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
  if (fileType === 'pdf') return <FileText size={13} className="text-red-500 flex-shrink-0" />
  if (fileType === 'image') return <Image size={13} className="text-blue-500 flex-shrink-0" />
  return <File size={13} className="text-gray-400 flex-shrink-0" />
}

function EditUserModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const qc = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [fullName,        setFullName]        = useState(user.fullName)
  const [email,           setEmail]           = useState(user.email)
  const [phone,           setPhone]           = useState(user.phone ?? '')
  const [dateOfBirth,     setDateOfBirth]     = useState(user.dateOfBirth ?? '')
  const [allergies,       setAllergies]       = useState(user.allergies ?? '')
  const [chronicDiseases, setChronicDiseases] = useState(user.chronicDiseases ?? '')
  const [photoUrl,        setPhotoUrl]        = useState(user.avatarUrl)
  const [photoLoading,    setPhotoLoading]    = useState(false)

  const { data: documents } = useQuery({
    queryKey: ['admin-user-docs', user.userId],
    queryFn: () => getAdminUserDocuments(user.userId),
  })

  const mutation = useMutation({
    mutationFn: () => updateUser(user.userId, {
      fullName:        fullName.trim(),
      email:           email.trim(),
      phone:           phone.trim() || undefined,
      dateOfBirth:     dateOfBirth.trim() || '',
      allergies:       allergies.trim() || '',
      chronicDiseases: chronicDiseases.trim() || '',
    }),
  })

  const handleUpload = async (file: File) => {
    setPhotoLoading(true)
    try {
      const res = await adminUploadUserPhoto(user.userId, file)
      setPhotoUrl(res.avatarUrl)
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    } catch {}
    setPhotoLoading(false)
  }

  const handleDeletePhoto = async () => {
    if (!confirm('Удалить фото пользователя?')) return
    setPhotoLoading(true)
    try { await adminDeleteUserPhoto(user.userId); setPhotoUrl(null); qc.invalidateQueries({ queryKey: ['admin-users'] }) } catch {}
    setPhotoLoading(false)
  }

  const src = photoUrl ? `${SERVER_ROOT}${photoUrl}` : null
  const canSave = fullName.trim().length >= 2 && email.includes('@') && !mutation.isPending

  return (
    <Modal title={`Редактировать: ${user.fullName}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 cursor-pointer group"
               style={{ background: hashColor(user.fullName) }}
               onClick={() => inputRef.current?.click()}>
            {src
              ? <img src={`${src}?v=${photoUrl}`} alt="" className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                  {initials(user.fullName)}
                </span>
            }
            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
              <Camera size={18} className="text-white" />
            </div>
            {photoLoading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>}
          </div>
          <div className="text-xs text-gray-500">
            <p>Нажмите на фото чтобы загрузить</p>
            {src && <button onClick={handleDeletePhoto} className="text-red-500 hover:underline mt-1">Удалить фото</button>}
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }} />
        </div>

        <Input placeholder="ФИО" value={fullName} onChange={e => setFullName(e.target.value)} />
        <Input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input placeholder="Телефон (необязательно)" value={phone} onChange={e => setPhone(e.target.value)} />

        <div className="rounded-md bg-amber-50 border border-amber-100 px-3 py-2 space-y-2">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Медданные</p>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">Дата рождения (ГГГГ-ММ-ДД)</label>
            <Input placeholder="1990-01-15" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">Аллергии</label>
            <Input placeholder="Не указано" value={allergies} onChange={e => setAllergies(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-0.5 block">Хронические заболевания</label>
            <Input placeholder="Не указано" value={chronicDiseases} onChange={e => setChronicDiseases(e.target.value)} />
          </div>
        </div>

        {documents && documents.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Документы</p>
            <div className="space-y-1">
              {(documents as Document[]).map(doc => (
                <div key={doc.documentId}
                     className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50 group">
                  <DocIcon fileType={doc.fileType} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs text-gray-700">{doc.fileName}</p>
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
                    <Download size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-400 space-y-0.5">
          <p>ID: {user.userId}</p>
          <p>Зарегистрирован: {new Date(user.createdAt).toLocaleDateString('ru-RU')}</p>
          {user.lastLoginAt && <p>Последний вход: {new Date(user.lastLoginAt).toLocaleDateString('ru-RU')}</p>}
        </div>

        {mutation.error && <p className="text-sm text-red-600">Ошибка: {getApiError(mutation.error, 'не удалось сохранить')}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={!canSave}
            onClick={async () => { try { await mutation.mutateAsync(); onSaved() } catch {} }}>
            {mutation.isPending ? 'Сохраняю...' : 'Сохранить'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
