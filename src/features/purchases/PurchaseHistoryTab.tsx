import { useEffect, useState } from 'react'
import api from '@/api/axios'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import { FileText, Building2, User, Search } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

export default function PurchaseHistoryTab() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    fetchPurchases()
  }, [])

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      const res = await api.get('/purchases')
      setPurchases(res.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }: any) => <span className="font-mono text-xs text-muted-foreground">#COMP-{row.original.id.toString().padStart(4, '0')}</span>
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }: any) => (
        <span className="text-sm">{format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm')}</span>
      )
    },
    {
      accessorKey: 'supplier_name',
      header: 'Proveedor',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-sm">{row.original.supplier_name || 'Sin proveedor'}</span>
        </div>
      )
    },
    {
      accessorKey: 'user_name',
      header: 'Registrado por',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5" />
          {row.original.user_name}
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }: any) => {
        const status = row.original.status
        return (
          <Badge variant={status === 'received' ? 'default' : status === 'pending' ? 'secondary' : 'destructive'} className="text-[10px] uppercase">
            {status === 'received' ? 'Recibido' : status === 'pending' ? 'Pendiente' : 'Cancelado'}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }: any) => (
        <span className="font-bold text-primary">Bs {Number(row.original.total).toFixed(2)}</span>
      )
    }
  ]

  const table = useReactTable({
    data: purchases,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    initialState: { pagination: { pageSize: 15 } }
  })

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar compra..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="rounded-md border border-border bg-card flex-1 overflow-auto min-h-0">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur z-10">
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
                  {loading ? 'Cargando historial...' : 'No hay compras registradas.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between shrink-0 border-t pt-2">
        <span className="text-xs text-muted-foreground">
          Total de registros: {purchases.length}
        </span>
        {table.getPageCount() > 1 && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              Ant
            </Button>
            <span className="text-xs text-muted-foreground">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Sig
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
