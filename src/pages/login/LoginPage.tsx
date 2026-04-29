import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { login } from '@/api/endpoints'
import { useAuthStore } from '@/auth/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiError } from '@/lib/utils'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore(s => s.setAuth)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (data) => {
      if (data.role !== 'admin' && data.role !== 'doctor') {
        alert('Доступ разрешён только для admin и doctor')
        return
      }
      setAuth(data)
      navigate(data.role === 'admin' ? '/admin/stats' : '/doctor/appointments', { replace: true })
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-gray-900">ЕВА</h1>
        <p className="mb-6 text-sm text-gray-500">Панель управления</p>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && mutate()}
          />
          <Input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && mutate()}
          />
          {error && (
            <p className="text-sm text-red-600">
              {getApiError(error, 'Неверные данные')}
            </p>
          )}
          <Button
            className="w-full"
            disabled={!email || !password || isPending}
            onClick={() => mutate()}
          >
            {isPending ? 'Вход...' : 'Войти'}
          </Button>
        </div>
      </div>
    </div>
  )
}
