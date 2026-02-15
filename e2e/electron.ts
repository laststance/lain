import { test as base, _electron as electron, expect } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

import { mockRaindropApi } from './api-mock'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Custom Playwright fixtures for Electron E2E tests.
 * Launches the built Electron app with LAIN_TEST_MODE=1 to bypass OAuth.
 * The main process registers mock auth IPC handlers, so the app starts
 * in an authenticated state without opening the Raindrop.io login window.
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
    const app = await electron.launch({
      args: [path.join(__dirname, '../dist-electron/main.js')],
      env: { ...process.env, NODE_ENV: 'test', LAIN_TEST_MODE: '1' },
    })
    await use(app)
    await app.close()
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
