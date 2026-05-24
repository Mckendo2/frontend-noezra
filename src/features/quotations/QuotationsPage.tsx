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
import { Plus, Search, FileText, Eye, TrendingUp, BarChart3, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import QuotationFormDialog from './QuotationFormDialog'
import QuotationDetailDialog from './QuotationDetailDialog'

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  pending:   { label: 'Pendiente', variant: 'secondary',    color: 'text-amber-500' },
  approved:  { label: 'Aprobada',  variant: 'default',      color: 'text-emerald-500' },
  expired:   { label: 'Expirada',  variant: 'destructive',  color: 'text-red-500' },
  cancelled: { label: 'Cancelada', variant: 'outline',      color: 'text-muted-foreground' },
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [statusFilter, setStatusFilter] = useState('all')

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuotation, setEditingQuotation] = useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedQuotation, setSelectedQuotation] = useState<any | null>(null)

  const fetchQuotations = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      const res = await api.get('/quotations', { params })
      setQuotations(res.data.data)
    } catch (err) {
      toast.error('Error al cargar cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotations()
  }, [statusFilter])

  const handleViewDetail = async (id: number) => {
    try {
      const res = await api.get(`/quotations/${id}`)
      setSelectedQuotation(res.data.data)
      setIsDetailOpen(true)
    } catch {
      toast.error('Error al cargar el detalle')
    }
  }

  const handleEditFromDetail = async () => {
    if (!selectedQuotation) return
    try {
      const res = await api.get(`/quotations/${selectedQuotation.id}`)
      setEditingQuotation(res.data.data)
      setIsFormOpen(true)
    } catch {
      toast.error('Error al cargar la cotización para editar')
    }
  }

  // KPIs
  const kpis = useMemo(() => {
    const now = new Date()
    const monthQuotations = quotations.filter(q => {
      const d = new Date(q.created_at)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const totalMonth = monthQuotations.length
    const totalAmount = monthQuotations.reduce((a: number, q: any) => a + Number(q.total), 0)
    const approved = monthQuotations.filter(q => q.status === 'approved').length
    const conversionRate = totalMonth > 0 ? ((approved / totalMonth) * 100).toFixed(1) : '0.0'
    return { totalMonth, totalAmount, conversionRate }
  }, [quotations])

  const columns = [
    {
      accessorKey: 'code',
      header: 'Código',
      cell: ({ row }: any) => (
        <span className="font-mono font-semibold text-foreground text-sm">{row.original.code}</span>
      )
    },
    {
      accessorKey: 'customer_name',
      header: 'Cliente',
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-foreground text-sm">{row.original.customer_name}</p>
          {row.original.customer_phone && (
            <p className="text-xs text-muted-foreground">{row.original.customer_phone}</p>
          )}
        </div>
      )
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      accessorKey: 'valid_until',
      header: 'Validez',
      cell: ({ row }: any) => {
        const validDate = new Date(row.original.valid_until + 'T00:00:00')
        const isExpired = validDate < new Date() && row.original.status === 'pending'
        return (
          <span className={`text-sm ${isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {validDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
            {isExpired && <span className="text-[10px] ml-1">⚠️</span>}
          </span>
        )
      }
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: any) => (
        <span className="font-semibold text-foreground">Bs{Number(row.original.total).toFixed(2)}</span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => {
        const s = STATUS_MAP[row.original.status] || STATUS_MAP.pending
        return <Badge variant={s.variant}>{s.label}</Badge>
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <Button variant="ghost" size="icon" onClick={() => handleViewDetail(row.original.id)}>
          <Eye className="h-4 w-4 text-primary" />
        </Button>
      )
    },
  ]

  const filteredData = useMemo(() => {
    if (!globalFilter) return quotations
    const lc = globalFilter.toLowerCase()
    return quotations.filter(q =>
      q.code?.toLowerCase().includes(lc) ||
      q.customer_name?.toLowerCase().includes(lc)
    )
  }, [quotations, globalFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 10 } },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cotizaciones</h1>
          <p className="text-muted-foreground text-sm">Crea presupuestos para tus clientes y conviértelos en ventas.</p>
        </div>
        <Button onClick={() => { setEditingQuotation(null); setIsFormOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Cotización
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cotizaciones del Mes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalMonth}</div>
            <p className="text-xs text-muted-foreground">Documentos emitidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Cotizado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Bs{kpis.totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total del mes en curso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{kpis.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Cotizaciones → Ventas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 py-2">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código o cliente..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>
        <div className="flex w-full md:w-auto items-center gap-2 md:ml-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-card">
              <BarChart3 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Estado..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="approved">Aprobadas</SelectItem>
              <SelectItem value="expired">Expiradas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
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
                  {loading ? 'Cargando cotizaciones...' : 'No hay cotizaciones registradas.'}
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

      {/* Dialogs */}
      <QuotationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchQuotations}
        editingQuotation={editingQuotation}
      />
      <QuotationDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        quotation={selectedQuotation}
        onEdit={handleEditFromDetail}
        onSuccess={fetchQuotations}
      />
    </div>
  )
}
