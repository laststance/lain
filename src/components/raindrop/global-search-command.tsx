import { useState, useEffect, useCallback, useMemo } from "react"
import {
  Search,
  Globe,
  FileText,
  Image,
  Video,
  File,
  Music,
  Clock,
  X,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FaviconIcon } from "@/components/raindrop/favicon-icon"
import type { Raindrop, Collection, Group, SearchScope, ContentType } from "@/lib/types"

/**
 * Map content type to its corresponding Lucide icon.
 * @param type - Content type string
 * @returns Lucide icon component
 * @example getTypeIcon("article") // => FileText
 */
function getTypeIcon(type: ContentType) {
  const map: Record<ContentType, typeof Globe> = {
    link: Globe,
    article: FileText,
    image: Image,
    video: Video,
    document: File,
    audio: Music,
  }
  return map[type] || Globe
}

/**
 * Props for the GlobalSearchCommand component.
 */
interface GlobalSearchCommandProps {
  /** All available raindrops to search through */
  raindrops: Raindrop[]
  /** Whether the command palette is open */
  open: boolean
  /** Callback to toggle the palette */
  onOpenChange: (open: boolean) => void
  /** Callback when a raindrop result is selected */
  onSelectRaindrop?: (raindrop: Raindrop) => void
  /** Callback when navigating to a collection */
  onSelectCollection?: (collectionId: string) => void
  /** Available groups for context */
  groups?: Group[]
  /** Available collections for context */
  collections?: Collection[]
  /** Currently active collection ID (for scope display) */
  currentCollectionId?: string
}

const SEARCH_SCOPE_LABELS: Record<SearchScope, string> = {
  all: "All Fields",
  url: "URL Only",
  title: "Title Only",
  description: "Description Only",
}

/**
 * Global search command palette triggered by Cmd+K.
 * Searches across all raindrops with scope filtering and recent searches.
 *
 * @param raindrops - All available raindrops to search
 * @param open - Whether the palette is visible
 * @param onOpenChange - Callback when visibility changes
 * @param onSelectRaindrop - Callback when a search result is selected
 * @param onSelectCollection - Callback when navigating to a collection
 * @param groups - Available groups for context
 * @param collections - Available collections for context
 * @param currentCollectionId - Currently active collection ID for scope indicator
 *
 * @example
 *   <GlobalSearchCommand
 *     raindrops={allRaindrops}
 *     open={isSearchOpen}
 *     onOpenChange={setIsSearchOpen}
 *     onSelectRaindrop={(rd) => handleSelect(rd)}
 *     currentCollectionId="dev-react"
 *   />
 */
