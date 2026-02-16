import { describe, expect, it } from 'vitest'

import type { Raindrop } from '@/lib/types'

import {
  buildIndexedHighlightSegments,
  buildSearchQuery,
  buildSubstringHighlightSegments,
  COLLECTION_FUZZY_THRESHOLD,
  extractSearchDomain,
  filterByScope,
  fuzzySearchByName,
} from './search'

const mockRaindrops: Raindrop[] = [
  {
    id: '1',
    title: 'React Documentation',
    url: 'https://react.dev/learn',
    domain: 'react.dev',
    description: 'The official React guides',
    notes: 'Great source for hooks',
    tags: ['react', 'frontend'],
    type: 'link',
    createdAt: '2026-02-17T00:00:00.000Z',
    updatedAt: '2026-02-17T00:00:00.000Z',
    collectionId: '100',
  },
  {
    id: '2',
    title: 'TypeScript Handbook',
    url: 'https://www.typescriptlang.org/docs',
    domain: 'typescriptlang.org',
    description: 'Typed JavaScript at scale',
    notes: '',
    tags: ['typescript'],
    type: 'article',
    createdAt: '2026-02-17T00:00:00.000Z',
    updatedAt: '2026-02-17T00:00:00.000Z',
    collectionId: '100',
  },
]

describe('extractSearchDomain', () => {
  it('extracts host from full URL', () => {
    expect(extractSearchDomain('https://www.react.dev/learn')).toBe('react.dev')
  })

  it('extracts host from bare domain', () => {
    expect(extractSearchDomain('typescriptlang.org')).toBe('typescriptlang.org')
  })

  it('returns empty string for non-domain text', () => {
    expect(extractSearchDomain('react hooks')).toBe('')
  })
})

describe('buildSearchQuery', () => {
  it('builds url-scope query with link: operator from domain', () => {
    expect(buildSearchQuery('https://react.dev/learn', 'url')).toBe(
      'link:react.dev',
    )
  })

  it('builds url-scope query with quoted phrase when needed', () => {
    expect(buildSearchQuery('crunch base', 'url')).toBe('link:"crunch base"')
  })

  it('returns raw query for all/title/description scopes', () => {
    expect(buildSearchQuery('react hooks', 'all')).toBe('react hooks')
    expect(buildSearchQuery('react hooks', 'title')).toBe('react hooks')
    expect(buildSearchQuery('react hooks', 'description')).toBe('react hooks')
  })
})

describe('filterByScope', () => {
  it('filters by url or domain when scope is url', () => {
    const filtered = filterByScope(mockRaindrops, 'react.dev', 'url')
    expect(filtered.map((item) => item.id)).toEqual(['1'])
  })

  it('filters by title when scope is title', () => {
    const filtered = filterByScope(mockRaindrops, 'typescript', 'title')
    expect(filtered.map((item) => item.id)).toEqual(['2'])
  })

  it('filters by description and notes when scope is description', () => {
    const byDescription = filterByScope(
      mockRaindrops,
      'typed javascript',
      'description',
    )
    expect(byDescription.map((item) => item.id)).toEqual(['2'])

    const byNotes = filterByScope(mockRaindrops, 'hooks', 'description')
    expect(byNotes.map((item) => item.id)).toEqual(['1'])
  })

  it('does not narrow when scope is all', () => {
    const filtered = filterByScope(mockRaindrops, 'react', 'all')
    expect(filtered).toHaveLength(2)
  })
})

describe('buildSubstringHighlightSegments', () => {
  it('builds matched and unmatched segments', () => {
    const segments = buildSubstringHighlightSegments(
      'React Documentation',
      'doc',
    )
    expect(segments).toEqual([
      { text: 'React ', matched: false },
      { text: 'Doc', matched: true },
      { text: 'umentation', matched: false },
    ])
  })
})

describe('buildIndexedHighlightSegments', () => {
  it('builds segments from inclusive indices', () => {
    const segments = buildIndexedHighlightSegments('React', [
      [0, 1],
      [4, 4],
    ])
    expect(segments).toEqual([
      { text: 'Re', matched: true },
      { text: 'ac', matched: false },
      { text: 't', matched: true },
    ])
  })
})

describe('fuzzySearchByName', () => {
  const collections = [
    { id: 'a', name: 'React Resources' },
    { id: 'b', name: 'TypeScript Guides' },
    { id: 'c', name: '日本語リソース' },
  ]

  it('uses configured threshold for typo tolerance', () => {
    expect(COLLECTION_FUZZY_THRESHOLD).toBe(0.4)
  })

  it('finds approximate latin query and returns indices', () => {
    const results = fuzzySearchByName(collections, 'rct')
    expect(results[0]?.item.name).toBe('React Resources')
    expect(results[0]?.indices.length).toBeGreaterThan(0)
  })

  it('supports japanese text search', () => {
    const results = fuzzySearchByName(collections, '日本語')
    expect(results[0]?.item.name).toBe('日本語リソース')
  })

  it('returns all collections on empty query', () => {
    const results = fuzzySearchByName(collections, '')
    expect(results).toHaveLength(collections.length)
    expect(results[0]?.indices).toEqual([])
  })
})
