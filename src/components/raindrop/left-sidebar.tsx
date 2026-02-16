import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  ChevronRight,
  FileQuestion,
  FolderPlus,
  Inbox,
  Layers,
  Merge,
  MoreHorizontal,
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-react'
import React, {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from 'react'

import { CollectionSearch } from '@/components/raindrop/collection-search'
import { DragPreview } from '@/components/raindrop/drag-preview'
import { DropIndicator } from '@/components/raindrop/drop-indicator'
import { ThemeToggle } from '@/components/raindrop/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  getCollectionDndId,
  getGroupDndId,
  findRootCollectionLocation,
  moveRootCollection,
  parseCollectionDndId,
  parseGroupDndId,
  updateRootCollection,
} from '@/lib/collection-organization'
import type { Collection, Group, SystemCollection } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Preset colors shown in collection context-menu.
 */
const COLLECTION_COLOR_OPTIONS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
] as const

/**
 * Stable click handler that stops propagation.
 * @param event - Mouse event from nested actions
 */
function stopPropagation(event: React.MouseEvent) {
  event.stopPropagation()
}

/**
 * Remove one root collection from groups.
 * @param groups - Current groups
 * @param collectionId - Collection ID to remove
 * @returns Updated groups
 */
function removeRootCollection(groups: Group[], collectionId: string): Group[] {
  return groups.map((group) => ({
    ...group,
    collections: group.collections.filter(
      (collection) => collection.id !== collectionId,
    ),
  }))
}

/**
 * Serialize root-order structure for optimistic/server sync checks.
 * @param groups - Groups to serialize
 * @returns Stable string for comparison
 */
function serializeRootStructure(groups: Group[]): string {
  return groups
    .map(
      (group) => `${group.id}:${group.collections.map((c) => c.id).join(',')}`,
    )
    .join('|')
}

/**
 * Resolve drop indicator position from the active `over` ID.
 * @param overId - Raw dnd-kit `over.id`
 * @param groups - Current groups
 * @returns Group and insertion index, or null
 */
function resolveDropIndicator(
  overId: unknown,
  groups: Group[],
): { groupId: string; index: number } | null {
  const overCollectionId = parseCollectionDndId(overId)
  if (overCollectionId) {
    const location = findRootCollectionLocation(groups, overCollectionId)
    if (!location) return null
    return { groupId: location.groupId, index: location.index }
  }

  const overGroupId = parseGroupDndId(overId)
  if (overGroupId) {
    const group = groups.find((currentGroup) => currentGroup.id === overGroupId)
    if (!group) return null
    return { groupId: overGroupId, index: group.collections.length }
  }

  return null
}

/**
 * Static map of system collection icon names to lucide components.
 */
const SYSTEM_ICON_MAP: Record<string, typeof Inbox> = {
  Inbox,
  FileQuestion,
  Trash2,
}

/**
 * Render a system icon from a system collection icon key.
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
 * System collection row in the sidebar.
 */
const SystemCollectionItem = React.memo(function SystemCollectionItem({
  collection,
  isSelected,
  onSelectCollection,
  onEmptyTrash,
}: {
  collection: SystemCollection
  isSelected: boolean
  onSelectCollection: (id: string) => void
  onEmptyTrash: () => Promise<void>
}) {
  const handleClick = useCallback(() => {
    onSelectCollection(collection.id)
  }, [collection.id, onSelectCollection])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isSelected}
        onClick={handleClick}
        className="group/syscol h-8"
        tooltip={collection.name}
      >
        <SystemIcon iconName={collection.icon} className="h-4 w-4" />
        <span className="flex-1 truncate">{collection.name}</span>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-muted-foreground text-xs tabular-nums">
            {collection.count}
          </span>
          {collection.id === 'trash' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover/syscol:opacity-100"
                  onClick={stopPropagation}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={onEmptyTrash}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Empty Trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
})

/**
 * Single collection row renderer (supports inline rename and context menu).
 */
