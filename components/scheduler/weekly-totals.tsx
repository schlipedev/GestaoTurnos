"use client"

import { useMemo } from "react"
import { Clock } from "lucide-react"
import { formatHours, shiftHours } from "@/lib/date-utils"
import type { Employee, Shift } from "@/lib/types"

interface WeeklyTotalsProps {
  shifts: Shift[]
  employees: Employee[]
}

export function WeeklyTotals({ shifts, employees }: WeeklyTotalsProps) {
  const totals = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of shifts) {
      map.set(s.employee_id, (map.get(s.employee_id) ?? 0) + shiftHours(s))
    }
    return employees
      .map((e) => ({ employee: e, hours: map.get(e.id) ?? 0 }))
      .filter((row) => row.hours > 0)
      .sort((a, b) => b.hours - a.hours)
  }, [shifts, employees])

  const grandTotal = totals.reduce((sum, row) => sum + row.hours, 0)

  return (
    <section
      aria-label="Total de horas semanais por funcionário"
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
          <Clock className="size-4 text-primary" aria-hidden="true" />
          Horas da Semana
        </h2>
        <span className="text-sm font-semibold text-primary">{formatHours(grandTotal)}</span>
      </div>

      {totals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem horas de trabalho agendadas.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {totals.map(({ employee, hours }) => (
            <li key={employee.id} className="flex items-center gap-3">
              <span
                className="inline-block size-3 shrink-0 rounded-full"
                style={{ backgroundColor: employee.color_code }}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-card-foreground">
                {employee.name}
              </span>
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {formatHours(hours)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
