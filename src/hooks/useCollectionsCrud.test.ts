import { act } from '@testing-library/react'
import { describe, it } from 'vitest'

import { useCollectionsCrud } from '@/hooks/useCollectionsCrud'
import { renderHookWithProviders } from '@test/render-with-providers'

describe('useCollectionsCrud', () => {
  it('creates a collection via mutation', async () => {
    const { result } = renderHookWithProviders(() => useCollectionsCrud())

    await act(async () => {
      await result.current.createCollection({ title: 'New Collection' })
    })

    // Should not throw — MSW handles the POST
  })

  it('updates a collection via mutation', async () => {
    const { result } = renderHookWithProviders(() => useCollectionsCrud())

    await act(async () => {
      await result.current.updateCollection('100', { title: 'Renamed' })
    })
  })

  it('deletes a collection via mutation', async () => {
    const { result } = renderHookWithProviders(() => useCollectionsCrud())

    await act(async () => {
      await result.current.deleteCollection('100')
    })
  })
})
