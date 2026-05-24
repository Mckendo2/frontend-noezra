import { useEffect, useState, useMemo } from 'react'
import api from '@/api/axios'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table'
import { Plus, Trash2, Edit, Search, Receipt } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ExpenseFormDialog from './ExpenseFormDialog'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any | null>(null)

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const res = await api.get('/expenses', {
        params: { category: categoryFilter !== 'all' ? categoryFilter : undefined }
      })
      setExpenses(res.data.data)
    } catch (err) {
      toast.error('Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [categoryFilter])

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este gasto?')) return
    try {
      await api.delete(`/expenses/${id}`)
      toast.success('Gasto eliminado')
      fetchExpenses()
    } catch (error) {
      toast.error('Error al eliminar gasto')
    }
  }

  const columns = [
    {
      accessorKey: 'date',
      header: 'Fecha',
      cell: ({ row }: any) => <span className="font-medium">{new Date(row.original.date).toLocaleDateString()}</span>
    },
    {
      accessorKey: 'category',
      header: 'Categoría',
      cell: ({ row }: any) => (
        <span className="inline-flex px-2 py-1 rounded bg-muted/50 text-xs font-semibold">
          {row.original.category}
        </span>
      )
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }: any) => <span className="text-muted-foreground">{row.original.description || '-'}</span>
    },
    {
      accessorKey: 'user_name',
      header: 'Registrado por',
      cell: ({ row }: any) => <span className="text-xs">{row.original.user_name}</span>
    },
    {
      accessorKey: 'amount',
      header: 'Monto (Bs)',
      cell: ({ row }: any) => (
        <span className="font-bold text-destructive">Bs {Number(row.original.amount).toFixed(2)}</span>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="icon" onClick={() => {
            setEditingExpense(row.original)
            setIsDialogOpen(true)
          }}>
            <Edit className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ]

  const table = useReactTable({
    data: expenses,
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
  const totalExpenses = useMemo(() => expenses.reduce((acc, curr) => acc + Number(curr.amount), 0), [expenses])
  const expensesCount = expenses.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Control de Gastos</h1>
          <p className="text-muted-foreground text-sm">Registra y administra los gastos operativos de la empresa.</p>
        </div>
        <Button onClick={() => {
          setEditingExpense(null)
          setIsDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Gasto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales Registrados</CardTitle>
            <Receipt className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">Bs {totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cantidad de Transacciones</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expensesCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 py-2">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descripción..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>
        <div className="w-full md:w-auto ml-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] bg-card">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="Servicios">Servicios</SelectItem>
              <SelectItem value="Alquiler">Alquiler</SelectItem>
              <SelectItem value="Planilla">Planilla</SelectItem>
              <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="Insumos">Insumos</SelectItem>
              <SelectItem value="Otros">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
                  {loading ? 'Cargando gastos...' : 'No hay gastos registrados en este filtro.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
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

      <ExpenseFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSuccess={fetchExpenses}
        editingExpense={editingExpense}
      />
    </div>
  )
}
