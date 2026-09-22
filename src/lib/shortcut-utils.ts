import type { ShortcutBinding, ShortcutMap } from '@/store/slices/settingsSlice'

/**
 * Check if a keyboard event matches a shortcut binding.
 *
 * @param event - The keyboard event to check
 * @param binding - The shortcut binding to match against
 * @returns true if the event matches the binding
 * @example
 *   matchesBinding(event, { key: 'n', meta: true, shift: false, alt: false, ctrl: false })
 *   // => true when user presses Cmd+N
 */
export function matchesBinding(
  event: KeyboardEvent,
  binding: ShortcutBinding,
): boolean {
  return (
    event.key.toLowerCase() === binding.key.toLowerCase() &&
    event.metaKey === binding.meta &&
    event.shiftKey === binding.shift &&
    event.altKey === binding.alt &&
    event.ctrlKey === binding.ctrl
  )
}

/**
 * Check if the event target is an editable element (input, textarea, contenteditable).
 *
 * @param target - The event target to check
 * @returns true if the target is an editable element
 * @example
 *   isEditableTarget(document.querySelector('input'))  // => true
 *   isEditableTarget(document.querySelector('div'))     // => false
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tagName = target.tagName
  if (tagName === 'INPUT' || tagName === 'TEXTAREA') return true
  if (target.isContentEditable) return true
  return false
}

const SYMBOL_MAP: Record<string, string> = {
  meta: '\u2318',
  shift: '\u21E7',
  alt: '\u2325',
  ctrl: '\u2303',
  Backspace: '\u232B',
  Escape: 'Esc',
  ArrowUp: '\u2191',
  ArrowDown: '\u2193',
  ArrowLeft: '\u2190',
  ArrowRight: '\u2192',
  Enter: '\u21A9',
  ' ': 'Space',
  ',': ',',
}

/**
 * Format a shortcut binding into a human-readable string using macOS symbols.
 *
 * @param binding - The shortcut binding to format
 * @returns Formatted string like "⌘⇧K" or "⌘N"
 * @example
 *   formatShortcut({ key: 'k', meta: true, shift: true, alt: false, ctrl: false })
 *   // => "⌘⇧K"
 *   formatShortcut({ key: 'Escape', meta: false, shift: false, alt: false, ctrl: false })
 *   // => "Esc"
 */
export function formatShortcut(binding: ShortcutBinding): string {
  const parts: string[] = []
  if (binding.ctrl) parts.push(SYMBOL_MAP.ctrl)
  if (binding.alt) parts.push(SYMBOL_MAP.alt)
  if (binding.shift) parts.push(SYMBOL_MAP.shift)
  if (binding.meta) parts.push(SYMBOL_MAP.meta)

  const keyDisplay = SYMBOL_MAP[binding.key] ?? binding.key.toUpperCase()
  parts.push(keyDisplay)

  return parts.join('')
}

/**
 * Find a conflicting shortcut action for a given binding.
 *
 * @param map - The current shortcut map
 * @param binding - The binding to check for conflicts
 * @param excludeId - Optional action ID to exclude (the action being edited)
 * @returns The conflicting action ID, or null if no conflict
 * @example
 *   findConflict(shortcuts, { key: 'n', meta: true, ... }, 'newBookmark')
 *   // => null (excluded)
 *   findConflict(shortcuts, { key: 'n', meta: true, ... })
 *   // => 'newBookmark'
 */
export function findConflict(
  map: ShortcutMap,
  binding: ShortcutBinding,
  excludeId?: string,
): string | null {
  for (const [actionId, existing] of Object.entries(map)) {
    if (actionId === excludeId) continue
    if (
      existing.key.toLowerCase() === binding.key.toLowerCase() &&
      existing.meta === binding.meta &&
      existing.shift === binding.shift &&
      existing.alt === binding.alt &&
      existing.ctrl === binding.ctrl
    ) {
      return actionId
    }
  }
  return null
}
