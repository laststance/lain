import {
  Inbox,
  FileQuestion,
  Trash2,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  Search,
  Tag,
  FolderPlus,
  Layers,
} from 'lucide-react'
import React, { useState, useCallback, useMemo } from 'react'

import { CollectionSearch } from '@/components/raindrop/collection-search'
import { ThemeToggle } from '@/components/raindrop/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { SystemCollection, Group, Collection } from '@/lib/types'

/**
 * Static map of system collection icon names to lucide components.
 * Defined at module level to avoid creating components during render.
 */
const SYSTEM_ICON_MAP: Record<string, typeof Inbox> = {
  Inbox,
  FileQuestion,
  Trash2,
}

/**
 * Render the appropriate system collection icon.
 * @param iconName - Icon identifier from SystemCollection.icon
 * @param className - CSS class for the icon
 * @returns JSX element for the icon
 * @example <SystemIcon iconName="Inbox" className="h-4 w-4" />
 */
const SystemIcon = React.memo(function SystemIcon({
  iconName,
  className,
}: {
  iconName: string
  className?: string
}) {
  const Icon = SYSTEM_ICON_MAP[iconName] || Inbox
  return <Icon className={className} />
})

/**
 * A single collection row in the sidebar.
 * Extracted to allow useCallback for click handlers inside recursive rendering.
 */
const CollectionItem = React.memo(function CollectionItem({
  collection,
  depth,
  selectedCollectionId,
  expandedCollections,
  onSelectCollection,
  onToggleCollection,
  sidebarMenuButtonStyles,
}: {
  collection: Collection
  depth: number
  selectedCollectionId: string
  expandedCollections: Set<string>
  onSelectCollection: (id: string) => void
  onToggleCollection: (id: string) => void
  sidebarMenuButtonStyles: Record<number, React.CSSProperties>
}) {
  const isSelected = selectedCollectionId === collection.id
  const hasChildren = collection.children && collection.children.length > 0
  const isExpanded = expandedCollections.has(collection.id)

  const handleClick = useCallback(
    () => onSelectCollection(collection.id),
    [onSelectCollection, collection.id],
  )
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCollection(collection.id)
  }

  return (
    <div>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isSelected}
          onClick={handleClick}
          className="group/collection h-8 w-full"
          style={
            sidebarMenuButtonStyles[depth] || {
              paddingLeft: `${12 + depth * 16}px`,
            }
          }
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={handleToggle}
                className="hover:bg-accent/50 flex-shrink-0 rounded p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown className="text-muted-foreground h-3 w-3" />
                ) : (
                  <ChevronRight className="text-muted-foreground h-3 w-3" />
                )}
              </button>
            ) : (
              <span className="w-4" />
            )}

            <div
              className="h-3 w-3 flex-shrink-0 rounded-sm"
              style={{ backgroundColor: collection.color || '#8b5cf6' }}
            />

            <span className="truncate text-sm">{collection.name}</span>
          </div>

          <span className="text-muted-foreground flex-shrink-0 text-xs tabular-nums opacity-0 transition-opacity group-hover/collection:opacity-100">
            {collection.count}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {hasChildren && isExpanded && (
        <div>
          {collection.children!.map((child) => (
            <CollectionItem
              key={child.id}
              collection={child}
              depth={depth + 1}
              selectedCollectionId={selectedCollectionId}
              expandedCollections={expandedCollections}
              onSelectCollection={onSelectCollection}
              onToggleCollection={onToggleCollection}
              sidebarMenuButtonStyles={sidebarMenuButtonStyles}
            />
          ))}
        </div>
      )}
    </div>
  )
})

/**
 * A single group section in the sidebar with its collections.
 * Extracted to allow useCallback for the Collapsible onOpenChange.
 */
