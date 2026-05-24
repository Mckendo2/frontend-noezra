import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ImagePlus, Package, Loader2 } from 'lucide-react'
import api from '@/api/axios'
import { toast } from 'sonner'

const productSchema = z.object({
  name: z.string().min(2, 'Name must contain at least 2 characters'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  category_id: z.string().optional(),
  cost: z.coerce.number().min(0, 'Cost must be >= 0'),
  price: z.coerce.number().min(0, 'Price must be >= 0'),
  stock: z.coerce.number().min(0, 'Stock must be >= 0'),
  min_stock: z.coerce.number().min(0),
})

type FormData = z.infer<typeof productSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editingProduct?: any | null
}

export default function ProductFormDialog({ open, onOpenChange, onSuccess, editingProduct }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(productSchema),
  })

  useEffect(() => {
    // Cargar categorias para el select
    api.get('/categories').then(res => setCategories(res.data.data)).catch()
  }, [])

  // Set fields on edit mode
  useEffect(() => {
    if (editingProduct) {
      Object.keys(productSchema.shape).forEach(key => {
        setValue(key as any, key === 'category_id' ? String(editingProduct[key] || '') : editingProduct[key])
      })
      if (editingProduct.image_url) {
        setPreviewUrl(editingProduct.image_url.startsWith('http') ? editingProduct.image_url : `http://localhost:3000${editingProduct.image_url}`)
      }
    } else {
      reset()
      setFile(null)
      setPreviewUrl(null)
    }
  }, [editingProduct, open, reset, setValue])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== '' && val !== 'none') formData.append(key, String(val))
      })
      
      if (file) {
        formData.append('image', file)
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Producto actualizado correctamente')
      } else {
        await api.post('/products', formData, {
           headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Producto creado correctamente')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el producto')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Imagen Section */}
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 rounded-xl border border-border bg-muted">
              {previewUrl ? (
                <AvatarImage src={previewUrl} className="object-cover" />
              ) : (
                <AvatarFallback className="rounded-xl"><Package className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <Label htmlFor="imageUpload" className="cursor-pointer">
                <div className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  <ImagePlus className="h-4 w-4" />
                  Seleccionar Fotografía
                </div>
              </Label>
              <Input id="imageUpload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WEBP. Máx 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Nombre del Producto</Label>
              <Input placeholder="Ej. Calamina Galvanizada" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Descripción</Label>
              <Textarea placeholder="Detalles del producto (opcional)" {...register('description')} className="resize-none" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Código de Barras</Label>
              <Input placeholder="Código SKU" {...register('barcode')} />
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={watch('category_id')} onValueChange={(val) => setValue('category_id', val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin Categoría</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Costo Base (Bs)</Label>
              <Input type="number" step="0.01" {...register('cost')} />
              {errors.cost && <p className="text-xs text-destructive">{errors.cost.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Precio Venta (Bs)</Label>
              <Input type="number" step="0.01" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Stock Actual</Label>
              <Input type="number" {...register('stock')} />
              {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Stock Mínimo</Label>
              <Input type="number" defaultValue={5} {...register('min_stock')} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
