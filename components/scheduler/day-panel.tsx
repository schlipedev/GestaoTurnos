"use client"

import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ShiftCard } from "./shift-card"
import type { Employee, Location, Shift } from "@/lib/types"

interface DayPanelProps {
  shifts: Shift[]
  locations: Location[]
  employees: Employee[]
  conflictIds: Set<string>
  onAdd: () => void
  onEditShift: (shift: Shift) => void
  /** When true, render compact (weekly grid column). */
  compact?: boolean
}

export function DayPanel({
  shifts,
  locations,
  employees,
  conflictIds,
  onAdd,
  onEditShift,
  compact,
}: DayPanelProps) {
  const employeeMap = new Map(employees.map((e) => [e.id, e]))
  const visibleLocations = locations.filter((l) =>
    shifts.some((s) => s.location_id === l.id),
  )

  return (
    <div className={cn("flex flex-col gap-3", compact && "min-h-24")}>
      {visibleLocations.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="no-print flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-4 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar
        </button>
      ) : (
        visibleLocations.map((location) => {
          const locationShifts = shifts.filter((s) => s.location_id === location.id)
          return (
            <div key={location.id} className="flex flex-col gap-1.5">
              <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                {location.name}
              </h4>
              <div className="flex flex-col gap-2">
                {locationShifts.map((shift) => (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    employee={employeeMap.get(shift.employee_id)}
                    conflict={conflictIds.has(shift.id)}
                    onClick={() => onEditShift(shift)}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}

      {visibleLocations.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="no-print h-7 justify-start gap-1.5 text-xs text-muted-foreground hover:text-primary"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Adicionar turno
        </Button>
      )}
    </div>
  )
}
