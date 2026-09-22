import { test as base, _electron as electron, expect } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

import { mockRaindropApi } from './api-mock'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Custom Playwright fixtures for Electron E2E tests.
 * Launches the built Electron app with LAIN_TEST_MODE=1 to bypass OAuth.
 * The main process registers mock auth IPC handlers, so the app starts
 * in an authenticated state without opening the Raindrop.io login window.
 * Every launch gets a fresh temporary userData dir (LAIN_USER_DATA_DIR), so
 * persisted Redux state in localStorage cannot leak from one test to the next.
 * Runs headless (hidden BrowserWindow, no Dock icon) — set LAIN_E2E_HEADED=1
 * to watch the app while tests run.
 *
 * @example
 *   import { test, expect } from '../electron'
 *
 *   test('shows main app (auth bypassed)', async ({ page }) => {
 *     await expect(page.getByText('All Bookmarks')).toBeVisible()
 *   })
 */
type ElectronFixtures = {
  electronApp: ElectronApplication
  page: Page
}

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    // Fresh userData per launch: the app persists the ui/search/settings slices
    // to localStorage, so a shared profile would carry e.g. the last selected
    // collection into the next test and break its readiness checks.
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lain-e2e-'))
    const app = await electron.launch({
      args: [path.join(__dirname, '../dist-electron/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        LAIN_TEST_MODE: '1',
        LAIN_USER_DATA_DIR: userDataDir,
      },
    })
    await use(app)
    await app.close()
    fs.rmSync(userDataDir, { recursive: true, force: true })
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    await mockRaindropApi(page)
    // Reload after mock setup to avoid race condition where RTK Query
    // fires API calls before page.route() intercepts are registered.
    // Without this, CI runners may fail because the app loads faster
    // than Playwright can set up route handlers.
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await use(page)
  },
})

export { expect }
