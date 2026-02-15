import type { Page } from '@playwright/test'

import {
  mockRaindrops,
  mockCollections,
  mockChildCollections,
  mockUser,
  mockTags,
} from '../fixtures'

/**
 * Mock Raindrop.io API responses via Playwright page.route().
 * Imports shared fixture data from fixtures/ (single source of truth).
 *
 * Called BEFORE page loads data so all API requests are intercepted.
 *
 * @param page - Playwright page instance
 *
 * @example
 *   const page = await electronApp.firstWindow()
 *   await mockRaindropApi(page)
 *   await page.waitForLoadState('domcontentloaded')
 */
export async function mockRaindropApi(page: Page): Promise<void> {
  await page.route('**/api.raindrop.io/rest/v1/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/rest/v1', '')
    const method = route.request().method()

    // GET /raindrops/:collectionId (with pagination)
    if (method === 'GET' && /^\/raindrops\/(-?\d+)$/.test(path)) {
      const collectionId = Number(path.split('/').pop())
      const pageNum = Number(url.searchParams.get('page') ?? '0')
      const perpage = Number(url.searchParams.get('perpage') ?? '50')

      const all =
        collectionId === 0
          ? mockRaindrops
          : mockRaindrops.filter((r) => r.collection.$id === collectionId)

      const start = pageNum * perpage
      const items = all.slice(start, start + perpage)
      return route.fulfill({
        json: { result: true, items, count: all.length },
      })
    }

    // GET /raindrop/:id (single)
    if (method === 'GET' && /^\/raindrop\/\d+$/.test(path)) {
      const id = Number(path.split('/').pop())
      const item = mockRaindrops.find((r) => r._id === id)
      if (item) {
        return route.fulfill({ json: { result: true, item } })
      }
      return route.fulfill({ status: 404, json: { result: false } })
    }

    // GET /collections
    if (method === 'GET' && path === '/collections') {
      return route.fulfill({
        json: { result: true, items: mockCollections },
      })
    }

    // GET /collections/childrens
    if (method === 'GET' && path === '/collections/childrens') {
      return route.fulfill({
        json: { result: true, items: mockChildCollections },
      })
    }

    // GET /user
    if (method === 'GET' && path === '/user') {
      return route.fulfill({ json: { result: true, user: mockUser } })
    }

    // GET /tags (with or without collectionId)
    if (method === 'GET' && /^\/tags(\/(-?\d+))?$/.test(path)) {
      return route.fulfill({ json: { result: true, items: mockTags } })
    }

    // GET /filters/:collectionId
    if (method === 'GET' && /^\/filters\//.test(path)) {
      return route.fulfill({
        json: {
          result: true,
          items: {
            type: [
              { _id: 'link', count: 30 },
              { _id: 'article', count: 15 },
            ],
            tag: [{ _id: 'react', count: 8 }],
          },
        },
      })
    }

    // Fallback: return generic success for mutations
    return route.fulfill({ json: { result: true } })
  })
}
