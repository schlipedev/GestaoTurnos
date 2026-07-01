import type { Shift } from "./types"

export const WEEKDAYS_PT = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
]

export const WEEKDAYS_PT_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

// Format a Date to YYYY-MM-DD using local time (avoids timezone shifts).
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

// Returns Monday of the week containing the given date.
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatDayLong(date: Date): string {
  return `${date.getDate()} de ${MONTHS_PT[date.getMonth()]}`
}

export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, 6)
  const sameMonth = weekStart.getMonth() === end.getMonth()
  if (sameMonth) {
    return `${weekStart.getDate()} – ${end.getDate()} de ${MONTHS_PT[end.getMonth()]} ${end.getFullYear()}`
  }
  return `${weekStart.getDate()} ${MONTHS_PT[weekStart.getMonth()]} – ${end.getDate()} ${MONTHS_PT[end.getMonth()]} ${end.getFullYear()}`
}

export function isToday(date: Date): boolean {
  return toISODate(date) === toISODate(new Date())
}

// HH:MM:SS -> HH:MM
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

// Convert HH:MM(:SS) to minutes since midnight.
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

// Duration in hours between start and end for a working shift.
export function shiftHours(shift: Shift): number {
  if (shift.shift_type !== "Trabalho") return 0
  const start = timeToMinutes(shift.start_time)
  let end = timeToMinutes(shift.end_time)
  if (end < start) end += 24 * 60 // overnight shift
  return (end - start) / 60
}

export function formatHours(hours: number): string {
  const rounded = Math.round(hours * 100) / 100
  return `${rounded}h`
}

// Two working shifts overlap in time on the same date.
export function shiftsOverlap(a: Shift, b: Shift): boolean {
  if (a.shift_type !== "Trabalho" || b.shift_type !== "Trabalho") return false
  if (a.shift_date !== b.shift_date) return false
  const aStart = timeToMinutes(a.start_time)
  let aEnd = timeToMinutes(a.end_time)
  if (aEnd < aStart) aEnd += 24 * 60
  const bStart = timeToMinutes(b.start_time)
  let bEnd = timeToMinutes(b.end_time)
  if (bEnd < bStart) bEnd += 24 * 60
  return aStart < bEnd && bStart < aEnd
}

// Returns the set of shift ids that have a time conflict with another shift
// for the same employee.
export function getConflictingShiftIds(shifts: Shift[]): Set<string> {
  const conflicts = new Set<string>()
  for (let i = 0; i < shifts.length; i++) {
    for (let j = i + 1; j < shifts.length; j++) {
      const a = shifts[i]
      const b = shifts[j]
      if (a.employee_id === b.employee_id && shiftsOverlap(a, b)) {
        conflicts.add(a.id)
        conflicts.add(b.id)
      }
    }
  }
  return conflicts
}
