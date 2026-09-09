import { describe, test, expect } from 'vitest'

import { store } from '@/store'

describe('Redux Store', () => {
  test('initializes with correct default state', () => {
    const state = store.getState()

    expect(state.ui.viewMode).toBe('list')
    expect(state.ui.selectedCollectionId).toBe('all')
    expect(state.ui.isDetailPanelOpen).toBe(false)
    expect(state.search.query).toBe('')
    expect(state.search.scope).toBe('all')
    expect(state.dialog.addBookmark.open).toBe(false)
    expect(state.settings.theme).toBe('system')
    expect(state.settings.defaultViewMode).toBe('list')
  })

  test('has RTK Query API reducer registered', () => {
    const state = store.getState()
    expect(state).toHaveProperty('raindropApi')
  })
})
