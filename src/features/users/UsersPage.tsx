import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'
import type { SortingState } from '@tanstack/react-table'
import {
  Users, UserCog, ShieldCheck, Plus, Edit, Trash2, Search,
  Power, UserCheck, UserX, ArrowUpDown, KeyRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getUsers, deleteUser, toggleUserActive, getPermissions } from '@/api/users'
import type { SystemUser, AllPermissions } from '@/api/users'
import { getRoles } from '@/api/roles'
import type { Role } from '@/api/roles'
import UserFormDialog from './components/UserFormDialog'
import PermissionsMatrix from './components/PermissionsMatrix'
import RolesManagementTab from './components/RolesManagementTab'

const ROLE_BADGE_COLORS: Record<number, string> = {
  1: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
  2: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  3: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
}

const getRoleBadgeClass = (roleId: number) => {
  return ROLE_BADGE_COLORS[roleId] || 'bg-gray-500/15 text-gray-600 border-gray-500/30'
}

export default function UsersPage() {
  const [users, setUsers]           = useState<SystemUser[]>([])
  const [roles, setRoles]           = useState<Role[]>([])
  const [loading, setLoading]       = useState(true)
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting]       = useState<SortingState>([])
  const [roleFilter, setRoleFilter] = useState<string>('all')

  // Dialog state
  const [isDialogOpen, setIsDialogOpen]   = useState(false)
  const [editingUser, setEditingUser]     = useState<SystemUser | null>(null)

  // Permissions state
  const [permissions, setPermissions]     = useState<AllPermissions>({})
  const [loadingPerms, setLoadingPerms]   = useState(true)

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true)
      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()])
      setUsers(usersData)
      setRoles(rolesData)
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      setLoadingPerms(true)
      const data = await getPermissions()
      setPermissions(data)
    } catch {
      toast.error('Error al cargar permisos')
    } finally {
      setLoadingPerms(false)
    }
  }

  useEffect(() => {
    fetchUsersAndRoles()
    fetchPermissions()
  }, [])

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleDelete = async (user: SystemUser) => {
    if (!window.confirm(`¿Eliminar al usuario "${user.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await deleteUser(user.id)
      toast.success('Usuario eliminado')
      fetchUsersAndRoles()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar')
    }
  }

  const handleToggleActive = async (user: SystemUser) => {
    try {
      await toggleUserActive(user.id)
      toast.success(user.active ? `${user.name} desactivado` : `${user.name} activado`)
      fetchUsersAndRoles()
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns = [
    {
      id: 'avatar',
      header: '',
      cell: ({ row }: any) => (
        <Avatar className="h-8 w-8">
          <AvatarFallback className={`text-xs font-bold ${getRoleBadgeClass(row.original.role_id)}`}>
            {row.original.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ row }: any) => (
        <div>
          <p className="font-medium text-foreground">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'role_id',
      header: 'Rol',
      cell: ({ row }: any) => {
        const role = roles.find(r => r.id === row.original.role_id)
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getRoleBadgeClass(row.original.role_id)}`}>
            {role?.name ?? `ID: ${row.original.role_id}`}
          </span>
        )
      },
    },
    {
      accessorKey: 'active',
      header: 'Estado',
      cell: ({ row }: any) => (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
          row.original.active
            ? 'bg-green-500/10 text-green-600'
            : 'bg-red-500/10 text-red-500'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${row.original.active ? 'bg-green-500' : 'bg-red-500'}`} />
          {row.original.active ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Creado',
      cell: ({ row }: any) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost" size="icon"
            title={row.original.active ? 'Desactivar' : 'Activar'}
            onClick={() => handleToggleActive(row.original)}
            className="h-8 w-8"
          >
            <Power className={`h-4 w-4 ${row.original.active ? 'text-green-500' : 'text-muted-foreground'}`} />
          </Button>
          <Button
            variant="ghost" size="icon"
            title="Editar usuario"
            onClick={() => { setEditingUser(row.original); setIsDialogOpen(true) }}
            className="h-8 w-8"
          >
            <Edit className="h-4 w-4 text-primary" />
          </Button>
          <Button
            variant="ghost" size="icon"
            title="Eliminar usuario"
            onClick={() => handleDelete(row.original)}
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  // ── Filtered data ────────────────────────────────────────────────────────────
  const filteredUsers = roleFilter === 'all'
    ? users
    : users.filter(u => u.role_id.toString() === roleFilter)

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    initialState: { pagination: { pageSize: 10 } },
  })

  // ── KPIs ─────────────────────────────────────────────────────────────────────
  const totalUsers    = users.length
  const activeUsers   = users.filter(u => u.active).length
  const adminCount    = users.filter(u => u.role_id === 1).length
  const cashierCount  = users.filter(u => u.role_id === 2).length
  const warehouseCount = users.filter(u => u.role_id === 3).length

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground text-sm">
            Administra los usuarios del sistema y configura los permisos por rol.
          </p>
        </div>
        <Button onClick={() => { setEditingUser(null); setIsDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="users">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <KeyRound className="h-4 w-4" />
            Permisos
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        {/* ════════════════ TAB: USERS ════════════════ */}
        <TabsContent value="users" className="mt-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">{activeUsers} activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
                <ShieldCheck className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{adminCount}</div>
                <p className="text-xs text-muted-foreground">Acceso total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cajeros</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{cashierCount}</div>
                <p className="text-xs text-muted-foreground">Ventas y clientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Almacén</CardTitle>
                <UserX className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{warehouseCount}</div>
                <p className="text-xs text-muted-foreground">Inventario</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="users-search"
                placeholder="Buscar por nombre o correo..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 bg-card"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger id="users-role-filter" className="w-full md:w-44 bg-card">
                <ArrowUpDown className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border border-border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((h) => (
                      <TableHead key={h.id}>
                        {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
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
                      {loading ? 'Cargando usuarios...' : 'No hay usuarios registrados.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {table.getPageCount() > 1 && (
            <div className="flex items-center justify-end gap-2 py-2">
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
        </TabsContent>

        {/* ════════════════ TAB: PERMISSIONS ════════════════ */}
        <TabsContent value="permissions" className="mt-6">
          {loadingPerms ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              Cargando permisos...
            </div>
          ) : (
            <PermissionsMatrix
              permissions={permissions}
              onPermissionsChange={setPermissions}
            />
          )}
        </TabsContent>

        {/* ════════════════ TAB: ROLES ════════════════ */}
        <TabsContent value="roles" className="mt-6">
          <RolesManagementTab onRolesChanged={fetchPermissions} />
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={fetchUsersAndRoles}
        editingUser={editingUser}
        roles={roles}
      />
    </div>
  )
}
