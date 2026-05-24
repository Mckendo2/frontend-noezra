import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/api/axios'

interface User {
  id: number
  name: string
  email: string
  role_id: number
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  fetchCurrentUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('pos_token', token)
        set({ user, token, isAuthenticated: true })
      },
      logout: () => {
        localStorage.removeItem('pos_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      fetchCurrentUser: async () => {
        try {
          const res = await api.get('/auth/profile')
          if (res.data?.success && res.data?.data) {
            set({ user: res.data.data })
          }
        } catch (error) {
          console.error('Error fetching current user profile', error)
        }
      },
    }),
    { name: 'pos-auth' }
  )
)
