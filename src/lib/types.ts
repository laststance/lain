/**
 * Raindrop.io user profile returned from /rest/v1/user endpoint.
 * @example
 *   const user: RaindropUser = {
 *     _id: 12345,
 *     fullName: "John Doe",
 *     email: "john@example.com",
 *     avatar: "https://example.com/avatar.jpg",
 *     pro: false
 *   }
 */
export interface RaindropUser {
  _id: number
  fullName: string
  email: string
  avatar: string
  pro: boolean
}

/**
 * Authentication state shared between main and renderer processes via IPC.
 * @example
 *   // Unauthenticated
 *   const state: AuthState = { isAuthenticated: false, user: null }
 *   // Authenticated
 *   const state: AuthState = { isAuthenticated: true, user: { _id: 1, fullName: "John", ... } }
 */
export interface AuthState {
  isAuthenticated: boolean
  user: RaindropUser | null
}

/**
 * OAuth token set returned from Raindrop.io token endpoint.
 * Both access_token and refresh_token rotate on every refresh.
 * @example
 *   const tokens: RaindropTokens = {
 *     access_token: "ae261404-11r4-47c0-bce3-e18a423da828",
 *     refresh_token: "c8080368-fad2-4a3f-b2c9-71d3z85011vb",
 *     expires_in: 1209599,
 *     token_type: "Bearer"
 *   }
 */
export interface RaindropTokens {
  access_token: string
  refresh_token: string
  /** Token lifetime in seconds (~2 weeks) */
  expires_in: number
  token_type: "Bearer"
}

/**
 * Stored token data with computed expiration timestamp.
 */
export interface StoredTokens {
  access_token: string
  refresh_token: string
  /** Epoch milliseconds when the access token expires */
  expires_at: number
}

/**
 * Auth API exposed to renderer via contextBridge.
 * All operations delegate to main process via IPC.
 */
export interface AuthAPI {
  login: () => Promise<void>
  logout: () => Promise<void>
  getUser: () => Promise<RaindropUser | null>
  getState: () => Promise<AuthState>
  onAuthStateChanged: (
    callback: (state: AuthState) => void,
  ) => () => void
}

declare global {
  interface Window {
    auth: AuthAPI
  }
}
