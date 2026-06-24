<div align="center">
  <h1>EVA Admin</h1>
  <p>Веб-панель управления платформы ЕВА — Единый Врачебный Ассистент</p>

  ![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
</div>

---

## Возможности

- Ролевой доступ: **admin** (полный CRUD) и **doctor** (свои записи и расписание)
- Управление пользователями, врачами, клиниками, специализациями
- Просмотр и смена статуса записей, добавление врачебного заключения
- Модерация отзывов (скрыть / удалить)
- Управление расписанием: добавление и удаление слотов
- Статистика: счётчики, графики записей, топ специализаций, AI-активность

## Быстрый старт

**Требование:** запущенный [eva-backend](../eva-backend) на порту 8081.

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # сборка в dist/
```

URL бэкенда задаётся через переменную окружения:
```
VITE_API_BASE_URL=http://localhost:8081/api/v1
```
В Docker-режиме задаётся как `/api/v1` — nginx проксирует `/api/` на бэкенд.

## Роли и страницы

| Роль | Страницы |
|------|----------|
| `admin` | Stats, Users, Doctors, Clinics, Appointments, Reviews, Schedule |
| `doctor` | Appointments, Schedule |

После логина: `admin` → `/admin/stats`, `doctor` → `/doctor/appointments`.

## Структура проекта

```
src/
  api/          ← axios instance + функции запросов
  auth/         ← Zustand store (token, role), ProtectedRoute
  components/
    layout/     ← AppLayout, Sidebar (роль-зависимый)
    ui/         ← shadcn/ui компоненты
  pages/
    admin/      ← Stats, Users, Doctors, Clinics, Appointments, Reviews, Schedule
    doctor/     ← Appointments, Schedule
  router.tsx    ← React Router + role guards
```

## Авторизация

Axios interceptor перехватывает 401, вызывает `POST /auth/refresh` и повторяет исходный запрос. При неудаче — разлогин. Паттерн зеркалит OkHttp Authenticator в Android-приложении.
