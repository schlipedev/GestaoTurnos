"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Plus,
  Printer,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"
import { useEmployees, useLocations, useShifts } from "@/lib/use-scheduler-data"
import {
  addDays,
  formatDayLong,
  formatWeekRange,
  getConflictingShiftIds,
  getWeekDays,
  getWeekStart,
  isToday,
  toISODate,
  WEEKDAYS_PT,
  WEEKDAYS_PT_SHORT,
} from "@/lib/date-utils"
import type { Shift } from "@/lib/types"
import { DayPanel } from "./day-panel"
import { WeeklyTotals } from "./weekly-totals"
import { ShiftFormDialog, type ShiftDraft } from "./shift-form-dialog"

const ALL_LOCATIONS = "all"

export function Scheduler() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [locationFilter, setLocationFilter] = useState<string>(ALL_LOCATIONS)
  const [lastLocationId, setLastLocationId] = useState<string>("")
  const [lastEmployeeId, setLastEmployeeId] = useState<string>("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [draft, setDraft] = useState<ShiftDraft | null>(null)
  const [duplicating, setDuplicating] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
    if (typeof window === "undefined") return

    const savedLocation = window.localStorage.getItem("scheduler:last-location")
    const savedEmployee = window.localStorage.getItem("scheduler:last-employee")

    if (savedLocation) setLastLocationId(savedLocation)
    if (savedEmployee) setLastEmployeeId(savedEmployee)
  }, [])

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return
    if (locationFilter !== ALL_LOCATIONS) {
      window.localStorage.setItem("scheduler:last-location", locationFilter)
      setLastLocationId(locationFilter)
    }
  }, [isHydrated, locationFilter])

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const startISO = toISODate(weekDays[0])
  const endISO = toISODate(weekDays[6])

  const { data: locations, isLoading: loadingLocations } = useLocations()
  const { data: employees, isLoading: loadingEmployees } = useEmployees()
  const {
    data: shifts,
    isLoading: loadingShifts,
    error: shiftsError,
    mutate: mutateShifts,
  } = useShifts(startISO, endISO)

  const loading = !isHydrated || loadingLocations || loadingEmployees || loadingShifts
  const allShifts = shifts ?? []

  const filteredShifts = useMemo(
    () =>
      locationFilter === ALL_LOCATIONS
        ? allShifts
        : allShifts.filter((s) => s.location_id === locationFilter),
    [allShifts, locationFilter],
  )

  const conflictIds = useMemo(() => getConflictingShiftIds(filteredShifts), [filteredShifts])
  const hasConflicts = conflictIds.size > 0

  const shiftsByDay = useMemo(() => {
    const map = new Map<string, Shift[]>()
    for (const s of filteredShifts) {
      const arr = map.get(s.shift_date) ?? []
      arr.push(s)
      map.set(s.shift_date, arr)
    }
    return map
  }, [filteredShifts])

  const visibleLocations =
    locationFilter === ALL_LOCATIONS
      ? (locations ?? [])
      : (locations ?? []).filter((l) => l.id === locationFilter)

  // --- Dialog helpers ---
  function openAdd(dateISO?: string) {
    const preferredEmployeeId = lastEmployeeId || employees?.[0]?.id || ""
    const preferredLocationId =
      lastLocationId || (locationFilter !== ALL_LOCATIONS ? locationFilter : locations?.[0]?.id || "")

    setDraft({
      employee_id: preferredEmployeeId,
      location_id: preferredLocationId,
      shift_date: dateISO ?? startISO,
      start_time: "09:00",
      end_time: "17:00",
      notes: "",
      shift_type: "Trabalho",
    })
    setDialogOpen(true)
  }

  function openEdit(shift: Shift) {
    setDraft({
      id: shift.id,
      employee_id: shift.employee_id,
      location_id: shift.location_id,
      shift_date: shift.shift_date,
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      notes: shift.notes ?? "",
      shift_type: shift.shift_type,
    })
    setDialogOpen(true)
  }

  // --- CRUD ---
  async function saveShift(d: ShiftDraft) {
    const payload = {
      employee_id: d.employee_id,
      location_id: d.location_id,
      shift_date: d.shift_date,
      start_time: d.shift_type === "Trabalho" ? d.start_time : "00:00",
      end_time: d.shift_type === "Trabalho" ? d.end_time : "00:00",
      notes: d.notes.trim() || null,
      shift_type: d.shift_type,
    }
    if (d.id) {
      const { error } = await supabase.from("shifts").update(payload).eq("id", d.id)
      if (error) throw new Error(error.message)
      toast.success("Turno atualizado.")
    } else {
      const { error } = await supabase.from("shifts").insert(payload)
      if (error) throw new Error(error.message)
      toast.success("Turno adicionado.")
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem("scheduler:last-employee", d.employee_id)
      window.localStorage.setItem("scheduler:last-location", d.location_id)
    }
    setLastEmployeeId(d.employee_id)
    setLastLocationId(d.location_id)
    await mutateShifts()
  }

  async function deleteShift(id: string) {
    const { error } = await supabase.from("shifts").delete().eq("id", id)
    if (error) throw new Error(error.message)
    toast.success("Turno eliminado.")
    await mutateShifts()
  }

  async function duplicateWeek() {
    if (allShifts.length === 0) {
      toast.info("Não há turnos nesta semana para duplicar.")
      return
    }
    if (
      !window.confirm(
        "Duplicar todos os turnos desta semana para a semana seguinte? Os turnos existentes serão mantidos.",
      )
    )
      return
    setDuplicating(true)
    try {
      const cleanCopies = allShifts.map((s) => {
        const [y, m, dd] = s.shift_date.split("-").map(Number)
        const next = new Date(y, m - 1, dd + 7)
        return {
          employee_id: s.employee_id,
          location_id: s.location_id,
          shift_date: toISODate(next),
          start_time: s.start_time,
          end_time: s.end_time,
          notes: s.notes,
          shift_type: s.shift_type,
        }
      })
      const { error } = await supabase.from("shifts").insert(cleanCopies)
      if (error) throw new Error(error.message)
      toast.success("Semana duplicada para a semana seguinte.")
      setWeekStart((w) => addDays(w, 7))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao duplicar a semana.")
    } finally {
      setDuplicating(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 sm:px-6 sm:pt-8 lg:px-8">
      {/* Header */}
      <header className="mb-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Horário dos Cafés
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestão de turnos dos funcionários
            </p>
          </div>
          <div className="no-print flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAdd(toISODate(new Date()))}
              disabled={loading}
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Adicionar Hoje</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={duplicateWeek}
              disabled={duplicating || loading}
            >
              {duplicating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Copy className="size-4" />
              )}
              <span className="hidden sm:inline">Duplicar Semana</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="size-4" />
              <span className="hidden sm:inline">Imprimir Horário</span>
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Semana anterior"
              onClick={() => setWeekStart((w) => addDays(w, -7))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekStart(getWeekStart(new Date()))}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Semana seguinte"
              onClick={() => setWeekStart((w) => addDays(w, 7))}
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="ml-1 text-sm font-medium text-foreground">
              {formatWeekRange(weekStart)}
            </span>
          </div>

          <div className="sm:w-56">
            <Select
              value={locationFilter}
              onValueChange={(v) => setLocationFilter(v ?? ALL_LOCATIONS)}
            >
              <SelectTrigger aria-label="Filtrar por café">
                <SelectValue>
                  {(value) =>
                    value === ALL_LOCATIONS
                      ? "Todos os Cafés"
                      : (locations ?? []).find((l) => l.id === value)?.name ?? ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_LOCATIONS}>Todos os Cafés</SelectItem>
                {(locations ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasConflicts && (
          <div className="no-print flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="size-4 shrink-0" />
            Existem turnos sobrepostos para o mesmo funcionário. Verifique os cartões realçados.
          </div>
        )}
      </header>

      {shiftsError && (
        <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erro ao carregar os turnos. Verifique a ligação e tente novamente.
        </div>
      )}

      {loading ? (
        <SchedulerSkeleton />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            {/* Desktop / tablet weekly grid */}
            <div className="no-print hidden overflow-x-auto md:block">
              <div className="print-grid grid min-w-[720px] grid-cols-7 gap-3">
                {weekDays.map((day, i) => {
                  const iso = toISODate(day)
                  return (
                    <div
                      key={iso}
                      className="print-day flex flex-col rounded-xl border border-border bg-secondary/30 p-2"
                    >
                      <div
                        className={cnHeader(isToday(day))}
                      >
                        <span>{WEEKDAYS_PT_SHORT[i]}</span>
                        <span className="text-base font-bold">{day.getDate()}</span>
                      </div>
                      <DayPanel
                        compact
                        shifts={shiftsByDay.get(iso) ?? []}
                        locations={visibleLocations}
                        employees={employees ?? []}
                        conflictIds={conflictIds}
                        onAdd={() => openAdd(iso)}
                        onEditShift={openEdit}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Print grid (always block in print) */}
            <div className="hidden print:block">
              <div className="print-grid grid grid-cols-1 gap-3">
                {weekDays.map((day, i) => {
                  const iso = toISODate(day)
                  return (
                    <div key={iso} className="print-day border-b pb-2">
                      <div className="mb-2 font-bold">
                        {WEEKDAYS_PT[i]} — {formatDayLong(day)}
                      </div>
                      <DayPanel
                        shifts={shiftsByDay.get(iso) ?? []}
                        locations={visibleLocations}
                        employees={employees ?? []}
                        conflictIds={conflictIds}
                        onAdd={() => openAdd(iso)}
                        onEditShift={openEdit}
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Mobile daily stream */}
            <div className="flex flex-col gap-4 md:hidden">
              {weekDays.map((day, i) => {
                const iso = toISODate(day)
                const dayShifts = shiftsByDay.get(iso) ?? []
                return (
                  <section
                    key={iso}
                    className="print-day rounded-xl border border-border bg-card p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="flex items-baseline gap-2 font-semibold text-card-foreground">
                        {WEEKDAYS_PT[i]}
                        <span className="text-sm font-normal text-muted-foreground">
                          {formatDayLong(day)}
                        </span>
                      </h3>
                      {isToday(day) && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                          Hoje
                        </span>
                      )}
                    </div>
                    <DayPanel
                      shifts={dayShifts}
                      locations={visibleLocations}
                      employees={employees ?? []}
                      conflictIds={conflictIds}
                      onAdd={() => openAdd(iso)}
                      onEditShift={openEdit}
                    />
                  </section>
                )
              })}
            </div>
          </div>

          {/* Totals sidebar */}
          <aside className="no-print w-full shrink-0 lg:sticky lg:top-6 lg:w-72">
            <WeeklyTotals shifts={filteredShifts} employees={employees ?? []} />
          </aside>
        </div>
      )}

      {/* Floating add button */}
      <Button
        size="lg"
        onClick={() => openAdd()}
        disabled={loading}
        className="no-print fixed bottom-6 right-6 z-30 size-14 rounded-full p-0 shadow-lg"
        aria-label="Adicionar turno"
      >
        <Plus className="size-6" />
      </Button>

      <ShiftFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={draft}
        locations={locations ?? []}
        employees={employees ?? []}
        shifts={allShifts}
        onSave={saveShift}
        onDelete={deleteShift}
      />
    </div>
  )
}

function cnHeader(today: boolean) {
  return [
    "mb-2 flex items-center justify-between rounded-lg px-2 py-1 text-xs font-semibold",
    today ? "bg-primary text-primary-foreground" : "text-muted-foreground",
  ].join(" ")
}

function SchedulerSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-3 md:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-border p-2">
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
      <div className="w-full lg:w-72">
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  )
}
