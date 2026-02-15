import { test, expect } from '../electron'

/**
 * P2 Core CRUD UI tests.
 * E2E runs with LAIN_TEST_MODE=1 (mock auth) and page.route() API mocking.
 * Tests verify UI rendering, data display, and user interactions.
 *
 * @example
 *   pnpm test:e2e
 */

test.describe('Sidebar Navigation', () => {
  test('should render system collections in sidebar', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )
    await expect(page.getByText('Unsorted')).toBeVisible()
    await expect(page.getByText('Trash')).toBeVisible()
  })

  test('should update breadcrumb on collection click', async ({ page }) => {
    // Wait for initial render
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // Click Unsorted in sidebar
    await page.getByRole('button', { name: 'Unsorted' }).click()

    // Breadcrumb should update — use the breadcrumb-specific element
    await expect(
      page.locator('[data-slot="breadcrumb-page"]', { hasText: 'Unsorted' }),
    ).toBeVisible()
  })
})

test.describe('Add Bookmark Dialog', () => {
  test('should open dialog with form fields', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // Click "Add Bookmark" button — could be in toolbar ("Add") or empty state ("Add Bookmark")
    await page
      .getByRole('button', { name: /Add Bookmark|^Add$/ })
      .first()
      .click()

    // Dialog should open with title and URL input
    await expect(
      page.getByRole('heading', { name: 'Add Bookmark' }),
    ).toBeVisible()
    await expect(page.getByLabel('URL')).toBeVisible()
  })

  test('should close dialog via Cancel button', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    await page
      .getByRole('button', { name: /Add Bookmark|^Add$/ })
      .first()
      .click()
    await expect(
      page.getByRole('heading', { name: 'Add Bookmark' }),
    ).toBeVisible()

    // Close via Cancel
    await page.getByRole('button', { name: 'Cancel' }).click()

    // Dialog should be gone
    await expect(
      page.getByRole('heading', { name: 'Add Bookmark' }),
    ).not.toBeVisible()
  })

  test('should close dialog via Escape key', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    await page
      .getByRole('button', { name: /Add Bookmark|^Add$/ })
      .first()
      .click()
    await expect(
      page.getByRole('heading', { name: 'Add Bookmark' }),
    ).toBeVisible()

    // Close via Escape
    await page.keyboard.press('Escape')

    await expect(
      page.getByRole('heading', { name: 'Add Bookmark' }),
    ).not.toBeVisible()
  })
})

test.describe('Bookmark List Rendering', () => {
  test('should render mocked bookmarks in list view', async ({ page }) => {
    // Wait for API-mocked data to load
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // Bookmark titles from mock data should appear (use heading role for exact match)
    await expect(
      page.getByRole('heading', { name: 'React Documentation' }),
    ).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole('heading', { name: 'TypeScript Handbook' }),
    ).toBeVisible()
  })

  test('should show item count in toolbar', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // Wait for list items to render
    await expect(
      page.getByRole('heading', { name: 'React Documentation' }),
    ).toBeVisible({ timeout: 10_000 })

    // Toolbar shows item count
    await expect(page.getByText(/\d+ items/)).toBeVisible()
  })
})

test.describe('Checkbox Selection', () => {
  test('should select raindrop via checkbox on hover', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // Wait for list items to appear
    await expect(
      page.getByRole('heading', { name: 'React Documentation' }),
    ).toBeVisible({ timeout: 10_000 })

    // Hover over first list item to reveal checkbox
    const firstItem = page.locator('.divide-y > div').first()
    await firstItem.hover()

    // Click the checkbox
    const checkbox = firstItem.locator('[data-slot="checkbox"]')
    await checkbox.click()

    // Selection bar should appear showing "1 selected"
    await expect(page.getByText('1 selected')).toBeVisible()
  })

  test('should deselect raindrop via checkbox click', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    await expect(
      page.getByRole('heading', { name: 'React Documentation' }),
    ).toBeVisible({ timeout: 10_000 })

    // Select first item
    const firstItem = page.locator('.divide-y > div').first()
    await firstItem.hover()
    const checkbox = firstItem.locator('[data-slot="checkbox"]')
    await checkbox.click()
    await expect(page.getByText('1 selected')).toBeVisible()

    // Deselect by clicking the checkbox again
    await checkbox.click()

    // Selection bar should disappear
    await expect(page.getByText(/\d+ selected/)).not.toBeVisible()
  })
})

