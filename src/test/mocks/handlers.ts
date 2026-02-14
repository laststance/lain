import { http, HttpResponse } from 'msw'

const API_BASE = 'https://api.raindrop.io/rest/v1'

/**
 * Mock raindrop data shared across tests.
 */
const mockRaindrops = [
  {
    _id: 1,
    title: 'React Documentation',
    link: 'https://react.dev',
    excerpt: 'The library for web and native user interfaces',
    type: 'link' as const,
    cover: '',
    tags: ['react', 'frontend'],
    important: false,
    domain: 'react.dev',
    created: '2024-01-15T00:00:00.000Z',
    lastUpdate: '2024-01-15T00:00:00.000Z',
    collection: { $id: 100 },
    media: [],
    note: '',
    highlights: [],
    removed: false,
    sort: 0,
  },
  {
    _id: 2,
    title: 'TypeScript Handbook',
    link: 'https://www.typescriptlang.org/docs/handbook',
    excerpt: 'The TypeScript Handbook is a comprehensive guide',
    type: 'article' as const,
    cover: '',
    tags: ['typescript', 'documentation'],
    important: true,
    domain: 'typescriptlang.org',
    created: '2024-02-01T00:00:00.000Z',
    lastUpdate: '2024-02-01T00:00:00.000Z',
    collection: { $id: 100 },
    media: [],
    note: '',
    highlights: [],
    removed: false,
    sort: 1,
  },
]

/**
 * Mock collection data shared across tests.
 */
const mockCollections = [
  {
    _id: 100,
    title: 'Development',
    parent: null,
    color: null,
    cover: [],
    count: 45,
    expanded: true,
    sort: 0,
    view: 'list' as const,
    access: { level: 4, draggable: true },
    creatorRef: { _id: 1 },
  },
  {
    _id: 101,
    title: 'Design',
    parent: null,
    color: '#ff6b6b',
    cover: [],
    count: 23,
    expanded: true,
    sort: 1,
    view: 'grid' as const,
    access: { level: 4, draggable: true },
    creatorRef: { _id: 1 },
  },
]

/**
 * MSW request handlers for Raindrop.io API mock.
 * Used by both unit tests (via setupServer) and E2E tests.
 */
export const handlers = [
  // --- Raindrops ---
  http.get(`${API_BASE}/raindrops/:collectionId`, ({ params }) => {
    const collectionId = Number(params.collectionId)
    const filtered =
      collectionId === 0
        ? mockRaindrops
        : mockRaindrops.filter((r) => r.collection.$id === collectionId)
    return HttpResponse.json({
      result: true,
      items: filtered,
      count: filtered.length,
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
    return HttpResponse.json({ result: true, items: [] })
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
    return HttpResponse.json({
      result: true,
      items: [
        { _id: 'react', count: 15 },
        { _id: 'typescript', count: 12 },
        { _id: 'design', count: 8 },
      ],
    })
  }),

  http.put(`${API_BASE}/tags`, () => {
    return HttpResponse.json({ result: true })
  }),

  http.delete(`${API_BASE}/tags`, () => {
    return HttpResponse.json({ result: true })
  }),

  // --- User ---
  http.get(`${API_BASE}/user`, () => {
    return HttpResponse.json({
      result: true,
      user: {
        _id: 1,
        fullName: 'Test User',
        email: 'test@example.com',
        avatar: '',
        pro: false,
      },
    })
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
  http.get(`${API_BASE}/raindrop/suggest`, () => {
    return HttpResponse.json({
      result: true,
      item: {
        title: 'Suggested Title',
        excerpt: 'Suggested description',
        media: [{ link: 'https://example.com/favicon.ico', type: 'image' }],
        meta: { icon: 'https://example.com/favicon.ico' },
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
