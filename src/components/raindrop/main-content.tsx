import {
  Search,
  Plus,
  List,
  LayoutGrid,
  Table2,
  FolderTree,
  SlidersHorizontal,
  BookmarkPlus,
  X,
} from 'lucide-react'
import React, { useState, useMemo, useCallback } from 'react'

import { RaindropCard } from '@/components/raindrop/raindrop-card'
import { RaindropListItem } from '@/components/raindrop/raindrop-list-item'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type {
  Raindrop,
  Group,
  Collection,
  ViewMode,
  SortOption,
  SearchScope,
} from '@/lib/types'

/**
 * Props for the MainContent component.
 */
interface MainContentProps {
  /** Breadcrumb path segments for current navigation */
  breadcrumbs: string[]
  /** Array of raindrops (bookmarks) to display */
  raindrops: Raindrop[]
  /** Callback when a raindrop is selected */
  onSelectRaindrop: (raindrop: Raindrop) => void
  /** ID of the currently selected raindrop */
  selectedRaindropId?: string
  /** Set of selected raindrop IDs for multi-select */
  selectedRaindropIds: Set<string>
  /** Callback to update selected raindrop IDs */
  onSelectedRaindropIdsChange: (ids: Set<string>) => void
  /** Available groups for context actions */
  groups: Group[]
  /** Flat list of all collections */
  collections: Collection[]
  /** Callback to open the add bookmark dialog */
  onAddBookmark: () => void
}

/**
 * Main content area displaying the raindrop list with toolbar controls.
 * Supports multiple view modes (list, grid, table, directory),
 * search with configurable scope, sorting, and multi-select.
 *
 * @param breadcrumbs - Path segments for the breadcrumb navigation
 * @param raindrops - Bookmarks to display in the chosen view mode
 * @param onSelectRaindrop - Fires when a single raindrop is clicked
 * @param selectedRaindropId - Currently focused raindrop for detail panel
 * @param selectedRaindropIds - Set of IDs for multi-selection
 * @param onSelectedRaindropIdsChange - Updates multi-selection state
 * @param groups - Groups used for move-to actions
 * @param collections - Flat collection list for move-to actions
 * @param onAddBookmark - Opens the add bookmark dialog
 *
 * @example
 *   <MainContent
 *     breadcrumbs={["Work", "Development"]}
 *     raindrops={filteredRaindrops}
 *     onSelectRaindrop={handleSelect}
 *     selectedRaindropId={selected?.id}
 *     selectedRaindropIds={selectedIds}
 *     onSelectedRaindropIdsChange={setSelectedIds}
 *     groups={groups}
 *     collections={allCollections}
 *     onAddBookmark={() => setIsAddOpen(true)}
 *   />
 */

/**
 * Wrapper for RaindropCard inside a .map() to allow useCallback for event handlers.
 */
const RaindropCardWrapper = React.memo(function RaindropCardWrapper({
  raindrop,
  isSelected,
  onRaindropClick,
  onRaindropDoubleClick,
}: {
  raindrop: Raindrop
  isSelected: boolean
  onRaindropClick: (raindrop: Raindrop, event: React.MouseEvent) => void
  onRaindropDoubleClick: (raindrop: Raindrop) => void
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => onRaindropClick(raindrop, e),
    [onRaindropClick, raindrop],
  )
  const handleDoubleClick = useCallback(
    () => onRaindropDoubleClick(raindrop),
    [onRaindropDoubleClick, raindrop],
  )
  return (
    <RaindropCard
      raindrop={raindrop}
      isSelected={isSelected}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    />
  )
})

/**
 * Wrapper for RaindropListItem inside a .map() to allow useCallback for event handlers.
 */
const RaindropListItemWrapper = React.memo(function RaindropListItemWrapper({
  raindrop,
  isSelected,
  onRaindropClick,
  onRaindropDoubleClick,
}: {
  raindrop: Raindrop
  isSelected: boolean
  onRaindropClick: (raindrop: Raindrop, event: React.MouseEvent) => void
  onRaindropDoubleClick: (raindrop: Raindrop) => void
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => onRaindropClick(raindrop, e),
    [onRaindropClick, raindrop],
  )
  const handleDoubleClick = useCallback(
    () => onRaindropDoubleClick(raindrop),
    [onRaindropDoubleClick, raindrop],
  )
  return (
    <RaindropListItem
      raindrop={raindrop}
      isSelected={isSelected}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    />
  )
})

/**
 * Search scope button used inside a .map() to allow useCallback.
 */
const SearchScopeButton = React.memo(function SearchScopeButton({
  value,
  label,
  isActive,
  onSetScope,
}: {
  value: SearchScope
  label: string
  isActive: boolean
  onSetScope: (scope: SearchScope) => void
}) {
  const handleClick = useCallback(() => onSetScope(value), [onSetScope, value])
  return (
    <Button
      variant={isActive ? 'secondary' : 'ghost'}
      size="sm"
      className="h-6 px-2 text-xs"
      onClick={handleClick}
    >
      {label}
    </Button>
  )
})

