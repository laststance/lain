import { Provider } from 'react-redux'

import { LoginScreen } from '@/components/LoginScreen'
import { MainApp } from '@/components/main-app'
import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { store } from '@/store'

/**
 * Root component that switches between login and the main 3-panel UI
 * based on Raindrop.io OAuth authentication state.
 *
 * Flow: Provider (Redux) → ThemeProvider → TooltipProvider → AuthProvider → LoginScreen | MainApp
 */
function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return <MainApp />
}

export function App() {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <AuthProvider>
            <AuthenticatedApp />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </Provider>
  )
}

export default App
