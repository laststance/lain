import { Search, X, ChevronRight } from 'lucide-react'
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'

import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Group, Collection } from '@/lib/types'
import { cn } from '@/lib/utils'

/**
 * Flattened collection entry with its full parent path and group info.
 */
interface FlatCollection {
  /** Collection ID */
  id: string
  /** Collection display name */
  name: string
  /** Collection color dot */
  color?: string
  /** Bookmark count */
  count: number
  /** Full breadcrumb path, e.g. ["Work", "Design Resources", "UI Inspiration"] */
  path: string[]
  /** Parent group name */
  groupName: string
}

/**
 * Flatten all collections from groups into a searchable list with full paths.
 * @param groups - Array of groups containing nested collections
 * @returns Flat array of collections with path and group metadata
 * @example
 *   flattenCollections(groups)
 *   // => [{ id: "design-ui", name: "UI Inspiration", path: ["Design Resources", "UI Inspiration"], ... }]
 */
function flattenCollections(groups: Group[]): FlatCollection[] {
  const result: FlatCollection[] = []

  const walk = (
    collections: Collection[],
    groupName: string,
    parentPath: string[],
  ) => {
    for (const col of collections) {
      const currentPath = [...parentPath, col.name]
      result.push({
        id: col.id,
        name: col.name,
        color: col.color,
        count: col.count,
        path: currentPath,
        groupName,
      })
      if (col.children) {
        walk(col.children, groupName, currentPath)
      }
    }
  }

  for (const group of groups) {
    walk(group.collections, group.name, [])
  }

  return result
}

/**
 * Highlight matching characters in a string with bold spans.
 * @param text - The original text
 * @param query - The search query to highlight
 * @returns JSX with matched portions wrapped in <strong>
 * @example
 *   highlightMatch("UI Inspiration", "ui ins")
 *   // => <><strong>UI</strong> <strong>Ins</strong>piration</>
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text

  const lower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  const index = lower.indexOf(queryLower)

  if (index === -1) return text

  return (
    <>
      {text.slice(0, index)}
      <strong className="text-primary font-semibold">
        {text.slice(index, index + query.length)}
      </strong>
      {text.slice(index + query.length)}
    </>
  )
}

/**
 * Props for the CollectionSearch component.
 */
interface CollectionSearchProps {
  /** Available groups containing collections to search */
  groups: Group[]
  /** Callback when a collection is selected from results */
  onSelect: (collectionId: string) => void
  /** Callback to close the search overlay */
  onClose: () => void
}

/**
 * Fuzzy search input for filtering collections in the sidebar.
 * Flattens all nested collections and shows matching results
 * with highlighted text and full path breadcrumbs.
 *
 * @param groups - All groups with their collection trees
 * @param onSelect - Fires when user clicks a matched collection
 * @param onClose - Fires when user dismisses the search (Escape or X)
 *
 * @example
 *   <CollectionSearch
 *     groups={groups}
 *     onSelect={(id) => {
 *       setSelectedCollection(id)
 *       setIsSearchOpen(false)
 *     }}
 *     onClose={() => setIsSearchOpen(false)}
 *   />
 */
/**
 * Auto-focus an input ref on mount.
 * @param ref - React ref to the input element
 */
function useAutoFocus(ref: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    ref.current?.focus()
  }, [ref])
}

const CollectionSearch = React.memo(function CollectionSearch({
  groups,
  onSelect,
  onClose,
}: CollectionSearchProps) {
  const [query, setQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const allCollections = useMemo(() => flattenCollections(groups), [groups])

  /**
   * Filter collections by fuzzy substring matching on name.
   */
  const filteredCollections = useMemo(() => {
    if (!query.trim()) return []
    const lower = query.toLowerCase()
    return allCollections.filter((col) =>
      col.name.toLowerCase().includes(lower),
    )
  }, [allCollections, query])

  useAutoFocus(inputRef)

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value)
      setFocusedIndex(0)
    },
    [],
  )

  /**
   * Handle keyboard navigation within search results.
   * @param e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) =>
          Math.min(prev + 1, filteredCollections.length - 1),
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCollections[focusedIndex]) {
          onSelect(filteredCollections[focusedIndex].id)
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  return (
    <div className="space-y-1" onKeyDown={handleKeyDown}>
      {/* Search Input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2" />
        <Input
          ref={inputRef}
          placeholder="Find collection..."
          value={query}
          onChange={handleQueryChange}
          className="h-7 pr-7 pl-7 text-xs"
        />
        <button
          type="button"
          onClick={onClose}
          className="hover:bg-accent absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-0.5"
        >
          <X className="text-muted-foreground h-3 w-3" />
        </button>
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="bg-popover rounded-md border shadow-md">
          {filteredCollections.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-muted-foreground text-xs">
                No collections matching "{query}"
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[240px]">
              <div className="p-1">
                {filteredCollections.map((col, index) => (
                  <button
                    key={col.id}
                    type="button"
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                      index === focusedIndex
                        ? 'bg-accent'
                        : 'hover:bg-accent/50',
                    )}
                    onClick={() => onSelect(col.id)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    {/* Color dot */}
                    <div
                      className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-sm"
                      style={{ backgroundColor: col.color || '#8b5cf6' }}
                    />

                    <div className="min-w-0 flex-1">
                      {/* Collection name with highlight */}
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-medium">
                          {highlightMatch(col.name, query)}
                        </span>
                        <span className="text-muted-foreground flex-shrink-0 text-[10px] tabular-nums">
                          {col.count}
                        </span>
                      </div>

                      {/* Path breadcrumb */}
                      <div className="mt-0.5 flex items-center gap-0.5">
                        <span className="text-muted-foreground text-[10px]">
                          {col.groupName}
                        </span>
                        {col.path.length > 1 && (
                          <>
                            <ChevronRight className="text-muted-foreground h-2 w-2" />
                            <span className="text-muted-foreground truncate text-[10px]">
                              {col.path.slice(0, -1).join(' / ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  )
})
export { CollectionSearch }
export default CollectionSearch
