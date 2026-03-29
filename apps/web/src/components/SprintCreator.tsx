import { useState } from 'react'
import { useExamSprints } from '@/hooks/useExamSprints'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SprintCreatorProps {
  isOpen: boolean
  onClose: () => void
}

export function SprintCreator({ isOpen, onClose }: SprintCreatorProps) {
  const { createSprint } = useExamSprints()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    exam_id: '',
    start_date: '',
    end_date: '',
    daily_target_hours: 2,
    target_grade: '',
  })

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      setIsSubmitting(true)

      if (!formData.exam_id || !formData.start_date || !formData.end_date) {
        toast.error('Completa todos los campos obligatorios')
        return
      }

      const startDate = new Date(formData.start_date)
      const endDate = new Date(formData.end_date)

      if (endDate <= startDate) {
        toast.error('La fecha de fin debe ser posterior a la de inicio')
        return
      }

      if (formData.daily_target_hours < 0.5 || formData.daily_target_hours > 24) {
        toast.error('Las horas por dia deben estar entre 0.5 y 24')
        return
      }

      const parsedTargetGrade =
        formData.target_grade.trim() === '' ? null : Number(formData.target_grade)

      if (
        parsedTargetGrade !== null &&
        (!Number.isFinite(parsedTargetGrade) || parsedTargetGrade < 0 || parsedTargetGrade > 100)
      ) {
        toast.error('La calificacion objetivo debe estar entre 0 y 100')
        return
      }

      await createSprint({
        exam_id: formData.exam_id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        daily_target_hours: formData.daily_target_hours,
        target_grade: parsedTargetGrade,
      })

      toast.success('Sprint creado correctamente')
      setFormData({
        exam_id: '',
        start_date: '',
        end_date: '',
        daily_target_hours: 2,
        target_grade: '',
      })
      onClose()
    } catch (error) {
      toast.error('No se pudo crear el sprint')
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle>Crear Sprint de Examen</DialogTitle>
          <DialogDescription>
            Planifica tu preparacion con metas diarias y un objetivo de calificacion
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exam_id">Asignatura o Examen</Label>
            <Input
              id="exam_id"
              value={formData.exam_id}
              onChange={(event) => handleChange('exam_id', event.target.value)}
              placeholder="Ej: Matematicas, Biologia"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha Inicio</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(event) => handleChange('start_date', event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Fecha Fin</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(event) => handleChange('end_date', event.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="daily_target_hours">Horas por Dia</Label>
            <Input
              id="daily_target_hours"
              type="number"
              step="0.5"
              min="0.5"
              max="24"
              value={formData.daily_target_hours}
              onChange={(event) => handleChange('daily_target_hours', Number(event.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_grade">Calificacion Objetivo (Opcional)</Label>
            <Input
              id="target_grade"
              type="number"
              min="0"
              max="100"
              placeholder="Ej: 90"
              value={formData.target_grade}
              onChange={(event) => handleChange('target_grade', event.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90"
            >
              {isSubmitting ? 'Creando...' : 'Crear Sprint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
