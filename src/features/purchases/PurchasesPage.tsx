import { useEffect, useState, useMemo } from 'react'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { Search, ShoppingCart, Trash2, Plus, Minus, Package, Tag, Building2, ChevronLeft, Check, Truck } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PurchaseHistoryTab from './PurchaseHistoryTab'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Product {
  id: number
  name: string
  price: number
  cost: number
  stock: number
  category_id: number | null
  category_name: string | null
  image_url: string | null
  barcode: string | null
}

interface PurchaseItem extends Product {
  quantity: number
  purchaseCost: number
  sellingPrice: number
  margin: number
}

export default function PurchasesPage() {
  const { user } = useAuthStore()
  
  // States
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categorySearch, setCategorySearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc'>('name-asc')
  
  const [cart, setCart] = useState<PurchaseItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Checkout States
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [supplierId, setSupplierId] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [completedPurchase, setCompletedPurchase] = useState<any>(null)

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [resProd, resCat, resSup] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/suppliers')
      ])
      setProducts(resProd.data.data)
      setCategories(resCat.data.data)
      setSuppliers(resSup.data.data)
    } catch (err) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered Products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            (p.barcode && p.barcode.includes(search))
      const matchesCat = categoryFilter === 'all' || String(p.category_id) === categoryFilter
      return matchesSearch && matchesCat
    })

    return [...result].sort((a, b) => {
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name)
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name)
      return 0
    })
  }, [products, search, categoryFilter, sortOrder])

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        return prev.map(item => item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        )
      }
      const margin = product.cost > 0 ? Number(product.price) / Number(product.cost) : 1.3
      return [...prev, { ...product, quantity: 1, purchaseCost: Number(product.cost), sellingPrice: Number(product.price), margin }]
    })
  }

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        if (newQty < 1) return item
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const updateManualQuantity = (id: number, value: number) => {
    if (value < 1) return
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: value } : item))
  }

  const updatePurchaseCost = (id: number, value: number) => {
    if (value < 0) return
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newSellingPrice = Number((value * item.margin).toFixed(2))
        return { ...item, purchaseCost: value, sellingPrice: newSellingPrice }
      }
      return item
    }))
  }

  const updateSellingPrice = (id: number, value: number) => {
    if (value < 0) return
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newMargin = item.purchaseCost > 0 ? value / item.purchaseCost : 1.3
        return { ...item, sellingPrice: value, margin: newMargin }
      }
      return item
    }))
  }

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => setCart([])

  const totalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.purchaseCost * item.quantity), 0)
  }, [cart])

  // Checkout
  const handleCheckout = async () => {
    if (!user) {
      toast.error('Error de sesión: Usuario no detectado')
      return
    }
    if (cart.length === 0) return

    if (!supplierId || supplierId === 'none') {
      toast.error('Debe seleccionar un proveedor')
      return
    }

    try {
      setIsProcessing(true)
      const payload = {
        user_id: user.id,
        supplier_id: Number(supplierId),
        notes: notes,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_cost: item.purchaseCost,
          selling_price: item.sellingPrice
        }))
      }

      const res = await api.post('/purchases', payload)
      toast.success('Compra registrada con éxito', {
        description: `Total invertido: Bs${totalAmount.toFixed(2)}`
      })
      
      setCompletedPurchase({
        id: res.data.data?.id,
        items: [...cart],
        total: totalAmount,
        date: new Date()
      })
      
      setStep(3)
      fetchData() // Refresh stock

    } catch (err: any) {
      toast.error('Error al registrar la compra', {
        description: err.response?.data?.message || 'Revisa la conexión'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetPurchase = () => {
    clearCart()
    setStep(1)
    setSupplierId('')
    setNotes('')
    setCompletedPurchase(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 mb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Compras / Ingresos</h1>
        </div>
      </div>

      <Tabs defaultValue="new" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 mb-2">
          <TabsTrigger value="new" className="flex items-center gap-2 text-xs py-1.5 h-8">
            <ShoppingCart className="w-3.5 h-3.5" /> Nueva Compra
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 text-xs py-1.5 h-8">
            <Truck className="w-3.5 h-3.5" /> Historial de Compras
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          value="new" 
          className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col lg:flex-row gap-3 lg:gap-4"
        >
          {/* ── PANEL IZQUIERDO: CATÁLOGO DE PRODUCTOS ── */}
          <div className="flex-[1.5] lg:flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Superior: Filtros */}
            <div className="bg-card border border-border p-2 sm:p-3 rounded-lg flex flex-col xl:flex-row gap-2 sm:gap-3 items-center shrink-0 mb-2 sm:mb-3">
              <div className="relative w-full xl:flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nombre o código..." 
                  className="pl-9 h-9 text-xs sm:text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex w-full xl:w-auto gap-2 sm:gap-3">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="flex-1 xl:w-[160px] h-9 text-xs sm:text-sm">
                    <Tag className="w-3.5 h-3.5 mr-2 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="p-2 border-b border-border mb-1 sticky top-0 bg-popover z-10">
                      <Input 
                        placeholder="Filtrar categoría..." 
                        className="h-7 text-[10px] sm:text-xs"
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <SelectItem value="all">Todas las Categorías</SelectItem>
                    {categories
                      .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                      .map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                  <SelectTrigger className="flex-1 xl:w-[130px] h-9 text-xs sm:text-sm">
                    <SelectValue placeholder="Ordenar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grilla de Productos */}
            <div className="flex-1 overflow-y-auto pr-1">
              {loading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Cargando catálogo...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                  <Package className="h-10 w-10 mb-2" />
                  <p className="text-xs">No hay productos</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 select-none gap-2 sm:gap-3">
                  {filteredProducts.map(product => {
                    return (
                      <Card 
                        key={product.id} 
                        className="overflow-hidden cursor-pointer transition-all hover:border-primary/50 border-transparent border shadow-none bg-card hover:bg-accent/5 hover:shadow-sm"
                        onClick={() => addToCart(product)}
                      >
                        <div className="aspect-[4/3] bg-muted relative flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img 
                              src={product.image_url.startsWith('http') ? product.image_url : `http://localhost:3000${product.image_url}`} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-foreground/20" />
                          )}
                          
                          <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-[4px] text-[8px] sm:text-[9px] font-bold ${product.stock <= 0 ? 'bg-destructive text-white' : 'bg-muted/80 text-foreground backdrop-blur-sm'}`}>
                            Stock actual: {product.stock}
                          </div>
                        </div>
                        <div className="p-1.5 sm:p-2 space-y-0.5">
                          <p className="font-medium text-[11px] sm:text-xs line-clamp-1 text-foreground" title={product.name}>
                            {product.name}
                          </p>
                          <div className="flex justify-between items-center text-[10px] sm:text-xs text-muted-foreground">
                            <span>Costo act: Bs{Number(product.cost).toFixed(2)}</span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── PANEL DERECHO: CARRITO / PAGO ── */}
          <Card className="flex-1 lg:flex-none w-full lg:w-[400px] xl:w-[450px] shrink-0 flex flex-col border-border shadow-none overflow-hidden bg-card/50">
            <CardHeader className="py-2.5 sm:py-3 px-4 border-b border-border bg-muted/30 shrink-0">
              <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
                {step === 1 ? (
                  <>
                    <Truck className="h-3.5 w-3.5 sm:h-4 w-4 text-primary" />
                    Detalle de Ingreso
                    <span className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] sm:text-[10px]">
                      {cart.length} items
                    </span>
                  </>
                ) : step === 2 ? (
                  <>
                    <Button variant="ghost" size="icon" className="h-5 w-5 -ml-1" onClick={() => setStep(1)}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    Finalizar Registro
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    Compra Registrada
                  </>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-0 min-h-0">
              {step === 3 ? (
                <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center h-full space-y-3 sm:space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 text-success rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-lg font-bold text-foreground">¡Ingreso de Mercadería Exitoso!</h2>
                    <div className="text-xl sm:text-2xl font-bold text-primary mt-1">
                      Bs {completedPurchase?.total.toFixed(2)}
                    </div>
                  </div>
                  <Separator className="w-1/2" />
                  <p className="text-xs text-muted-foreground">El stock ha sido actualizado correctamente.</p>
                </div>
              ) : step === 1 ? (
                cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 sm:p-6 text-center">
                    <Truck className="h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-20" />
                    <p className="text-[10px] sm:text-xs">Selecciona productos para ingresar</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {cart.map(item => (
                      <div key={item.id} className="p-2 sm:p-3 flex gap-2 hover:bg-accent/30 transition-colors group">
                        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-1">
                          <p className="text-xs sm:text-sm font-semibold text-foreground truncate leading-none" title={item.name}>{item.name}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[9px] text-muted-foreground font-medium uppercase" title="Costo al que lo compras">Costo Unit</label>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="h-7 w-[70px] sm:w-20 text-xs px-2"
                                value={item.purchaseCost === 0 ? '' : item.purchaseCost}
                                onChange={(e) => updatePurchaseCost(item.id, Number(e.target.value))}
                              />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[9px] text-muted-foreground font-medium uppercase" title="Precio al que lo venderás">Precio Venta</label>
                              <Input 
                                type="number" 
                                min="0" 
                                step="0.01" 
                                className="h-7 w-[70px] sm:w-20 text-xs px-2 border-primary/50 bg-primary/5"
                                value={item.sellingPrice === 0 ? '' : item.sellingPrice}
                                onChange={(e) => updateSellingPrice(item.id, Number(e.target.value))}
                              />
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[9px] text-muted-foreground font-medium uppercase">Cantidad</label>
                              <div className="flex items-center bg-muted/80 rounded-md border border-border h-7">
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-transparent" onClick={() => updateQuantity(item.id, -1)}>
                                  <Minus className="h-2.5 w-2.5" />
                                </Button>
                                <Input 
                                  type="number" 
                                  min="1" 
                                  className="h-6 w-12 text-xs px-1 text-center border-none bg-transparent shadow-none"
                                  value={item.quantity}
                                  onChange={(e) => updateManualQuantity(item.id, Number(e.target.value))}
                                />
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-transparent" onClick={() => updateQuantity(item.id, 1)}>
                                  <Plus className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="ml-auto flex flex-col justify-end text-right">
                               <p className="text-primary text-xs sm:text-sm font-bold">Bs{(item.purchaseCost * item.quantity).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">
                      Proveedor <span className="text-destructive">*</span>
                    </Label>
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase">Notas / Documento</Label>
                    <Textarea 
                      placeholder="Factura #12345, Observaciones..." 
                      className="resize-none"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="bg-primary/5 border border-primary/10 p-3 rounded-lg mt-4">
                    <p className="text-[10px] font-bold text-primary uppercase mb-2">Resumen de Compra</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Productos diferentes:</span>
                      <span className="font-semibold">{cart.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total de unidades:</span>
                      <span className="font-semibold">{cart.reduce((a, b) => a + b.quantity, 0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Footer: Totals and Actions */}
            <div className="p-3 sm:p-4 bg-muted/30 border-t border-border shrink-0 space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Total a Pagar</span>
                <span className="text-xl sm:text-2xl font-black tracking-tighter text-primary">
                  Bs{totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="grid gap-1.5 sm:gap-2">
                {step === 1 ? (
                  <>
                    <Button 
                      size="lg" 
                      className="w-full font-bold h-9 sm:h-10 text-xs sm:text-sm shadow-sm"
                      disabled={cart.length === 0}
                      onClick={() => setStep(2)}
                    >
                      Continuar <Truck className="ml-2 h-3.5 w-3.5 sm:h-4 w-4" />
                    </Button>
                    {cart.length > 0 && (
                      <Button variant="ghost" size="sm" className="w-full text-[9px] font-bold text-muted-foreground uppercase h-5 sm:h-6" onClick={resetPurchase}>
                        Vaciar
                      </Button>
                    )}
                  </>
                ) : step === 2 ? (
                  <Button 
                    size="lg" 
                    className="w-full font-bold h-9 sm:h-10 text-xs sm:text-sm shadow-sm"
                    disabled={cart.length === 0 || isProcessing || !supplierId}
                    onClick={handleCheckout}
                  >
                    {isProcessing ? 'Procesando...' : 'Confirmar Ingreso y Stock'}
                  </Button>
                ) : (
                  <Button variant="outline" className="w-full h-8 sm:h-9 text-[10px] sm:text-xs font-bold" onClick={resetPurchase}>
                    Registrar Otra Compra
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <PurchaseHistoryTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

