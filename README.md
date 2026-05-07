# EVA Admin — Веб-панель управления

React SPA для ролей **admin** и **doctor** платформы ЕВА.

## Стек

- Vite 5 + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query v5 (server state)
- Zustand (auth store)
- React Router v6
- Axios (с interceptor авто-обновления токена)

## Запуск

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # сборка в dist/
```

Бэкенд должен работать на `http://localhost:8081`.  
Base URL задаётся через `VITE_API_URL` в `.env` (по умолчанию `http://localhost:8081/api/v1`).

## Роли и доступ

| Роль | Доступные страницы |
|------|--------------------|
| `admin` | Stats, Users, Doctors, Clinics, Appointments, Reviews, Schedule (любого врача) |
| `doctor` | Appointments (свои), Schedule (своё) |

После логина редирект: `admin` → `/admin/stats`, `doctor` → `/doctor/appointments`.  
Попытка зайти на страницу чужой роли → 403 / редирект на логин.

## Структура проекта

```
src/
  api/              ← axios instance + функции запросов к API
  auth/             ← Zustand store (token, role, userId), ProtectedRoute
  components/
    layout/         ← AppLayout, Sidebar (роль-зависимый)
    ui/             ← shadcn-компоненты (Button, Card, Badge, Input…)
  pages/
    login/          ← LoginPage
    admin/          ← StatsPage, UsersPage, DoctorsPage, ClinicsPage,
                       AppointmentsPage, ReviewsPage, SchedulePage
    doctor/         ← AppointmentsPage, SchedulePage
  router.tsx        ← React Router + role guards
  main.tsx          ← точка входа
```

## Страницы Admin

| Маршрут | Описание |
|---------|----------|
| `/admin/stats` | Дашборд: счётчики пользователей, врачей, записей; топ специализаций |
| `/admin/users` | Список пользователей, смена роли |
| `/admin/doctors` | CRUD врачей, создание doctor-аккаунта |
| `/admin/clinics` | CRUD клиник |
| `/admin/appointments` | Все записи с фильтрами, смена статуса |
| `/admin/reviews` | Модерация отзывов (скрыть / удалить) |
| `/admin/schedule` | Расписание любого врача (добавить / удалить слоты) |

## Страницы Doctor

| Маршрут | Описание |
|---------|----------|
| `/doctor/appointments` | Записи врача, смена статуса, написание заключения |
| `/doctor/schedule` | Своё расписание (добавить / удалить слоты) |

## Авторизация

Token refresh реализован через axios interceptor: при 401 автоматически вызывается `POST /auth/refresh`, после чего исходный запрос повторяется. При неудаче — разлогин.
