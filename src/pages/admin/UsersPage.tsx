import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, updateUserRole, setUserActive } from '@/api/endpoints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { Ban, RotateCcw } from 'lucide-react'

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

type User = { userId: string; fullName: string; email: string; role: string; isActive: boolean }

export function UsersPage() {
  const qc = useQueryClient()
  const [search,     setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page,       setPage]       = useState(1)
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({})

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
    if (newRole === currentRole) {
      setPendingRoles(({ [userId]: _, ...rest }) => rest)
    } else {
      setPendingRoles(prev => ({ ...prev, [userId]: newRole }))
    }
  }

  const handleSaveRole = (userId: string, currentRole: string) => {
    const newRole = pendingRoles[userId]
    if (!newRole || newRole === currentRole) return
    if (newRole === 'admin' && !confirm(`Дать пользователю права администратора? Это даст полный доступ к панели управления.`)) return
    roleMutation.mutate({ userId, role: newRole })
  }

  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleRoleFilter = (v: string) => { setRoleFilter(v); setPage(1) }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Пользователи</h1>

      <div className="flex gap-3">
        <Input
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          options={ROLE_FILTER}
          value={roleFilter}
          onChange={e => handleRoleFilter(e.target.value)}
          className="w-40"
        />
      </div>

      <Card>
        <CardHeader><CardTitle>Всего: {data?.total ?? '—'}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-gray-500">Загрузка...</div> : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Имя</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Статус</th>
                    <th className="px-4 py-3 text-left w-64">Роль</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.users?.map((u: User) => {
                    const pending = pendingRoles[u.userId]
                    const displayRole = pending ?? u.role
                    const changed = pending && pending !== u.role
                    const saving = roleMutation.isPending && roleMutation.variables?.userId === u.userId
                    const toggling = activeMutation.isPending && activeMutation.variables?.userId === u.userId
                    return (
                      <tr key={u.userId} className="hover:bg-gray-50">
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
                              {ROLE_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                            {changed && (
                              <Button
                                size="sm"
                                disabled={saving}
                                onClick={() => handleSaveRole(u.userId, u.role)}
                                className="text-xs h-6 px-2"
                              >
                                {saving ? '...' : 'Сохранить'}
                              </Button>
                            )}
                          </div>
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
    </div>
  )
}
