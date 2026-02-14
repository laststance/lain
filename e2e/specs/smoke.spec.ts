import { test, expect } from '../fixtures/electron'

/**
 * Auth bypass smoke tests.
 * Verify that LAIN_TEST_MODE=1 causes the app to start authenticated,
 * showing the main 3-panel UI instead of the login screen.
 *
 * @example
 *   pnpm test:e2e
 */

test.describe('Auth Bypass', () => {
  test('should skip login screen and show main app', async ({ page }) => {
    await expect(page.getByText('Login with Raindrop.io')).not.toBeVisible()
    // Use breadcrumb link to uniquely identify (sidebar also has "All Bookmarks")
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )
  })

  test('should not show loading state after initial render', async ({
    page,
  }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )
    await expect(page.getByText('Loading...')).not.toBeVisible()
  })

  test('should have sidebar with system collections', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )
    await expect(page.getByText('Unsorted')).toBeVisible()
    await expect(page.getByText('Trash')).toBeVisible()
  })
})
