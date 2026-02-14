import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowRight, FolderInput } from "lucide-react"
import type { Collection } from "@/lib/types"

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
export function MergeDialog({
  open,
  onOpenChange,
  sourceCollection,
  targetCollection,
  onConfirm,
}: MergeDialogProps) {
  if (!sourceCollection || !targetCollection) return null

  const handleConfirm = () => {
    onConfirm(sourceCollection.id, targetCollection.id)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="h-5 w-5 text-primary" />
            Merge Collections
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. Please review the details below.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Visual merge representation */}
          <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/30">
            <div className="flex-1 text-center">
              <div
                className="mx-auto mb-2 h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-medium"
                style={{
                  backgroundColor: sourceCollection.color || "#8b5cf6",
                }}
              >
                {sourceCollection.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium truncate">
                {sourceCollection.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {sourceCollection.count} bookmarks
              </p>
            </div>

            <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

            <div className="flex-1 text-center">
              <div
                className="mx-auto mb-2 h-8 w-8 rounded-md flex items-center justify-center text-white text-xs font-medium"
                style={{
                  backgroundColor: targetCollection.color || "#8b5cf6",
                }}
              >
                {targetCollection.name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium truncate">
                {targetCollection.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {targetCollection.count} bookmarks
              </p>
            </div>
          </div>

          {/* Warning notice */}
          <div className="flex gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">What will happen:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  &bull; {sourceCollection.count} bookmarks will be moved to{" "}
                  <span className="font-medium text-foreground">
                    {targetCollection.name}
                  </span>
                </li>
                <li>
                  &bull;{" "}
                  <span className="font-medium text-foreground">
                    {sourceCollection.name}
                  </span>{" "}
                  collection will be deleted
                </li>
                <li>&bull; Duplicate bookmarks will be kept as-is</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Confirm Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
