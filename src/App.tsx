import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LoginScreen } from "@/components/LoginScreen"
import { MainApp } from "@/components/main-app"

/**
 * Root component that switches between login and the main 3-panel UI
 * based on Raindrop.io OAuth authentication state.
 *
 * Flow: ThemeProvider → AuthProvider → LoginScreen | MainApp
 */
function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
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
    <ThemeProvider defaultTheme="system">
      <TooltipProvider>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}

export default App
