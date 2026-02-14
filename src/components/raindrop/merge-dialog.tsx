import { AlertTriangle, ArrowRight, FolderInput } from 'lucide-react'
import React, { useCallback } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Collection } from '@/lib/types'

/**
 * Props for MergeDialog component.
 */
interface MergeDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void
  /** The source collection being merged away (will be deleted) */
  sourceCollection?: Collection
  /** The target collection receiving bookmarks */
  targetCollection?: Collection
  /** Callback when user confirms the merge */
  onConfirm: (sourceId: string, targetId: string) => void
}

/**
 * Confirmation dialog for merging two collections.
 * Shows a summary of the merge operation: source collection's bookmarks
 * will be moved to the target, and the source collection will be deleted.
 *
 * @param open - Controls dialog visibility
 * @param onOpenChange - Callback when dialog open state changes
 * @param sourceCollection - Collection to be merged away and deleted
 * @param targetCollection - Collection to receive the merged bookmarks
 * @param onConfirm - Callback with source and target IDs on confirmation
 *
 * @example
 *   <MergeDialog
 *     open={isMerging}
 *     onOpenChange={setIsMerging}
 *     sourceCollection={sourceCol}
 *     targetCollection={targetCol}
 *     onConfirm={(srcId, tgtId) => mergeCollections(srcId, tgtId)}
 *   />
 */
const MergeDialog = React.memo(function MergeDialog({
  open,
  onOpenChange,
  sourceCollection,
  targetCollection,
  onConfirm,
}: MergeDialogProps) {
  const handleConfirm = useCallback(() => {
    if (!sourceCollection || !targetCollection) return
    onConfirm(sourceCollection.id, targetCollection.id)
    onOpenChange(false)
  }, [sourceCollection, targetCollection, onConfirm, onOpenChange])

  const handleCancel = useCallback(() => onOpenChange(false), [onOpenChange])

  if (!sourceCollection || !targetCollection) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="text-primary h-5 w-5" />
            Merge Collections
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please review the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Visual merge representation */}
          <div className="bg-muted/30 flex items-center gap-3 rounded-lg border p-4">
            <div className="flex-1 text-center">
              <div
                className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-white"
                style={{
                  backgroundColor: sourceCollection.color || '#8b5cf6',
                }}
              >
                {sourceCollection.name.charAt(0).toUpperCase()}
              </div>
              <p className="truncate text-sm font-medium">
                {sourceCollection.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {sourceCollection.count} bookmarks
              </p>
            </div>

            <ArrowRight className="text-muted-foreground h-5 w-5 flex-shrink-0" />

            <div className="flex-1 text-center">
              <div
                className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium text-white"
                style={{
                  backgroundColor: targetCollection.color || '#8b5cf6',
                }}
              >
                {targetCollection.name.charAt(0).toUpperCase()}
              </div>
              <p className="truncate text-sm font-medium">
                {targetCollection.name}
              </p>
              <p className="text-muted-foreground text-xs">
                {targetCollection.count} bookmarks
              </p>
            </div>
          </div>

          {/* Warning notice */}
          <div className="flex gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
            <div className="space-y-1">
              <p className="text-sm font-medium">What will happen:</p>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>
                  &bull; {sourceCollection.count} bookmarks will be moved to{' '}
                  <span className="text-foreground font-medium">
                    {targetCollection.name}
                  </span>
                </li>
                <li>
                  &bull;{' '}
                  <span className="text-foreground font-medium">
                    {sourceCollection.name}
                  </span>{' '}
                  collection will be deleted
                </li>
                <li>&bull; Duplicate bookmarks will be kept as-is</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
export { MergeDialog }
export default MergeDialog
