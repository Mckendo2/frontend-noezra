import { useEffect, useState, useMemo } from 'react'
import api from '@/api/axios'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { Search, ShoppingCart, Trash2, Plus, Minus, Package, Tag, Wallet, ChevronLeft, Check, Printer } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import SalesHistoryTab from './SalesHistoryTab'
import { printSaleReceipt } from './SalePrint'
import CustomerFormDialog from '../customers/CustomerFormDialog'

interface Product {
  id: number
  name: string
  price: number
  stock: number
  category_id: number | null
  category_name: string | null
  image_url: string | null
  barcode: string | null
}

interface CartItem extends Product {
  quantity: number
}

export default function SalesPage() {
  const { user } = useAuthStore()
  
  // States
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [categorySearch, setCategorySearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc'>('name-asc')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Checkout States
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [paymentType, setPaymentType] = useState<'Pagada' | 'A Crédito'>('Pagada')
  const [customerId, setCustomerId] = useState<string>('none')
  const [discount, setDiscount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false)
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [completedSale, setCompletedSale] = useState<any>(null)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [resProd, resCat, resCust] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get('/customers')
      ])
      setProducts(resProd.data.data)
      setCategories(resCat.data.data)
      setCustomers(resCust.data.data)
    } catch (err) {
      toast.error('Error al cargar catálogo de productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                            (p.barcode && p.barcode.includes(search))
      const matchesCat = categoryFilter === 'all' || String(p.category_id) === categoryFilter
      return matchesSearch && matchesCat
    })

    // Sort
    return [...result].sort((a, b) => {
      if (sortOrder === 'name-asc') return a.name.localeCompare(b.name)
      if (sortOrder === 'name-desc') return b.name.localeCompare(a.name)
      if (sortOrder === 'price-asc') return Number(a.price) - Number(b.price)
      if (sortOrder === 'price-desc') return Number(b.price) - Number(a.price)
      return 0
    })
  }, [products, search, categoryFilter, sortOrder])

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Este producto está agotado')
      return
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning('No hay más stock disponible de este producto')
          return prev
        }
        return prev.map(item => item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        )
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta
        if (newQty > item.stock) {
          toast.warning('Supera el stock físicamente disponible')
          return item
        }
        if (newQty < 1) return item
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }

  const setExactQuantity = (id: number, qty: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        if (qty > item.stock) {
          toast.warning(`Solo hay ${item.stock} unidades disponibles`)
          return item
        }
        return { ...item, quantity: qty }
      }
      return item
    }))
  }

  const updatePrice = (id: number, newPrice: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, price: newPrice }
      }
      return item
    }))
  }

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const clearCart = () => setCart([])

  const totalAmount = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.price) * item.quantity), 0)
  }, [cart])

  // Checkout
  const handleCheckout = async () => {
    if (!user) {
      toast.error('Error de sesión: Usuario no detectado')
      return
    }
    if (cart.length === 0) return

    if (paymentType === 'A Crédito' && (!customerId || customerId === 'none')) {
      toast.error('Debe seleccionar un cliente para ventas a crédito')
      return
    }

    try {
      setIsProcessing(true)
      const payload = {
        user_id: user.id,
        customer_id: customerId !== 'none' ? Number(customerId) : null,
        payment_method: paymentType === 'A Crédito' ? 'credit' : (
          paymentMethod === 'Efectivo' ? 'cash' :
          paymentMethod === 'Tarjeta' ? 'card' :
          'transfer'
        ),
        discount: discount,
        initial_payment: paymentType === 'A Crédito' ? (amountPaid || 0) : 0,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: Number(item.price)
        }))
      }

      await api.post('/sales', payload)
      toast.success('Venta registrada con éxito', {
        description: `Total cobrado: Bs${(totalAmount - discount).toFixed(2)}`
      })
      
      const finalAmount = Math.max(0, totalAmount - discount)
      setCompletedSale({
        items: [...cart],
        subtotal: totalAmount,
        discount: discount,
        total: finalAmount,
        date: new Date()
      })
      
      setStep(3)
      fetchData() // Refresh stock

    } catch (err: any) {
      toast.error('Error al registrar la venta', {
        description: err.response?.data?.message || 'Revisa la conexión'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const resetSale = () => {
    clearCart()
    setStep(1)
    setDiscount(0)
    setCustomerId('none')
    setAmountPaid(0)
    setCompletedSale(null)
  }

  const handleDownloadReceipt = () => {
    if (completedSale) {
      printSaleReceipt(completedSale)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shrink-0 mb-2">
        <div>
          <h1 className="text-xl font-bold text-foreground">Ventas</h1>
        </div>
      </div>

      <Tabs defaultValue="pos" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="shrink-0 mb-2">
          <TabsTrigger value="pos" className="flex items-center gap-2 text-xs py-1.5 h-8">
            <ShoppingCart className="w-3.5 h-3.5" /> Punto de Venta
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 text-xs py-1.5 h-8">
            <Wallet className="w-3.5 h-3.5" /> Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          value="pos" 
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
                        onClick={(e) => e.stopPropagation()} // Prevent closing dropdown
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
                  <SelectTrigger className="flex-1 xl:w-[160px] h-9 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 truncate">
                      <Wallet className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Ordenar por" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Nombre (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Nombre (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Menor Precio</SelectItem>
                    <SelectItem value="price-desc">Mayor Precio</SelectItem>
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
                    const isOutOfStock = product.stock <= 0
                    return (
                      <Card 
                        key={product.id} 
                        className={`overflow-hidden cursor-pointer transition-all hover:border-primary/50 border-transparent border shadow-none bg-card hover:bg-accent/5 ${isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:shadow-sm'}`}
                        onClick={() => !isOutOfStock && addToCart(product)}
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
                          
                          <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded-[4px] text-[8px] sm:text-[9px] font-bold ${isOutOfStock ? 'bg-destructive text-white' : 'bg-primary/90 text-white'}`}>
                            {isOutOfStock ? 'AGOTADO' : `Stock: ${product.stock}`}
                          </div>
                        </div>
                        <div className="p-1.5 sm:p-2 space-y-0.5">
                          <p className="font-medium text-[11px] sm:text-xs line-clamp-1 text-foreground" title={product.name}>
                            {product.name}
                          </p>
                          <div className="flex justify-between items-center">
                            <p className="text-primary font-bold text-xs sm:text-sm">
                              Bs{Number(product.price).toFixed(2)}
                            </p>
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
          <Card className="flex-1 lg:flex-none w-full lg:w-[320px] xl:w-[360px] shrink-0 flex flex-col border-border shadow-none overflow-hidden bg-card/50">
            <CardHeader className="py-2.5 sm:py-3 px-4 border-b border-border bg-muted/30 shrink-0">
              <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
                {step === 1 ? (
                  <>
                    <ShoppingCart className="h-3.5 w-3.5 sm:h-4 w-4 text-primary" />
                    Carrito
                    <span className="ml-auto bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] sm:text-[10px]">
                      {cart.length} items
                    </span>
                  </>
                ) : step === 2 ? (
                  <>
                    <Button variant="ghost" size="icon" className="h-5 w-5 -ml-1" onClick={() => setStep(1)}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    Finalizar
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    Completada
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
                    <h2 className="text-sm sm:text-lg font-bold text-foreground">¡Venta Exitosa!</h2>
                    <div className="text-xl sm:text-2xl font-bold text-primary mt-1">
                      Bs {completedSale?.total.toFixed(2)}
                    </div>
                  </div>
                  <Separator className="w-1/2" />
                  <p className="text-[10px] text-muted-foreground">Comprobante generado</p>
                </div>
              ) : step === 1 ? (
                cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 sm:p-6 text-center">
                    <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 mb-2 opacity-20" />
                    <p className="text-[10px] sm:text-xs">Selecciona productos</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {cart.map(item => (
                      <div key={item.id} className="p-2 sm:p-3 flex gap-2 sm:gap-2.5 hover:bg-accent/30 transition-colors group">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 rounded-md border border-border bg-muted overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url.startsWith('http') ? item.image_url : `http://localhost:3000${item.image_url}`} className="h-full w-full object-cover" alt="" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center"><Package className="h-3 w-3 sm:h-4 sm:w-4 opacity-30" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate leading-none mb-1" title={item.name}>{item.name}</p>
                          <div className="flex items-center gap-1 text-primary font-bold">
                            <span className="text-[10px] sm:text-[11px]">Bs</span>
                            <input
                              type="number"
                              className="w-14 sm:w-16 h-5 text-[10px] sm:text-[11px] font-bold bg-transparent border-b border-primary/30 outline-none focus:border-primary p-0 text-primary"
                              value={item.price === '' ? '' : Number(item.price)}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value)
                                if (!isNaN(val) && val >= 0) {
                                  updatePrice(item.id, val)
                                } else if (e.target.value === '') {
                                  // Permitir limpiar el input temporalmente
                                  setCart(prev => prev.map(i => i.id === item.id ? { ...i, price: '' as any } : i))
                                }
                              }}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value)
                                if (isNaN(val) || val < 0) {
                                  const baseProduct = products.find(p => p.id === item.id)
                                  updatePrice(item.id, baseProduct ? Number(baseProduct.price) : 0)
                                }
                              }}
                              step="0.01"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                          <div className="flex items-center bg-muted/80 rounded-md border border-border h-6 sm:h-7">
                            <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-transparent" onClick={() => updateQuantity(item.id, -1)}>
                              <Minus className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                            </Button>
                            <input 
                              type="text" inputMode="numeric" pattern="[0-9]*"
                              className="w-8 sm:w-10 text-[10px] sm:text-[11px] font-bold text-center bg-transparent border-none outline-none focus:ring-0 p-0"
                              value={item.quantity || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value)
                                if (!isNaN(val)) setExactQuantity(item.id, val)
                                else if (e.target.value === '') setExactQuantity(item.id, 0)
                              }}
                              onBlur={() => {
                                if (!item.quantity || item.quantity < 1) setExactQuantity(item.id, 1)
                              }}
                            />
                            <Button variant="ghost" size="icon" className="h-5 w-5 sm:h-6 sm:w-6 hover:bg-transparent" onClick={() => updateQuantity(item.id, 1)}>
                              <Plus className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                            </Button>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}>
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  {/* Tipo de Pago */}
                  <div className="flex gap-1 p-1 bg-muted rounded-lg">
                    <Button 
                      variant={paymentType === 'Pagada' ? 'default' : 'ghost'} 
                      className="flex-1 h-7 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider" 
                      onClick={() => setPaymentType('Pagada')}
                    >
                      Pagada
                    </Button>
                    <Button 
                      variant={paymentType === 'A Crédito' ? 'default' : 'ghost'} 
                      className="flex-1 h-7 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
                      onClick={() => setPaymentType('A Crédito')}
                    >
                      A Crédito
                    </Button>
                  </div>

                  {/* Cliente */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center ml-1">
                      <label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">
                        Cliente {paymentType === 'Pagada' && '(Opcional)'}
                      </label>
                      <button 
                        className="text-[9px] sm:text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        onClick={() => setIsCustomerModalOpen(true)}
                      >
                        <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Nuevo
                      </button>
                    </div>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger className="w-full h-8 text-[11px] sm:text-xs">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Consumidor Final</SelectItem>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Descuento y Método */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase ml-1">Descuento</label>
                      <Input 
                        type="number" 
                        className="h-8 text-[11px] sm:text-xs"
                        value={discount} 
                        onChange={(e) => setDiscount(Number(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase ml-1">Método</label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="h-8 text-[11px] sm:text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Efectivo">Efectivo</SelectItem>
                          <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                          <SelectItem value="Transferencia">Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-primary/5 border border-primary/10 p-2 sm:p-3 rounded-lg">
                    <p className="text-[9px] sm:text-[10px] font-bold text-primary uppercase mb-1">Resumen</p>
                    <div className="flex justify-between text-[11px] sm:text-xs">
                      <span className="text-muted-foreground">Bruto:</span>
                      <span className="font-semibold">Bs {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Footer: Totals and Actions */}
            <div className="p-3 sm:p-4 bg-muted/30 border-t border-border shrink-0 space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">Total</span>
                <span className="text-xl sm:text-2xl font-black tracking-tighter text-primary">
                  Bs{Math.max(0, totalAmount - discount).toFixed(2)}
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
                      Continuar <ShoppingCart className="ml-2 h-3.5 w-3.5 sm:h-4 w-4" />
                    </Button>
                    {cart.length > 0 && (
                      <Button variant="ghost" size="sm" className="w-full text-[9px] font-bold text-muted-foreground uppercase h-5 sm:h-6" onClick={resetSale}>
                        Vaciar
                      </Button>
                    )}
                  </>
                ) : step === 2 ? (
                  <Button 
                    size="lg" 
                    className="w-full font-bold h-9 sm:h-10 text-xs sm:text-sm shadow-sm"
                    disabled={cart.length === 0 || isProcessing}
                    onClick={() => {
                      setAmountPaid(0)
                      setIsChangeModalOpen(true)
                    }}
                  >
                    {isProcessing ? 'Procesando...' : 'Confirmar Venta'}
                  </Button>
                ) : (
                  <>
                    <Button 
                      size="lg" 
                      className="w-full font-bold h-9 sm:h-10 text-xs sm:text-sm flex items-center justify-center gap-2"
                      onClick={handleDownloadReceipt}
                    >
                      <Printer className="w-3.5 h-3.5 sm:w-4 h-4" />
                      Ticket
                    </Button>
                    <Button variant="outline" className="w-full h-8 sm:h-9 text-[10px] sm:text-xs font-bold" onClick={resetSale}>
                      Nueva Venta
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Modal de Cambio */}
          <Dialog open={isChangeModalOpen} onOpenChange={setIsChangeModalOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Calcula el cambio de tu venta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Valor de la venta</label>
                  <div className="text-2xl font-bold">Bs {Math.max(0, totalAmount - discount).toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">¿Con cuánto paga tu cliente?</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">Bs</span>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01" 
                      className="pl-9 text-lg" 
                      value={amountPaid || ''} 
                      onChange={(e) => setAmountPaid(Number(e.target.value))} 
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Valor a devolver</label>
                  <div className={`text-2xl font-bold ${amountPaid - Math.max(0, totalAmount - discount) >= 0 ? 'text-success' : 'text-muted-foreground'}`}>
                    Bs {Math.max(0, amountPaid - Math.max(0, totalAmount - discount)).toFixed(2)}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsChangeModalOpen(false)}>Cancelar</Button>
                <Button 
                  onClick={() => {
                    setIsChangeModalOpen(false)
                    handleCheckout()
                  }}
                  disabled={isProcessing || (paymentType === 'Pagada' && amountPaid > 0 && amountPaid < Math.max(0, totalAmount - discount))}
                >
                  Confirmar
                </Button>
              </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Modal de Nuevo Cliente */}
            <CustomerFormDialog 
              open={isCustomerModalOpen} 
              onOpenChange={setIsCustomerModalOpen} 
              onSuccess={(newCustomer) => {
                fetchData().then(() => {
                  if (newCustomer?.id) {
                    setCustomerId(String(newCustomer.id))
                  }
                })
              }} 
            />
          </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-hidden m-0 data-[state=active]:flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <SalesHistoryTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
