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
import type { SortingState } from '@tanstack/react-table'
import { Plus, Trash2, Edit, Search, Users, Mail, Phone, MapPin, ArrowUpDown, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import CustomerFormDialog from './CustomerFormDialog'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/customers')
      setCustomers(res.data.data)
    } catch (err) {
      toast.error('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleDeleteCustomer = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return
    try {
      await api.delete(`/customers/${id}`)
      toast.success('Cliente eliminado')
      fetchCustomers()
    } catch (error) {
      toast.error('Error al eliminar cliente')
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'Cliente',
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-foreground">{row.original.name}</p>
          <div className="flex items-center text-xs text-muted-foreground gap-2 mt-1">
            {row.original.ci && <span className="flex items-center"><CreditCard className="h-3 w-3 mr-1"/>{row.original.ci}</span>}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'contact',
      header: 'Contacto',
      cell: ({ row }: any) => (
        <div className="space-y-1">
          {row.original.phone ? (
            <p className="text-sm flex items-center text-foreground"><Phone className="h-3 w-3 mr-1.5 text-muted-foreground"/> {row.original.phone}</p>
          ) : <span className="text-xs text-muted-foreground">-</span>}
          {row.original.email && (
            <p className="text-xs flex items-center text-muted-foreground"><Mail className="h-3 w-3 mr-1.5"/> {row.original.email}</p>
          )}
        </div>
      )
    },
    {
      accessorKey: 'address',
      header: 'Dirección',
      cell: ({ row }: any) => (
        <span className="text-sm text-muted-foreground flex items-center">
          {row.original.address ? <><MapPin className="h-3 w-3 mr-1.5"/> {row.original.address}</> : '-'}
        </span>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="icon" onClick={() => {
            setEditingCustomer(row.original)
            setIsDialogOpen(true)
          }}>
            <Edit className="h-4 w-4 text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDeleteCustomer(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ]

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // KPIs
  const totalCustomers = customers.length
  const withEmail = customers.filter(c => c.email).length
  const withCi = customers.filter(c => c.ci).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Directorio de Clientes</h1>
          <p className="text-muted-foreground text-sm">Gestiona la información de contacto y facturación de tus clientes.</p>
        </div>
        <Button onClick={() => {
          setEditingCustomer(null)
          setIsDialogOpen(true)
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Añadir Cliente
        </Button>
      </div>

      {/* KPIs Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Correo</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withEmail}</div>
            <p className="text-xs text-muted-foreground">Pueden recibir comprobantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Carnet</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{withCi}</div>
            <p className="text-xs text-muted-foreground">Datos de identidad listos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center gap-4 py-2">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, Carnet o teléfono..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 bg-card"
          />
        </div>
        <div className="flex w-full md:w-auto items-center gap-2 md:ml-auto">
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
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-md border border-border bg-card">
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {loading ? 'Cargando clientes...' : 'No hay clientes registrados.'}
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

      <CustomerFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onSuccess={fetchCustomers}
        editingCustomer={editingCustomer}
      />
    </div>
  )
}

