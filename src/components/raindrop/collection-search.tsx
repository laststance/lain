import { useState, useMemo, useRef, useEffect } from "react"
import { Search, X, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Group, Collection } from "@/lib/types"

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
    parentPath: string[]
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
export function CollectionSearch({
  groups,
  onSelect,
  onClose,
}: CollectionSearchProps) {
  const [query, setQuery] = useState("")
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
      col.name.toLowerCase().includes(lower)
    )
  }, [allCollections, query])

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  /**
   * Handle keyboard navigation within search results.
   * @param e - Keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setFocusedIndex((prev) =>
          Math.min(prev + 1, filteredCollections.length - 1)
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (filteredCollections[focusedIndex]) {
          onSelect(filteredCollections[focusedIndex].id)
        }
        break
      case "Escape":
        e.preventDefault()
        onClose()
        break
    }
  }

  return (
    <div className="space-y-1" onKeyDown={handleKeyDown}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Find collection..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setFocusedIndex(0)
          }}
          className="h-7 pl-7 pr-7 text-xs"
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="rounded-md border bg-popover shadow-md">
          {filteredCollections.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-xs text-muted-foreground">
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
                      "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                      index === focusedIndex
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => onSelect(col.id)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    {/* Color dot */}
                    <div
                      className="h-3 w-3 rounded-sm flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: col.color || "#8b5cf6" }}
                    />

                    <div className="flex-1 min-w-0">
                      {/* Collection name with highlight */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">
                          {highlightMatch(col.name, query)}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">
                          {col.count}
                        </span>
                      </div>

                      {/* Path breadcrumb */}
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {col.groupName}
                        </span>
                        {col.path.length > 1 && (
                          <>
                            <ChevronRight className="h-2 w-2 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground truncate">
                              {col.path.slice(0, -1).join(" / ")}
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
}
