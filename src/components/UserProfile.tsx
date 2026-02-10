import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/**
 * User profile screen displayed after successful login.
 * Shows the authenticated user's Raindrop.io profile information
 * (avatar, name, email, Pro status) with a logout button.
 *
 * @example
 *   <UserProfile />
 */
export function UserProfile() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <img
            src={user.avatar}
            alt={user.fullName}
            className="size-20 rounded-full ring-2 ring-border"
          />
          <CardTitle className="text-xl">{user.fullName}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
          {user.pro && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              PRO
            </span>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button variant="outline" className="w-full" onClick={logout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
