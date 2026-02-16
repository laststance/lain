import { act } from '@testing-library/react'
import { describe, it } from 'vitest'

import { useCollectionsCrud } from '@/hooks/useCollectionsCrud'
import type { Group } from '@/lib/types'
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

  it('merges collections via mutation', async () => {
    const { result } = renderHookWithProviders(() => useCollectionsCrud())

    await act(async () => {
      await result.current.merge('100', ['101'])
    })
  })

  it('empties trash via deleteCollection99', async () => {
    const { result } = renderHookWithProviders(() => useCollectionsCrud())

    await act(async () => {
      await result.current.emptyTrash()
    })
  })

  it('persists group ordering via putUser', async () => {
    const { result } = renderHookWithProviders(() => useCollectionsCrud())
    const groups: Group[] = [
      {
        id: 'group-0',
        name: 'Development',
        collections: [
          {
            id: '100',
            name: 'Development',
            icon: 'Folder',
            count: 10,
            groupId: 'group-0',
          },
        ],
      },
    ]

    await act(async () => {
      await result.current.updateUserGroups(groups)
    })
  })

  it('renames collection via updateCollection wrapper', async () => {
    const { result } = renderHookWithProviders(() => useCollectionsCrud())

    await act(async () => {
      await result.current.renameCollection('100', 'Renamed in Sidebar')
    })
  })

  it('updates collection color via putCollection', async () => {
    const { result } = renderHookWithProviders(() => useCollectionsCrud())

    await act(async () => {
      await result.current.recolorCollection('100', '#3b82f6')
    })
  })
})
