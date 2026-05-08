import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiError(error: unknown, fallback = 'Ошибка сервера'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const msg = (error as { response?: { data?: { message?: string } } }).response?.data?.message
    if (msg) return msg
  }
  return fallback
}

const AVATAR_COLORS = ['#1565C0', '#2E7D32', '#6A1B9A', '#00838F', '#E65100', '#37474F']

export function hashColor(name: string): string {
  return AVATAR_COLORS[Math.abs([...name].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)) % 6]
}

export function initials(name: string): string {
  return name.trim().split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('') || '?'
}