test.describe('Content Scrolling', () => {
  test('should render scroll area with bookmarks', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // Wait for mocked data to render in the list
    await expect(
      page.getByRole('heading', { name: 'React Documentation' }),
    ).toBeVisible({ timeout: 10_000 })

    // Multiple items should be present (mocked data has 20 items)
    const items = page.locator('.divide-y > div')
    await expect(items.first()).toBeVisible()
    const count = await items.count()
    expect(count).toBeGreaterThan(5)
  })
})

test.describe('View Mode Toggle', () => {
  test('should have view mode buttons in toolbar', async ({ page }) => {
    // Wait for main content to render
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // All 4 view mode buttons should be present (aria-label on ToggleGroupItem)
    await expect(page.getByLabel('List view')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByLabel('Grid view')).toBeVisible()
    await expect(page.getByLabel('Table view')).toBeVisible()
    await expect(page.getByLabel('Directory view')).toBeVisible()
  })
})

test.describe('Sort Dropdown', () => {
  test('should render sort dropdown with default "Newest First"', async ({
    page,
  }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // Sort dropdown should show current value
    await expect(page.getByText('Newest First')).toBeVisible({
      timeout: 5_000,
    })
  })

  test('should change sort option via dropdown', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // Wait for data to load
    await expect(
      page.getByRole('heading', { name: 'React Documentation' }),
    ).toBeVisible({ timeout: 10_000 })

    // Open sort dropdown and select "Title A-Z"
    await page.getByText('Newest First').click()
    await page.getByRole('option', { name: 'Title A-Z' }).click()

    // Dropdown should now show "Title A-Z"
    await expect(page.getByText('Title A-Z')).toBeVisible()
  })
})

test.describe('Bulk Delete', () => {
  test('should show Delete button in bulk bar and handle click', async ({
    page,
  }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    // Wait for list items
    await expect(
      page.getByRole('heading', { name: 'React Documentation' }),
    ).toBeVisible({ timeout: 10_000 })

    // Select first item via checkbox
    const firstItem = page.locator('.divide-y > div').first()
    await firstItem.hover()
    const checkbox = firstItem.locator('[data-slot="checkbox"]')
    await checkbox.click()

    // Bulk bar should show "1 selected" and Delete button
    await expect(page.getByText('1 selected')).toBeVisible()
    const deleteButton = page.getByRole('button', { name: 'Delete' })
    await expect(deleteButton).toBeVisible()

    // Click Delete — should trigger batch delete mutation
    await deleteButton.click()

    // After delete, selection bar should clear
    await expect(page.getByText(/\d+ selected/)).not.toBeVisible({
      timeout: 5_000,
    })
  })

  test('should show Deselect All button in bulk bar', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    await expect(
      page.getByRole('heading', { name: 'React Documentation' }),
    ).toBeVisible({ timeout: 10_000 })

    // Select first item
    const firstItem = page.locator('.divide-y > div').first()
    await firstItem.hover()
    await firstItem.locator('[data-slot="checkbox"]').click()
    await expect(page.getByText('1 selected')).toBeVisible()

    // Click Deselect All
    await page.getByRole('button', { name: 'Deselect All' }).click()

    // Selection bar should disappear
    await expect(page.getByText(/\d+ selected/)).not.toBeVisible()
  })
})

test.describe('Bulk Operations Bar', () => {
  test('should show disabled Move to... and Add Tag... buttons', async ({
    page,
  }) => {
    await expect(page.getByRole('link', { name: 'All Bookmarks' })).toBeVisible(
      { timeout: 10_000 },
    )

    await expect(
      page.getByRole('heading', { name: 'React Documentation' }),
    ).toBeVisible({ timeout: 10_000 })

    // Select an item to show bulk bar
    const firstItem = page.locator('.divide-y > div').first()
    await firstItem.hover()
    await firstItem.locator('[data-slot="checkbox"]').click()
    await expect(page.getByText('1 selected')).toBeVisible()

    // Move to... and Add Tag... should be visible but disabled
    const moveButton = page.getByRole('button', { name: 'Move to...' })
    const tagButton = page.getByRole('button', { name: 'Add Tag...' })
    await expect(moveButton).toBeVisible()
    await expect(tagButton).toBeVisible()
    await expect(moveButton).toBeDisabled()
    await expect(tagButton).toBeDisabled()
  })
})
