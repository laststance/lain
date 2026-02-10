import { app, BrowserWindow, ipcMain } from "electron"
import path from "path"
import { fileURLToPath } from "url"
import { RaindropAuth } from "./raindrop-auth.ts"
import type { AuthState } from "../src/lib/types.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const clientId = process.env.VITE_RAINDROP_CLIENT_ID ?? ""
const clientSecret = process.env.RAINDROP_CLIENT_SECRET ?? ""
const auth = new RaindropAuth(clientId, clientSecret)

let mainWindow: BrowserWindow | null = null

/**
 * Create the main application window with secure webPreferences.
 * Loads Vite dev server in development, built files in production.
 */
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Lain",
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
  }
}

/**
 * Register IPC handlers for auth operations.
 * All handlers validate the sender before processing.
 */
function registerAuthIPC(): void {
  ipcMain.handle("auth:login", async (event) => {
    validateSender(event)
    await auth.login()
    const user = await auth.getUser()
    const state: AuthState = { isAuthenticated: true, user }
    mainWindow?.webContents.send("auth:state-changed", state)
  })

  ipcMain.handle("auth:logout", async (event) => {
    validateSender(event)
    await auth.logout()
    const state: AuthState = { isAuthenticated: false, user: null }
    mainWindow?.webContents.send("auth:state-changed", state)
  })

  ipcMain.handle("auth:get-user", async (event) => {
    validateSender(event)
    return auth.getUser()
  })

  ipcMain.handle("auth:get-state", async (event) => {
    validateSender(event)
    if (!auth.isAuthenticated()) {
      return { isAuthenticated: false, user: null } satisfies AuthState
    }
    const user = await auth.getUser()
    return { isAuthenticated: !!user, user } satisfies AuthState
  })
}

/**
 * Validate that the IPC message comes from a known BrowserWindow.
 * @param event - IPC invoke event
 * @throws If sender is not from a recognized window
 */
function validateSender(event: Electron.IpcMainInvokeEvent): void {
  const sender = BrowserWindow.fromWebContents(event.sender)
  if (!sender) {
    throw new Error("Unauthorized IPC sender")
  }
}

// --- App Lifecycle ---

app.whenReady().then(() => {
  registerAuthIPC()
  createWindow()

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
