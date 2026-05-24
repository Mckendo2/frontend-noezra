import { useEffect, useState, useMemo } from 'react'
import api from '@/api/axios'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import { Search, Eye, ShoppingCart, DollarSign, Calendar, TrendingUp, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import SaleDetailDialog from './SaleDetailDialog'

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
  cash: { label: 'Efectivo', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
  card: { label: 'Tarjeta', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  transfer: { label: 'Transferencia', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
  credit: { label: 'Crédito', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
}

export default function SalesHistoryTab() {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  
  // Date filters
  const [dateFilter, setDateFilter] = useState('month')
  
  // Dialogs
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any | null>(null)

  const fetchSales = async () => {
    try {
      setLoading(true)
      
      const now = new Date()
      const from = new Date()
      if (dateFilter === 'today') {
        // keep from as today
      } else if (dateFilter === 'week') {
        from.setDate(now.getDate() - 7)
      } else if (dateFilter === 'month') {
        from.setDate(1) // first day of current month
      } else if (dateFilter === 'all') {
        from.setFullYear(2000)
      }
      
      const params: any = {}
      if (dateFilter !== 'all') {
        params.from = from.toISOString().split('T')[0]
        params.to = now.toISOString().split('T')[0]
      }
      
      const res = await api.get('/sales', { params })
      setSales(res.data.data)
    } catch (err) {
      toast.error('Error al cargar historial de ventas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [dateFilter])

  const handleViewDetail = async (id: number) => {
    try {
      const res = await api.get(`/sales/${id}`)
      setSelectedSale(res.data.data)
      setIsDetailOpen(true)
    } catch {
      toast.error('Error al cargar el detalle de la venta')
    }
  }

  // KPIs
  const kpis = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    
    let salesToday = 0
    let amountToday = 0
    let totalAmount = 0
    
    sales.forEach(s => {
      const sDate = s.created_at.split('T')[0]
      if (sDate === today) {
        salesToday++
        amountToday += Number(s.total)
      }
      totalAmount += Number(s.total)
    })
    
    return {
      totalCount: sales.length,
      totalAmount,
      salesToday,
      amountToday
    }
  }, [sales])

  const columns = [
    {
      accessorKey: 'id',
      header: 'Ticket',
      cell: ({ row }: any) => (
        <span className="font-mono font-semibold text-foreground text-sm">
          #{String(row.original.id).padStart(6, '0')}
        </span>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('es-ES', { 
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
          })}
        </span>
      )
    },
    {
      accessorKey: 'customer_name',
      header: 'Cliente',
      cell: ({ row }: any) => (
        <span className="font-medium text-foreground text-sm">
          {row.original.customer_name || 'Cliente Ocasional'}
        </span>
      )
    },
    {
      accessorKey: 'payment_method',
      header: 'Pago',
      cell: ({ row }: any) => {
        const p = PAYMENT_MAP[row.original.payment_method] || { label: row.original.payment_method, color: 'bg-muted' }
        return <span className={`text-xs px-2 py-0.5 rounded-full border ${p.color}`}>{p.label}</span>
      }
    },
    {
      accessorKey: 'cashier_name',
      header: 'Cajero',
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">{row.original.cashier_name}</span>
      )
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: any) => (
        <span className="font-semibold text-primary">Bs{Number(row.original.total).toFixed(2)}</span>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewDetail(row.original.id); }}>
          <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
        </Button>
      )
    },
  ]

  const filteredData = useMemo(() => {
    if (!globalFilter) return sales
    const lc = globalFilter.toLowerCase()
    return sales.filter(s =>
      String(s.id).includes(lc) ||
      (s.customer_name && s.customer_name.toLowerCase().includes(lc)) ||
      (s.cashier_name && s.cashier_name.toLowerCase().includes(lc))
    )
  }, [sales, globalFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 15 }, sorting: [{ id: 'id', desc: true }] },
  })

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* KPIs */}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-4 shrink-0">
        <Card className="bg-card shadow-none border-border/60">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Ventas Hoy</p>
              <div className="text-lg font-bold leading-none">{kpis.salesToday}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-none border-border/60">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg text-success">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Ingresos Hoy</p>
              <div className="text-lg font-bold leading-none text-success">Bs{kpis.amountToday.toFixed(0)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-none border-border/60">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Total Período</p>
              <div className="text-lg font-bold leading-none">Bs{kpis.totalAmount.toFixed(0)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card shadow-none border-border/60">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg text-muted-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Tickets</p>
              <div className="text-lg font-bold leading-none">{kpis.totalCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3 shrink-0">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar venta..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-8 h-8 text-xs bg-card"
          />
        </div>
        <div className="flex w-full md:w-auto items-center gap-2 md:ml-auto">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-card">
              <Calendar className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">7 días</SelectItem>
              <SelectItem value="month">Este Mes</SelectItem>
              <SelectItem value="all">Todo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleViewDetail(row.original.id)}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {loading ? 'Cargando ventas...' : 'No se encontraron ventas registradas.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Anterior
          </Button>
          <span className="text-sm text-foreground px-2">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </Button>
        </div>
      )}

      {/* Dialog */}
      <SaleDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        sale={selectedSale}
      />
    </div>
  )
}
