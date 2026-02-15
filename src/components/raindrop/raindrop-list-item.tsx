import {
  Star,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  FolderInput,
  Tag,
  Copy,
  Trash2,
  Globe,
  FileText,
  Image,
  Video,
  File,
  Music,
  // TODO: @dnd-kit migration — GripVertical for drag handle
} from 'lucide-react'
import React, { useState, useMemo, useCallback } from 'react'

import { FaviconIcon } from '@/components/raindrop/favicon-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Raindrop, ContentType } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Static map of content type to lucide icon component.
 * Defined outside render to avoid React rule violations.
 */
const TYPE_ICON_MAP: Record<ContentType, typeof Globe> = {
  link: Globe,
  article: FileText,
  image: Image,
  video: Video,
  document: File,
  audio: Music,
}

/**
 * Format a date string as a relative time or short date.
 * @param dateStr - ISO date string
 * @returns Human-readable relative time string
 * @example formatRelativeDate("2026-02-14T10:00:00Z") // => "2h ago"
 */
function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Props for the RaindropListItem component.
 */
interface RaindropListItemProps {
  /** The raindrop (bookmark) data to display */
  raindrop: Raindrop
  /** Whether this row is currently selected */
  isSelected: boolean
  /** Click handler with mouse event for modifier key detection */
  onClick: (event: React.MouseEvent) => void
  /** Toggle this item's selection state (used by checkbox) */
  onToggleSelect: () => void
  /** Double-click handler to open the URL externally */
  onDoubleClick: () => void
}

/**
 * List row view for a single raindrop bookmark.
 * Shows type icon (or checkbox on hover), favicon thumbnail,
 * title, domain, excerpt, tags, date, and important indicator.
 * Supports selection, hover actions, and context menu.
 *
 * @param raindrop - Bookmark data including title, URL, type, tags, etc.
 * @param isSelected - Whether this row has active selection styling
 * @param onClick - Handles click with support for multi-select modifiers
 * @param onDoubleClick - Opens the bookmark URL in the external browser
 *
 * @example
 *   <RaindropListItem
 *     raindrop={bookmark}
 *     isSelected={selectedId === bookmark.id}
 *     onClick={(e) => handleClick(bookmark, e)}
 *     onDoubleClick={() => openExternal(bookmark.url)}
 *   />
 */
const RaindropListItem = React.memo(function RaindropListItem({
  raindrop,
  isSelected,
  onClick,
  onToggleSelect,
  onDoubleClick,
}: RaindropListItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)
  const handleCheckboxWrapperClick = (e: React.MouseEvent) =>
    e.stopPropagation()
  const TypeIcon = useMemo(
    () => TYPE_ICON_MAP[raindrop.type] || Globe,
    [raindrop.type],
  )

  const handleMoreClick = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  )
  const handleOpenUrl = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      window.shell.openExternal(raindrop.url)
    },
    [raindrop.url],
  )
  const handleStopPropagation = useCallback(
    (e: React.MouseEvent) => e.stopPropagation(),
    [],
  )
  const handleCopyUrl = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      navigator.clipboard.writeText(raindrop.url)
    },
    [raindrop.url],
  )

  const visibleTags = raindrop.tags.slice(0, 3)
  const remainingTagCount = raindrop.tags.length - 3

  // TODO: @dnd-kit migration — drag source setup
  // const dragRef = useRef(null)

  return (
    <div
      className={cn(
        'group flex h-16 cursor-pointer items-center gap-3 px-4 transition-colors duration-150',
        'hover:bg-accent/50',
        isSelected && 'bg-accent',
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* TODO: @dnd-kit migration — drag handle
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      */}

      {/* Checkbox / Type Icon */}
      <div className="flex w-5 flex-shrink-0 items-center justify-center">
        {isHovered || isSelected ? (
          <div onClick={handleCheckboxWrapperClick}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="h-4 w-4"
            />
          </div>
        ) : (
          <TypeIcon className="text-muted-foreground h-4 w-4" />
        )}
      </div>

      {/* Favicon Thumbnail */}
      <FaviconIcon
        url={raindrop.url}
        type={raindrop.type}
        size={32}
        className="flex-shrink-0"
      />

      {/* Title + Domain + Description */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium">{raindrop.title}</h3>
          {raindrop.isImportant && (
            <Star className="h-3 w-3 flex-shrink-0 fill-yellow-400 text-yellow-400" />
          )}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-muted-foreground truncate text-xs">
            {raindrop.domain || new URL(raindrop.url).hostname}
          </span>
          {raindrop.description && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground flex-1 truncate text-xs">
                {raindrop.description}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex max-w-[200px] flex-shrink-0 items-center gap-1">
        {visibleTags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="h-4 max-w-[70px] truncate px-1.5 py-0 text-[10px]"
          >
            {tag}
          </Badge>
        ))}
        {remainingTagCount > 0 && (
          <span className="text-muted-foreground text-[10px]">
            +{remainingTagCount}
          </span>
        )}
      </div>

      {/* Date */}
      <span className="text-muted-foreground w-16 flex-shrink-0 text-right text-xs tabular-nums">
        {formatRelativeDate(raindrop.createdAt)}
      </span>

      {/* More Menu */}
      <div
        className={cn(
          'flex-shrink-0 transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0',
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleMoreClick}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleOpenUrl}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleStopPropagation}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleStopPropagation}>
              <FolderInput className="mr-2 h-4 w-4" />
              Move to Collection...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleStopPropagation}>
              <Tag className="mr-2 h-4 w-4" />
              Add Tags...
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyUrl}>
              <Copy className="mr-2 h-4 w-4" />
              Copy URL
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleStopPropagation}>
              <Star className="mr-2 h-4 w-4" />
              {raindrop.isImportant ? 'Remove Important' : 'Mark as Important'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleStopPropagation}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Move to Trash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
})
export { RaindropListItem }
export default RaindropListItem
