import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/auth/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, Stethoscope, Building2,
  CalendarDays, Star, Calendar, ClipboardList, LogOut, Tag,
} from 'lucide-react'

const adminLinks = [
  { to: '/admin/stats',           icon: LayoutDashboard, label: 'Дашборд' },
  { to: '/admin/users',           icon: Users,           label: 'Пользователи' },
  { to: '/admin/doctors',         icon: Stethoscope,     label: 'Врачи' },
  { to: '/admin/clinics',         icon: Building2,       label: 'Клиники' },
  { to: '/admin/specializations', icon: Tag,             label: 'Специализации' },
  { to: '/admin/appointments',    icon: CalendarDays,    label: 'Записи' },
  { to: '/admin/reviews',         icon: Star,            label: 'Отзывы' },
  { to: '/admin/schedule',        icon: Calendar,        label: 'Расписание' },
]

const doctorLinks = [
  { to: '/doctor/appointments', icon: ClipboardList, label: 'Мои записи' },
  { to: '/doctor/schedule',     icon: Calendar,      label: 'Расписание' },
]

export function Sidebar() {
  const { role, fullName, logout } = useAuthStore()
  const links = role === 'admin' ? adminLinks : doctorLinks

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-gray-200 bg-white">
      <div className="px-4 py-5 border-b border-gray-100">
        <p className="text-lg font-bold text-blue-600">ЕВА</p>
        <p className="text-xs text-gray-500 truncate">{fullName}</p>
        <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 capitalize">{role}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn('flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50')
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-2 px-5 py-4 text-sm text-gray-500 hover:text-red-600 border-t border-gray-100"
      >
        <LogOut size={16} /> Выйти
      </button>
    </aside>
  )
}
