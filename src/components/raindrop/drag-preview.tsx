import React from 'react'

import type { Collection } from '@/lib/types'

/**
 * Props for the drag overlay preview.
 */
interface DragPreviewProps {
  /** Active collection being dragged. */
  collection?: Collection
}

/**
 * Floating drag preview shown by `DragOverlay`.
 * @param collection - Currently dragged root collection
 * @returns Overlay content or null when no active drag exists
 * @example
 *   <DragPreview collection={activeCollection} />
 */
const DragPreview = React.memo(function DragPreview({
  collection,
}: DragPreviewProps) {
  if (!collection) return null

  return (
    <div
      data-testid="drag-preview"
      className="bg-popover text-popover-foreground flex min-w-44 items-center gap-2 rounded-md border px-3 py-2 shadow-lg"
    >
      <div
        className="h-3 w-3 flex-shrink-0 rounded-sm"
        style={{ backgroundColor: collection.color || '#8b5cf6' }}
      />
      <span className="truncate text-sm font-medium">{collection.name}</span>
    </div>
  )
})

export { DragPreview }
export default DragPreview