const MainContent = React.memo(function MainContent({
  breadcrumbs,
  raindrops,
  onSelectRaindrop,
  selectedRaindropId,
  selectedRaindropIds,
  onSelectedRaindropIdsChange,
  groups: _groups,
  collections: _collections,
  onAddBookmark,
}: MainContentProps) {
  // Reserved for bulk action "Move to..." functionality
  void _groups
  void _collections
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchScope, setSearchScope] = useState<SearchScope>('all')
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false)

  const handleSearchQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value),
    [],
  )
  const handleAdvancedSearchToggle = useCallback(
    () => setIsAdvancedSearchOpen((prev) => !prev),
    [],
  )
  const handleViewModeChange = useCallback((val: string) => {
    if (val) setViewMode(val as ViewMode)
  }, [])
  const handleSortChange = useCallback(
    (val: string) => setSortOption(val as SortOption),
    [],
  )
  const handleDeselectAll = useCallback(
    () => onSelectedRaindropIdsChange(new Set()),
    [onSelectedRaindropIdsChange],
  )
  const handleSetSearchScope = useCallback(
    (scope: SearchScope) => setSearchScope(scope),
    [],
  )
  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchScope('all')
    setIsAdvancedSearchOpen(false)
  }, [])

  /**
   * Filter raindrops based on current search query and scope.
   * @returns Filtered array of raindrops matching the search criteria
   */
  const filteredRaindrops = useMemo(() => {
    if (!searchQuery.trim()) return raindrops

    const query = searchQuery.toLowerCase()

    return raindrops.filter((r) => {
      switch (searchScope) {
        case 'url':
          return r.url.toLowerCase().includes(query)
        case 'title':
          return r.title.toLowerCase().includes(query)
        case 'description':
          return (r.description || '').toLowerCase().includes(query)
        case 'all':
        default:
          return (
            r.title.toLowerCase().includes(query) ||
            r.url.toLowerCase().includes(query) ||
            (r.description || '').toLowerCase().includes(query) ||
            r.tags.some((t) => t.toLowerCase().includes(query))
          )
      }
    })
  }, [raindrops, searchQuery, searchScope])

  /**
   * Sort filtered raindrops based on current sort option.
   * @returns Sorted array of raindrops
   */
  const sortedRaindrops = useMemo(() => {
    const sorted = [...filteredRaindrops]

    switch (sortOption) {
      case 'newest':
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
      case 'oldest':
        return sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
      case 'title-asc':
        return sorted.sort((a, b) => a.title.localeCompare(b.title))
      case 'title-desc':
        return sorted.sort((a, b) => b.title.localeCompare(a.title))
      case 'domain':
        return sorted.sort((a, b) =>
          (a.domain || '').localeCompare(b.domain || ''),
        )
      default:
        return sorted
    }
  }, [filteredRaindrops, sortOption])

  /**
   * Handle click on a raindrop with multi-select support.
   * @param raindrop - The clicked raindrop
   * @param event - Mouse event for detecting modifier keys
   */
  const handleRaindropClick = useCallback(
    (raindrop: Raindrop, event: React.MouseEvent) => {
      if (event.metaKey || event.ctrlKey) {
        // Toggle multi-select
        const next = new Set(selectedRaindropIds)
        if (next.has(raindrop.id)) {
          next.delete(raindrop.id)
        } else {
          next.add(raindrop.id)
        }
        onSelectedRaindropIdsChange(next)
      } else if (event.shiftKey && selectedRaindropId) {
        // Range select
        const currentIndex = sortedRaindrops.findIndex(
          (r) => r.id === selectedRaindropId,
        )
        const clickedIndex = sortedRaindrops.findIndex(
          (r) => r.id === raindrop.id,
        )
        if (currentIndex !== -1 && clickedIndex !== -1) {
          const start = Math.min(currentIndex, clickedIndex)
          const end = Math.max(currentIndex, clickedIndex)
          const rangeIds = sortedRaindrops
            .slice(start, end + 1)
            .map((r) => r.id)
          onSelectedRaindropIdsChange(new Set(rangeIds))
        }
      } else {
        onSelectedRaindropIdsChange(new Set())
        onSelectRaindrop(raindrop)
      }
    },
    [
      selectedRaindropIds,
      selectedRaindropId,
      sortedRaindrops,
      onSelectedRaindropIdsChange,
      onSelectRaindrop,
    ],
  )

  /**
   * Handle double-click to open URL in external browser.
   * @param raindrop - The double-clicked raindrop
   */
  const handleRaindropDoubleClick = useCallback((raindrop: Raindrop) => {
    window.shell.openExternal(raindrop.url)
  }, [])

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 flex-shrink-0 border-b backdrop-blur">
        {/* Top row: Breadcrumb + Actions */}
        <div className="flex items-center justify-between px-4 py-2">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <BreadcrumbItem key={`${crumb}-${index}`}>
                    {!isLast ? (
                      <>
                        <BreadcrumbLink className="hover:text-foreground cursor-pointer text-sm">
                          {crumb}
                        </BreadcrumbLink>
                        <BreadcrumbSeparator />
                      </>
                    ) : (
                      <BreadcrumbPage className="text-sm font-medium">
                        {crumb}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs tabular-nums">
              {sortedRaindrops.length} items
            </span>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" onClick={onAddBookmark} className="h-8">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add a new bookmark</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Second row: Search + View Controls */}
        <div className="flex items-center gap-2 px-4 pb-2">
          {/* Search Input */}
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input
              placeholder="Search bookmarks... (Cmd+K)"
              value={searchQuery}
              onChange={handleSearchQueryChange}
              className="h-8 pr-8 pl-8 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSearchScope('all')
                  setIsAdvancedSearchOpen(false)
                }}
                className="hover:bg-accent absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5"
              >
                <X className="text-muted-foreground h-3 w-3" />
              </button>
            )}
          </div>

          {/* Search Scope Badge */}
          {searchScope !== 'all' && (
            <Badge variant="secondary" className="gap-1 text-xs">
              {searchScope}
              <button
                type="button"
                onClick={() => setSearchScope('all')}
                className="ml-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}

          {/* Advanced Search Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAdvancedSearchOpen ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={handleAdvancedSearchToggle}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search options</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-5" />

          {/* View Mode Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={handleViewModeChange}
            className="gap-0"
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="list"
                  aria-label="List view"
                  className="h-8 w-8 p-0"
                >
                  <List className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>List view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="grid"
                  aria-label="Grid view"
                  className="h-8 w-8 p-0"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Grid view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="table"
                  aria-label="Table view"
                  className="h-8 w-8 p-0"
                >
                  <Table2 className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Table view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value="directory"
                  aria-label="Directory view"
                  className="h-8 w-8 p-0"
                >
                  <FolderTree className="h-3.5 w-3.5" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Directory view</TooltipContent>
            </Tooltip>
          </ToggleGroup>

          <Separator orientation="vertical" className="h-5" />

          {/* Sort Dropdown */}
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
              <SelectItem value="domain">By Domain</SelectItem>
              <SelectItem value="relevance">By Relevance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Search Options */}
        {isAdvancedSearchOpen && (
          <div className="flex items-center gap-2 px-4 pb-2">
            <span className="text-muted-foreground text-xs">Search in:</span>
            <div className="flex gap-1">
              {(
                [
                  { value: 'all', label: 'All Fields' },
                  { value: 'url', label: 'URL Only' },
                  { value: 'title', label: 'Title Only' },
                  { value: 'description', label: 'Description Only' },
                ] as const
              ).map((scope) => (
                <SearchScopeButton
                  key={scope.value}
                  value={scope.value}
                  label={scope.label}
                  isActive={searchScope === scope.value}
                  onSetScope={handleSetSearchScope}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {selectedRaindropIds.size > 0 && (
          <div className="bg-muted/30 flex items-center gap-2 border-t px-4 pt-2 pb-2">
            <span className="text-xs font-medium">
              {selectedRaindropIds.size} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={handleDeselectAll}
            >
              Deselect All
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              Move to...
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs">
              Add Tag...
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive h-6 text-xs"
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <ScrollArea className="flex-1">
        {sortedRaindrops.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center px-4 py-20">
            <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <BookmarkPlus className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No bookmarks found</h3>
            <p className="text-muted-foreground mb-4 max-w-sm text-center text-sm">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search term or clear filters.`
                : 'This collection is empty. Add your first bookmark to get started.'}
            </p>
            {searchQuery ? (
              <Button variant="outline" size="sm" onClick={clearSearch}>
                Clear Search
              </Button>
            ) : (
              <Button size="sm" onClick={onAddBookmark}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add Bookmark
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 p-4">
            {sortedRaindrops.map((raindrop) => (
              <RaindropCardWrapper
                key={raindrop.id}
                raindrop={raindrop}
                isSelected={
                  selectedRaindropId === raindrop.id ||
                  selectedRaindropIds.has(raindrop.id)
                }
                onRaindropClick={handleRaindropClick}
                onRaindropDoubleClick={handleRaindropDoubleClick}
              />
            ))}
          </div>
        ) : (
          /* List View (default) */
          <div className="divide-y">
            {sortedRaindrops.map((raindrop) => (
              <RaindropListItemWrapper
                key={raindrop.id}
                raindrop={raindrop}
                isSelected={
                  selectedRaindropId === raindrop.id ||
                  selectedRaindropIds.has(raindrop.id)
                }
                onRaindropClick={handleRaindropClick}
                onRaindropDoubleClick={handleRaindropDoubleClick}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
})
export { MainContent }
export default MainContent
