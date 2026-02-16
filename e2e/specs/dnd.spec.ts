import type { Locator, Page } from '@playwright/test'

import { expect, test } from '../electron'

/**
 * Wait until the app reaches a stable, authenticated state.
 * @param page - Playwright page
 */
async function waitForSidebarReady(page: Page) {
  await expect(
    page.locator('[data-slot="breadcrumb-page"]', {
      hasText: 'All Bookmarks',
    }),
  ).toBeVisible({ timeout: 10_000 })
}

/**
 * Get ordered root collection IDs visible in one sidebar group.
 * @param page - Playwright page
 * @param groupId - Group test identifier suffix (e.g. "group-0")
 * @returns Ordered list of collection IDs
 */
async function getGroupRootCollectionIds(
  page: Page,
  groupId: string,
): Promise<string[]> {
  const ids = await page
    .getByTestId(`sidebar-group-${groupId}`)
    .locator('[data-testid^="sidebar-collection-"]')
    .evaluateAll((elements) => {
      return elements
        .map((element) => element.getAttribute('data-testid') ?? '')
        .map((value) => value.replace('sidebar-collection-', ''))
        .filter(Boolean)
    })
  return ids
}

/**
 * Perform manual drag-and-drop (with double hover for dragover reliability).
 * @param page - Playwright page
 * @param sourceCollectionId - Source collection ID
 * @param target - Target locator
 */
async function dragCollectionToTarget(
  page: Page,
  sourceCollectionId: string,
  target: Locator,
) {
  const source = page.getByTestId(`sidebar-collection-${sourceCollectionId}`)
  await source.hover()
  await page.mouse.down()
  await target.hover()
  await target.hover()
  await page.mouse.up()
}

/**
 * Open context menu for one collection row.
 * @param page - Playwright page
 * @param collectionId - Collection ID
 */
async function openCollectionContextMenu(page: Page, collectionId: string) {
  await page
    .getByTestId(`sidebar-collection-${collectionId}`)
    .click({ button: 'right' })
}

test.describe('P4 Organization - DnD and Context Menu (F6)', () => {
  // @spec:F6.1 - Drag collection between groups updates API
  // @spec:F6.5 - Drag preview shows collection icon + name
  // @spec:F6.6 - Drop indicator shows insertion point
  test('moves collection across groups with drag preview and drop indicator', async ({
    page,
  }) => {
    await waitForSidebarReady(page)

    await expect
      .poll(async () => getGroupRootCollectionIds(page, 'group-0'))
      .toContain('100')

    const source = page.getByTestId('sidebar-collection-100')
    const targetGroup = page.getByTestId('sidebar-group-group-1')

    await source.hover()
    await page.mouse.down()
    await targetGroup.hover()
    await targetGroup.hover()

    await expect(page.getByTestId('drag-preview')).toBeVisible()
    await expect(
      page.locator('[data-testid^="drop-indicator-"]').first(),
    ).toBeVisible()

    await page.mouse.up()

    await expect
      .poll(async () => getGroupRootCollectionIds(page, 'group-1'))
      .toContain('100')
    await expect
      .poll(async () => getGroupRootCollectionIds(page, 'group-0'))
      .not.toContain('100')
  })

  // @spec:F6.2 - Reorder within group works and persists
  test('reorders collections within a group and keeps order after reload', async ({
    page,
  }) => {
    await waitForSidebarReady(page)

    const before = await getGroupRootCollectionIds(page, 'group-0')
    expect(before).toEqual(['100', '102'])

    await dragCollectionToTarget(
      page,
      '102',
      page.getByTestId('sidebar-collection-100'),
    )

    await expect
      .poll(async () => getGroupRootCollectionIds(page, 'group-0'))
      .toEqual(['102', '100'])

    await page.reload()
    await waitForSidebarReady(page)

    await expect
      .poll(async () => getGroupRootCollectionIds(page, 'group-0'))
      .toEqual(['102', '100'])
  })

  // @spec:F6.3 - Double-click enables inline rename
  test('supports inline rename on double-click', async ({ page }) => {
    await waitForSidebarReady(page)

    const row = page.getByTestId('sidebar-collection-100')
    await row.dblclick()
    const inlineInput = row.locator('input')
    await expect(inlineInput).toBeVisible()

    await inlineInput.fill('Renamed Collection')
    await inlineInput.press('Enter')

    await expect(row.getByText('Renamed Collection')).toBeVisible()
  })

  // @spec:F6.4 - Right-click context menu with all options
  test('supports context menu rename, move, color, and delete actions', async ({
    page,
  }) => {
    await waitForSidebarReady(page)

    // Rename
    await openCollectionContextMenu(page, '100')
    await page.getByRole('menuitem', { name: 'Rename' }).click()
    const renamedRow = page.getByTestId('sidebar-collection-100')
    const renameInput = renamedRow.locator('input')
    await renameInput.fill('Context Renamed')
    await renameInput.press('Enter')
    await expect(renamedRow.getByText('Context Renamed')).toBeVisible()

    // Move to Group
    await openCollectionContextMenu(page, '100')
    await page.getByRole('menuitem', { name: 'Move to Group' }).hover()
    await page.getByRole('menuitem', { name: 'Creative' }).last().click()
    await expect
      .poll(async () => getGroupRootCollectionIds(page, 'group-1'))
      .toContain('100')

    // Change color
    await openCollectionContextMenu(page, '100')
    await page.getByRole('menuitem', { name: 'Change Color' }).hover()
    await page.getByRole('menuitem', { name: 'Red' }).last().click()
    await expect(page.getByTestId('collection-color-100')).toBeVisible()

    // Delete
    await openCollectionContextMenu(page, '100')
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await expect(page.getByTestId('sidebar-collection-100')).not.toBeVisible()
  })

  // @spec:F6.7 - Optimistic updates: UI updates immediately, reverts on error
  test('rolls back optimistic group move when persistence fails', async ({
    page,
  }) => {
    await waitForSidebarReady(page)

    let failedOnce = false
    await page.route('**/api.raindrop.io/rest/v1/user', async (route) => {
      if (route.request().method() === 'PUT' && !failedOnce) {
        failedOnce = true
        await page.waitForTimeout(600)
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ result: false }),
        })
        return
      }
      await route.fallback()
    })

    await openCollectionContextMenu(page, '100')
    await page.getByRole('menuitem', { name: 'Move to Group' }).hover()
    await page.getByRole('menuitem', { name: 'Creative' }).last().click()

    // Optimistic move first.
    await expect
      .poll(async () => getGroupRootCollectionIds(page, 'group-1'))
      .toContain('100')

    // Then rollback after failed mutation.
    await expect
      .poll(async () => getGroupRootCollectionIds(page, 'group-0'))
      .toContain('100')
  })
})
