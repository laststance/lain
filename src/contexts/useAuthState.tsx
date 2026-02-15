import { useState, useEffect } from 'react'

import type { RaindropUser, AuthState } from '@/lib/types'

/**
 * Custom hook encapsulating auth state initialization and IPC listener.
 * Checks for existing auth state on mount and listens for changes from main process.
 *
 * @returns Auth state: isAuthenticated, isLoading, user, login, logout
 */
export function useAuthState() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<RaindropUser | null>(null)

  useEffect(() => {
    // Check initial auth state on mount
    window.auth
      .getState()
      .then((state: AuthState) => {
        setIsAuthenticated(state.isAuthenticated)
        setUser(state.user)
      })
      .catch(() => {
        setIsAuthenticated(false)
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })

    // Listen for auth state changes from main process
    const cleanup = window.auth.onAuthStateChanged((state: AuthState) => {
      setIsAuthenticated(state.isAuthenticated)
      setUser(state.user)
      setIsLoading(false)
    })

    return cleanup
  }, [])

  const login = () => {
    setIsLoading(true)
    window.auth.login().catch(() => {
      setIsLoading(false)
    })
  }

  const logout = () => {
    window.auth.logout()
  }

  return { isAuthenticated, isLoading, user, login, logout }
}
