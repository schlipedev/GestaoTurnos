export type ShiftType = "Trabalho" | "Folga" | "Férias"

export interface Location {
  id: string
  name: string
  created_at?: string
}

export interface Employee {
  id: string
  name: string
  color_code: string
  created_at?: string
}

export interface Shift {
  id: string
  employee_id: string
  location_id: string
  shift_date: string // YYYY-MM-DD
  start_time: string // HH:MM:SS or HH:MM
  end_time: string
  notes: string | null
  shift_type: ShiftType
  created_at?: string
}

export const SHIFT_TYPES: ShiftType[] = ["Trabalho", "Folga", "Férias"]
