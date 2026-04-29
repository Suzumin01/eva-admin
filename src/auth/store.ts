import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  fullName: string | null
  role: string | null
  doctorId: number | null
  setAuth: (data: { token: string; refreshToken: string; userId: string; fullName: string; role: string }) => void
  setTokens: (access: string, refresh: string) => void
  logout: () => void
}

function parseDoctorId(token: string | null): number | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.doctorId ?? null
  } catch { return null }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      fullName: null,
      role: null,
      doctorId: null,
      setAuth: (data) => set({
        accessToken: data.token,
        refreshToken: data.refreshToken,
        userId: data.userId,
        fullName: data.fullName,
        role: data.role,
        doctorId: parseDoctorId(data.token),
      }),
      setTokens: (access, refresh) => set({
        accessToken: access,
        refreshToken: refresh,
        doctorId: parseDoctorId(access),
      }),
      logout: () => {
        set({ accessToken: null, refreshToken: null, userId: null, fullName: null, role: null, doctorId: null })
        window.location.href = '/login'
      },
    }),
    { name: 'eva-admin-auth' }
  )
)
