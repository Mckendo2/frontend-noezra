import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, UserCog, Eye, EyeOff } from 'lucide-react'
import { createUser, updateUser } from '@/api/users'
import { getRoles, type Role } from '@/api/roles'
import type { SystemUser } from '@/api/users'
import { useAuthStore } from '@/store/authStore'
import { usePermissionsStore } from '@/store/permissionsStore'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onSuccess: () => void
  editingUser: SystemUser | null
  roles: Role[]
}

export default function UserFormDialog({ open, onOpenChange, onSuccess, editingUser, roles }: Props) {
  const isEditing = !!editingUser

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    ci: '',
    password: '',
    role_id: 2,
    active: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { fetchCurrentUser } = useAuthStore()
  const { fetchMyPermissions } = usePermissionsStore()

  useEffect(() => {
    if (open) {
      if (editingUser) {
        setForm({
          name: editingUser.name,
          email: editingUser.email,
          phone: (editingUser as any).phone || '',
          ci: (editingUser as any).ci || '',
          password: '',
          role_id: editingUser.role_id,
          active: editingUser.active,
        })
      } else {
        setForm({ name: '', email: '', phone: '', ci: '', password: '', role_id: 2, active: true })
      }
      setShowPassword(false)
    }
  }, [open, editingUser])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Nombre y correo son obligatorios')
      return
    }
    if (!isEditing && !form.password) {
      toast.error('La contraseña es obligatoria para usuarios nuevos')
      return
    }

    setLoading(true)
    try {
      if (isEditing) {
        const payload: any = { name: form.name, email: form.email, phone: form.phone, ci: form.ci, role_id: form.role_id, active: form.active }
        if (form.password) payload.password = form.password
        await updateUser(editingUser!.id, payload)
        toast.success('Usuario actualizado correctamente')
      } else {
        await createUser({ name: form.name, email: form.email, phone: form.phone, ci: form.ci, password: form.password, role_id: form.role_id } as any)
        toast.success('Usuario creado correctamente')
      }
      onSuccess()
      await fetchCurrentUser()
      await fetchMyPermissions()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al guardar usuario')
    } finally {
      setLoading(false)
    }
  }

  const selectedRoleData = roles.find(r => r.id === form.role_id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <UserCog className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
              <DialogDescription className="text-xs">
                {isEditing ? `Modificando datos de ${editingUser?.name}` : 'Completa los datos para crear una cuenta'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Nombre completo</Label>
            <Input
              id="user-name"
              placeholder="Ej: Juan Pérez"
              value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              autoComplete="off"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="user-email">Correo electrónico</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="user-phone">Teléfono / Celular</Label>
              <Input
                id="user-phone"
                placeholder="Ej: 71234567"
                value={form.phone}
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                autoComplete="off"
              />
            </div>

            {/* CI */}
            <div className="space-y-1.5">
              <Label htmlFor="user-ci">C.I.</Label>
              <Input
                id="user-ci"
                placeholder="Ej: 1234567"
                value={form.ci}
                onChange={(e) => setForm(f => ({ ...f, ci: e.target.value }))}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="user-password">
              {isEditing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            </Label>
            <div className="relative">
              <Input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={isEditing ? '••••••••' : 'Mínimo 6 caracteres'}
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(s => !s)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="user-role">Rol del sistema</Label>
            <Select
              value={form.role_id.toString()}
              onValueChange={(v) => setForm(f => ({ ...f, role_id: Number(v) }))}
            >
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(r => (
                  <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedRoleData?.id === 1 
                ? '⚠️ El administrador tiene acceso completo al sistema' 
                : selectedRoleData?.description || 'Rol personalizado sujeto a permisos en la matriz'}
            </p>
          </div>

          {/* Active toggle (only on edit) */}
          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Estado de la cuenta</p>
                <p className="text-xs text-muted-foreground">
                  {form.active ? 'El usuario puede ingresar al sistema' : 'El usuario está deshabilitado'}
                </p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm(f => ({ ...f, active: v }))}
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
