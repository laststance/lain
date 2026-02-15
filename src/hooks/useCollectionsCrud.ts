import { useCallback } from 'react'
import { toast } from 'sonner'

import { collectionIdToApi } from '@/lib/api-mappers'
import {
  useDeleteCollectionByIdMutation,
  usePostCollectionMutation,
  usePutCollectionByIdMutation,
  usePutCollectionsMergeMutation,
} from '@/store/api/raindropApi'
import type {
  CollectionCreate,
  CollectionUpdate,
} from '@/store/api/raindropApi'

/**
 * Collection CRUD operations with UI-to-API type mapping.
 *
 * Wraps RTK Query mutations for collections. Converts UI string IDs
 * to API numeric IDs and maps form data to API shapes.
 *
 * @returns Collection mutation functions
 * @example
 *   const { createCollection, updateCollection, deleteCollection } = useCollectionsCrud()
 *   await createCollection({ title: 'My Collection', parentId: '100' })
 */
export function useCollectionsCrud(): UseCollectionsCrudReturn {
  const [postCollection] = usePostCollectionMutation()
  const [putCollection] = usePutCollectionByIdMutation()
  const [deleteCollectionMutation] = useDeleteCollectionByIdMutation()
  const [mergeCollections] = usePutCollectionsMergeMutation()

  const createCollection = useCallback(
    async (data: CreateCollectionFormData) => {
      const apiData: CollectionCreate = {
        title: data.title,
        view: data.view,
        parent: data.parentId
          ? { $id: collectionIdToApi(data.parentId) }
          : undefined,
      }
      const result = await postCollection({ collectionCreate: apiData })
      if ('data' in result) {
        toast.success('Collection created')
      }
    },
    [postCollection],
  )

  const updateCollection = useCallback(
    async (id: string, data: UpdateCollectionFormData) => {
      const apiData: CollectionUpdate = {
        title: data.title,
        view: data.view,
        expanded: data.expanded,
        parent: data.parentId
          ? { $id: collectionIdToApi(data.parentId) }
          : undefined,
      }
      const result = await putCollection({
        id: collectionIdToApi(id),
        collectionUpdate: apiData,
      })
      if ('data' in result) {
        toast.success('Collection updated')
      }
    },
    [putCollection],
  )

  const deleteCollection = useCallback(
    async (id: string) => {
      const result = await deleteCollectionMutation({
        id: collectionIdToApi(id),
      })
      if ('data' in result) {
        toast.success('Collection deleted')
      }
    },
    [deleteCollectionMutation],
  )

  const merge = useCallback(
    async (targetId: string, sourceIds: string[]) => {
      const result = await mergeCollections({
        collectionsMergeRequest: {
          to: collectionIdToApi(targetId),
          ids: sourceIds.map((id) => collectionIdToApi(id)),
        },
      })
      if ('data' in result) {
        toast.success('Collections merged')
      }
    },
    [mergeCollections],
  )

  return { createCollection, updateCollection, deleteCollection, merge }
}

/**
 * Form data for creating a new collection.
 */
export interface CreateCollectionFormData {
  /** Collection title (required) */
  title: string
  /** Parent collection ID (UI string). Omit for root-level. */
  parentId?: string
  /** View mode preference for this collection */
  view?: string
}

/**
 * Form data for updating an existing collection.
 * Only defined fields are sent to the API.
 */
export interface UpdateCollectionFormData {
  title?: string
  parentId?: string
  view?: string
  expanded?: boolean
}

interface UseCollectionsCrudReturn {
  createCollection: (data: CreateCollectionFormData) => Promise<void>
  updateCollection: (
    id: string,
    data: UpdateCollectionFormData,
  ) => Promise<void>
  deleteCollection: (id: string) => Promise<void>
  /** Merge source collections into a target collection */
  merge: (targetId: string, sourceIds: string[]) => Promise<void>
}
