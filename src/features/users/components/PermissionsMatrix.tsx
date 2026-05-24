import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Loader2, Save, ShieldCheck, RotateCcw,
  LayoutDashboard, ShoppingCart, FileText, Package, Tags, 
  Users, Truck, ShoppingBag, Receipt, CreditCard, BarChart, Settings
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { updateRolePermissions } from '@/api/users'
import { getRoles, type Role } from '@/api/roles'
import { usePermissionsStore } from '@/store/permissionsStore'
import type { AllPermissions, RolePermissions, SystemModule } from '@/api/users'

const MODULES: { key: SystemModule; label: string; icon: LucideIcon }[] = [
  { key: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { key: 'sales',      label: 'Ventas',        icon: ShoppingCart },
  { key: 'quotations', label: 'Cotizaciones',  icon: FileText },
  { key: 'products',   label: 'Productos',     icon: Package },
  { key: 'categories', label: 'Categorías',    icon: Tags },
  { key: 'customers',  label: 'Clientes',      icon: Users },
  { key: 'suppliers',  label: 'Proveedores',   icon: Truck },
  { key: 'purchases',  label: 'Compras',       icon: ShoppingBag },
  { key: 'expenses',   label: 'Gastos',        icon: Receipt },
  { key: 'credits',    label: 'Créditos',      icon: CreditCard },
  { key: 'reports',    label: 'Reportes',      icon: BarChart },
  { key: 'users',      label: 'Usuarios',      icon: Settings },
]

const ACTIONS = [
  { key: 'view',   label: 'Ver',      color: 'text-blue-500' },
  { key: 'create', label: 'Crear',    color: 'text-green-500' },
  { key: 'edit',   label: 'Editar',   color: 'text-yellow-500' },
  { key: 'delete', label: 'Eliminar', color: 'text-red-500' },
] as const

interface Props {
  permissions: AllPermissions
  onPermissionsChange: (p: AllPermissions) => void
}

export default function PermissionsMatrix({ permissions, onPermissionsChange }: Props) {
  const [saving, setSaving] = useState<number | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [loadingRoles, setLoadingRoles] = useState(true)

  const { clearPermissions, fetchMyPermissions } = usePermissionsStore()

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    setLoadingRoles(true)
    try {
      const data = await getRoles()
      setRoles(data)
    } catch {
      toast.error('Error al cargar roles')
    } finally {
      setLoadingRoles(false)
    }
  }

  const getChecked = (roleId: number, module: SystemModule, action: string): boolean => {
    return permissions[roleId]?.[module]?.[action as keyof typeof permissions[typeof roleId][typeof module]] ?? false
  }

  const toggle = (roleId: number, module: SystemModule, action: string) => {
    const current = getChecked(roleId, module, action)
    const updated: AllPermissions = {
      ...permissions,
      [roleId]: {
        ...permissions[roleId],
        [module]: {
          ...permissions[roleId]?.[module],
          [action]: !current,
        },
      },
    }
    onPermissionsChange(updated)
  }

  const saveRole = async (roleId: number, roleName: string) => {
    setSaving(roleId)
    try {
      await updateRolePermissions(roleId, permissions[roleId] as RolePermissions)
      clearPermissions()
      await fetchMyPermissions()
      toast.success(`Permisos de ${roleName} guardados (Actualizados en tiempo real)`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar permisos')
    } finally {
      setSaving(null)
    }
  }

  const toggleAllModule = (roleId: number, module: SystemModule, enable: boolean) => {
    const updated = { ...permissions }
    updated[roleId] = { ...updated[roleId] }
    updated[roleId][module] = {
      view: enable, create: enable, edit: enable, delete: enable
    }
    onPermissionsChange(updated)
  }

  const rolesToEdit = roles.filter(r => r.id !== 1)

  return (
    <div className="space-y-6">
      {/* Admin notice */}
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Administrador — Acceso Total</p>
          <p className="text-xs text-muted-foreground">
            El rol <strong>Administrador</strong> tiene acceso irrestricto a todos los módulos del sistema. Sus permisos no son editables.
          </p>
        </div>
      </div>

      {loadingRoles ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : rolesToEdit.length === 0 ? (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No hay roles personalizados. Crea uno para asignar permisos.</p>
        </div>
      ) : (
        rolesToEdit.map((role) => (
          <div key={role.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Role header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold bg-accent text-accent-foreground">
                  {role.name}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  ({role.id}) — {MODULES.filter(m => getChecked(role.id, m.key, 'view')).length} módulos visibles
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => saveRole(role.id, role.name)}
                disabled={saving === role.id}
              >
                {saving === role.id
                  ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  : <Save className="mr-2 h-3.5 w-3.5" />
                }
                Guardar cambios
              </Button>
            </div>

            {/* Matrix table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left font-medium text-muted-foreground px-5 py-3 w-48">Módulo</th>
                    {ACTIONS.map(a => (
                      <th key={a.key} className={`text-center font-medium px-4 py-3 w-24 ${a.color}`}>
                        {a.label}
                      </th>
                    ))}
                    <th className="text-center font-medium text-muted-foreground px-4 py-3 w-28">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod, idx) => {
                    const allEnabled = ACTIONS.every(a => getChecked(role.id, mod.key, a.key))
                    return (
                      <tr
                        key={mod.key}
                        className={`border-b border-border/50 transition-colors hover:bg-muted/20 ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'}`}
                      >
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2 font-medium text-foreground">
                            <mod.icon className="h-4 w-4 text-muted-foreground" />
                            {mod.label}
                          </span>
                        </td>
                        {ACTIONS.map(a => (
                          <td key={a.key} className="px-4 py-3 text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                id={`perm-${role.id}-${mod.key}-${a.key}`}
                                checked={getChecked(role.id, mod.key, a.key)}
                                onCheckedChange={() => toggle(role.id, mod.key, a.key)}
                                className="h-4 w-4"
                              />
                            </div>
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => toggleAllModule(role.id, mod.key, !allEnabled)}
                            title={allEnabled ? 'Desactivar todos' : 'Activar todos'}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            {allEnabled ? 'Quitar' : 'Todo'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
      
    </div>
  )
}
