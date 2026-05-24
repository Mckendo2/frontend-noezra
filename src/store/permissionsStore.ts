import { create } from 'zustand'
import { getMyPermissions } from '@/api/users'

export type SystemModule =
  | 'dashboard' | 'sales' | 'quotations' | 'products' | 'categories'
  | 'customers' | 'suppliers' | 'purchases' | 'expenses' | 'credits' | 'reports' | 'users'

export type ModulePermissions = {
  view: boolean
  create: boolean
  edit: boolean
  delete: boolean
}

export type RolePermissions = {
  [module in SystemModule]?: ModulePermissions
}

interface PermissionsState {
  permissions: RolePermissions
  role_id: number | null
  loaded: boolean
  loading: boolean
  fetchMyPermissions: () => Promise<void>
  clearPermissions: () => void
  can: (module: SystemModule, action?: keyof ModulePermissions) => boolean
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  permissions: {},
  role_id: null,
  loaded: false,
  loading: false,

  fetchMyPermissions: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const { role_id, data } = await getMyPermissions()
      set({
        permissions: data,
        role_id,
        loaded: true,
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  clearPermissions: () => {
    set({ permissions: {}, role_id: null, loaded: false, loading: false })
  },

  /**
   * Check if the current user can perform an action on a module.
   * If no action specified, checks 'view'.
   * Admin role (full access) returns true always.
   */
  can: (module: SystemModule, action: keyof ModulePermissions = 'view') => {
    const { role_id, permissions } = get()
    // Admin override (id 1)
    if (Number(role_id) === 1) return true
    
    // Check fallback for old token using authStore directly
    const authState = localStorage.getItem('pos-auth')
    if (authState) {
      try {
        const parsed = JSON.parse(authState)
        if (parsed?.state?.user?.role === 'admin' || Number(parsed?.state?.user?.role_id) === 1) {
          return true
        }
      } catch (e) {}
    }

    return permissions[module]?.[action] ?? false
  },
}))