const CollectionRow = React.memo(function CollectionRow({
  collection,
  depth,
  selectedCollectionId,
  expandedCollections,
  onSelectCollection,
  onToggleCollection,
  onDeleteCollection,
  onMoveCollectionToGroup,
  onChangeCollectionColor,
  onStartInlineRename,
  onSubmitInlineRename,
  onCancelInlineRename,
  editingCollectionId,
  editingName,
  onEditingNameChange,
  groups,
  sidebarMenuButtonStyles,
  sortable,
  isRoot,
}: {
  collection: Collection
  depth: number
  selectedCollectionId: string
  expandedCollections: Set<string>
  onSelectCollection: (id: string) => void
  onToggleCollection: (id: string) => void
  onDeleteCollection: (collectionId: string) => Promise<void>
  onMoveCollectionToGroup: (
    collectionId: string,
    targetGroupId: string,
  ) => Promise<void>
  onChangeCollectionColor: (
    collectionId: string,
    color: string,
  ) => Promise<void>
  onStartInlineRename: (collection: Collection) => void
  onSubmitInlineRename: (
    collectionId: string,
    nextName: string,
  ) => Promise<void>
  onCancelInlineRename: () => void
  editingCollectionId: string | null
  editingName: string
  onEditingNameChange: (nextName: string) => void
  groups: Group[]
  sidebarMenuButtonStyles: Record<number, CSSProperties>
  sortable?: {
    setNodeRef: (node: HTMLElement | null) => void
    attributes: DraggableAttributes
    listeners?: DraggableSyntheticListeners
    style: CSSProperties
    isDragging: boolean
  }
  isRoot: boolean
}) {
  const isSelected = selectedCollectionId === collection.id
  const hasChildren = (collection.children?.length ?? 0) > 0
  const isExpanded = expandedCollections.has(collection.id)
  const isEditing = editingCollectionId === collection.id

  const handleSelect = useCallback(() => {
    onSelectCollection(collection.id)
  }, [collection.id, onSelectCollection])

  function handleToggle(event: React.MouseEvent) {
    event.stopPropagation()
    onToggleCollection(collection.id)
  }

  function handleDoubleClick(event: React.MouseEvent) {
    if (!isRoot) return
    event.stopPropagation()
    onStartInlineRename(collection)
  }

  const handleSubmitRename = useCallback(async () => {
    await onSubmitInlineRename(collection.id, editingName)
  }, [collection.id, editingName, onSubmitInlineRename])

  const handleContextRename = useCallback(() => {
    onStartInlineRename(collection)
  }, [collection, onStartInlineRename])

  const handleContextDelete = useCallback(() => {
    void onDeleteCollection(collection.id)
  }, [collection.id, onDeleteCollection])

  const moveToGroupHandlers = useMemo(() => {
    return new Map(
      groups.map((group) => {
        const handler = () => {
          void onMoveCollectionToGroup(collection.id, group.id)
        }
        return [group.id, handler]
      }),
    )
  }, [collection.id, groups, onMoveCollectionToGroup])

  const colorHandlers = useMemo(() => {
    return new Map(
      COLLECTION_COLOR_OPTIONS.map((color) => {
        const handler = () => {
          void onChangeCollectionColor(collection.id, color)
        }
        return [color, handler]
      }),
    )
  }, [collection.id, onChangeCollectionColor])

  const row = (
    <div
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      data-testid={isRoot ? `sidebar-collection-${collection.id}` : undefined}
      className={cn(sortable?.isDragging && 'opacity-50')}
    >
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isSelected}
          onClick={handleSelect}
          className="group/collection h-8 w-full"
          style={
            sidebarMenuButtonStyles[depth] || {
              paddingLeft: `${12 + depth * 16}px`,
            }
          }
          {...(sortable?.attributes ?? {})}
          {...(sortable?.listeners ?? {})}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={handleToggle}
                className="hover:bg-accent/50 shrink-0 rounded p-0.5"
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
              data-testid={`collection-color-${collection.id}`}
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: collection.color || '#8b5cf6' }}
            />

            {isEditing ? (
              <input
                value={editingName}
                onChange={(event) => onEditingNameChange(event.target.value)}
                onClick={stopPropagation}
                onBlur={() => {
                  void handleSubmitRename()
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void handleSubmitRename()
                  }
                  if (event.key === 'Escape') {
                    onCancelInlineRename()
                  }
                }}
                autoFocus
                className="bg-background h-6 min-w-0 flex-1 rounded border px-1.5 text-sm outline-none"
              />
            ) : (
              <span
                className="truncate text-sm"
                onDoubleClick={handleDoubleClick}
                title={collection.name}
              >
                {collection.name}
              </span>
            )}
          </div>

          <span className="text-muted-foreground text-xs tabular-nums opacity-0 transition-opacity group-hover/collection:opacity-100">
            {collection.count}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </div>
  )

  const maybeContextMenu = isRoot ? (
    <ContextMenu>
      <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleContextRename}>Rename</ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={handleContextDelete}>
          Delete
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Move to Group</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {groups.map((group) => (
              <ContextMenuItem
                key={group.id}
                disabled={group.id === collection.groupId}
                onClick={moveToGroupHandlers.get(group.id)}
              >
                {group.name}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Change Color</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-40">
            {COLLECTION_COLOR_OPTIONS.map((color) => (
              <ContextMenuItem key={color} onClick={colorHandlers.get(color)}>
                <span
                  className="mr-2 inline-block h-3 w-3 rounded-sm border"
                  style={{ backgroundColor: color }}
                />
                {color}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  ) : (
    row
  )

  return (
    <div>
      {maybeContextMenu}
      {hasChildren && isExpanded && (
        <div>
          {collection.children?.map((childCollection) => (
            <CollectionRow
              key={childCollection.id}
              collection={childCollection}
              depth={depth + 1}
              selectedCollectionId={selectedCollectionId}
              expandedCollections={expandedCollections}
              onSelectCollection={onSelectCollection}
              onToggleCollection={onToggleCollection}
              onDeleteCollection={onDeleteCollection}
              onMoveCollectionToGroup={onMoveCollectionToGroup}
              onChangeCollectionColor={onChangeCollectionColor}
              onStartInlineRename={onStartInlineRename}
              onSubmitInlineRename={onSubmitInlineRename}
              onCancelInlineRename={onCancelInlineRename}
              editingCollectionId={editingCollectionId}
              editingName={editingName}
              onEditingNameChange={onEditingNameChange}
              groups={groups}
              sidebarMenuButtonStyles={sidebarMenuButtonStyles}
              isRoot={false}
            />
          ))}
        </div>
      )}
    </div>
  )
})

/**
 * Sortable root collection row wrapper.
 */
const SortableRootCollectionRow = React.memo(
  function SortableRootCollectionRow({
    collection,
    selectedCollectionId,
    expandedCollections,
    onSelectCollection,
    onToggleCollection,
    onDeleteCollection,
    onMoveCollectionToGroup,
    onChangeCollectionColor,
    onStartInlineRename,
    onSubmitInlineRename,
    onCancelInlineRename,
    editingCollectionId,
    editingName,
    onEditingNameChange,
    groups,
    sidebarMenuButtonStyles,
  }: {
    collection: Collection
    selectedCollectionId: string
    expandedCollections: Set<string>
    onSelectCollection: (id: string) => void
    onToggleCollection: (id: string) => void
    onDeleteCollection: (collectionId: string) => Promise<void>
    onMoveCollectionToGroup: (
      collectionId: string,
      targetGroupId: string,
    ) => Promise<void>
    onChangeCollectionColor: (
      collectionId: string,
      color: string,
    ) => Promise<void>
    onStartInlineRename: (collection: Collection) => void
    onSubmitInlineRename: (
      collectionId: string,
      nextName: string,
    ) => Promise<void>
    onCancelInlineRename: () => void
    editingCollectionId: string | null
    editingName: string
    onEditingNameChange: (nextName: string) => void
    groups: Group[]
    sidebarMenuButtonStyles: Record<number, CSSProperties>
  }) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: getCollectionDndId(collection.id),
      data: { collectionId: collection.id, groupId: collection.groupId },
    })

    const style = useMemo<CSSProperties>(() => {
      return {
        transform: CSS.Transform.toString(transform),
        transition,
      }
    }, [transform, transition])

    const sortableProps = useMemo(
      () => ({
        setNodeRef,
        attributes,
        listeners: listeners ?? undefined,
        style,
        isDragging,
      }),
      [attributes, isDragging, listeners, setNodeRef, style],
    )

    return (
      <CollectionRow
        collection={collection}
        depth={0}
        selectedCollectionId={selectedCollectionId}
        expandedCollections={expandedCollections}
        onSelectCollection={onSelectCollection}
        onToggleCollection={onToggleCollection}
        onDeleteCollection={onDeleteCollection}
        onMoveCollectionToGroup={onMoveCollectionToGroup}
        onChangeCollectionColor={onChangeCollectionColor}
        onStartInlineRename={onStartInlineRename}
        onSubmitInlineRename={onSubmitInlineRename}
        onCancelInlineRename={onCancelInlineRename}
        editingCollectionId={editingCollectionId}
        editingName={editingName}
        onEditingNameChange={onEditingNameChange}
        groups={groups}
        sidebarMenuButtonStyles={sidebarMenuButtonStyles}
        isRoot
        sortable={sortableProps}
      />
    )
  },
)

