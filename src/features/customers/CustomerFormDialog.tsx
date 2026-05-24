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
import { Users, Loader2 } from 'lucide-react'
import api from '@/api/axios'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'

const customerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  ci: z.string().optional(),
})

type FormData = z.infer<typeof customerSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (data?: any) => void
  editingCustomer?: any | null
}

export default function CustomerFormDialog({ open, onOpenChange, onSuccess, editingCustomer }: Props) {
  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      ci: '',
    }
  })

  // Set fields on edit mode
  useEffect(() => {
    if (editingCustomer) {
      setValue('name', editingCustomer.name || '')
      setValue('email', editingCustomer.email || '')
      setValue('phone', editingCustomer.phone || '')
      setValue('address', editingCustomer.address || '')
      setValue('ci', editingCustomer.ci || '')
    } else {
      reset()
    }
  }, [editingCustomer, open, reset, setValue])

  const onSubmit = async (data: FormData) => {
    try {
      // Limpiar campos vacíos
      const payload = { ...data }
      if (!payload.email) delete payload.email
      
      if (editingCustomer) {
        const res = await api.put(`/customers/${editingCustomer.id}`, payload)
        toast.success('Cliente actualizado correctamente')
        onSuccess(res.data)
      } else {
        const res = await api.post('/customers', payload)
        toast.success('Cliente creado correctamente')
        onSuccess(res.data.data) // assuming the backend returns { data: { id: ... } }
      }

      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el cliente')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {editingCustomer ? 'Editar Cliente' : 'Añadir Nuevo Cliente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Nombre Completo / Razón Social <span className="text-destructive">*</span></Label>
            <Input placeholder="Ej. Juan Pérez" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de Carnet</Label>
              <Input placeholder="Ej. 12345678" {...register('ci')} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input placeholder="Ej. 70012345" {...register('phone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Correo Electrónico</Label>
            <Input placeholder="ejemplo@correo.com" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Dirección</Label>
            <Textarea 
              placeholder="Dirección del cliente..." 
              {...register('address')} 
              className="resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
