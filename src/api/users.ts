import api from './axios'

// ─── Users ────────────────────────────────────────────────────────────────────

export interface SystemUser {
  id: number
  name: string
  email: string
  phone?: string
  ci?: string
  role_id: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  name: string
  email: string
  phone?: string
  ci?: string
  password?: string
  role_id: number
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  phone?: string
  ci?: string
  password?: string
  role_id?: number
  active?: boolean
}

export const getUsers = async (): Promise<SystemUser[]> => {
  const res = await api.get('/users')
  return res.data.data
}

export const createUser = async (payload: CreateUserData): Promise<{ id: number }> => {
  const res = await api.post('/users', payload)
  return res.data.data
}

export const updateUser = async (id: number, payload: UpdateUserPayload): Promise<SystemUser> => {
  const res = await api.put(`/users/${id}`, payload)
  return res.data.data
}

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  const res = await api.put('/users/me/password', { currentPassword, newPassword })
  return res.data
}

export const toggleUserActive = async (id: number): Promise<SystemUser> => {
  const res = await api.patch(`/users/${id}/toggle`)
  return res.data.data
}

export const deleteUser = async (id: number): Promise<void> => {
  await api.delete(`/users/${id}`)
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete'
export type SystemModule =
  | 'dashboard' | 'sales' | 'quotations' | 'products' | 'categories'
  | 'customers' | 'suppliers' | 'purchases' | 'expenses' | 'credits' | 'reports' | 'users'

export type ModulePermissions = {
  [action in PermissionAction]?: boolean
}

export type RolePermissions = {
  [module in SystemModule]?: ModulePermissions
}

export type AllPermissions = Record<number, RolePermissions>

export const getPermissions = async (): Promise<AllPermissions> => {
  const res = await api.get('/permissions')
  return res.data.data
}

export const getMyPermissions = async (): Promise<{ role_id: number; data: RolePermissions }> => {
  const res = await api.get('/permissions/me')
  return res.data
}

export const updateRolePermissions = async (
  role_id: number,
  permissions: RolePermissions
): Promise<void> => {
  await api.put(`/permissions/${role_id}`, permissions)
}
