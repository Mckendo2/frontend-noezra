import { useEffect, useState } from 'react'
import api from '@/api/axios'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'
import type { SortingState, ColumnFiltersState } from '@tanstack/react-table'
import { Plus, Trash2, Edit, Package, Tag, Search, Box, CircleDollarSign, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProductFormDialog from './ProductFormDialog'
import CategoryFormDialog from './CategoryFormDialog'

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('products')
  
  // Products state
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  // KPIs
  const totalProducts = products.length
  const totalStock = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0)
  const totalCost = products.reduce((acc, p) => acc + ((Number(p.stock) || 0) * (Number(p.cost) || 0)), 0)
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await api.get('/products')
      setProducts(res.data.data)
    } catch (err) {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  // Categories placeholder state
  const [categories, setCategories] = useState<any[]>([])
  
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data.data)
    } catch (err) {
      toast.error('Error al cargar categorías')
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto? (Eliminación lógica)')) return
    try {
      await api.delete(`/products/${id}`)
      toast.success('Producto eliminado')
      fetchProducts()
    } catch (error) {
      toast.error('Error al eliminar producto')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta categoría? (Eliminación lógica)')) return
    try {
      await api.delete(`/categories/${id}`)
      toast.success('Categoría eliminada')
      fetchCategories()
    } catch (error) {
      toast.error('Error al eliminar categoría')
    }
  }

  const productColumns = [
    {
      accessorKey: 'image_url',
      header: 'Imagen',
      cell: ({ row }: any) => {
        const url = row.original.image_url
        const fullUrl = url ? (url.startsWith('http') ? url : `http://localhost:3000${url}`) : null
        return (
          <Avatar 
            className={`h-10 w-10 border border-border ${fullUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={() => fullUrl && setSelectedImage(fullUrl)}
          >
            {fullUrl ? (
              <AvatarImage src={fullUrl} className="object-cover" />
            ) : (
              <AvatarFallback><Package className="h-4 w-4" /></AvatarFallback>
            )}
          </Avatar>
        )
      }
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-foreground">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.barcode || 'Sin SKU'}</p>
        </div>
      )
    },
    {
      accessorKey: 'category_name',
      header: 'Categoría',
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">{row.original.category_name || '-'}</span>
      )
    },
    {
      accessorKey: 'cost',
      header: 'Costo',
      cell: ({ row }: any) => <span className="text-muted-foreground">Bs{Number(row.original.cost).toFixed(2)}</span>
    },
    {
      accessorKey: 'price',
      header: 'Precio Venta',
      cell: ({ row }: any) => <span className="font-medium text-foreground">Bs{Number(row.original.price).toFixed(2)}</span>
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }: any) => {
        const stock = Number(row.original.stock) || 0
        const minStock = Number(row.original.min_stock) || 1
        
        let colorClass = 'bg-emerald-500' // green
        let textClass  = 'text-emerald-600 dark:text-emerald-400'
        
        // Calcular porcentaje visual (tope en 100%)
        // Si el stock está en minStock es el 30% de la barra.
        const percentage = Math.max(5, Math.min((stock / (minStock * 3)) * 100, 100))

        if (stock <= minStock) {
           colorClass = 'bg-destructive' 
           textClass  = 'text-destructive font-bold'
        } else if (stock <= minStock * 2) {
           colorClass = 'bg-amber-500' 
           textClass  = 'text-amber-600 dark:text-amber-400 font-medium'
        }

        return (
          <div className="w-full min-w-[100px] flex flex-col gap-1.5 justify-center">
             <div className="text-xs">
               <span className={textClass}>{stock} u.</span>
             </div>
             <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
               <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${percentage}%` }} />
             </div>
          </div>
        )
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="icon" onClick={() => {
            setEditingProduct(row.original)
            setIsDialogOpen(true)
          }}>
            <Edit className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ]

  const productTable = useReactTable({
    data: products,
    columns: productColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      sorting,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const categoryColumns = [
    {
      accessorKey: 'name',
      header: 'Nombre de la Categoría',
      cell: ({ row }: any) => <span className="font-medium text-foreground">{row.original.name}</span>
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }: any) => <span className="text-sm text-muted-foreground">{row.original.description || '-'}</span>
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="icon" onClick={() => {
            setEditingCategory(row.original)
            setIsCategoryDialogOpen(true)
          }}>
            <Edit className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ]

  const categoryTable = useReactTable({
    data: categories,
    columns: categoryColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
          <p className="text-muted-foreground text-sm">Gestiona tus productos y agrupaciones en un mismo lugar.</p>
        </div>
        <div className="flex items-center gap-4">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="products" className="px-6">
              <Package className="mr-2 h-4 w-4" /> Productos
            </TabsTrigger>
            <TabsTrigger value="categories" className="px-6">
              <Tag className="mr-2 h-4 w-4" /> Categorías
            </TabsTrigger>
          </TabsList>

          <Button 
            variant={activeTab === 'products' ? 'default' : 'outline'}
            className={activeTab === 'categories' ? 'border-primary text-primary hover:bg-primary/10' : ''}
            onClick={() => {
            if (activeTab === 'products') {
              setEditingProduct(null)
              setIsDialogOpen(true)
            } else {
              setEditingCategory(null)
              setIsCategoryDialogOpen(true)
            }
          }}>
            <Plus className="mr-2 h-4 w-4" />
            {activeTab === 'products' ? 'Añadir Producto' : 'Añadir Categoría'}
          </Button>
        </div>
      </div>

      <TabsContent value="products" className="space-y-4">
        {/* KPIs Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">Productos únicos registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock}</div>
              <p className="text-xs text-muted-foreground">Unidades físicas almacenadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Costo de Inventario</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Bs{totalCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Capital inmovilizado (Costo)</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row items-center gap-4 py-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-8 bg-card"
            />
          </div>
          <div className="flex w-full md:w-auto items-center gap-2 md:ml-auto">
            <Select 
              value={(columnFilters.find(f => f.id === 'category_name')?.value as string) || 'all'}
              onValueChange={(val) => {
                if (val === 'all') {
                  setColumnFilters(prev => prev.filter(f => f.id !== 'category_name'))
                } else {
                  setColumnFilters(prev => [...prev.filter(f => f.id !== 'category_name'), { id: 'category_name', value: val }])
                }
              }}
            >
              <SelectTrigger className="w-[180px] bg-card">
                <Tag className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Categoría..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Categorías</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={sorting.length ? `${sorting[0].id}_${sorting[0].desc ? 'desc' : 'asc'}` : 'none'}
              onValueChange={(val) => {
                if (val === 'none') {
                  setSorting([])
                } else {
                  const [id, dir] = val.split('_')
                  setSorting([{ id, desc: dir === 'desc' }])
                }
              }}
            >
              <SelectTrigger className="w-[200px] bg-card">
                <ArrowUpDown className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin orden específico</SelectItem>
                <SelectItem value="name_asc">Nombre (A - Z)</SelectItem>
                <SelectItem value="name_desc">Nombre (Z - A)</SelectItem>
                <SelectItem value="stock_desc">Stock (Mayor a menor)</SelectItem>
                <SelectItem value="stock_asc">Stock (Menor a mayor)</SelectItem>
                <SelectItem value="price_desc">Precio (Mayor a menor)</SelectItem>
                <SelectItem value="price_asc">Precio (Menor a mayor)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Table */}
        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              {productTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
              {productTable.getRowModel().rows?.length ? (
                productTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={productColumns.length} className="h-24 text-center">
                    {loading ? 'Cargando productos...' : 'No hay productos todavía.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination directly controlled */}
        {productTable.getPageCount() > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => productTable.previousPage()} disabled={!productTable.getCanPreviousPage()}>
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Página {productTable.getState().pagination.pageIndex + 1} de {productTable.getPageCount() || 1}
            </span>
            <Button variant="outline" size="sm" onClick={() => productTable.nextPage()} disabled={!productTable.getCanNextPage()}>
              Siguiente
            </Button>
          </div>
        )}
      </TabsContent>

      <TabsContent value="categories" className="space-y-4">
        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              {categoryTable.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
              {categoryTable.getRowModel().rows?.length ? (
                categoryTable.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={categoryColumns.length} className="h-24 text-center">
                    Cargando categorías o no hay ninguna disponible.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {categoryTable.getPageCount() > 1 && (
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button variant="outline" size="sm" onClick={() => categoryTable.previousPage()} disabled={!categoryTable.getCanPreviousPage()}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => categoryTable.nextPage()} disabled={!categoryTable.getCanNextPage()}>
              Siguiente
            </Button>
          </div>
        )}
      </TabsContent>

      <ProductFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSuccess={fetchProducts}
        editingProduct={editingProduct}
      />
      <CategoryFormDialog 
        open={isCategoryDialogOpen} 
        onOpenChange={setIsCategoryDialogOpen} 
        onSuccess={fetchCategories}
        editingCategory={editingCategory}
      />

      {/* Image Preview Modal */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none flex justify-center items-center">
          {selectedImage && (
            <img src={selectedImage} alt="Preview" className="max-w-full max-h-[80vh] object-contain rounded-md" />
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
