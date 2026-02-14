import { ipcMain, type BrowserWindow } from 'electron'

import type { AuthState, RaindropUser } from '../src/lib/types.ts'

/**
 * Mock user returned by all auth handlers in test mode.
 * Uses _id: 99999 to be clearly distinguishable from real users.
 */
const MOCK_USER: RaindropUser = {
  _id: 99999,
  fullName: 'Test User',
  email: 'test@lain.app',
  avatar: '',
  pro: false,
}

const MOCK_AUTH_STATE: AuthState = {
  isAuthenticated: true,
  user: MOCK_USER,
}

const MOCK_TOKEN = 'test-token-for-e2e'

/**
 * Register mock IPC auth handlers that always return authenticated state.
 * Replaces the real registerAuthIPC() when LAIN_TEST_MODE=1.
 *
 * @param getMainWindow - Getter for the main window (for state-changed events)
 * @example
 *   // In main.ts (test mode branch)
 *   registerTestAuthIPC(() => mainWindow)
 */
export function registerTestAuthIPC(
  getMainWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle('auth:login', async () => {
    const win = getMainWindow()
    win?.webContents.send('auth:state-changed', MOCK_AUTH_STATE)
  })

  ipcMain.handle('auth:logout', async () => {
    const state: AuthState = { isAuthenticated: false, user: null }
    const win = getMainWindow()
    win?.webContents.send('auth:state-changed', state)
  })

  ipcMain.handle('auth:get-user', async () => MOCK_USER)

  ipcMain.handle('auth:get-state', async () => MOCK_AUTH_STATE)

  ipcMain.handle('auth:get-token', async () => MOCK_TOKEN)
}
