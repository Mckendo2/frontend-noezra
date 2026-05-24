import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Loader2, KeyRound, User as UserIcon, Shield, Eye, EyeOff, LayoutDashboard, ShoppingCart, FileText, Package, Tags, Users, Truck, ShoppingBag, Receipt, CreditCard, BarChart, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/authStore'
import { updatePassword } from '@/api/users'
import { usePermissionsStore } from '@/store/permissionsStore'
import type { SystemModule } from '@/api/users'

const MODULES: { key: SystemModule; label: string; icon: any }[] = [
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

export default function ProfilePage() {
  const { user } = useAuthStore()
  const { can } = usePermissionsStore()
  const [saving, setSaving] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const getRoleName = () => {
    if (user?.role_id === 1 || (user as any)?.role === 'admin') return 'Administrador'
    if (user?.role_id === 2 || (user as any)?.role === 'cashier') return 'Cajero'
    if (user?.role_id === 3 || (user as any)?.role === 'warehouse') return 'Almacén'
    return 'Usuario Personalizado'
  }

  const onSubmit = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Las nuevas contraseñas no coinciden')
      return
    }
    if (data.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }
    setSaving(true)
    try {
      await updatePassword(data.currentPassword, data.newPassword)
      toast.success('Contraseña actualizada correctamente')
      reset()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error al cambiar contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tu información personal y la seguridad de tu cuenta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información del Usuario */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <UserIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Información Personal</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground">Nombre</Label>
              <p className="font-medium text-foreground">{user?.name}</p>
            </div>
            
            <div className="space-y-1">
              <Label className="text-muted-foreground">Correo Electrónico</Label>
              <p className="font-medium text-foreground">{user?.email}</p>
            </div>
            
            <div className="space-y-1">
              <Label className="text-muted-foreground">Rol Asignado</Label>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-4 w-4 text-emerald-500" />
                <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {getRoleName()}
                </span>
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
              <Label className="text-muted-foreground">Módulos Permitidos</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {MODULES.filter(m => can(m.key, 'view')).map(m => (
                  <span key={m.key} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    <m.icon className="h-3.5 w-3.5" />
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Cambio de Contraseña */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <KeyRound className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Cambiar Contraseña</h2>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showCurrent ? "text" : "password"} 
                  autoComplete="current-password"
                  {...register('currentPassword', { required: true })} 
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.currentPassword && <span className="text-xs text-red-500">Este campo es requerido</span>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showNew ? "text" : "password"} 
                  autoComplete="new-password"
                  {...register('newPassword', { required: true, minLength: 6 })} 
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.newPassword?.type === 'required' && <span className="text-xs text-red-500">Este campo es requerido</span>}
              {errors.newPassword?.type === 'minLength' && <span className="text-xs text-red-500">Mínimo 6 caracteres</span>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirm ? "text" : "password"} 
                  autoComplete="new-password"
                  {...register('confirmPassword', { required: true })} 
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && <span className="text-xs text-red-500">Este campo es requerido</span>}
            </div>
            
            <Button type="submit" className="w-full mt-2" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Actualizar Contraseña
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
