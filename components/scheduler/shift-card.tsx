"use client"

import { AlertTriangle, Clock, Coffee, Palmtree, StickyNote } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/date-utils"
import type { Employee, Shift } from "@/lib/types"

interface ShiftCardProps {
  shift: Shift
  employee?: Employee
  conflict?: boolean
  onClick: () => void
}

export function ShiftCard({ shift, employee, conflict, onClick }: ShiftCardProps) {
  const color = employee?.color_code ?? "#94a3b8"
  const isWork = shift.shift_type === "Trabalho"

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "print-card group relative flex w-full flex-col gap-1 rounded-lg border bg-card p-2.5 text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-3",
        conflict ? "border-destructive ring-1 ring-destructive/40" : "border-border",
      )}
      style={!conflict ? { borderLeft: `4px solid ${color}` } : undefined}
      aria-label={`Turno de ${employee?.name ?? "funcionário"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="print-accent inline-block size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="truncate text-sm font-semibold text-card-foreground">
            {employee?.name ?? "—"}
          </span>
        </span>
        {conflict && (
          <AlertTriangle className="size-4 shrink-0 text-destructive" aria-label="Conflito de horário" />
        )}
      </div>

      {isWork ? (
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
        </span>
      ) : (
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
            shift.shift_type === "Folga"
              ? "bg-secondary text-secondary-foreground"
              : "bg-accent text-accent-foreground",
          )}
        >
          {shift.shift_type === "Folga" ? (
            <Coffee className="size-3.5" aria-hidden="true" />
          ) : (
            <Palmtree className="size-3.5" aria-hidden="true" />
          )}
          {shift.shift_type}
        </span>
      )}

      {shift.notes && (
        <span className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <StickyNote className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{shift.notes}</span>
        </span>
      )}
    </button>
  )
}
