import React, { useCallback, useEffect, useMemo, useState } from 'react'

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
import { useCollectionsCrud } from '@/hooks/useCollectionsCrud'
import { useRaindropsCrud } from '@/hooks/useRaindropsCrud'
import { useSidebarData } from '@/hooks/useSidebarData'
import { useTagsCrud } from '@/hooks/useTagsCrud'
import type { Collection, Raindrop } from '@/lib/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  closeAddBookmark,
  closeCollectionDialog,
  closeGroupDialog,
  closeTagManagement,
  openAddBookmark,
  openCollectionDialog,
  openGroupDialog,
  openTagManagement,
} from '@/store/slices/dialogSlice'
import { setSearchOpen } from '@/store/slices/searchSlice'
import {
  setDetailPanelOpen,
  setSelectedCollectionId,
  setSelectedRaindropIds,
} from '@/store/slices/uiSlice'

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
 * Connects all UI components to the Raindrop.io API via RTK Query hooks and
 * Redux slices. Replaces mock data with real API data.
 *
 * @example
 *   // Used in App.tsx after auth check
 *   if (isAuthenticated) return <MainApp />
 */
export const MainApp = React.memo(function MainApp() {
  const dispatch = useAppDispatch()

  // --- Redux State ---
  const selectedCollectionId = useAppSelector((s) => s.ui.selectedCollectionId)
  const isDetailPanelOpen = useAppSelector((s) => s.ui.isDetailPanelOpen)
  const selectedRaindropIds = useAppSelector((s) => s.ui.selectedRaindropIds)
  const isSearchOpen = useAppSelector((s) => s.search.isSearchOpen)
  const isAddBookmarkOpen = useAppSelector((s) => s.dialog.addBookmark.open)
  const isCollectionDialogOpen = useAppSelector(
    (s) => s.dialog.collectionDialog.open,
  )
  const isGroupDialogOpen = useAppSelector((s) => s.dialog.groupDialog.open)
  const isTagManagementOpen = useAppSelector((s) => s.dialog.tagManagement.open)

  // --- Data Hooks ---
  const {
    groups,
    systemCollections,
    isLoading: isSidebarLoading,
  } = useSidebarData()

  const {
    raindrops,
    isLoading: isRaindropsLoading,
    isFetching: isRaindropsFetching,
    hasMore,
    loadMore,
    createRaindrop,
    updateRaindrop,
    deleteRaindrop,
  } = useRaindropsCrud({ collectionId: selectedCollectionId })

  const { tags: allTags, renameTag, deleteTag } = useTagsCrud()
  const { createCollection: saveCollection } = useCollectionsCrud()

  // --- Local State (ephemeral UI only) ---
  const [selectedRaindrop, setSelectedRaindrop] = useState<
    Raindrop | undefined
  >()

  // Bridge: string[] (Redux) → Set<string> (MainContent expects Set until Phase 2.4)
  const selectedRaindropIdsSet = useMemo(
    () => new Set(selectedRaindropIds),
    [selectedRaindropIds],
  )

  // --- Breadcrumbs ---
  const breadcrumbs = useMemo(() => {
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
  }, [selectedCollectionId, groups])

  // --- Event Handlers ---
  const handleSelectCollection = useCallback(
    (id: string) => dispatch(setSelectedCollectionId(id)),
    [dispatch],
  )

  const handleSelectRaindrop = useCallback(
    (raindrop: Raindrop) => {
      setSelectedRaindrop(raindrop)
      dispatch(setDetailPanelOpen(true))
    },
    [dispatch],
  )

  const handleSelectedIdsChange = useCallback(
    (ids: Set<string>) => dispatch(setSelectedRaindropIds([...ids])),
    [dispatch],
  )

  const handleCloseDetailPanel = useCallback(
    () => dispatch(setDetailPanelOpen(false)),
    [dispatch],
  )

  const handleSearchOpenChange = useCallback(
    (open: boolean) => dispatch(setSearchOpen(open)),
    [dispatch],
  )

  const handleOpenSearch = useCallback(
    () => dispatch(setSearchOpen(true)),
    [dispatch],
  )

  // --- CRUD Handlers ---
  const handleSaveBookmark = useCallback(
    (bookmark: unknown) => {
      const data = bookmark as {
        url?: string
        title?: string
        description?: string
        tags?: string[]
        collectionId?: string
      }
      if (data.url) {
        createRaindrop({
          url: data.url,
          title: data.title,
          description: data.description,
          tags: data.tags,
          collectionId: data.collectionId,
        })
      }
    },
    [createRaindrop],
  )

  const handleSaveRaindrop = useCallback(
    async (raindrop: Raindrop) => updateRaindrop(raindrop.id, raindrop),
    [updateRaindrop],
  )

  const handleDeleteRaindrop = useCallback(
    (raindropId: string) => {
      deleteRaindrop(raindropId)
      dispatch(setDetailPanelOpen(false))
    },
    [deleteRaindrop, dispatch],
  )

  const handleSaveCollection = useCallback(
    (collection: unknown) => {
      const data = collection as { title?: string }
      if (data.title) saveCollection({ title: data.title })
      dispatch(closeCollectionDialog())
    },
    [saveCollection, dispatch],
  )

  const handleSaveGroup = useCallback(
    (_group: unknown) => {
      dispatch(closeGroupDialog())
    },
    [dispatch],
  )

  const handleRenameTag = useCallback(
    async (oldName: string, newName: string) =>
      renameTag(selectedCollectionId, oldName, newName),
    [renameTag, selectedCollectionId],
  )

  const handleDeleteTag = useCallback(
    async (tagName: string) => deleteTag(selectedCollectionId, [tagName]),
    [deleteTag, selectedCollectionId],
  )

  const handleMergeTags = useCallback(
    async (sourceTags: string[], targetTag: string) =>
      renameTag(selectedCollectionId, sourceTags[0], targetTag),
    [renameTag, selectedCollectionId],
  )

  // --- Dialog Openers ---
  const handleAddBookmark = useCallback(
    () =>
      dispatch(
        openAddBookmark(
          selectedCollectionId !== 'all'
            ? { defaultCollectionId: selectedCollectionId }
            : undefined,
        ),
      ),
    [dispatch, selectedCollectionId],
  )

  const handleAddCollection = useCallback(
    () => dispatch(openCollectionDialog()),
    [dispatch],
  )

  const handleAddGroup = useCallback(
    () => dispatch(openGroupDialog()),
    [dispatch],
  )

  const handleManageTags = useCallback(
    () => dispatch(openTagManagement()),
    [dispatch],
  )

  // --- Dialog Close Handlers ---
  const handleAddBookmarkOpenChange = useCallback(
    (open: boolean) => {
      if (!open) dispatch(closeAddBookmark())
    },
    [dispatch],
  )

  const handleCollectionDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) dispatch(closeCollectionDialog())
    },
    [dispatch],
  )

  const handleGroupDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) dispatch(closeGroupDialog())
    },
    [dispatch],
  )

  const handleTagManagementOpenChange = useCallback(
    (open: boolean) => {
      if (!open) dispatch(closeTagManagement())
    },
    [dispatch],
  )

  // Global search shortcut (Cmd+K)
  useGlobalSearchShortcut(handleOpenSearch)

  // Loading skeleton while sidebar data loads
  if (isSidebarLoading) {
    return (
      <SidebarProvider defaultOpen>
        <div className="flex h-screen w-screen items-center justify-center">
          <div className="text-muted-foreground animate-pulse">Loading...</div>
        </div>
        <Toaster />
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen w-screen overflow-hidden">
        <LeftSidebar
          systemCollections={systemCollections}
          groups={groups}
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={handleSelectCollection}
          onAddBookmark={handleAddBookmark}
          onAddCollection={handleAddCollection}
          onAddGroup={handleAddGroup}
          onManageTags={handleManageTags}
        />

        <SidebarInset className="flex-1">
          <MainContent
            breadcrumbs={breadcrumbs}
            raindrops={raindrops}
            isLoading={isRaindropsLoading}
            isFetching={isRaindropsFetching}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onSelectRaindrop={handleSelectRaindrop}
            selectedRaindropId={selectedRaindrop?.id}
            selectedRaindropIds={selectedRaindropIdsSet}
            onSelectedRaindropIdsChange={handleSelectedIdsChange}
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
          onOpenChange={handleSearchOpenChange}
          raindrops={raindrops}
          onSelectRaindrop={handleSelectRaindrop}
          onSelectCollection={handleSelectCollection}
          groups={groups}
          collections={groups.flatMap((g) => g.collections)}
          currentCollectionId={selectedCollectionId}
        />

        <AddBookmarkDialog
          open={isAddBookmarkOpen}
          onOpenChange={handleAddBookmarkOpenChange}
          groups={groups}
          existingTags={allTags.map((t) => t.name)}
          defaultCollectionId={
            selectedCollectionId !== 'all' ? selectedCollectionId : undefined
          }
          onSave={handleSaveBookmark}
        />

        <CollectionDialog
          open={isCollectionDialogOpen}
          onOpenChange={handleCollectionDialogOpenChange}
          groups={groups}
          collection={undefined}
          onSave={handleSaveCollection}
        />

        <GroupDialog
          open={isGroupDialogOpen}
          onOpenChange={handleGroupDialogOpenChange}
          group={undefined}
          onSave={handleSaveGroup}
        />

        <TagManagement
          open={isTagManagementOpen}
          onOpenChange={handleTagManagementOpenChange}
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
