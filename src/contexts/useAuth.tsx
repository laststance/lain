import { useContext } from 'react'

import { type AuthContextValue, AuthContext } from '@/contexts/AuthContext'

/**
 * Hook to access auth state and operations.
 * Must be used within an AuthProvider.
 *
 * @returns Auth state (isAuthenticated, isLoading, user) and actions (login, logout)
 * @example
 *   const { isAuthenticated, user, login, logout } = useAuth()
 */

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
