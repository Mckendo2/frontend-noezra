import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tag, Loader2 } from 'lucide-react'
import api from '@/api/axios'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

const categorySchema = z.object({
  name: z.string().min(2, 'Name must contain at least 2 characters'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof categorySchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingCategory?: any | null
}

export default function CategoryFormDialog({ open, onOpenChange, onSuccess, editingCategory }: Props) {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(categorySchema),
  })

  // Set fields on edit mode
  useEffect(() => {
    if (editingCategory) {
      setValue('name', editingCategory.name)
      setValue('description', editingCategory.description || '')
    } else {
      reset()
    }
  }, [editingCategory, open, reset, setValue])

  const onSubmit = async (data: FormData) => {
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, data)
        toast.success('Categoría actualizada correctamente')
      } else {
        await api.post('/categories', data)
        toast.success('Categoría creada correctamente')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar la categoría')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {editingCategory ? 'Editar Categoría' : 'Añadir Nueva Categoría'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre de Categoría</Label>
            <Input placeholder="Ej. Calaminas, Herramientas..." {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Descripción (Opcional)</Label>
            <Textarea 
              placeholder="Breve descripción de los productos agrupados aquí..." 
              {...register('description')} 
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Categoría
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
