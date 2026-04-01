import { test, expect } from '../electron'

/**
 * Keyboard shortcut E2E tests for PR1 modifier-key shortcuts.
 * Verifies that global keyboard shortcuts trigger the correct UI actions
 * when wired through useKeyboardShortcuts hook.
 *
 * Uses synthetic KeyboardEvent dispatch via page.evaluate() to avoid
 * Playwright-Electron key mapping issues with certain modifier combos.
 */

/** Wait for the main app to fully render (breadcrumb visible = data loaded). */
async function waitForApp(page: import('@playwright/test').Page) {
  await expect(
    page.locator('[data-slot="breadcrumb-page"]', {
      hasText: 'All Bookmarks',
    }),
  ).toBeVisible({ timeout: 10_000 })
}

/**
 * Dispatch a synthetic keyboard event on the window.
 * Bypasses Playwright's keyboard API which can have issues with certain
 * modifier+key combinations in Electron.
 */
async function pressShortcut(
  page: import('@playwright/test').Page,
  opts: {
    key: string
    metaKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
    ctrlKey?: boolean
  },
) {
  await page.evaluate((o) => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: o.key,
        metaKey: o.metaKey ?? false,
        shiftKey: o.shiftKey ?? false,
        altKey: o.altKey ?? false,
        ctrlKey: o.ctrlKey ?? false,
        bubbles: true,
        cancelable: true,
      }),
    )
  }, opts)
}

test.describe('Keyboard Shortcuts', () => {
  // @spec:KB.1 - CmdK opens search palette
  test('Cmd+K opens global search palette', async ({ page }) => {
    await waitForApp(page)
    await page.keyboard.press('Meta+k')
    await expect(page.getByText('Search bookmarks')).toBeVisible()
  })

  // @spec:KB.2 - CmdN opens add bookmark dialog
  test('Cmd+N opens add bookmark dialog', async ({ page }) => {
    await waitForApp(page)
    await pressShortcut(page, { key: 'n', metaKey: true })
    await expect(
      page.getByRole('heading', { name: 'Add Bookmark', level: 2 }),
    ).toBeVisible()
  })

  // @spec:KB.3 - CmdShiftN opens new collection dialog
  test('Cmd+Shift+N opens new collection dialog', async ({ page }) => {
    await waitForApp(page)
    await page.keyboard.press('Meta+Shift+n')
    await expect(
      page.getByRole('heading', { name: /collection/i }),
    ).toBeVisible()
  })

  // @spec:KB.4 - Cmd1 switches to grid view
  test('Cmd+1 switches to grid view', async ({ page }) => {
    await waitForApp(page)
    await page.keyboard.press('Meta+1')
    // Grid view renders cards in a grid layout
    await expect(page.locator('[data-testid="grid-view"]')).toBeVisible()
  })

  // @spec:KB.5 - Cmd2 switches to list view
  test('Cmd+2 switches to list view', async ({ page }) => {
    await waitForApp(page)
    // First switch away from list (default)
    await page.keyboard.press('Meta+1')
    await expect(page.locator('[data-testid="grid-view"]')).toBeVisible()
    // Then back to list
    await page.keyboard.press('Meta+2')
    await expect(page.locator('[data-testid="list-view"]')).toBeVisible()
  })

  // @spec:KB.8 - CmdComma opens settings
  test('Cmd+, opens settings dialog', async ({ page }) => {
    await waitForApp(page)
    await pressShortcut(page, { key: ',', metaKey: true })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  // @spec:KB.16 - CmdShiftK opens shortcut settings
  test('Cmd+Shift+K opens settings on shortcuts tab', async ({ page }) => {
    await waitForApp(page)
    await pressShortcut(page, { key: 'k', metaKey: true, shiftKey: true })
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(
      page.getByRole('tab', { name: 'Keyboard Shortcuts', selected: true }),
    ).toBeVisible()
  })

  // @spec:KB.10 - CmdA selects all bookmarks
  test('Cmd+A selects all bookmarks in view', async ({ page }) => {
    await waitForApp(page)
    await page.keyboard.press('Meta+a')
    // When all selected, the bulk action bar should appear
    await expect(page.getByText(/selected/i)).toBeVisible()
  })

  // @spec:KB.20 - CmdShiftT opens tag management
  test('Cmd+Shift+T opens tag management', async ({ page }) => {
    await waitForApp(page)
    await pressShortcut(page, { key: 't', metaKey: true, shiftKey: true })
    await expect(page.getByRole('heading', { name: /tag/i })).toBeVisible()
  })
})
