import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import api from '@/api/axios'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingExpense: any | null
}

const CATEGORIES = ['Servicios', 'Alquiler', 'Planilla', 'Mantenimiento', 'Insumos', 'Otros']

export default function ExpenseFormDialog({ open, onOpenChange, onSuccess, editingExpense }: Props) {
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (editingExpense && open) {
      setFormData({
        category: editingExpense.category || '',
        amount: String(editingExpense.amount) || '',
        description: editingExpense.description || '',
        date: editingExpense.date ? editingExpense.date.split('T')[0] : new Date().toISOString().split('T')[0]
      })
    } else if (open) {
      setFormData({
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      })
    }
  }, [editingExpense, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.category || !formData.amount || !formData.date) {
      toast.error('Llena los campos obligatorios')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        ...formData,
        amount: Number(formData.amount)
      }

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, payload)
        toast.success('Gasto actualizado con éxito')
      } else {
        await api.post('/expenses', payload)
        toast.success('Gasto registrado con éxito')
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar gasto')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingExpense ? 'Editar Gasto' : 'Registrar Nuevo Gasto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Categoría *</Label>
            <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label>Monto (Bs) *</Label>
            <Input 
              type="number" 
              step="0.01" 
              min="0"
              value={formData.amount}
              onChange={e => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="grid gap-2">
            <Label>Fecha *</Label>
            <Input 
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Descripción (Opcional)</Label>
            <Input 
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalles del gasto..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
