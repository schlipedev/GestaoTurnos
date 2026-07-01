"use client"

import useSWR from "swr"
import { supabase } from "./supabase"
import type { Employee, Location, Shift } from "./types"

const LOCATION_DISPLAY_NAMES = [
  "Avenida Café",
  "O Meu Caffée",
  "Café Vigia",
  "Santy Parque",
]

async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase.from("locations").select("*").order("name")
  if (error) throw new Error(error.message)
  const locations = data ?? []
  if (locations.length === LOCATION_DISPLAY_NAMES.length) {
    return locations.map((location, index) => ({
      ...location,
      name: LOCATION_DISPLAY_NAMES[index],
    }))
  }
  return locations
}

async function fetchEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from("employees").select("*").order("name")
  if (error) throw new Error(error.message)
  return data ?? []
}

async function fetchShiftsInRange([, start, end]: [string, string, string]): Promise<Shift[]> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .gte("shift_date", start)
    .lte("shift_date", end)
    .order("start_time")
  if (error) throw new Error(error.message)
  return data ?? []
}

export function useLocations() {
  return useSWR("locations", fetchLocations)
}

export function useEmployees() {
  return useSWR("employees", fetchEmployees)
}

export function useShifts(startISO: string, endISO: string) {
  return useSWR(["shifts", startISO, endISO], fetchShiftsInRange)
}
