import { api } from './client'

export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then(r => r.data)

export const getStats = () =>
  api.get('/admin/stats').then(r => r.data)

export const getAppointmentsChart = (days: number) =>
  api.get('/admin/stats/chart', { params: { days } }).then(r => r.data as { date: string; count: number }[])

export const getAppointmentStatuses = () =>
  api.get('/admin/stats/statuses').then(r => r.data as { name: string; count: number }[])

export const getDoctorLoad = (limit = 5) =>
  api.get('/admin/stats/doctor-load', { params: { limit } }).then(r => r.data as { name: string; count: number }[])

export const getAiStats = () =>
  api.get('/admin/stats/ai').then(r => r.data as {
    totalRequests: number
    requestsLast30Days: number
    urgencyDistribution: { name: string; count: number }[]
  })

export const getUsers = (params?: { search?: string; role?: string; limit?: number; offset?: number }) =>
  api.get('/admin/users', { params }).then(r => r.data)

export const updateUser = (userId: string, data: {
  fullName?: string; email?: string; phone?: string
  dateOfBirth?: string; allergies?: string; chronicDiseases?: string
}) => api.patch(`/admin/users/${userId}`, data).then(r => r.data)

export const updateUserRole = (userId: string, role: string) =>
  api.patch(`/admin/users/${userId}/role`, { role }).then(r => r.data)

export const setUserActive = (userId: string, active: boolean) =>
  api.patch(`/admin/users/${userId}/active`, { active }).then(r => r.data)

export const adminUploadUserPhoto = (userId: string, file: File) => {
  const fd = new FormData(); fd.append('photo', file)
  return api.post(`/admin/users/${userId}/photo`, fd).then(r => r.data)
}

export const adminDeleteUserPhoto = (userId: string) =>
  api.delete(`/admin/users/${userId}/photo`).then(r => r.data)

export const getDoctors = (params?: { specializationId?: number; clinicId?: number; search?: string; limit?: number; offset?: number }) =>
  api.get('/doctors', { params }).then(r => r.data)

export const createDoctor = (data: {
  fullName: string; clinicId: number; specializationId: number;
  bio?: string; photoUrl?: string; experienceYears?: number
}) => api.post('/admin/doctors', data).then(r => r.data)

export const updateDoctor = (doctorId: number, data: {
  fullName?: string; clinicId?: number; specializationId?: number;
  bio?: string; photoUrl?: string; experienceYears?: number
}) => api.patch(`/admin/doctors/${doctorId}`, data).then(r => r.data)

export const deactivateDoctor = (doctorId: number) =>
  api.delete(`/admin/doctors/${doctorId}`).then(r => r.data)

export const adminUploadDoctorPhoto = (doctorId: number, file: File) => {
  const fd = new FormData(); fd.append('photo', file)
  return api.post(`/admin/doctors/${doctorId}/photo`, fd).then(r => r.data)
}

export const adminDeleteDoctorPhoto = (doctorId: number) =>
  api.delete(`/admin/doctors/${doctorId}/photo`).then(r => r.data)

export const createDoctorAccount = (doctorId: number, data: { email: string; password: string; fullName?: string }) =>
  api.post(`/admin/doctors/${doctorId}/account`, data).then(r => r.data)

export const getClinics = () =>
  api.get('/clinics').then(r => r.data)

export const createClinic = (data: { clinicName: string; address: string; phone?: string; website?: string }) =>
  api.post('/admin/clinics', data).then(r => r.data)

export const updateClinic = (clinicId: number, data: { clinicName?: string; address?: string; phone?: string; website?: string }) =>
  api.patch(`/admin/clinics/${clinicId}`, data).then(r => r.data)

export const deactivateClinic = (clinicId: number) =>
  api.delete(`/admin/clinics/${clinicId}`).then(r => r.data)

export const adminUploadClinicLogo = (clinicId: number, file: File) => {
  const fd = new FormData(); fd.append('logo', file)
  return api.post(`/clinics/${clinicId}/logo`, fd).then(r => r.data)
}

