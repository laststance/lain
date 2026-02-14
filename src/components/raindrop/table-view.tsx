import { useState, useMemo, useCallback } from "react"
import {
  Globe,
  FileText,
  Image,
  Video,
  File,
  Music,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  FolderInput,
  Tag,
  Copy,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { FaviconIcon } from "@/components/raindrop/favicon-icon"
import type { Raindrop, ContentType } from "@/lib/types"

/**
 * Map content type to its corresponding Lucide icon component.
 */
function getTypeIcon(type: ContentType) {
  const map: Record<ContentType, typeof Globe> = {
    link: Globe,
    article: FileText,
    image: Image,
    video: Video,
    document: File,
    audio: Music,
  }
  return map[type] || Globe
}

/**
 * Format a date string to a human-readable relative format.
 * @param dateStr - ISO date string
 * @returns Formatted date string
 * @example formatDate("2026-02-08T10:00:00Z") // => "Feb 8, 2026"
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${Math.floor(diffHours)}h ago`
  if (diffDays < 2) return "Yesterday"
  if (diffDays < 7) return `${Math.floor(diffDays)}d ago`
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

type SortKey = "title" | "domain" | "type" | "createdAt" | "updatedAt"
type SortDir = "asc" | "desc"

/**
 * Column visibility configuration.
 */
interface ColumnVisibility {
  type: boolean
  title: boolean
  domain: boolean
  tags: boolean
  created: boolean
  updated: boolean
  contentType: boolean
}

/**
 * Props for the TableView component.
 */
interface TableViewProps {
  /** Raindrops to display in the table */
  raindrops: Raindrop[]
  /** Currently selected raindrop IDs */
  selectedIds?: Set<string>
  /** Callback when selection changes */
  onSelectionChange?: (ids: Set<string>) => void
  /** Callback when a raindrop is clicked for detail view */
  onSelect?: (raindrop: Raindrop) => void
  /** Callback when opening a URL externally */
  onOpenUrl?: (url: string) => void
  /** Callback when moving raindrop(s) to a collection */
  onMoveToCollection?: (ids: string[]) => void
  /** Callback when adding tags to raindrop(s) */
  onAddTags?: (ids: string[]) => void
  /** Callback when deleting raindrop(s) */
  onDelete?: (ids: string[]) => void
  /** Callback when toggling important status */
  onToggleImportant?: (id: string) => void
}

/**
 * Dense sortable data table view for displaying raindrops.
 * Features sortable columns, column visibility toggles, multi-select,
 * context menus, and pagination controls.
 *
 * @param raindrops - Array of raindrops to display
 * @param selectedIds - Set of currently selected raindrop IDs
 * @param onSelectionChange - Callback when selection changes
 * @param onSelect - Callback when a row is clicked for detail
 * @param onOpenUrl - Callback when opening URL externally
 * @param onMoveToCollection - Callback for moving items
 * @param onAddTags - Callback for adding tags
 * @param onDelete - Callback for deleting items
 * @param onToggleImportant - Callback for toggling important flag
 *
 * @example
 *   <TableView
 *     raindrops={filteredRaindrops}
 *     selectedIds={selected}
 *     onSelectionChange={setSelected}
 *     onSelect={(rd) => openDetail(rd)}
 *     onOpenUrl={(url) => window.shell.openExternal(url)}
 *   />
 */
export function TableView({
  raindrops,
  selectedIds = new Set(),
  onSelectionChange,
  onSelect,
  onOpenUrl,
  onMoveToCollection,
  onAddTags,
  onDelete,
  onToggleImportant,
}: TableViewProps) {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [page, setPage] = useState(0)
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    type: true,
    title: true,
    domain: true,
    tags: true,
    created: true,
    updated: true,
    contentType: false,
  })
  const pageSize = 50

  const toggleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"))
      } else {
        setSortKey(key)
        setSortDir("asc")
      }
      setPage(0)
    },
    [sortKey],
  )

  const sortedRaindrops = useMemo(() => {
    const sorted = [...raindrops].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title)
          break
        case "domain":
          cmp = (a.domain || "").localeCompare(b.domain || "")
          break
        case "type":
          cmp = a.type.localeCompare(b.type)
          break
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "updatedAt":
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return sorted
  }, [raindrops, sortKey, sortDir])

  const paginatedRaindrops = useMemo(() => {
    const start = page * pageSize
    return sortedRaindrops.slice(start, start + pageSize)
  }, [sortedRaindrops, page])

  const totalPages = Math.ceil(sortedRaindrops.length / pageSize)

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedRaindrops.length) {
      onSelectionChange?.(new Set())
    } else {
      onSelectionChange?.(new Set(paginatedRaindrops.map((r) => r.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    onSelectionChange?.(next)
  }

  const SortHeader = ({
    label,
    sortKeyName,
    className,
  }: {
    label: string
    sortKeyName: SortKey
    className?: string
  }) => {
    const isActive = sortKey === sortKeyName
    return (
      <TableHead className={cn("cursor-pointer select-none", className)}>
        <button
          type="button"
          className="flex items-center gap-1 hover:text-foreground"
          onClick={() => toggleSort(sortKeyName)}
        >
          {label}
          {isActive ? (
            sortDir === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
          )}
        </button>
      </TableHead>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} selected
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => onMoveToCollection?.(Array.from(selectedIds))}
          >
            <FolderInput className="h-3.5 w-3.5" />
            Move to...
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => onAddTags?.(Array.from(selectedIds))}
          >
            <Tag className="h-3.5 w-3.5" />
            Add Tag...
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => {
              for (const id of selectedIds) {
                onToggleImportant?.(id)
              }
            }}
          >
            <Star className="h-3.5 w-3.5" />
            Mark Important
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
            onClick={() => onDelete?.(Array.from(selectedIds))}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                  {columnVisibility.type ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.keys(columnVisibility) as (keyof ColumnVisibility)[]).map(
                  (col) => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={columnVisibility[col]}
                      onCheckedChange={(checked) =>
                        setColumnVisibility((prev) => ({
                          ...prev,
                          [col]: checked,
                        }))
                      }
                    >
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                    </DropdownMenuCheckboxItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Column visibility toggle (when no selection) */}
      {selectedIds.size === 0 && (
        <div className="flex items-center justify-end px-4 py-1 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                <Eye className="h-3.5 w-3.5" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.keys(columnVisibility) as (keyof ColumnVisibility)[]).map(
                (col) => (
                  <DropdownMenuCheckboxItem
                    key={col}
                    checked={columnVisibility[col]}
                    onCheckedChange={(checked) =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [col]: checked,
                      }))
                    }
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                  </DropdownMenuCheckboxItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow className="h-10">
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    paginatedRaindrops.length > 0 &&
                    selectedIds.size === paginatedRaindrops.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              {columnVisibility.type && (
                <TableHead className="w-8">
                  <span className="sr-only">Type icon</span>
                </TableHead>
              )}
              {columnVisibility.title && (
                <SortHeader label="Title" sortKeyName="title" className="min-w-[200px]" />
              )}
              {columnVisibility.domain && (
                <SortHeader label="Domain" sortKeyName="domain" />
              )}
              {columnVisibility.tags && (
                <TableHead>Tags</TableHead>
              )}
              {columnVisibility.created && (
                <SortHeader label="Created" sortKeyName="createdAt" />
              )}
              {columnVisibility.updated && (
                <SortHeader label="Updated" sortKeyName="updatedAt" />
              )}
              {columnVisibility.contentType && (
                <SortHeader label="Type" sortKeyName="type" />
              )}
              <TableHead className="w-10">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRaindrops.map((raindrop, index) => {
              const TypeIcon = getTypeIcon(raindrop.type)
              const isSelected = selectedIds.has(raindrop.id)

              return (
                <ContextMenu key={raindrop.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow
                      className={cn(
                        "h-10 cursor-pointer transition-colors",
                        isSelected && "bg-accent",
                        index % 2 === 1 && !isSelected && "bg-muted/30",
                      )}
                      onClick={() => onSelect?.(raindrop)}
                      onDoubleClick={() =>
                        onOpenUrl?.(raindrop.url)
                      }
                    >
                      <TableCell className="w-10">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(raindrop.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${raindrop.title}`}
                        />
                      </TableCell>
                      {columnVisibility.type && (
                        <TableCell className="w-8">
                          <FaviconIcon
                            url={raindrop.url}
                            type={raindrop.type}
                            size={16}
                          />
                        </TableCell>
                      )}
                      {columnVisibility.title && (
                        <TableCell className="font-medium min-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate">{raindrop.title}</span>
                            {raindrop.isImportant && (
                              <span className="text-amber-500 flex-shrink-0">★</span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.domain && (
                        <TableCell className="text-muted-foreground text-xs">
                          {raindrop.domain || ""}
                        </TableCell>
                      )}
                      {columnVisibility.tags && (
                        <TableCell>
                          <div className="flex items-center gap-1 truncate">
                            {raindrop.tags.slice(0, 2).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] h-4 px-1.5"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {raindrop.tags.length > 2 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{raindrop.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {columnVisibility.created && (
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(raindrop.createdAt)}
                        </TableCell>
                      )}
                      {columnVisibility.updated && (
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(raindrop.updatedAt)}
                        </TableCell>
                      )}
                      {columnVisibility.contentType && (
                        <TableCell className="text-xs text-muted-foreground capitalize">
                          <div className="flex items-center gap-1">
                            <TypeIcon className="h-3 w-3" />
                            {raindrop.type}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="w-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                onOpenUrl?.(raindrop.url)
                              }
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onSelect?.(raindrop)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                onMoveToCollection?.([raindrop.id])
                              }
                            >
                              <FolderInput className="mr-2 h-4 w-4" />
                              Move to Collection...
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onAddTags?.([raindrop.id])}
                            >
                              <Tag className="mr-2 h-4 w-4" />
                              Add Tags...
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                navigator.clipboard.writeText(raindrop.url)
                              }
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onToggleImportant?.(raindrop.id)}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              {raindrop.isImportant
                                ? "Remove Important"
                                : "Mark as Important"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDelete?.([raindrop.id])}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Move to Trash
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onClick={() =>
                        onOpenUrl?.(raindrop.url)
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open URL
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => onSelect?.(raindrop)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      onClick={() => onMoveToCollection?.([raindrop.id])}
                    >
                      <FolderInput className="mr-2 h-4 w-4" />
                      Move to Collection...
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        navigator.clipboard.writeText(raindrop.url)
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy URL
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => onToggleImportant?.(raindrop.id)}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      {raindrop.isImportant
                        ? "Remove Important"
                        : "Mark as Important"}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete?.([raindrop.id])}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Move to Trash
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )
            })}
          </TableBody>
        </Table>

        {paginatedRaindrops.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Globe className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No bookmarks to display</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <span className="text-xs text-muted-foreground">
            Showing {page * pageSize + 1}-
            {Math.min((page + 1) * pageSize, sortedRaindrops.length)} of{" "}
            {sortedRaindrops.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum =
                totalPages <= 5
                  ? i
                  : Math.max(0, Math.min(page - 2, totalPages - 5)) + i
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  className="h-7 w-7 p-0 text-xs"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              )
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
