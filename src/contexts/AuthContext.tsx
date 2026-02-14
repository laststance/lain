import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { AuthState, RaindropUser } from '@/lib/types'

interface AuthContextValue extends AuthState {
  isLoading: boolean
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Custom hook encapsulating auth state initialization and IPC listener.
 * Checks for existing auth state on mount and listens for changes from main process.
 *
 * @returns Auth state: isAuthenticated, isLoading, user, login, logout
 */
function useAuthState() {
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

  return (
    // eslint-disable-next-line @laststance/react-next/no-context-provider
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
})

/**
 * Hook to access auth state and operations.
 * Must be used within an AuthProvider.
 *
 * @returns Auth state (isAuthenticated, isLoading, user) and actions (login, logout)
 * @example
 *   const { isAuthenticated, user, login, logout } = useAuth()
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
