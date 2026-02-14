import { useState, useMemo } from "react"
import { Check, ChevronsUpDown, ChevronRight, Folder } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Group, Collection } from "@/lib/types"

/**
 * Props for CollectionSelector component.
 */
interface CollectionSelectorProps {
  /** Available groups with their collections */
  groups: Group[]
  /** Currently selected collection ID */
  value?: string
  /** Callback when selection changes */
  onChange: (collectionId: string) => void
  /** Placeholder text when nothing selected */
  placeholder?: string
  /** Whether to allow selecting "None" (root level) */
  allowNone?: boolean
}

/**
 * Searchable dropdown tree selector for choosing a collection.
 * Shows groups and their nested collections in a hierarchical popover.
 *
 * @param groups - Available groups containing collections
 * @param value - Currently selected collection ID
 * @param onChange - Callback when a collection is selected
 * @param placeholder - Placeholder text when no selection
 * @param allowNone - Whether to show a "None" option for root level
 *
 * @example
 *   <CollectionSelector
 *     groups={groups}
 *     value={selectedId}
 *     onChange={setSelectedId}
 *     placeholder="Select collection..."
 *   />
 */
export function CollectionSelector({
  groups,
  value,
  onChange,
  placeholder = "Select collection...",
  allowNone = false,
}: CollectionSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const selectedCollection = useMemo(() => {
    const findCollection = (
      collections: Collection[],
    ): Collection | undefined => {
      for (const col of collections) {
        if (col.id === value) return col
        if (col.children) {
          const found = findCollection(col.children)
          if (found) return found
        }
      }
      return undefined
    }

    for (const group of groups) {
      const found = findCollection(group.collections)
      if (found) return found
    }
    return undefined
  }, [groups, value])

  const filterCollections = (
    collections: Collection[],
    query: string,
  ): Collection[] => {
    if (!query) return collections
    const lower = query.toLowerCase()
    return collections.reduce<Collection[]>((acc, col) => {
      const nameMatch = col.name.toLowerCase().includes(lower)
      const filteredChildren = col.children
        ? filterCollections(col.children, query)
        : []
      if (nameMatch || filteredChildren.length > 0) {
        acc.push({
          ...col,
          children:
            filteredChildren.length > 0 ? filteredChildren : col.children,
        })
      }
      return acc
    }, [])
  }

  const renderCollection = (
    collection: Collection,
    depth: number = 0,
  ) => {
    const isSelected = value === collection.id

    return (
      <div key={collection.id}>
        <button
          type="button"
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
            isSelected && "bg-accent",
          )}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            onChange(collection.id)
            setOpen(false)
            setSearchQuery("")
          }}
        >
          {collection.children && collection.children.length > 0 && (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <div
            className="h-3 w-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: collection.color || "#8b5cf6" }}
          />
          <span className="truncate flex-1 text-left">{collection.name}</span>
          <span className="text-xs text-muted-foreground">
            {collection.count}
          </span>
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </button>
        {collection.children?.map((child) =>
          renderCollection(child, depth + 1),
        )}
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedCollection ? (
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm flex-shrink-0"
                style={{
                  backgroundColor: selectedCollection.color || "#8b5cf6",
                }}
              />
              <span className="truncate">{selectedCollection.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="p-2">
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
        </div>
        <ScrollArea className="max-h-[300px]">
          <div className="p-1">
            {allowNone && (
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                  !value && "bg-accent",
                )}
                onClick={() => {
                  onChange("")
                  setOpen(false)
                  setSearchQuery("")
                }}
              >
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span>None (root level)</span>
                {!value && <Check className="ml-auto h-4 w-4 text-primary" />}
              </button>
            )}
            {groups.map((group) => {
              const filteredCollections = filterCollections(
                group.collections,
                searchQuery,
              )
              if (searchQuery && filteredCollections.length === 0) return null

              return (
                <div key={group.id} className="mb-1">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group.name}
                  </div>
                  {(searchQuery ? filteredCollections : group.collections).map(
                    (col) => renderCollection(col),
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
