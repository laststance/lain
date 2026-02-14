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
import { useState } from 'react'

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
 * Map system collection icon name to lucide component.
 * @param iconName - Icon identifier from SystemCollection.icon
 * @returns Corresponding lucide icon component
 * @example getSystemIcon("Inbox") // => Inbox component
 */
function getSystemIcon(iconName: string) {
  const map: Record<string, typeof Inbox> = {
    Inbox,
    FileQuestion,
    Trash2,
  }
  return map[iconName] || Inbox
}

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
export function LeftSidebar({
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

  /**
   * Toggle a group's expanded/collapsed state.
   * @param groupId - The group ID to toggle
   */
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  /**
   * Toggle a collection's expanded/collapsed state (for nested children).
   * @param collectionId - The collection ID to toggle
   */
  const toggleCollection = (collectionId: string) => {
    setExpandedCollections((prev) => {
      const next = new Set(prev)
      if (next.has(collectionId)) {
        next.delete(collectionId)
      } else {
        next.add(collectionId)
      }
      return next
    })
  }

  /**
   * Render a single collection item with optional nested children.
   * @param collection - The collection to render
   * @param depth - Current nesting depth for indentation
   * @returns JSX element for the collection item
   */
  const renderCollection = (collection: Collection, depth: number = 0) => {
    const isSelected = selectedCollectionId === collection.id
    const hasChildren = collection.children && collection.children.length > 0
    const isExpanded = expandedCollections.has(collection.id)

    return (
      <div key={collection.id}>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={isSelected}
            onClick={() => onSelectCollection(collection.id)}
            className="group/collection h-8 w-full"
            style={{ paddingLeft: `${12 + depth * 16}px` }}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleCollection(collection.id)
                  }}
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
            {collection.children!.map((child) =>
              renderCollection(child, depth + 1),
            )}
          </div>
        )}
      </div>
    )
  }

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
                  onClick={() => setIsSearchOpen(true)}
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
              onSelect={(collectionId) => {
                onSelectCollection(collectionId)
                setIsSearchOpen(false)
              }}
              onClose={() => {
                setIsSearchOpen(false)
              }}
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
                {systemCollections.map((sc) => {
                  const Icon = getSystemIcon(sc.icon)
                  const isSelected = selectedCollectionId === sc.id

                  return (
                    <SidebarMenuItem key={sc.id}>
                      <SidebarMenuButton
                        isActive={isSelected}
                        onClick={() => onSelectCollection(sc.id)}
                        className="h-8"
                        tooltip={sc.name}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 truncate">{sc.name}</span>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {sc.count}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator className="mx-3 my-1" />

          {/* Groups with Collections */}
          {groups.map((group) => {
            const isExpanded = expandedGroups.has(group.id)

            return (
              <Collapsible
                key={group.id}
                open={isExpanded}
                onOpenChange={() => toggleGroup(group.id)}
              >
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                          >
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
                        {group.collections.map((collection) =>
                          renderCollection(collection),
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            )
          })}
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
}
