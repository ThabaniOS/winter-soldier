import type { Week } from './types'

const CYCLE_START = new Date('2026-05-18')
const CYCLE_END = new Date('2026-08-16')

export function getCurrentWeek(weeks: Week[]): Week | null {
  const today = todayISO()
  return weeks.find((w) => w.start_date <= today && w.end_date >= today) ?? null
}

export function getDayOfCycle(date?: string): number {
  const d = date ? new Date(date) : new Date()
  const ms = d.getTime() - CYCLE_START.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function isCycleActive(): boolean {
  const today = new Date()
  return today >= CYCLE_START && today <= CYCLE_END
}

export function isSundayReviewOpen(): boolean {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`
}

export function formatDateRange(start: string, end: string): string {
  return `${formatDate(start)} — ${formatDate(end)}`
}

export function formatDateShort(iso: string): string {
  const [, month, day] = iso.split('-')
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
  return `${parseInt(day)} ${months[parseInt(month) - 1]}`
}

export function daysSince(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'today'
  if (diff === 1) return '1 day ago'
  return `${diff} days ago`
}

export function daysIn(startedDate: string): number {
  return Math.floor((Date.now() - new Date(startedDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export function currentMonthRange(): { first: string; last: string } {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { first, last }
}
