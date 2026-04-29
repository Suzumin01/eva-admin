import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSpecializations, createSpecialization, updateSpecialization, deleteSpecialization } from '@/api/endpoints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { getApiError } from '@/lib/utils'

type Spec = { specializationId: number; name: string; description: string | null }

export function SpecializationsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate]   = useState(false)
  const [editSpec,   setEditSpec]     = useState<Spec | null>(null)

  const { data: specs, isLoading } = useQuery<Spec[]>({
    queryKey: ['specializations'],
    queryFn: getSpecializations,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSpecialization(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specializations'] }),
  })

  const handleDelete = (s: Spec) => {
    if (confirm(`Удалить специализацию «${s.name}»?\nНельзя удалить, если с ней связаны врачи.`)) {
      deleteMutation.mutate(s.specializationId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Специализации</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus size={14} /> Добавить</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Всего: {specs?.length ?? '—'}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <div className="p-6 text-gray-500">Загрузка...</div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Название</th>
                  <th className="px-4 py-3 text-left">Описание</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {specs?.map((s: Spec) => (
                  <tr key={s.specializationId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs tabular-nums">{s.specializationId}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{s.description ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button title="Редактировать" onClick={() => setEditSpec(s)} className="text-gray-400 hover:text-blue-600"><Pencil size={14} /></button>
                        <button title="Удалить" onClick={() => handleDelete(s)} className="text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {showCreate && (
        <SpecModal
          title="Новая специализация"
          onClose={() => setShowCreate(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['specializations'] }); setShowCreate(false) }}
        />
      )}

      {editSpec && (
        <SpecModal
          title={`Редактировать: ${editSpec.name}`}
          initial={editSpec}
          onClose={() => setEditSpec(null)}
          onSaved={() => { qc.invalidateQueries({ queryKey: ['specializations'] }); setEditSpec(null) }}
        />
      )}
    </div>
  )
}

function SpecModal({ title, initial, onClose, onSaved }: {
  title: string
  initial?: Spec
  onClose: () => void
  onSaved: () => void
}) {
  const [name,        setName]        = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  const mutation = useMutation({
    mutationFn: () => initial
      ? updateSpecialization(initial.specializationId, { name: name.trim(), description: description.trim() || undefined })
      : createSpecialization({ name: name.trim(), description: description.trim() || undefined }),
  })

  const handleSubmit = async () => {
    try { await mutation.mutateAsync(); onSaved() } catch {}
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3">
        <Input placeholder="Название" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Описание (опционально)" value={description} onChange={e => setDescription(e.target.value)} />
        {mutation.error && <p className="text-sm text-red-600">Ошибка: {getApiError(mutation.error, 'не удалось сохранить')}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button disabled={name.trim().length < 2 || mutation.isPending} onClick={handleSubmit}>
            {mutation.isPending ? 'Сохраняю...' : initial ? 'Сохранить' : 'Создать'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
