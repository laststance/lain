import {
  Star,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  FolderInput,
  Tag,
  Copy,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'

import { FaviconIcon } from '@/components/raindrop/favicon-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { getDomainColor } from '@/utils/favicon'

/**
 * Map content type to a display label.
 * @param type - The content type
 * @returns Human-readable type label
 * @example getTypeLabel("article") // => "Article"
 */
function getTypeLabel(type: ContentType): string {
  const map: Record<ContentType, string> = {
    link: 'Link',
    article: 'Article',
    image: 'Image',
    video: 'Video',
    document: 'Document',
    audio: 'Audio',
  }
  return map[type] || 'Link'
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
 * Props for the RaindropCard component.
 */
interface RaindropCardProps {
  /** The raindrop (bookmark) data to display */
  raindrop: Raindrop
  /** Whether this card is currently selected */
  isSelected: boolean
  /** Click handler with mouse event for modifier key detection */
  onClick: (event: React.MouseEvent) => void
  /** Double-click handler to open the URL externally */
  onDoubleClick: () => void
}

/**
 * Grid card view for a single raindrop bookmark.
 * Shows cover image (or gradient placeholder), favicon, type badge,
 * title, domain, tags, and date. Supports selection, hover actions,
 * and context menu.
 *
 * @param raindrop - Bookmark data including title, URL, type, tags, etc.
 * @param isSelected - Whether this card has active selection styling
 * @param onClick - Handles click with support for multi-select modifiers
 * @param onDoubleClick - Opens the bookmark URL in the external browser
 *
 * @example
 *   <RaindropCard
 *     raindrop={bookmark}
 *     isSelected={selectedId === bookmark.id}
 *     onClick={(e) => handleClick(bookmark, e)}
 *     onDoubleClick={() => openExternal(bookmark.url)}
 *   />
 */
export function RaindropCard({
  raindrop,
  isSelected,
  onClick,
  onDoubleClick,
}: RaindropCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isChecked, setIsChecked] = useState(false)

  const domainColor = getDomainColor(raindrop.domain || '')
  const visibleTags = raindrop.tags.slice(0, 2)
  const remainingTagCount = raindrop.tags.length - 2

  return (
    <Card
      className={cn(
        'group relative cursor-pointer overflow-hidden transition-all duration-150',
        'hover:scale-[1.01] hover:shadow-md',
        isSelected && 'ring-primary shadow-md ring-2',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {/* Cover Image / Placeholder */}
      <div className="bg-muted relative aspect-video overflow-hidden">
        {raindrop.coverImage ? (
          <img
            src={raindrop.coverImage}
            alt={raindrop.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${domainColor} 0%, oklch(0.4 0.15 280) 100%)`,
            }}
          />
        )}

        {/* Favicon overlay on cover */}
        <div className="absolute bottom-2 left-2">
          <FaviconIcon
            url={raindrop.url}
            type={raindrop.type}
            size={24}
            className="shadow-sm ring-1 ring-black/10"
          />
        </div>

        {/* Type badge */}
        <Badge
          variant="secondary"
          className="bg-background/80 absolute top-2 right-2 h-5 px-1.5 py-0 text-[10px] backdrop-blur-sm"
        >
          {getTypeLabel(raindrop.type)}
        </Badge>

        {/* Important indicator */}
        {raindrop.isImportant && (
          <div className="absolute top-2 left-2">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow" />
          </div>
        )}

        {/* Checkbox (on hover) */}
        {(isHovered || isSelected) && (
          <div
            className="absolute top-2 left-2"
            style={{ display: raindrop.isImportant ? 'none' : undefined }}
          >
            <Checkbox
              checked={isSelected || isChecked}
              onCheckedChange={(checked) => setIsChecked(!!checked)}
              onClick={(e) => e.stopPropagation()}
              className="bg-background/80 backdrop-blur-sm"
            />
          </div>
        )}

        {/* More menu (on hover) */}
        {isHovered && (
          <div className="absolute top-2 right-2" style={{ zIndex: 10 }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="bg-background/80 h-6 w-6 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    window.shell.openExternal(raindrop.url)
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <FolderInput className="mr-2 h-4 w-4" />
                  Move to Collection...
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Tag className="mr-2 h-4 w-4" />
                  Add Tags...
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(raindrop.url)
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Star className="mr-2 h-4 w-4" />
                  {raindrop.isImportant
                    ? 'Remove Important'
                    : 'Mark as Important'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Move to Trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Card Content */}
      <CardContent className="space-y-1.5 p-3">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm leading-snug font-medium">
          {raindrop.title}
        </h3>

        {/* Domain */}
        <p className="text-muted-foreground truncate text-xs">
          {raindrop.domain || new URL(raindrop.url).hostname}
        </p>

        {/* Tags + Date row */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {visibleTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="h-4 max-w-[80px] truncate px-1.5 py-0 text-[10px]"
              >
                {tag}
              </Badge>
            ))}
            {remainingTagCount > 0 && (
              <span className="text-muted-foreground flex-shrink-0 text-[10px]">
                +{remainingTagCount}
              </span>
            )}
          </div>

          <span className="text-muted-foreground flex-shrink-0 text-[10px] tabular-nums">
            {formatRelativeDate(raindrop.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
