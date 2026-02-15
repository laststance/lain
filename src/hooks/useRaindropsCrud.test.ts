import { waitFor, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { useRaindropsCrud } from '@/hooks/useRaindropsCrud'
import { renderHookWithProviders } from '@test/render-with-providers'

describe('useRaindropsCrud', () => {
  it('fetches and maps raindrops from API', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all' }),
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // MSW returns 60 mock raindrops, perpage=50 → first page has 50
    expect(result.current.raindrops).toHaveLength(50)

    // Verify mapping from API types to UI types
    const first = result.current.raindrops[0]
    expect(first.id).toBe('1') // _id: 1 → string
    expect(first.title).toBe('React Documentation')
    expect(first.url).toBe('https://react.dev') // link → url
    expect(first.type).toBe('link')
    expect(first.tags).toEqual(['react', 'frontend'])
    expect(first.collectionId).toBe('100') // collection.$id → string
  })

  it('maps important flag correctly', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.raindrops[0].isImportant).toBe(false)
    expect(result.current.raindrops[1].isImportant).toBe(true)
  })

  it('creates a raindrop via mutation', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Create should not throw
    await act(async () => {
      await result.current.createRaindrop({
        url: 'https://example.com',
        title: 'Test Bookmark',
      })
    })
  })

  it('updates a raindrop via mutation', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.updateRaindrop('1', { title: 'Updated Title' })
    })
  })

  it('deletes a raindrop via mutation', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.deleteRaindrop('1')
    })
  })

  it('reports hasMore based on count vs loaded items', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // MSW returns count: 60 with 50 loaded → hasMore should be true
    expect(result.current.hasMore).toBe(true)
  })

  it('batch moves raindrops to another collection', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.batchMoveToCollection(['1', '2'], '100')
    })
  })

  it('batch adds tags to raindrops', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.batchAddTag(['1', '2'], ['new-tag'])
    })
  })

  it('batch deletes raindrops', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.batchDeleteRaindrops(['1', '2'])
    })
  })

  it('accepts sort parameter for API-driven sorting', async () => {
    const { result } = renderHookWithProviders(() =>
      useRaindropsCrud({ collectionId: 'all', sort: 'title' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify data loaded (sorting is handled by API/MSW)
    expect(result.current.raindrops.length).toBeGreaterThan(0)
  })
})
