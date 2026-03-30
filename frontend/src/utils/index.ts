import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const LEAD_STATUS_COLORS: Record<string, string> = {
  New: 'badge-blue',
  Contacted: 'badge-purple',
  Qualified: 'badge-green',
  Unqualified: 'badge-gray',
  Lost: 'badge-red',
  Converted: 'badge-green',
}

export const PRIORITY_COLORS: Record<string, string> = {
  Low: 'badge-gray',
  Medium: 'badge-yellow',
  High: 'badge-red',
}

export const DEAL_STATUS_COLORS: Record<string, string> = {
  Open: 'badge-blue',
  Won: 'badge-green',
  Lost: 'badge-red',
  'On Hold': 'badge-yellow',
}

export const ACTIVITY_ICONS: Record<string, string> = {
  Call: '📞',
  Meeting: '📅',
  Task: '✅',
  Note: '📝',
  Email: '📧',
}