/**
 * One group section with sortable root collections.
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
  onDeleteCollection,
  onMoveCollectionToGroup,
  onChangeCollectionColor,
  onStartInlineRename,
  onSubmitInlineRename,
  onCancelInlineRename,
  editingCollectionId,
  editingName,
  onEditingNameChange,
  sidebarMenuButtonStyles,
  groups,
  dropIndicator,
}: {
  group: Group
  isExpanded: boolean
  selectedCollectionId: string
  expandedCollections: Set<string>
  onToggleGroup: (groupId: string) => void
  onSelectCollection: (collectionId: string) => void
  onToggleCollection: (collectionId: string) => void
  onAddCollection: () => void
  onDeleteCollection: (collectionId: string) => Promise<void>
  onMoveCollectionToGroup: (
    collectionId: string,
    targetGroupId: string,
  ) => Promise<void>
  onChangeCollectionColor: (
    collectionId: string,
    color: string,
  ) => Promise<void>
  onStartInlineRename: (collection: Collection) => void
  onSubmitInlineRename: (
    collectionId: string,
    nextName: string,
  ) => Promise<void>
  onCancelInlineRename: () => void
  editingCollectionId: string | null
  editingName: string
  onEditingNameChange: (nextName: string) => void
  sidebarMenuButtonStyles: Record<number, CSSProperties>
  groups: Group[]
  dropIndicator: { groupId: string; index: number } | null
}) {
  const handleOpenChange = useCallback(() => {
    onToggleGroup(group.id)
  }, [group.id, onToggleGroup])

  const sortableIds = useMemo(() => {
    return group.collections.map((collection) =>
      getCollectionDndId(collection.id),
    )
  }, [group.collections])

  const { setNodeRef } = useDroppable({
    id: getGroupDndId(group.id),
    data: { groupId: group.id },
  })

  return (
    <Collapsible open={isExpanded} onOpenChange={handleOpenChange}>
      <SidebarGroup data-testid={`sidebar-group-${group.id}`}>
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
                <DropdownMenuItem className="text-destructive" disabled>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Group
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <CollapsibleContent>
          <div ref={setNodeRef}>
            <SidebarGroupContent>
              <SortableContext
                items={sortableIds}
                strategy={verticalListSortingStrategy}
              >
                <SidebarMenu>
                  {group.collections.map((collection, index) => (
                    <React.Fragment key={collection.id}>
                      {dropIndicator?.groupId === group.id &&
                        dropIndicator.index === index && (
                          <DropIndicator
                            isActive
                            position="before"
                            data-testid={`drop-indicator-${group.id}-${index}`}
                          />
                        )}
                      <SortableRootCollectionRow
                        collection={collection}
                        selectedCollectionId={selectedCollectionId}
                        expandedCollections={expandedCollections}
                        onSelectCollection={onSelectCollection}
                        onToggleCollection={onToggleCollection}
                        onDeleteCollection={onDeleteCollection}
                        onMoveCollectionToGroup={onMoveCollectionToGroup}
                        onChangeCollectionColor={onChangeCollectionColor}
                        onStartInlineRename={onStartInlineRename}
                        onSubmitInlineRename={onSubmitInlineRename}
                        onCancelInlineRename={onCancelInlineRename}
                        editingCollectionId={editingCollectionId}
                        editingName={editingName}
                        onEditingNameChange={onEditingNameChange}
                        groups={groups}
                        sidebarMenuButtonStyles={sidebarMenuButtonStyles}
                      />
                    </React.Fragment>
                  ))}
                  {dropIndicator?.groupId === group.id &&
                    dropIndicator.index === group.collections.length && (
                      <DropIndicator
                        isActive
                        position="after"
                        data-testid={`drop-indicator-${group.id}-end`}
                      />
                    )}
                </SidebarMenu>
              </SortableContext>
            </SidebarGroupContent>
          </div>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
})

/**
 * Props for LeftSidebar.
 */
