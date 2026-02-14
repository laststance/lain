import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

import type { ViewMode } from '@/lib/types'

/**
 * Keyboard shortcut binding: modifier keys + key code.
 *
 * @example
 *   const shortcut: ShortcutBinding = {
 *     key: 'n',
 *     meta: true,    // ⌘
 *     shift: false,
 *     alt: false,
 *     ctrl: false,
 *   }
 */
export interface ShortcutBinding {
  key: string
  meta: boolean
  shift: boolean
  alt: boolean
  ctrl: boolean
}

export type ShortcutMap = Record<string, ShortcutBinding>

/**
 * Settings state for shortcuts, theme, and preferences.
 * All values in this slice are persisted to localStorage.
 *
 * @example
 *   dispatch(setDefaultViewMode('grid'))
 *   dispatch(updateShortcut({ actionId: 'newBookmark', binding: { key: 'n', meta: true, ... } }))
 */
interface SettingsState {
  shortcuts: ShortcutMap
  theme: 'light' | 'dark' | 'system'
  defaultViewMode: ViewMode
}

/**
 * Default keyboard shortcut bindings following macOS conventions.
 */
export const DEFAULT_SHORTCUTS: ShortcutMap = {
  newBookmark: { key: 'n', meta: true, shift: false, alt: false, ctrl: false },
  newCollection: {
    key: 'n',
    meta: true,
    shift: true,
    alt: false,
    ctrl: false,
  },
  viewGrid: { key: '1', meta: true, shift: false, alt: false, ctrl: false },
  viewList: { key: '2', meta: true, shift: false, alt: false, ctrl: false },
  viewTable: { key: '3', meta: true, shift: false, alt: false, ctrl: false },
  viewDirectory: {
    key: '4',
    meta: true,
    shift: false,
    alt: false,
    ctrl: false,
  },
  delete: {
    key: 'Backspace',
    meta: true,
    shift: false,
    alt: false,
    ctrl: false,
  },
  selectAll: { key: 'a', meta: true, shift: false, alt: false, ctrl: false },
  search: { key: 'k', meta: true, shift: false, alt: false, ctrl: false },
  escape: {
    key: 'Escape',
    meta: false,
    shift: false,
    alt: false,
    ctrl: false,
  },
}

const initialState: SettingsState = {
  shortcuts: DEFAULT_SHORTCUTS,
  theme: 'system',
  defaultViewMode: 'list',
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<'light' | 'dark' | 'system'>) {
      state.theme = action.payload
    },
    setDefaultViewMode(state, action: PayloadAction<ViewMode>) {
      state.defaultViewMode = action.payload
    },
    updateShortcut(
      state,
      action: PayloadAction<{
        actionId: string
        binding: ShortcutBinding
      }>,
    ) {
      state.shortcuts[action.payload.actionId] = action.payload.binding
    },
    resetShortcuts(state) {
      state.shortcuts = DEFAULT_SHORTCUTS
    },
  },
})

export const { setTheme, setDefaultViewMode, updateShortcut, resetShortcuts } =
  settingsSlice.actions
