import React, { type ReactNode, useMemo } from 'react'

import { AuthContext } from '@/contexts/AuthContext'
import { useAuthState } from '@/contexts/useAuthState'

/**
 * Auth provider that bridges Electron IPC auth operations to React state.
 * On mount, checks for existing auth state (stored tokens).
 * Listens for auth state changes pushed from the main process.
 *
 * @example
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 */

export const AuthProvider = React.memo(function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const { isAuthenticated, isLoading, user, login, logout } = useAuthState()

  const contextValue = useMemo(
    () => ({ isAuthenticated, isLoading, user, login, logout }),
    [isAuthenticated, isLoading, user, login, logout],
  )

  return <AuthContext value={contextValue}>{children}</AuthContext>
})
