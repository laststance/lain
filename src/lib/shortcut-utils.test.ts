import { describe, expect, it } from 'vitest'

import type { ShortcutBinding, ShortcutMap } from '@/store/slices/settingsSlice'

import {
  findConflict,
  formatShortcut,
  isEditableTarget,
  matchesBinding,
} from './shortcut-utils'

// Helper to create a minimal KeyboardEvent-like object
function makeEvent(overrides: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: '',
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ctrlKey: false,
    ...overrides,
  } as KeyboardEvent
}

describe('matchesBinding', () => {
  const cmdN: ShortcutBinding = {
    key: 'n',
    meta: true,
    shift: false,
    alt: false,
    ctrl: false,
  }

  it('matches Cmd+N', () => {
    const event = makeEvent({ key: 'n', metaKey: true })
    expect(matchesBinding(event, cmdN)).toBe(true)
  })

  it('matches case-insensitively', () => {
    const event = makeEvent({ key: 'N', metaKey: true })
    expect(matchesBinding(event, cmdN)).toBe(true)
  })

  it('rejects when meta is not pressed', () => {
    const event = makeEvent({ key: 'n', metaKey: false })
    expect(matchesBinding(event, cmdN)).toBe(false)
  })

  it('rejects when shift is pressed but not expected', () => {
    const event = makeEvent({ key: 'n', metaKey: true, shiftKey: true })
    expect(matchesBinding(event, cmdN)).toBe(false)
  })

  it('matches Cmd+Shift+K', () => {
    const cmdShiftK: ShortcutBinding = {
      key: 'k',
      meta: true,
      shift: true,
      alt: false,
      ctrl: false,
    }
    const event = makeEvent({ key: 'k', metaKey: true, shiftKey: true })
    expect(matchesBinding(event, cmdShiftK)).toBe(true)
  })

  it('matches Escape (no modifiers)', () => {
    const esc: ShortcutBinding = {
      key: 'Escape',
      meta: false,
      shift: false,
      alt: false,
      ctrl: false,
    }
    const event = makeEvent({ key: 'Escape' })
    expect(matchesBinding(event, esc)).toBe(true)
  })

  it('rejects wrong key', () => {
    const event = makeEvent({ key: 'x', metaKey: true })
    expect(matchesBinding(event, cmdN)).toBe(false)
  })
})

describe('isEditableTarget', () => {
  it('returns true for INPUT', () => {
    const input = document.createElement('input')
    expect(isEditableTarget(input)).toBe(true)
  })

  it('returns true for TEXTAREA', () => {
    const textarea = document.createElement('textarea')
    expect(isEditableTarget(textarea)).toBe(true)
  })

  it('returns true for contenteditable', () => {
    const div = document.createElement('div')
    div.contentEditable = 'true'
    expect(isEditableTarget(div)).toBe(true)
  })

  it('returns false for regular div', () => {
    const div = document.createElement('div')
    expect(isEditableTarget(div)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isEditableTarget(null)).toBe(false)
  })
})

describe('formatShortcut', () => {
  it('formats Cmd+N', () => {
    const binding: ShortcutBinding = {
      key: 'n',
      meta: true,
      shift: false,
      alt: false,
      ctrl: false,
    }
    expect(formatShortcut(binding)).toBe('\u2318N')
  })

  it('formats Cmd+Shift+K', () => {
    const binding: ShortcutBinding = {
      key: 'k',
      meta: true,
      shift: true,
      alt: false,
      ctrl: false,
    }
    expect(formatShortcut(binding)).toBe('\u21E7\u2318K')
  })

  it('formats Escape', () => {
    const binding: ShortcutBinding = {
      key: 'Escape',
      meta: false,
      shift: false,
      alt: false,
      ctrl: false,
    }
    expect(formatShortcut(binding)).toBe('Esc')
  })

  it('formats Cmd+Backspace', () => {
    const binding: ShortcutBinding = {
      key: 'Backspace',
      meta: true,
      shift: false,
      alt: false,
      ctrl: false,
    }
    expect(formatShortcut(binding)).toBe('\u2318\u232B')
  })

  it('formats Cmd+, (comma)', () => {
    const binding: ShortcutBinding = {
      key: ',',
      meta: true,
      shift: false,
      alt: false,
      ctrl: false,
    }
    expect(formatShortcut(binding)).toBe('\u2318,')
  })

  it('formats Cmd+1', () => {
    const binding: ShortcutBinding = {
      key: '1',
      meta: true,
      shift: false,
      alt: false,
      ctrl: false,
    }
    expect(formatShortcut(binding)).toBe('\u23181')
  })
})

describe('findConflict', () => {
  const map: ShortcutMap = {
    search: { key: 'k', meta: true, shift: false, alt: false, ctrl: false },
    newBookmark: {
      key: 'n',
      meta: true,
      shift: false,
      alt: false,
      ctrl: false,
    },
  }

  it('finds a conflict', () => {
    const binding: ShortcutBinding = {
      key: 'k',
      meta: true,
      shift: false,
      alt: false,
      ctrl: false,
    }
    expect(findConflict(map, binding)).toBe('search')
  })

  it('excludes specified action', () => {
    const binding: ShortcutBinding = {
      key: 'k',
      meta: true,
      shift: false,
      alt: false,
      ctrl: false,
    }
    expect(findConflict(map, binding, 'search')).toBeNull()
  })

  it('returns null for no conflict', () => {
    const binding: ShortcutBinding = {
      key: 'x',
      meta: true,
      shift: false,
      alt: false,
      ctrl: false,
    }
    expect(findConflict(map, binding)).toBeNull()
  })
})