export function GlobalSearchCommand({
  raindrops,
  open,
  onOpenChange,
  onSelectRaindrop,
  onSelectCollection: _onSelectCollection,
  groups: _groups,
  collections,
  currentCollectionId,
}: GlobalSearchCommandProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchScope, setSearchScope] = useState<SearchScope>("all")
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("lain-recent-searches")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Register global Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onOpenChange])

  const addRecentSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim()
      if (!trimmed) return
      const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5)
      setRecentSearches(updated)
      try {
        localStorage.setItem("lain-recent-searches", JSON.stringify(updated))
      } catch {
        // Storage quota exceeded — silently ignore
      }
    },
    [recentSearches],
  )

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("lain-recent-searches")
  }

  const matchesSearch = useCallback(
    (raindrop: Raindrop, query: string): boolean => {
      const lower = query.toLowerCase()
      switch (searchScope) {
        case "url":
          return raindrop.url.toLowerCase().includes(lower)
        case "title":
          return raindrop.title.toLowerCase().includes(lower)
        case "description":
          return (
            (raindrop.description?.toLowerCase().includes(lower) ?? false) ||
            (raindrop.notes?.toLowerCase().includes(lower) ?? false)
          )
        case "all":
        default:
          return (
            raindrop.title.toLowerCase().includes(lower) ||
            raindrop.url.toLowerCase().includes(lower) ||
            (raindrop.description?.toLowerCase().includes(lower) ?? false) ||
            raindrop.tags.some((t) => t.toLowerCase().includes(lower)) ||
            (raindrop.domain?.toLowerCase().includes(lower) ?? false)
          )
      }
    },
    [searchScope],
  )

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    return raindrops.filter((r) => matchesSearch(r, searchQuery)).slice(0, 20)
  }, [raindrops, searchQuery, matchesSearch])

  const currentCollectionName = useMemo(() => {
    if (!currentCollectionId || !collections) return undefined
    const findName = (cols: Collection[]): string | undefined => {
      for (const col of cols) {
        if (col.id === currentCollectionId) return col.name
        if (col.children) {
          const found = findName(col.children)
          if (found) return found
        }
      }
      return undefined
    }
    return findName(collections)
  }, [currentCollectionId, collections])

  const handleSelect = (raindrop: Raindrop) => {
    addRecentSearch(searchQuery)
    onSelectRaindrop?.(raindrop)
    onOpenChange(false)
    setSearchQuery("")
  }

  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Search bookmarks</DialogTitle>
          <DialogDescription>
            Search across all your bookmarks by title, URL, description, or tags.
          </DialogDescription>
        </DialogHeader>
        <Command
          shouldFilter={false}
          className="rounded-lg border-0"
        >
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <CommandInput
              placeholder={
                currentCollectionName
                  ? `Search in ${currentCollectionName}... (⌘K)`
                  : "Search all bookmarks... (⌘K)"
              }
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-0 focus:ring-0"
            />
            {searchQuery && (
              <button
                type="button"
                className="p-1 rounded-sm hover:bg-muted"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Search scope selector */}
          <div className="flex items-center gap-1.5 border-b px-3 py-2">
            <span className="text-xs text-muted-foreground mr-1">Scope:</span>
            {(Object.keys(SEARCH_SCOPE_LABELS) as SearchScope[]).map((scope) => (
              <button
                key={scope}
                type="button"
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  searchScope === scope
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
                onClick={() => setSearchScope(scope)}
              >
                {SEARCH_SCOPE_LABELS[scope]}
              </button>
            ))}
          </div>

          <CommandList className="max-h-[400px]">
            <CommandEmpty>
              {searchQuery
                ? "No bookmarks found."
                : "Start typing to search..."}
            </CommandEmpty>

            {/* Recent searches — shown when query is empty */}
            {!searchQuery && recentSearches.length > 0 && (
              <CommandGroup
                heading={
                  <div className="flex items-center justify-between">
                    <span>Recent Searches</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={clearRecentSearches}
                    >
                      Clear
                    </button>
                  </div>
                }
              >
                {recentSearches.map((query) => (
                  <CommandItem
                    key={query}
                    value={query}
                    onSelect={() => handleRecentSearchClick(query)}
                    className="gap-2"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{query}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Search results */}
            {searchQuery && searchResults.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading={`Results (${searchResults.length})`}>
                  {searchResults.map((raindrop) => {
                    const TypeIcon = getTypeIcon(raindrop.type)
                    return (
                      <CommandItem
                        key={raindrop.id}
                        value={raindrop.id}
                        onSelect={() => handleSelect(raindrop)}
                        className="gap-3 py-2.5"
                      >
                        <FaviconIcon
                          url={raindrop.url}
                          type={raindrop.type}
                          size={20}
                          className="flex-shrink-0"
                        />
                        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium text-sm">
                              {raindrop.title}
                            </span>
                            {raindrop.isImportant && (
                              <span className="text-amber-500 flex-shrink-0">
                                ★
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TypeIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">
                              {raindrop.domain || raindrop.url}
                            </span>
                          </div>
                          {raindrop.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              {raindrop.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-[10px] h-4 px-1.5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {raindrop.tags.length > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{raindrop.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span>
                <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">↑↓</kbd>{" "}
                Navigate
              </span>
              <span>
                <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">↵</kbd>{" "}
                Select
              </span>
              <span>
                <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-mono">Esc</kbd>{" "}
                Close
              </span>
            </div>
            {currentCollectionName && (
              <span className="flex items-center gap-1">
                Searching in:{" "}
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  {currentCollectionName}
                </Badge>
              </span>
            )}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
