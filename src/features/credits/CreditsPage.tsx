import { useEffect, useState } from 'react'
import api from '@/api/axios'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import { Search, Eye, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import CreditDetailDialog from './CreditDetailDialog'

export default function CreditsPage() {
  const [credits, setCredits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCreditId, setSelectedCreditId] = useState<number | null>(null)

  const fetchCredits = async () => {
    try {
      setLoading(true)
      const res = await api.get('/credits')
      setCredits(res.data.data)
    } catch (err) {
      toast.error('Error al cargar créditos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredits()
  }, [])

  const columns = [
    {
      accessorKey: 'customer_name',
      header: 'Cliente',
      cell: ({ row }: any) => <span className="font-medium">{row.original.customer_name}</span>
    },
    {
      accessorKey: 'total_amount',
      header: 'Total Venta',
      cell: ({ row }: any) => <span>Bs {Number(row.original.total_amount).toFixed(2)}</span>
    },
    {
      accessorKey: 'balance',
      header: 'Saldo Pendiente',
      cell: ({ row }: any) => (
        <span className="font-bold text-destructive">Bs {Number(row.original.balance).toFixed(2)}</span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => {
        const isPaid = row.original.status === 'paid'
        return (
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            isPaid ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
          }`}>
            {isPaid ? 'PAGADO' : 'PENDIENTE'}
          </span>
        )
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha de Crédito',
      cell: ({ row }: any) => <span className="text-muted-foreground text-sm">{new Date(row.original.created_at).toLocaleDateString()}</span>
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" onClick={() => {
            setSelectedCreditId(row.original.id)
            setIsDialogOpen(true)
          }}>
            <Eye className="h-4 w-4 mr-2 text-primary" /> Ver Detalles / Abonar
          </Button>
        </div>
      )
    }
  ]

  const table = useReactTable({
    data: credits,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  // KPIs
  const totalDebts = credits.reduce((acc, curr) => acc + Number(curr.balance), 0)
  const pendingCreditsCount = credits.filter(c => c.status !== 'paid').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Créditos y Cuentas por Cobrar</h1>
          <p className="text-muted-foreground text-sm">Gestiona las deudas de tus clientes y registra sus abonos.</p>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deuda Total Pendiente</CardTitle>
            <Wallet className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">Bs {totalDebts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Suma de todos los saldos por cobrar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Activos</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCreditsCount}</div>
            <p className="text-xs text-muted-foreground">Cuentas que aún tienen saldo</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center gap-4 py-2">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
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
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {loading ? 'Cargando créditos...' : 'No hay créditos registrados.'}
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
          <span className="text-sm text-muted-foreground px-2">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </Button>
        </div>
      )}

      <CreditDetailDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        creditId={selectedCreditId}
        onSuccess={fetchCredits}
      />
    </div>
  )
}
