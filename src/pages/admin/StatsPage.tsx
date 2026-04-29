import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  getStats, getAppointmentsChart,
  getAppointmentStatuses, getDoctorLoad, getAiStats,
} from '@/api/endpoints'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Stethoscope, CalendarDays, TrendingUp, Brain } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const DAY_OPTIONS = [7, 14, 30, 90] as const
type DayOption = typeof DAY_OPTIONS[number]

const STATUS_COLORS: Record<string, string> = {
  scheduled:  '#6366f1',
  completed:  '#14b8a6',
  cancelled:  '#ef4444',
}
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Запланировано',
  completed: 'Завершено',
  cancelled: 'Отменено',
}

const URGENCY_COLORS: Record<string, string> = {
  low:    '#14b8a6',
  normal: '#6366f1',
  high:   '#ef4444',
}
const URGENCY_LABELS: Record<string, string> = {
  low:    'Низкая',
  normal: 'Средняя',
  high:   'Высокая',
}

export function StatsPage() {
  const [days, setDays] = useState<DayOption>(7)

  const { data, isLoading }             = useQuery({ queryKey: ['admin-stats'],    queryFn: getStats })
  const { data: chartData,  isLoading: chartLoading }    = useQuery({ queryKey: ['admin-chart', days], queryFn: () => getAppointmentsChart(days) })
  const { data: statuses,   isLoading: statusLoading }   = useQuery({ queryKey: ['admin-statuses'],    queryFn: getAppointmentStatuses })
  const { data: doctorLoad, isLoading: doctorLoading }   = useQuery({ queryKey: ['admin-doctor-load'], queryFn: getDoctorLoad })
  const { data: aiStats,    isLoading: aiLoading }       = useQuery({ queryKey: ['admin-ai-stats'],    queryFn: getAiStats })

  if (isLoading) return <div className="text-gray-500">Загрузка...</div>

  const pieData = (statuses ?? []).map(s => ({
    name:  STATUS_LABELS[s.name] ?? s.name,
    value: s.count,
    color: STATUS_COLORS[s.name] ?? '#94a3b8',
  }))

  const urgencyData = (aiStats?.urgencyDistribution ?? []).map(u => ({
    name:  URGENCY_LABELS[u.name] ?? u.name,
    value: u.count,
    color: URGENCY_COLORS[u.name] ?? '#94a3b8',
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Дашборд</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Users size={20} />}        label="Пользователей"     value={data.totalUsers}        color="blue" />
        <StatCard icon={<Stethoscope size={20} />}  label="Врачей (активных)" value={data.totalDoctors}      color="teal" />
        <StatCard icon={<CalendarDays size={20} />} label="Записей сегодня"   value={data.appointmentsToday} color="purple" />
        <StatCard icon={<TrendingUp size={20} />}   label="Записей за неделю" value={data.appointmentsWeek}  color="green" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Записи по дням</CardTitle>
          <div className="flex gap-1">
            {DAY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  days === d
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {d}д
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {chartLoading ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400">Загрузка...</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Записей']} labelFormatter={l => `Дата: ${l}`} />
                <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} name="Записей" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <Card>
          <CardHeader><CardTitle>Статусы записей</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {statusLoading ? (
              <div className="py-8 text-sm text-gray-400">Загрузка...</div>
            ) : pieData.length === 0 ? (
              <div className="py-8 text-sm text-gray-400">Нет данных</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number, name: string) => [v, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Топ врачей по записям</CardTitle></CardHeader>
          <CardContent className="p-0">
            {doctorLoading ? (
              <div className="px-6 py-8 text-sm text-gray-400">Загрузка...</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Врач</th>
                    <th className="px-6 py-3 text-right">Записей</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(doctorLoad ?? []).map((d, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3 text-gray-900">{d.name}</td>
                      <td className="px-6 py-3 text-right font-medium">{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <Card>
          <CardHeader><CardTitle>Топ специализаций</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Специализация</th>
                  <th className="px-6 py-3 text-right">Записей</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.topSpecializations?.map((s: { name: string; count: number }) => (
                  <tr key={s.name}>
                    <td className="px-6 py-3 text-gray-900">{s.name}</td>
                    <td className="px-6 py-3 text-right font-medium">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain size={18} className="text-indigo-500" />
              ИИ-анализ симптомов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiLoading ? (
              <div className="py-4 text-sm text-gray-400">Загрузка...</div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-6">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{aiStats?.totalRequests ?? 0}</p>
                    <p className="text-xs text-gray-500">Всего запросов</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{aiStats?.requestsLast30Days ?? 0}</p>
                    <p className="text-xs text-gray-500">За последние 30 дней</p>
                  </div>
                </div>
                {urgencyData.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-500 uppercase">Срочность</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie
                          data={urgencyData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {urgencyData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number, name: string) => [v, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const STAT_COLORS: Record<string, string> = {
  blue:   'bg-blue-50 text-blue-600',
  teal:   'bg-teal-50 text-teal-600',
  purple: 'bg-purple-50 text-purple-600',
  green:  'bg-green-50 text-green-600',
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`rounded-lg p-2.5 ${STAT_COLORS[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
