/**
 * Placeholder component for drop zone indicator lines.
 * Original implementation used react-dnd's useDrop hook.
 *
 * // TODO: @dnd-kit migration
 * This component will be reimplemented with @dnd-kit to show
 * insertion lines and highlight valid drop zones during drag operations.
 *
 * @example
 *   <DropIndicator position="after" isActive={false} />
 */
export function DropIndicator(_props: {
  /** Position relative to the sibling element */
  position?: "before" | "after" | "inside"
  /** Whether the indicator is currently active (item hovering over) */
  isActive?: boolean
}) {
  // TODO: @dnd-kit migration
  // Will render a thin primary-color line with dot endpoints
  // at the insertion point when a draggable item hovers nearby.
  return null
}
