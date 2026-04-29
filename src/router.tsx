import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout }               from '@/components/layout/AppLayout'
import { ProtectedRoute }          from '@/auth/ProtectedRoute'
import { LoginPage }               from '@/pages/login/LoginPage'
import { StatsPage }               from '@/pages/admin/StatsPage'
import { UsersPage }               from '@/pages/admin/UsersPage'
import { DoctorsPage }             from '@/pages/admin/DoctorsPage'
import { ClinicsPage }             from '@/pages/admin/ClinicsPage'
import { AppointmentsAdminPage }   from '@/pages/admin/AppointmentsPage'
import { ReviewsPage }             from '@/pages/admin/ReviewsPage'
import { ScheduleAdminPage }       from '@/pages/admin/SchedulePage'
import { SpecializationsPage }      from '@/pages/admin/SpecializationsPage'
import { DoctorAppointmentsPage }  from '@/pages/doctor/AppointmentsPage'
import { DoctorSchedulePage }      from '@/pages/doctor/SchedulePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { path: '/', element: <Navigate to="/admin/stats" replace /> },

      { path: '/admin/stats',        element: <ProtectedRoute role="admin"><StatsPage /></ProtectedRoute> },
      { path: '/admin/users',        element: <ProtectedRoute role="admin"><UsersPage /></ProtectedRoute> },
      { path: '/admin/doctors',      element: <ProtectedRoute role="admin"><DoctorsPage /></ProtectedRoute> },
      { path: '/admin/clinics',      element: <ProtectedRoute role="admin"><ClinicsPage /></ProtectedRoute> },
      { path: '/admin/appointments',    element: <ProtectedRoute role="admin"><AppointmentsAdminPage /></ProtectedRoute> },
      { path: '/admin/reviews',          element: <ProtectedRoute role="admin"><ReviewsPage /></ProtectedRoute> },
      { path: '/admin/schedule',         element: <ProtectedRoute role="admin"><ScheduleAdminPage /></ProtectedRoute> },
      { path: '/admin/specializations',  element: <ProtectedRoute role="admin"><SpecializationsPage /></ProtectedRoute> },

      { path: '/doctor/appointments', element: <ProtectedRoute role="doctor"><DoctorAppointmentsPage /></ProtectedRoute> },
      { path: '/doctor/schedule',     element: <ProtectedRoute role="doctor"><DoctorSchedulePage /></ProtectedRoute> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
])
