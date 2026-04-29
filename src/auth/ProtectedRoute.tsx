import { Navigate } from 'react-router-dom'
import { useAuthStore } from './store'

export function ProtectedRoute({ role, children }: { role?: string; children: React.ReactNode }) {
  const { accessToken, role: userRole } = useAuthStore()
  if (!accessToken) return <Navigate to="/login" replace />
  if (role && userRole !== role) return <Navigate to={userRole === 'admin' ? '/admin/stats' : '/doctor/appointments'} replace />
  return <>{children}</>
}
