import { useEffect, useState, useMemo } from 'react'
import api from '@/api/axios'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table'
import { Search, Plus, Edit, Trash2, Building2, MapPin, Phone, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import SupplierFormDialog from './SupplierFormDialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface Supplier {
  id: number
  name: string
  email: string | null
  phone: string | null
  address: string | null
  ruc: string | null
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  
  // Delete states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null)

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/suppliers')
      setSuppliers(res.data.data)
    } catch (err) {
      toast.error('Error al cargar proveedores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const handleSave = async (data: Partial<Supplier>) => {
    try {
      if (selectedSupplier) {
        await api.put(`/suppliers/${selectedSupplier.id}`, data)
        toast.success('Proveedor actualizado')
      } else {
        await api.post('/suppliers', data)
        toast.success('Proveedor creado exitosamente')
      }
      fetchSuppliers()
    } catch (error) {
      toast.error('Error al guardar el proveedor')
      throw error // to prevent dialog from closing if there's an error
    }
  }

  const confirmDelete = async () => {
    if (!supplierToDelete) return
    try {
      await api.delete(`/suppliers/${supplierToDelete}`)
      toast.success('Proveedor eliminado')
      setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete))
    } catch (error) {
      toast.error('No se pudo eliminar el proveedor (puede estar asociado a compras)')
    } finally {
      setIsDeleteDialogOpen(false)
      setSupplierToDelete(null)
    }
  }

  const columns = [
    {
      accessorKey: 'name',
      header: 'Nombre / Empresa',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{row.original.name}</p>
            {row.original.email && <p className="text-xs text-muted-foreground">{row.original.email}</p>}
          </div>
        </div>
      )
    },
    {
      accessorKey: 'ruc',
      header: 'RUC/NIT',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-sm">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{row.original.ruc || '-'}</span>
        </div>
      )
    },
    {
      accessorKey: 'phone',
      header: 'Contacto',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Phone className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{row.original.phone || '-'}</span>
        </div>
      )
    },
    {
      accessorKey: 'address',
      header: 'Dirección',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1.5 text-sm max-w-[200px] truncate" title={row.original.address}>
          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">{row.original.address || '-'}</span>
        </div>
      )
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            setSelectedSupplier(row.original)
            setIsFormOpen(true)
          }}>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
            setSupplierToDelete(row.original.id)
            setIsDeleteDialogOpen(true)
          }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ]

  const filteredData = useMemo(() => {
    if (!globalFilter) return suppliers
    const lc = globalFilter.toLowerCase()
    return suppliers.filter(s =>
      s.name.toLowerCase().includes(lc) ||
      (s.ruc && s.ruc.toLowerCase().includes(lc)) ||
      (s.email && s.email.toLowerCase().includes(lc))
    )
  }, [suppliers, globalFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 10 }, sorting: [{ id: 'name', desc: false }] },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Gestiona la información de tus proveedores.</p>
        </div>
        <Button onClick={() => {
          setSelectedSupplier(null)
          setIsFormOpen(true)
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      <div className="bg-card border border-border p-3 rounded-lg flex items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedor..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  {loading ? 'Cargando proveedores...' : 'No se encontraron proveedores.'}
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
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Siguiente
          </Button>
        </div>
      )}

      <SupplierFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        supplier={selectedSupplier}
        onSave={handleSave}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al proveedor permanentemente. Si el proveedor tiene compras asociadas, la acción podría no completarse para mantener la integridad de los datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
