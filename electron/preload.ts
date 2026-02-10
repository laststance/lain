import { contextBridge, ipcRenderer } from "electron"
import type { AuthState } from "../src/lib/types.ts"

/**
 * Preload script that bridges main process auth operations to the renderer.
 * Exposes a minimal, typed API via contextBridge — never raw ipcRenderer.
 *
 * @example
 *   // In renderer process:
 *   await window.auth.login()
 *   const user = await window.auth.getUser()
 *   const cleanup = window.auth.onAuthStateChanged((state) => {
 *     console.log(state.isAuthenticated)
 *   })
 *   // Later: cleanup() to remove listener
 */
contextBridge.exposeInMainWorld("auth", {
  /** Initiate OAuth login flow (opens Raindrop.io auth window). */
  login: (): Promise<void> => ipcRenderer.invoke("auth:login"),

  /** Clear stored tokens and sign out. */
  logout: (): Promise<void> => ipcRenderer.invoke("auth:logout"),

  /** Fetch the authenticated user's Raindrop.io profile. */
  getUser: () => ipcRenderer.invoke("auth:get-user"),

  /** Get current authentication state (isAuthenticated + user). */
  getState: () => ipcRenderer.invoke("auth:get-state"),

  /**
   * Subscribe to auth state changes pushed from the main process.
   * @param callback - Called when auth state changes (login/logout)
   * @returns Cleanup function to unsubscribe
   */
  onAuthStateChanged: (callback: (state: AuthState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: AuthState) =>
      callback(state)
    ipcRenderer.on("auth:state-changed", handler)
    return () => {
      ipcRenderer.removeListener("auth:state-changed", handler)
    }
  },
})
