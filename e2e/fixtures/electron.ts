import { test as base, _electron as electron, expect } from '@playwright/test'
import type { ElectronApplication, Page } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Custom Playwright fixtures for Electron E2E tests.
 * Launches the built Electron app and provides access to the main window.
 *
 * @example
 *   import { test, expect } from '../fixtures/electron'
 *
 *   test('shows login screen', async ({ page }) => {
 *     await expect(page.getByText('Login')).toBeVisible()
 *   })
 */
type ElectronFixtures = {
  electronApp: ElectronApplication
  page: Page
}

export const test = base.extend<ElectronFixtures>({
  electronApp: async ({}, use) => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../dist-electron/main.js')],
      env: { ...process.env, NODE_ENV: 'test' },
    })
    await use(app)
    await app.close()
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await use(page)
  },
})

export { expect }