const GroupSection = React.memo(function GroupSection({
  group,
  isExpanded,
  selectedCollectionId,
  expandedCollections,
  onToggleGroup,
  onSelectCollection,
  onToggleCollection,
  onAddCollection,
  sidebarMenuButtonStyles,
}: {
  group: Group
  isExpanded: boolean
  selectedCollectionId: string
  expandedCollections: Set<string>
  onToggleGroup: (id: string) => void
  onSelectCollection: (id: string) => void
  onToggleCollection: (id: string) => void
  onAddCollection: () => void
  sidebarMenuButtonStyles: Record<number, React.CSSProperties>
}) {
  const handleOpenChange = useCallback(
    () => onToggleGroup(group.id),
    [onToggleGroup, group.id],
  )

  return (
    <Collapsible open={isExpanded} onOpenChange={handleOpenChange}>
      <SidebarGroup>
        <div className="group/groupheader flex items-center">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="text-muted-foreground hover:text-foreground flex-1 cursor-pointer px-3 text-xs font-medium tracking-wider uppercase transition-colors">
              <span className="flex items-center gap-1">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {group.name}
              </span>
            </SidebarGroupLabel>
          </CollapsibleTrigger>

          <div className="flex items-center gap-0.5 pr-2 opacity-0 transition-opacity group-hover/groupheader:opacity-100 group-data-[collapsible=icon]:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onAddCollection}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Add Collection
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.collections.map((collection) => (
                <CollectionItem
                  key={collection.id}
                  collection={collection}
                  depth={0}
                  selectedCollectionId={selectedCollectionId}
                  expandedCollections={expandedCollections}
                  onSelectCollection={onSelectCollection}
                  onToggleCollection={onToggleCollection}
                  sidebarMenuButtonStyles={sidebarMenuButtonStyles}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
})

/**
 * A system collection row in the sidebar.
 * Extracted to allow useCallback for click handler.
 */
const SystemCollectionItem = React.memo(function SystemCollectionItem({
  sc,
  isSelected,
  onSelectCollection,
}: {
  sc: SystemCollection
  isSelected: boolean
  onSelectCollection: (id: string) => void
}) {
  const handleClick = useCallback(
    () => onSelectCollection(sc.id),
    [onSelectCollection, sc.id],
  )

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isSelected}
        onClick={handleClick}
        className="h-8"
        tooltip={sc.name}
      >
        <SystemIcon iconName={sc.icon} className="h-4 w-4" />
        <span className="flex-1 truncate">{sc.name}</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {sc.count}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})

/**
 * Props for the LeftSidebar component.
 */
interface LeftSidebarProps {
  /** System-level collections (All Bookmarks, Unsorted, Trash) */
  systemCollections: SystemCollection[]
  /** Groups containing user collections */
  groups: Group[]
  /** Currently selected collection ID */
  selectedCollectionId: string
  /** Callback when a collection is selected */
  onSelectCollection: (id: string) => void
  /** Callback to open the add bookmark dialog */
  onAddBookmark: () => void
  /** Callback to open the add collection dialog */
  onAddCollection: () => void
  /** Callback to open the add group dialog */
  onAddGroup: () => void
  /** Callback to open the tag management dialog */
  onManageTags: () => void
}

/**
 * Left sidebar navigation for the Raindrop.io bookmark manager.
 * Contains system collections (All, Unsorted, Trash), user groups
 * with nested collection trees, and action buttons.
 *
 * @param systemCollections - Pinned system-level collections
 * @param groups - User-created groups containing collections
 * @param selectedCollectionId - Currently active collection ID
 * @param onSelectCollection - Fires when user clicks a collection
 * @param onAddBookmark - Opens the add bookmark dialog
 * @param onAddCollection - Opens the add collection dialog
 * @param onAddGroup - Opens the add group dialog
 * @param onManageTags - Opens the tag management dialog
 *
 * @example
 *   <LeftSidebar
 *     systemCollections={systemCollections}
 *     groups={groups}
 *     selectedCollectionId="all"
 *     onSelectCollection={setSelectedCollectionId}
 *     onAddBookmark={() => setIsAddBookmarkOpen(true)}
 *     onAddCollection={() => setIsCollectionDialogOpen(true)}
 *     onAddGroup={() => setIsGroupDialogOpen(true)}
 *     onManageTags={() => setIsTagManagementOpen(true)}
 *   />
 */
const LeftSidebar = React.memo(function LeftSidebar({
  systemCollections,
  groups,
  selectedCollectionId,
  onSelectCollection,
  onAddBookmark,
  onAddCollection,
  onAddGroup,
  onManageTags,
}: LeftSidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.id)),
  )
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(),
  )
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const handleOpenSearch = useCallback(() => setIsSearchOpen(true), [])
  const handleCloseSearch = useCallback(() => setIsSearchOpen(false), [])
  const handleSearchSelect = useCallback(
    (collectionId: string) => {
      onSelectCollection(collectionId)
      setIsSearchOpen(false)
    },
    [onSelectCollection],
  )

  /**
   * Toggle a group's expanded/collapsed state.
   * @param groupId - The group ID to toggle
   */
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  /**
   * Toggle a collection's expanded/collapsed state (for nested children).
   * @param collectionId - The collection ID to toggle
   */
  const toggleCollection = useCallback((collectionId: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev)
      if (next.has(collectionId)) {
        next.delete(collectionId)
      } else {
        next.add(collectionId)
      }
      return next
    })
  }, [])

  /**
   * Pre-computed indentation styles for collection tree depths.
   */
  const sidebarMenuButtonStyles = useMemo(() => {
    const styles: Record<number, React.CSSProperties> = {}
    for (let d = 0; d <= 5; d++) {
      styles[d] = { paddingLeft: `${12 + d * 16}px` }
    }
    return styles
  }, [])

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-lg">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Lain</span>
          </div>
          <SidebarTrigger className="h-7 w-7" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Quick Actions */}
        <SidebarGroup className="px-3 py-1 group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 flex-1 text-xs"
                  onClick={onAddBookmark}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add Bookmark
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Add a new bookmark</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={handleOpenSearch}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Search collections</TooltipContent>
            </Tooltip>
          </div>
        </SidebarGroup>

        {/* Collection Search */}
        {isSearchOpen && (
          <div className="px-3 pb-1 group-data-[collapsible=icon]:hidden">
            <CollectionSearch
              groups={groups}
              onSelect={handleSearchSelect}
              onClose={handleCloseSearch}
            />
          </div>
        )}

        <ScrollArea className="flex-1">
          {/* System Collections */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground px-3 text-xs font-medium tracking-wider uppercase">
              Library
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemCollections.map((sc) => (
                  <SystemCollectionItem
                    key={sc.id}
                    sc={sc}
                    isSelected={selectedCollectionId === sc.id}
                    onSelectCollection={onSelectCollection}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator className="mx-3 my-1" />

          {/* Groups with Collections */}
          {groups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              isExpanded={expandedGroups.has(group.id)}
              selectedCollectionId={selectedCollectionId}
              expandedCollections={expandedCollections}
              onToggleGroup={toggleGroup}
              onSelectCollection={onSelectCollection}
              onToggleCollection={toggleCollection}
              onAddCollection={onAddCollection}
              sidebarMenuButtonStyles={sidebarMenuButtonStyles}
            />
          ))}
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="border-t p-2 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onAddGroup}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">New Group</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onManageTags}
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Manage Tags</TooltipContent>
            </Tooltip>
          </div>

          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
})
export { LeftSidebar }
export default LeftSidebar
