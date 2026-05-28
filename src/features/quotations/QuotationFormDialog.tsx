import { useEffect, useState, useMemo } from 'react'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Search, Package, Plus, Minus, Trash2, Loader2, FileText, Tag } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface Product {
  id: number; name: string; price: number; stock: number;
  category_id: number | null; category_name: string | null;
  image_url: string | null; barcode: string | null;
}

interface CartItem extends Product { quantity: number }

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  editingQuotation?: any | null
}

export default function QuotationFormDialog({ open, onOpenChange, onSuccess, editingQuotation }: Props) {
  const { user } = useAuthStore()

  // Data
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form
  const [cart, setCart] = useState<CartItem[]>([])
  const [customerId, setCustomerId] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [discount, setDiscount] = useState(0)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [submitting, setSubmitting] = useState(false)

  // Default valid_until = 7 days from now
  const defaultValidDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  }

  // Fetch products, categories, customers
  useEffect(() => {
    if (!open) return
    setLoadingData(true)
    Promise.all([
      api.get('/products'),
      api.get('/categories'),
      api.get('/customers'),
    ]).then(([resProd, resCat, resCust]) => {
      setProducts(resProd.data.data)
      setCategories(resCat.data.data)
      setCustomers(resCust.data.data)
    }).catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoadingData(false))
  }, [open])

  // Reset / populate on open
  useEffect(() => {
    if (!open) return
    if (editingQuotation) {
      setCustomerId(String(editingQuotation.customer_id))
      setValidUntil(editingQuotation.valid_until?.split('T')[0] || defaultValidDate())
      setNotes(editingQuotation.notes || '')
      setDiscount(Number(editingQuotation.discount) || 0)
      // Load items into cart
      if (editingQuotation.items) {
        setCart(editingQuotation.items.map((it: any) => ({
          id: it.product_id,
          name: it.product_name,
          price: Number(it.unit_price),
          stock: 9999,
          category_id: null, category_name: null, image_url: null, barcode: null,
          quantity: it.quantity,
        })))
      }
    } else {
      setCustomerId('')
      setValidUntil(defaultValidDate())
      setNotes('')
      setDiscount(0)
      setCart([])
    }
    setSearch('')
    setCategoryFilter('all')
  }, [open, editingQuotation])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
      const matchCat = categoryFilter === 'all' || String(p.category_id) === categoryFilter
      return matchSearch && matchCat
    })
  }, [products, search, categoryFilter])

  // Cart ops
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const nq = i.quantity + delta
        if (nq < 1) return i
        return { ...i, quantity: nq }
      }
      return i
    }))
  }

  const removeItem = (id: number) => setCart(prev => prev.filter(i => i.id !== id))

  const subtotal = useMemo(() => cart.reduce((a, i) => a + Number(i.price) * i.quantity, 0), [cart])
  const total = Math.max(0, subtotal - discount)

  // Submit
  const handleSubmit = async () => {
    if (cart.length === 0) { toast.error('Agrega al menos un producto'); return }
    if (!validUntil) { toast.error('Define una fecha de validez'); return }

    setSubmitting(true)
    try {
      const payload = {
        user_id: user?.id,
        customer_id: customerId && customerId !== 'none' ? Number(customerId) : null,
        discount,
        valid_until: validUntil,
        notes: notes || undefined,
        items: cart.map(i => ({
          product_id: i.id,
          quantity: i.quantity,
          unit_price: i.price,
        }))
      }

      if (editingQuotation) {
        await api.put(`/quotations/${editingQuotation.id}`, payload)
        toast.success('Cotización actualizada')
      } else {
        await api.post('/quotations', payload)
        toast.success('Cotización creada exitosamente')
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al guardar cotización')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1100px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {editingQuotation ? 'Editar Cotización' : 'Nueva Cotización'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex gap-4 flex-1 overflow-hidden">
            {/* LEFT: Product selection */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Tag className="w-3 h-3 mr-1 text-muted-foreground" />
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 overflow-y-auto border border-border rounded-md">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <Package className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">Sin resultados</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 p-2">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => addToCart(p)}
                        className="flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:border-primary hover:bg-accent/40 transition-all text-left"
                      >
                        <Avatar className="h-9 w-9 shrink-0 border border-border">
                          {p.image_url ? (
                            <AvatarImage src={p.image_url.startsWith('http') ? p.image_url : `http://localhost:3000${p.image_url}`} className="object-cover" />
                          ) : (
                            <AvatarFallback className="text-xs"><Package className="h-3 w-3" /></AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                          <p className="text-xs text-primary font-semibold">Bs{Number(p.price).toFixed(2)}</p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Cart + form fields */}
            <div className="w-[340px] shrink-0 flex flex-col overflow-hidden border border-border rounded-md bg-card">
              {/* Cart items */}
              <div className="flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
                    <FileText className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm text-center">Selecciona productos<br/>a la izquierda</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {cart.map(item => (
                      <div key={item.id} className="p-3 flex items-center gap-2 hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-primary font-semibold">Bs{Number(item.price).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-background rounded border border-border shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-xs font-semibold w-5 text-center text-foreground">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(item.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-xs font-semibold text-foreground w-16 text-right">
                          Bs{(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeItem(item.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form fields + totals */}
              <div className="border-t border-border p-3 space-y-3 bg-card shrink-0">
                {/* Customer */}
                <div className="space-y-1">
                  <Label className="text-xs">Cliente (Opcional)</Label>
                  <Select value={customerId || "none"} onValueChange={(val) => setCustomerId(val === "none" ? "" : val)}>
                    <SelectTrigger className="w-full h-8 text-xs">
                      <SelectValue placeholder="Seleccionar cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente específico</SelectItem>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Válida hasta</Label>
                    <Input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Descuento (Bs)</Label>
                    <Input type="number" min="0" step="0.01" value={discount} onChange={e => setDiscount(Number(e.target.value) || 0)} className="h-8 text-xs" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Notas / Condiciones</Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ej: Precios válidos por 7 días..."
                    className="resize-none text-xs"
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal ({cart.length} items)</span>
                    <span>Bs{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-destructive">
                      <span>Descuento</span>
                      <span>- Bs{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1">
                    <span>Total</span>
                    <span className="text-primary">Bs{total.toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingQuotation ? 'Actualizar Cotización' : 'Guardar Cotización'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
