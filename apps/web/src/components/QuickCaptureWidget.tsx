import { useState } from 'react'
import { Zap, Loader2, Check } from 'lucide-react'
import { useActionConversion, type ActionConversionResult } from '@/hooks/useActionConversion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface QuickCaptureWidgetProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickCaptureWidget({ isOpen, onClose }: QuickCaptureWidgetProps) {
  const { convertNote, convertingNote } = useActionConversion()
  const [note, setNote] = useState('')
  const [conversionResult, setConversionResult] = useState<ActionConversionResult | null>(null)

  const handleConvert = async () => {
    if (!note.trim()) {
      toast.error('Escribe algo para convertir')
      return
    }

    try {
      const result = await convertNote(note)
      if (result) {
        setConversionResult(result)
      } else {
        toast.error('No se pudo analizar la nota')
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleCreateAction = () => {
    toast.success('Acción creada correctamente')
    setNote('')
    setConversionResult(null)
    onClose()
  }

  const handleReset = () => {
    setNote('')
    setConversionResult(null)
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'study_block':
        return 'Estudio'
      case 'exercise':
        return 'Rutina'
      case 'goal':
        return 'Meta'
      case 'habit':
        return 'Hábito'
      default:
        return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'study_block':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'exercise':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'goal':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'habit':
        return 'bg-pink-50 text-pink-700 border-pink-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Captura Rápida
          </DialogTitle>
          <DialogDescription>
            Escribe una idea, tarea o recordatorio. Nuestro IA la convertirá en una acción
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!conversionResult ? (
            <>
              {/* Input area */}
              <Textarea
                placeholder="Ej: Necesito estudiar 2 horas de matemáticas para el lunes"
                value={note}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
                className="min-h-24 rounded-2xl border border-gray-200 resize-none placeholder-gray-400"
                disabled={convertingNote}
              />

              {/* Convert button */}
              <Button
                onClick={handleConvert}
                disabled={convertingNote || !note.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50"
              >
                {convertingNote ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Analizar
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Usa frases naturales. Ej: "hacer tarea", "correr 20min", "limpiar cuarto"
              </p>
            </>
          ) : (
            <>
              {/* Preview */}
              <Card className={`rounded-2xl border p-4 ${getTypeColor(conversionResult.type)}`}>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Tipo detectado</p>
                    <Badge variant="outline" className={`mt-1 ${getTypeColor(conversionResult.type)}`}>
                      {getTypeLabel(conversionResult.type)}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Tu nota:</p>
                    <p className="text-sm font-medium text-gray-800 mt-1">{note}</p>
                  </div>

                  {conversionResult.reasoning && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase">Análisis:</p>
                      <p className="text-xs text-gray-700 mt-1 italic">
                        {conversionResult.reasoning}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase">Confianza</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                          style={{ width: `${conversionResult.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-gray-700">
                        {(conversionResult.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 rounded-xl border-gray-200"
                >
                  Editar
                </Button>
                <Button
                  onClick={handleCreateAction}
                  className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:opacity-90"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Crear
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
