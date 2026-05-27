import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { usePermissionsStore } from '@/store/permissionsStore'
import type { SystemModule } from '@/store/permissionsStore'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck,
  ClipboardList, BarChart3, LogOut, Store, Sun, Moon, FileText,
  CreditCard, Receipt, UserCog, User as UserIcon, Menu
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const navItems: { to: string; label: string; icon: React.ElementType; module: SystemModule }[] = [
  { to: '/dashboard',  label: 'Dashboard',    icon: LayoutDashboard, module: 'dashboard'  },
  { to: '/sales',      label: 'Ventas',       icon: ShoppingCart,    module: 'sales'      },
  { to: '/quotations', label: 'Cotizaciones', icon: FileText,        module: 'quotations' },
  { to: '/products',   label: 'Productos',    icon: Package,         module: 'products'   },
  { to: '/customers',  label: 'Clientes',     icon: Users,           module: 'customers'  },
  { to: '/suppliers',  label: 'Proveedores',  icon: Truck,           module: 'suppliers'  },
  { to: '/purchases',  label: 'Compras',      icon: ClipboardList,   module: 'purchases'  },
  { to: '/expenses',   label: 'Gastos',       icon: Receipt,         module: 'expenses'   },
  { to: '/credits',    label: 'Créditos',     icon: CreditCard,      module: 'credits'    },
  { to: '/reports',    label: 'Reportes',     icon: BarChart3,       module: 'reports'    },
  { to: '/users',      label: 'Usuarios',     icon: UserCog,         module: 'users'      },
]

export default function MainLayout() {
  const { user, logout, fetchCurrentUser } = useAuthStore()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useThemeStore()
  const { can, fetchMyPermissions, loaded, clearPermissions } = usePermissionsStore()

  // Fetch permissions and fresh user profile once when the layout mounts (on login or refresh)
  useEffect(() => {
    fetchCurrentUser()
    if (!loaded) {
      fetchMyPermissions()
    }
  }, [loaded, fetchMyPermissions, fetchCurrentUser])

  const handleLogout = () => {
    logout()
    clearPermissions()
    navigate('/login')
  }

  // Visible nav items = only modules where user has view permission
  const visibleNavItems = navItems.filter(item => can(item.module, 'view'))

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
          <Store className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">NOEZRA</p>
          <p className="text-xs text-muted-foreground mt-0.5">Importadora</p>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <Separator />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="px-4 py-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {user?.name?.slice(0, 2).toUpperCase() ?? 'US'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role_id === 1 || (user as any)?.role === 'admin' ? 'Administrador' : user?.role_id === 2 || (user as any)?.role === 'cashier' ? 'Cajero' : user?.role_id === 3 || (user as any)?.role === 'warehouse' ? 'Almacén' : 'Personalizado'}
              </p>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 mb-2">
          <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Mi Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar (Desktop) ── */}
      <aside className="w-64 hidden md:flex flex-col border-r border-border bg-card shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* ── Navbar ── */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-md hover:bg-accent text-foreground flex items-center justify-center">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <SheetHeader className="hidden">
                  <SheetTitle>Menú</SheetTitle>
                </SheetHeader>
                <SidebarContent onNavClick={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            <h2 className="text-lg font-semibold text-foreground hidden sm:block">Sistema Administrativo</h2>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={toggleTheme} title="Cambiar Tema">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
