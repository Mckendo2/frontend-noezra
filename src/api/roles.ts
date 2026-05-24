import api from './axios'

export interface Role {
  id: number
  name: string
  description?: string
  is_custom: boolean
  created_at?: string
}

export const getRoles = async (): Promise<Role[]> => {
  const res = await api.get('/roles')
  return res.data.data
}

export const createRole = async (data: { name: string; description?: string }): Promise<void> => {
  await api.post('/roles', data)
}

export const updateRole = async (id: number, data: { name?: string; description?: string }): Promise<void> => {
  await api.put(`/roles/${id}`, data)
}

export const deleteRole = async (id: number): Promise<void> => {
  await api.delete(`/roles/${id}`)
}
