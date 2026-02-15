import { createContext } from 'react'

import type { AuthState } from '@/lib/types'

export interface AuthContextValue extends AuthState {
  isLoading: boolean
  login: () => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
