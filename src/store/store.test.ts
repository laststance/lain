import { describe, it, expect } from 'vitest'

import { store } from '@/store'

describe('Redux Store', () => {
  it('initializes with correct default state', () => {
    const state = store.getState()

    expect(state.ui.viewMode).toBe('list')
    expect(state.ui.selectedCollectionId).toBe('0')
    expect(state.ui.isDetailPanelOpen).toBe(false)
    expect(state.search.query).toBe('')
    expect(state.search.scope).toBe('all')
    expect(state.dialog.addBookmark.open).toBe(false)
    expect(state.settings.theme).toBe('system')
    expect(state.settings.defaultViewMode).toBe('list')
  })

  it('has RTK Query API reducer registered', () => {
    const state = store.getState()
    expect(state).toHaveProperty('raindropApi')
  })
})
