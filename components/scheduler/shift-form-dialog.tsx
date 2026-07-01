"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SHIFT_TYPES, type Employee, type Location, type Shift, type ShiftType } from "@/lib/types"

export interface ShiftDraft {
  id?: string
  employee_id: string
  location_id: string
  shift_date: string
  start_time: string
  end_time: string
  notes: string
  shift_type: ShiftType
}

interface ShiftFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial: ShiftDraft | null
  locations: Location[]
  employees: Employee[]
  shifts: Shift[]
  onSave: (draft: ShiftDraft) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function ShiftFormDialog({
  open,
  onOpenChange,
  initial,
  locations,
  employees,
  shifts,
  onSave,
  onDelete,
}: ShiftFormDialogProps) {
  const [form, setForm] = useState<ShiftDraft | null>(initial)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setForm(initial)
  }, [initial])

  const isEditing = Boolean(form?.id)

  const update = <K extends keyof ShiftDraft>(key: K, value: ShiftDraft[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  // Absence detected: same employee already has Folga/Férias on this date.
  const absenceConflict = useMemo(() => {
    if (!form || form.shift_type !== "Trabalho") return null
    return shifts.find(
      (s) =>
        s.id !== form.id &&
        s.employee_id === form.employee_id &&
        s.shift_date === form.shift_date &&
        s.shift_type !== "Trabalho",
    )
  }, [form, shifts])

  if (!form) return null

  const handleSave = async () => {
    if (!form.employee_id || !form.location_id || !form.shift_date) {
      toast.error("Preencha o café, o funcionário e a data.")
      return
    }
    if (form.shift_type === "Trabalho" && form.end_time <= form.start_time) {
      toast.error("A hora de fim deve ser posterior à hora de início.")
      return
    }
    if (absenceConflict) {
      const confirmed = window.confirm(
        `Este funcionário tem ${absenceConflict.shift_type} marcada neste dia. Deseja mesmo agendar um turno de trabalho?`,
      )
      if (!confirmed) return
    }
    setSaving(true)
    try {
      await onSave(form)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar o turno.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!form.id) return
    if (!window.confirm("Tem a certeza que pretende eliminar este turno?")) return
    setDeleting(true)
    try {
      await onDelete(form.id)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar o turno.")
    } finally {
      setDeleting(false)
    }
  }

  const isWork = form.shift_type === "Trabalho"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Turno" : "Adicionar Turno"}</DialogTitle>
          <DialogDescription>
            Defina os detalhes do turno para o horário do café.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="employee">Funcionário</Label>
            <Select value={form.employee_id} onValueChange={(v) => update("employee_id", v ?? "")}>
              <SelectTrigger id="employee">
                <SelectValue placeholder="Selecionar funcionário">
                  {(value) => employees.find((e) => e.id === value)?.name ?? ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: e.color_code }}
                      />
                      {e.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="location">Café</Label>
            <Select value={form.location_id} onValueChange={(v) => update("location_id", v ?? "")}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Selecionar café">
                  {(value) => locations.find((l) => l.id === value)?.name ?? ""}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={form.shift_date}
                onChange={(e) => update("shift_date", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo de Turno</Label>
              <Select
                value={form.shift_type}
                onValueChange={(v) => update("shift_type", (v ?? "Trabalho") as ShiftType)}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isWork && (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="start">Início</Label>
                <Input
                  id="start"
                  type="time"
                  value={form.start_time.slice(0, 5)}
                  onChange={(e) => update("start_time", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="end">Fim</Label>
                <Input
                  id="end"
                  type="time"
                  value={form.end_time.slice(0, 5)}
                  onChange={(e) => update("end_time", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              placeholder="Notas opcionais (ex: abertura, formação...)"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={2}
            />
          </div>

          {absenceConflict && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Atenção: este funcionário tem {absenceConflict.shift_type} marcada neste dia.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          {isEditing ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="text-destructive hover:text-destructive"
            >
              {deleting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Eliminar
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving || deleting}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