interface LeftSidebarProps {
  systemCollections: SystemCollection[]
  groups: Group[]
  selectedCollectionId: string
  onSelectCollection: (id: string) => void
  onAddBookmark: () => void
  onAddCollection: () => void
  onAddGroup: () => void
  onManageTags: () => void
  onDeleteCollection: (collectionId: string) => Promise<void>
  onEmptyTrash: () => Promise<void>
  onMergeCollections: () => void
  onPersistGroups: (groups: Group[]) => Promise<void>
  onRenameCollection: (collectionId: string, title: string) => Promise<void>
  onChangeCollectionColor: (
    collectionId: string,
    color: string,
  ) => Promise<void>
}

/**
 * Left sidebar navigation with system collections, grouped collections, and DnD.
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
  onDeleteCollection,
  onEmptyTrash,
  onMergeCollections,
  onPersistGroups,
  onRenameCollection,
  onChangeCollectionColor,
}: LeftSidebarProps) {
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(
    new Set(),
  )
  const [expandedCollections, setExpandedCollections] = useState<Set<string>>(
    new Set(),
  )
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [optimisticGroups, setOptimisticGroups] = useState<Group[] | null>(null)
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(
    null,
  )
  const [editingName, setEditingName] = useState('')
  const [activeDragCollectionId, setActiveDragCollectionId] = useState<
    string | null
  >(null)
  const [dropIndicator, setDropIndicator] = useState<{
    groupId: string
    index: number
  } | null>(null)

  const displayedGroups = useMemo(() => {
    if (!optimisticGroups) return groups
    if (
      serializeRootStructure(optimisticGroups) ===
      serializeRootStructure(groups)
    ) {
      return groups
    }
    return optimisticGroups
  }, [groups, optimisticGroups])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  const handleSearchSelect = useCallback(
    (collectionId: string) => {
      onSelectCollection(collectionId)
      setIsSearchOpen(false)
    },
    [onSelectCollection],
  )

  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroupIds((previous) => {
      const next = new Set(previous)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  const toggleCollection = useCallback((collectionId: string) => {
    setExpandedCollections((previous) => {
      const next = new Set(previous)
      if (next.has(collectionId)) {
        next.delete(collectionId)
      } else {
        next.add(collectionId)
      }
      return next
    })
  }, [])

  const sidebarMenuButtonStyles = useMemo(() => {
    const styles: Record<number, CSSProperties> = {}
    for (let depth = 0; depth <= 5; depth += 1) {
      styles[depth] = { paddingLeft: `${12 + depth * 16}px` }
    }
    return styles
  }, [])

  const activeDragCollection = useMemo(() => {
    if (!activeDragCollectionId) return undefined
    for (const group of displayedGroups) {
      const found = group.collections.find(
        (collection) => collection.id === activeDragCollectionId,
      )
      if (found) return found
    }
    return undefined
  }, [activeDragCollectionId, displayedGroups])

  const handlePersistGroups = useCallback(
    async (nextGroups: Group[], previousGroups: Group[]) => {
      setOptimisticGroups(nextGroups)
      try {
        await onPersistGroups(nextGroups)
      } catch {
        setOptimisticGroups(previousGroups)
      }
    },
    [onPersistGroups],
  )

  const handleMoveCollectionToGroup = useCallback(
    async (collectionId: string, targetGroupId: string) => {
      const previousGroups = displayedGroups
      const targetGroup = previousGroups.find(
        (group) => group.id === targetGroupId,
      )
      if (!targetGroup) return

      const nextGroups = moveRootCollection(
        previousGroups,
        collectionId,
        targetGroupId,
        targetGroup.collections.length,
      )
      if (
        serializeRootStructure(previousGroups) ===
        serializeRootStructure(nextGroups)
      ) {
        return
      }
      await handlePersistGroups(nextGroups, previousGroups)
    },
    [displayedGroups, handlePersistGroups],
  )

  const handleDeleteWithOptimistic = useCallback(
    async (collectionId: string) => {
      const previousGroups = displayedGroups
      const nextGroups = removeRootCollection(previousGroups, collectionId)
      setOptimisticGroups(nextGroups)
      try {
        await onDeleteCollection(collectionId)
      } catch {
        setOptimisticGroups(previousGroups)
      }
    },
    [displayedGroups, onDeleteCollection],
  )

  const handleStartInlineRename = useCallback((collection: Collection) => {
    setEditingCollectionId(collection.id)
    setEditingName(collection.name)
  }, [])

  const handleEditingNameChange = useCallback((nextName: string) => {
    setEditingName(nextName)
  }, [])

  const handleCancelInlineRename = useCallback(() => {
    setEditingCollectionId(null)
    setEditingName('')
  }, [])

  const handleSubmitInlineRename = useCallback(
    async (collectionId: string, nextName: string) => {
      const trimmedName = nextName.trim()
      if (!trimmedName) {
        handleCancelInlineRename()
        return
      }

      const previousGroups = displayedGroups
      const nextGroups = updateRootCollection(
        previousGroups,
        collectionId,
        (item) => ({
          ...item,
          name: trimmedName,
        }),
      )

      setOptimisticGroups(nextGroups)
      setEditingCollectionId(null)
      setEditingName('')

      try {
        await onRenameCollection(collectionId, trimmedName)
      } catch {
        setOptimisticGroups(previousGroups)
      }
    },
    [displayedGroups, handleCancelInlineRename, onRenameCollection],
  )

  const handleChangeColor = useCallback(
    async (collectionId: string, color: string) => {
      const previousGroups = displayedGroups
      const nextGroups = updateRootCollection(
        previousGroups,
        collectionId,
        (item) => ({
          ...item,
          color,
        }),
      )
      setOptimisticGroups(nextGroups)

      try {
        await onChangeCollectionColor(collectionId, color)
      } catch {
        setOptimisticGroups(previousGroups)
      }
    },
    [displayedGroups, onChangeCollectionColor],
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setEditingCollectionId(null)
    setEditingName('')
    setActiveDragCollectionId(parseCollectionDndId(event.active.id))
  }, [])

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      setDropIndicator(resolveDropIndicator(event.over?.id, displayedGroups))
    },
    [displayedGroups],
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const activeCollectionId = parseCollectionDndId(event.active.id)
      const dropTarget = resolveDropIndicator(event.over?.id, displayedGroups)

      setActiveDragCollectionId(null)
      setDropIndicator(null)

      if (!activeCollectionId || !dropTarget) return

      const sourceLocation = findRootCollectionLocation(
        displayedGroups,
        activeCollectionId,
      )
      if (!sourceLocation) return

      let toIndex = dropTarget.index
      if (
        sourceLocation.groupId === dropTarget.groupId &&
        sourceLocation.index < dropTarget.index
      ) {
        toIndex -= 1
      }

      const nextGroups = moveRootCollection(
        displayedGroups,
        activeCollectionId,
        dropTarget.groupId,
        toIndex,
      )
      if (
        serializeRootStructure(displayedGroups) ===
        serializeRootStructure(nextGroups)
      ) {
        return
      }

      await handlePersistGroups(nextGroups, displayedGroups)
    },
    [displayedGroups, handlePersistGroups],
  )

  const handleDragCancel = useCallback(() => {
    setActiveDragCollectionId(null)
    setDropIndicator(null)
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
                  className="h-8 w-8 shrink-0"
                  onClick={handleOpenSearch}
                >
                  <Search className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Search collections</TooltipContent>
            </Tooltip>
          </div>
        </SidebarGroup>

        {isSearchOpen && (
          <div className="px-3 pb-1 group-data-[collapsible=icon]:hidden">
            <CollectionSearch
              groups={displayedGroups}
              onSelect={handleSearchSelect}
              onClose={handleCloseSearch}
            />
          </div>
        )}

        <ScrollArea className="flex-1">
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground px-3 text-xs font-medium tracking-wider uppercase">
              Library
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {systemCollections.map((collection) => (
                  <SystemCollectionItem
                    key={collection.id}
                    collection={collection}
                    isSelected={selectedCollectionId === collection.id}
                    onSelectCollection={onSelectCollection}
                    onEmptyTrash={onEmptyTrash}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator className="mx-3 my-1" />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            {displayedGroups.map((group) => (
              <GroupSection
                key={group.id}
                group={group}
                isExpanded={!collapsedGroupIds.has(group.id)}
                selectedCollectionId={selectedCollectionId}
                expandedCollections={expandedCollections}
                onToggleGroup={toggleGroup}
                onSelectCollection={onSelectCollection}
                onToggleCollection={toggleCollection}
                onAddCollection={onAddCollection}
                onDeleteCollection={handleDeleteWithOptimistic}
                onMoveCollectionToGroup={handleMoveCollectionToGroup}
                onChangeCollectionColor={handleChangeColor}
                onStartInlineRename={handleStartInlineRename}
                onSubmitInlineRename={handleSubmitInlineRename}
                onCancelInlineRename={handleCancelInlineRename}
                editingCollectionId={editingCollectionId}
                editingName={editingName}
                onEditingNameChange={handleEditingNameChange}
                sidebarMenuButtonStyles={sidebarMenuButtonStyles}
                groups={displayedGroups}
                dropIndicator={dropIndicator}
              />
            ))}
            <DragOverlay>
              <DragPreview collection={activeDragCollection} />
            </DragOverlay>
          </DndContext>
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onMergeCollections}
                >
                  <Merge className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Merge Collections</TooltipContent>
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