export const adminDeleteClinicLogo = (clinicId: number) =>
  api.delete(`/admin/clinics/${clinicId}/logo`).then(r => r.data)

export const getAdminAppointments = (params?: {
  status?: string; doctorId?: number; dateFrom?: string; dateTo?: string;
  limit?: number; offset?: number
}) => api.get('/admin/appointments', { params }).then(r => r.data)

export const updateAppointmentStatus = (id: string, status: string) =>
  api.patch(`/admin/appointments/${id}/status`, { status }).then(r => r.data)

export const getAdminReviews = (params?: { doctorId?: number; hidden?: boolean }) =>
  api.get('/admin/reviews', { params }).then(r => r.data)

export const hideReview = (reviewId: string, hidden: boolean) =>
  api.patch(`/admin/reviews/${reviewId}/hide`, { hidden }).then(r => r.data)

export const deleteReview = (reviewId: string) =>
  api.delete(`/admin/reviews/${reviewId}`).then(r => r.data)

export const getSchedules = (params?: { doctorId?: number; dateFrom?: string; dateTo?: string }) =>
  api.get('/schedules', { params }).then(r => r.data)

export const createSchedule = (data: { doctorId: number; slotDate: string; slotTime: string; durationMinutes?: number }) =>
  api.post('/admin/schedules', data).then(r => r.data)

export const bulkCreateSchedule = (data: {
  doctorId: number; dateFrom: string; dateTo: string; times: string[]; durationMinutes?: number
}) => api.post('/admin/schedules/bulk', data).then(r => r.data)

export const deleteSchedule = (scheduleId: number) =>
  api.delete(`/admin/schedules/${scheduleId}`).then(r => r.data)

export const getDoctorAppointments = (params?: { status?: string; dateFrom?: string; dateTo?: string }) =>
  api.get('/doctor/appointments', { params }).then(r => r.data)

export const getDoctorAppointmentDocuments = (appointmentId: string) =>
  api.get(`/doctor/appointments/${appointmentId}/documents`).then(r => r.data)

export const getAdminUserDocuments = (userId: string) =>
  api.get(`/admin/users/${userId}/documents`).then(r => r.data)

export const updateDoctorAppointmentStatus = (id: string, status: string) =>
  api.patch(`/doctor/appointments/${id}/status`, { status }).then(r => r.data)

export const saveDoctorConclusion = (id: string, data: { conclusion?: string; notes?: string }) =>
  api.patch(`/doctor/appointments/${id}/conclusion`, data).then(r => r.data)

export const getDoctorSchedules = (params?: { dateFrom?: string; dateTo?: string }) =>
  api.get('/doctor/schedules', { params }).then(r => r.data)

export const createDoctorSchedule = (data: { slotDate: string; slotTime: string; durationMinutes?: number }) =>
  api.post('/doctor/schedules', data).then(r => r.data)

export const bulkCreateDoctorSchedule = (data: { dateFrom: string; dateTo: string; times: string[]; durationMinutes?: number }) =>
  api.post('/doctor/schedules/bulk', data).then(r => r.data)

export const deleteDoctorSchedule = (scheduleId: number) =>
  api.delete(`/doctor/schedules/${scheduleId}`).then(r => r.data)

export const createSpecialization = (data: { name: string; description?: string }) =>
  api.post('/admin/specializations', data).then(r => r.data)

export const updateSpecialization = (id: number, data: { name?: string; description?: string }) =>
  api.patch(`/admin/specializations/${id}`, data).then(r => r.data)

export const deleteSpecialization = (id: number) =>
  api.delete(`/admin/specializations/${id}`).then(r => r.data)

export const getSpecializations = () =>
  api.get('/specializations').then(r => r.data)

export const downloadBlob = async (apiPath: string, fileName: string) => {
  const res = await api.get(apiPath, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
