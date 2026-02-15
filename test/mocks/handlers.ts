import { http, HttpResponse } from 'msw'

import {
  mockRaindrops,
  mockCollections,
  mockChildCollections,
  mockUser,
  mockTags,
} from '@fixtures'

const API_BASE = 'https://api.raindrop.io/rest/v1'

/**
 * MSW request handlers for Raindrop.io API mock.
 * Uses shared fixture data with pagination support.
 *
 * @example
 *   // Override handler for specific test
 *   server.use(
 *     http.get(`${API_BASE}/user`, () =>
 *       HttpResponse.json({ result: false }, { status: 401 })
 *     )
 *   )
 */
export const handlers = [
  // --- Raindrops (with pagination) ---
  http.get(`${API_BASE}/raindrops/:collectionId`, ({ params, request }) => {
    const collectionId = Number(params.collectionId)
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '0')
    const perpage = Number(url.searchParams.get('perpage') ?? '25')

    const all =
      collectionId === 0
        ? mockRaindrops
        : mockRaindrops.filter((r) => r.collection.$id === collectionId)

    const start = page * perpage
    const items = all.slice(start, start + perpage)

    return HttpResponse.json({
      result: true,
      items,
      count: all.length,
    })
  }),

  http.get(`${API_BASE}/raindrop/:id`, ({ params }) => {
    const item = mockRaindrops.find((r) => r._id === Number(params.id))
    return item
      ? HttpResponse.json({ result: true, item })
      : new HttpResponse(null, { status: 404 })
  }),

  http.post(`${API_BASE}/raindrop`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      result: true,
      item: { _id: Date.now(), ...body, created: new Date().toISOString() },
    })
  }),

  http.put(`${API_BASE}/raindrop/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const existing = mockRaindrops.find((r) => r._id === Number(params.id))
    return HttpResponse.json({ result: true, item: { ...existing, ...body } })
  }),

  http.delete(`${API_BASE}/raindrop/:id`, () => {
    return HttpResponse.json({ result: true })
  }),

  // Batch operations
  http.put(`${API_BASE}/raindrops/:collectionId`, async ({ request }) => {
    const body = (await request.json()) as { ids?: number[] }
    return HttpResponse.json({
      result: true,
      modified: body.ids?.length ?? 0,
    })
  }),

  http.delete(`${API_BASE}/raindrops/:collectionId`, () => {
    return HttpResponse.json({ result: true, modified: 0 })
  }),

  // --- Collections ---
  http.get(`${API_BASE}/collections`, () => {
    return HttpResponse.json({ result: true, items: mockCollections })
  }),

  http.get(`${API_BASE}/collections/childrens`, () => {
    return HttpResponse.json({ result: true, items: mockChildCollections })
  }),

  http.post(`${API_BASE}/collection`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>
    return HttpResponse.json({
      result: true,
      item: { _id: Date.now(), ...body, count: 0 },
    })
  }),

  http.put(`${API_BASE}/collection/:id`, async ({ request, params }) => {
    const body = (await request.json()) as Record<string, unknown>
    const existing = mockCollections.find((c) => c._id === Number(params.id))
    return HttpResponse.json({ result: true, item: { ...existing, ...body } })
  }),

  http.delete(`${API_BASE}/collection/:id`, () => {
    return HttpResponse.json({ result: true })
  }),

  // --- Tags ---
  http.get(`${API_BASE}/tags/:collectionId`, () => {
    return HttpResponse.json({ result: true, items: mockTags })
  }),

  http.get(`${API_BASE}/tags`, () => {
    return HttpResponse.json({ result: true, items: mockTags })
  }),

  http.put(`${API_BASE}/tags/:collectionId`, () => {
    return HttpResponse.json({ result: true })
  }),

  http.delete(`${API_BASE}/tags/:collectionId`, () => {
    return HttpResponse.json({ result: true })
  }),

  // --- User ---
  http.get(`${API_BASE}/user`, () => {
    return HttpResponse.json({ result: true, user: mockUser })
  }),

  // --- Filters ---
  http.get(`${API_BASE}/filters/:collectionId`, () => {
    return HttpResponse.json({
      result: true,
      items: {
        type: [
          { _id: 'link', count: 30 },
          { _id: 'article', count: 15 },
        ],
        tag: [{ _id: 'react', count: 15 }],
      },
    })
  }),

  // --- Suggest ---
  http.post(`${API_BASE}/raindrop/suggest`, () => {
    return HttpResponse.json({
      result: true,
      item: {
        collections: [{ $id: 100 }],
        tags: ['suggested-tag'],
      },
    })
  }),

  // --- Import ---
  http.post(`${API_BASE}/import/url`, async ({ request }) => {
    const body = (await request.json()) as { url: string }
    return HttpResponse.json({
      result: true,
      item: {
        title: 'Parsed Title',
        excerpt: 'Parsed excerpt',
        link: body.url,
      },
    })
  }),
]
