import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getRoles, createRole, updateRole, deleteRole, type Role } from '@/api/roles'
import { Loader2, Plus, Trash2, Edit2, ShieldAlert, Save } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { usePermissionsStore } from '@/store/permissionsStore'

interface Props {
  onRolesChanged: () => void
}

export default function RolesManagementTab({ onRolesChanged }: Props) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)

  // Form states for creating/editing
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [formLoading, setFormLoading] = useState(false)
  const { fetchCurrentUser } = useAuthStore()
  const { fetchMyPermissions } = usePermissionsStore()

  useEffect(() => {
    fetchRoles()
    resetForm()
  }, [])

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const data = await getRoles()
      setRoles(data)
    } catch {
      toast.error('Error al cargar los roles')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setForm({ name: '', description: '' })
  }

  const startEdit = (role: Role) => {
    setEditingId(role.id)
    setForm({ name: role.name, description: role.description || '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }

    setFormLoading(true)
    try {
      if (editingId) {
        await updateRole(editingId, { name: form.name, description: form.description })
        toast.success('Rol actualizado correctamente')
      } else {
        await createRole({ name: form.name, description: form.description })
        toast.success('Rol creado correctamente')
      }
      resetForm()
      fetchRoles()
      onRolesChanged() // Notify parent to refresh PermissionsMatrix if needed
      await fetchCurrentUser()
      await fetchMyPermissions()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar rol')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este rol? Se eliminarán todos sus permisos asociados. (Esta acción fallará si hay usuarios con este rol)')) return
    
    try {
      await deleteRole(id)
      toast.success('Rol eliminado')
      fetchRoles()
      onRolesChanged()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al eliminar rol')
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Roles List */}
      <div className="border border-border rounded-lg overflow-hidden flex flex-col min-h-[500px]">
        <div className="bg-muted/30 px-5 py-3 border-b border-border font-medium text-sm flex items-center justify-between">
          <span>Roles Existentes</span>
          <span className="text-xs text-muted-foreground">{roles.length} roles</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-card">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
          ) : roles.map(role => (
            <div key={role.id} className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${editingId === role.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-background hover:border-primary/30'}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold flex items-center gap-2">
                  {role.name} 
                  {!role.is_custom && <ShieldAlert className="h-3.5 w-3.5 text-primary" title="Rol del Sistema" />}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-1">{role.id}</p>
                {role.description && <p className="text-xs text-muted-foreground mt-2">{role.description}</p>}
              </div>
              {!!role.is_custom && (
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(role)} title="Editar nombre/descripción">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(role.id)} title="Eliminar rol">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Form */}
      <div className="bg-muted/10 p-6 rounded-lg border border-border flex flex-col min-h-[500px]">
        <div className="mb-6">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            {editingId ? <Edit2 className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
            {editingId ? 'Editar Rol' : 'Crear Nuevo Rol'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {editingId ? 'Modifica el nombre o descripción del rol seleccionado.' : 'Crea un rol personalizado para asignarlo a los usuarios.'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
          <div className="space-y-2">
            <Label htmlFor="role-name">Nombre del Rol</Label>
            <Input
              id="role-name"
              placeholder="ej. Gerente de Ventas"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-desc">Descripción (opcional)</Label>
            <Input
              id="role-desc"
              placeholder="Acceso completo al módulo de ventas..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="mt-auto pt-6 flex gap-3 justify-end border-t border-border/50">
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm} disabled={formLoading}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={formLoading}>
              {formLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingId ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />)}
              {editingId ? 'Guardar Cambios' : 'Crear Rol'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
