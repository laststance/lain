import React, { useState, useEffect, useCallback } from 'react'

import { AddBookmarkDialog } from '@/components/raindrop/add-bookmark-dialog'
import { CollectionDialog } from '@/components/raindrop/collection-dialog'
import { GlobalSearchCommand } from '@/components/raindrop/global-search-command'
import { GroupDialog } from '@/components/raindrop/group-dialog'
import { LeftSidebar } from '@/components/raindrop/left-sidebar'
import { MainContent } from '@/components/raindrop/main-content'
import { RightDetailPanel } from '@/components/raindrop/right-detail-panel'
import { TagManagement } from '@/components/raindrop/tag-management'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'
import { systemCollections, groups, mockRaindrops } from '@/data/mock-data'
import type { Raindrop, Group, Collection } from '@/lib/types'

/**
 * Custom hook for the global search shortcut (Cmd+K / Ctrl+K).
 *
 * @param onOpen - Callback fired when the shortcut is triggered
 */
function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpen])
}

/**
 * Main authenticated app view — 3-panel layout with sidebar, content, and detail.
 * Replaces the old UserProfile component after successful OAuth login.
 *
 * @example
 *   // Used in App.tsx after auth check
 *   if (isAuthenticated) return <MainApp />
 */
export const MainApp = React.memo(function MainApp() {
  const [selectedCollectionId, setSelectedCollectionId] =
    useState<string>('all')
  const [selectedRaindrop, setSelectedRaindrop] = useState<
    Raindrop | undefined
  >()
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [selectedRaindropIds, setSelectedRaindropIds] = useState<Set<string>>(
    new Set(),
  )

  // Dialog states
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false)
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false)
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState<
    Collection | undefined
  >()
  const [editingGroup, setEditingGroup] = useState<Group | undefined>()

  const currentRaindrops = mockRaindrops

  const allTags = Array.from(
    new Set(mockRaindrops.flatMap((r) => r.tags || [])),
  ).map((tag) => ({
    name: tag,
    count: mockRaindrops.filter((r) => r.tags?.includes(tag)).length,
  }))

  const getBreadcrumbs = (): string[] => {
    if (selectedCollectionId === 'all') return ['All Bookmarks']
    if (selectedCollectionId === 'unsorted') return ['Unsorted']
    if (selectedCollectionId === 'trash') return ['Trash']

    const findCollectionPath = (
      collections: Collection[],
      targetId: string,
      path: string[] = [],
    ): string[] | null => {
      for (const collection of collections) {
        const currentPath = [...path, collection.name]
        if (collection.id === targetId) return currentPath
        if (collection.children) {
          const childPath = findCollectionPath(
            collection.children,
            targetId,
            currentPath,
          )
          if (childPath) return childPath
        }
      }
      return null
    }

    for (const group of groups) {
      const collectionPath = findCollectionPath(
        group.collections,
        selectedCollectionId,
      )
      if (collectionPath) return [group.name, ...collectionPath]
    }

    return ['Unknown']
  }

  const handleSelectRaindrop = useCallback((raindrop: Raindrop) => {
    setSelectedRaindrop(raindrop)
    setIsDetailPanelOpen(true)
  }, [])

  // CRUD handlers (mock — will connect to Raindrop.io API later)
  const handleSaveBookmark = useCallback((bookmark: unknown) => {
    console.log('Save bookmark:', bookmark)
  }, [])

  const handleSaveRaindrop = useCallback((raindrop: Raindrop) => {
    console.log('Update raindrop:', raindrop)
  }, [])

  const handleDeleteRaindrop = useCallback((raindropId: string) => {
    console.log('Delete raindrop:', raindropId)
  }, [])

  const handleSaveCollection = useCallback((collection: unknown) => {
    console.log('Save collection:', collection)
    setEditingCollection(undefined)
  }, [])

  const handleSaveGroup = useCallback((group: unknown) => {
    console.log('Save group:', group)
    setEditingGroup(undefined)
  }, [])

  const handleRenameTag = useCallback((oldName: string, newName: string) => {
    console.log('Rename tag:', oldName, 'to', newName)
  }, [])

  const handleDeleteTag = useCallback((tagName: string) => {
    console.log('Delete tag:', tagName)
  }, [])

  const handleMergeTags = useCallback(
    (sourceTags: string[], targetTag: string) => {
      console.log('Merge tags:', sourceTags, 'into', targetTag)
    },
    [],
  )

  // Inline callback extractions
  const handleAddBookmark = useCallback(() => {
    setIsAddBookmarkOpen(true)
  }, [])

  const handleAddCollection = useCallback(() => {
    setEditingCollection(undefined)
    setIsCollectionDialogOpen(true)
  }, [])

  const handleAddGroup = useCallback(() => {
    setEditingGroup(undefined)
    setIsGroupDialogOpen(true)
  }, [])

  const handleManageTags = useCallback(() => {
    setIsTagManagementOpen(true)
  }, [])

  const handleCloseDetailPanel = useCallback(() => {
    setIsDetailPanelOpen(false)
  }, [])

  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  // Global search shortcut (Cmd+K)
  useGlobalSearchShortcut(handleOpenSearch)

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-screen overflow-hidden">
        <LeftSidebar
          systemCollections={systemCollections}
          groups={groups}
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={setSelectedCollectionId}
          onAddBookmark={handleAddBookmark}
          onAddCollection={handleAddCollection}
          onAddGroup={handleAddGroup}
          onManageTags={handleManageTags}
        />

        <SidebarInset className="flex-1">
          <MainContent
            breadcrumbs={getBreadcrumbs()}
            raindrops={currentRaindrops}
            onSelectRaindrop={handleSelectRaindrop}
            selectedRaindropId={selectedRaindrop?.id}
            selectedRaindropIds={selectedRaindropIds}
            onSelectedRaindropIdsChange={setSelectedRaindropIds}
            groups={groups}
            collections={groups.flatMap((g) => g.collections)}
            onAddBookmark={handleAddBookmark}
          />
        </SidebarInset>

        <RightDetailPanel
          raindrop={selectedRaindrop}
          isOpen={isDetailPanelOpen}
          onClose={handleCloseDetailPanel}
          groups={groups}
          existingTags={allTags.map((t) => t.name)}
          onSave={handleSaveRaindrop}
          onDelete={handleDeleteRaindrop}
        />

        <GlobalSearchCommand
          open={isSearchOpen}
          onOpenChange={setIsSearchOpen}
          raindrops={mockRaindrops}
          onSelectRaindrop={handleSelectRaindrop}
          onSelectCollection={setSelectedCollectionId}
          groups={groups}
          collections={groups.flatMap((g) => g.collections)}
          currentCollectionId={selectedCollectionId}
        />

        <AddBookmarkDialog
          open={isAddBookmarkOpen}
          onOpenChange={setIsAddBookmarkOpen}
          groups={groups}
          existingTags={allTags.map((t) => t.name)}
          defaultCollectionId={
            selectedCollectionId !== 'all' ? selectedCollectionId : undefined
          }
          onSave={handleSaveBookmark}
        />

        <CollectionDialog
          open={isCollectionDialogOpen}
          onOpenChange={setIsCollectionDialogOpen}
          groups={groups}
          collection={editingCollection}
          onSave={handleSaveCollection}
        />

        <GroupDialog
          open={isGroupDialogOpen}
          onOpenChange={setIsGroupDialogOpen}
          group={editingGroup}
          onSave={handleSaveGroup}
        />

        <TagManagement
          open={isTagManagementOpen}
          onOpenChange={setIsTagManagementOpen}
          tags={allTags}
          onRename={handleRenameTag}
          onDelete={handleDeleteTag}
          onMerge={handleMergeTags}
        />
      </div>
      <Toaster />
    </SidebarProvider>
  )
})
