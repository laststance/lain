import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { LoginScreen } from "@/components/LoginScreen"
import { UserProfile } from "@/components/UserProfile"

/**
 * Root component that switches between login and main content
 * based on authentication state.
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

  return <UserProfile />
}

export function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App
