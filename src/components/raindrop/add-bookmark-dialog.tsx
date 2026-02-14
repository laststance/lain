import { zodResolver } from '@hookform/resolvers/zod'
import {
  Globe,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Music,
  ChevronDown,
  Loader2,
  Link,
  X,
  Plus,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { CollectionSelector } from '@/components/raindrop/collection-selector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { Group, ContentType } from '@/lib/types'
import { extractDomain, getFaviconUrl } from '@/utils/favicon'

const bookmarkSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  title: z.string().optional(),
  description: z.string().optional(),
  collectionId: z.string().optional(),
  type: z.enum(['link', 'article', 'image', 'video', 'document', 'audio']),
  notes: z.string().optional(),
  isImportant: z.boolean(),
})

type BookmarkFormValues = z.infer<typeof bookmarkSchema>

/**
 * Type icon mapping for the content type selector.
 */
const TYPE_ICONS: Record<ContentType, typeof Globe> = {
  link: Globe,
  article: FileText,
  image: ImageIcon,
  video: Video,
  document: File,
  audio: Music,
}

/**
 * Props for AddBookmarkDialog component.
 */
interface AddBookmarkDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void
  /** Available groups with their collections */
  groups: Group[]
  /** List of existing tag names for autocomplete */
  existingTags: string[]
  /** Default collection ID to pre-select */
  defaultCollectionId?: string
  /** Callback when user saves the bookmark */
  onSave: (data: BookmarkFormValues & { tags: string[] }) => void
}

/**
 * Dialog for adding a new bookmark (raindrop).
 * Supports URL auto-parsing, tag input with autocomplete,
 * collection selection, type detection, and optional notes.
 *
 * @param open - Controls dialog visibility
 * @param onOpenChange - Callback when dialog open state changes
 * @param groups - Available groups for collection selection
 * @param existingTags - Existing tags for autocomplete suggestions
 * @param defaultCollectionId - Pre-selected collection ID
 * @param onSave - Callback with form data and tags on save
 *
 * @example
 *   <AddBookmarkDialog
 *     open={isOpen}
 *     onOpenChange={setIsOpen}
 *     groups={groups}
 *     existingTags={["react", "typescript"]}
 *     defaultCollectionId="dev"
 *     onSave={(data) => console.log("Save:", data)}
 *   />
 */
export function AddBookmarkDialog({
  open,
  onOpenChange,
  groups,
  existingTags,
  defaultCollectionId,
  onSave,
}: AddBookmarkDialogProps) {
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [parsedFavicon, setParsedFavicon] = useState('')
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  const [autoIcon, setAutoIcon] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookmarkFormValues>({
    resolver: zodResolver(bookmarkSchema),
    defaultValues: {
      url: '',
      title: '',
      description: '',
      collectionId: defaultCollectionId || '',
      type: 'link',
      notes: '',
      isImportant: false,
    },
  })

  const url = watch('url')
  const selectedType = watch('type')
  const isImportant = watch('isImportant')

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      reset({
        url: '',
        title: '',
        description: '',
        collectionId: defaultCollectionId || '',
        type: 'link',
        notes: '',
        isImportant: false,
      })
      setTags([])
      setTagInput('')
      setParsedFavicon('')
      setIsNotesOpen(false)
      setAutoIcon(true)
    }
  }, [open, defaultCollectionId, reset])

  // Auto-parse URL (simulated - in real app would call Raindrop API)
  const parseUrl = useCallback(
    (urlValue: string) => {
      if (!urlValue) return
      try {
        new URL(urlValue)
      } catch {
        return
      }

      setIsParsing(true)
      const domain = extractDomain(urlValue)

      // Simulate URL parsing delay
      const timeout = setTimeout(() => {
        if (autoIcon && domain) {
          setParsedFavicon(getFaviconUrl(domain))
        }

        // Auto-detect type from URL
        if (
          urlValue.match(/youtube\.com|vimeo\.com|dailymotion\.com|\.mp4$/i)
        ) {
          setValue('type', 'video')
        } else if (urlValue.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) {
          setValue('type', 'image')
        } else if (urlValue.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
          setValue('type', 'document')
        } else if (urlValue.match(/\.(mp3|wav|ogg|flac|aac)$/i)) {
          setValue('type', 'audio')
        } else if (
          urlValue.match(
            /medium\.com|dev\.to|hashnode\.dev|substack\.com|blog\./i,
          )
        ) {
          setValue('type', 'article')
        }

        // Auto-fill title from domain if empty
        const currentTitle = watch('title')
        if (!currentTitle) {
          setValue('title', domain ? `${domain} - Untitled` : '')
        }

        setIsParsing(false)
      }, 500)

      return () => clearTimeout(timeout)
    },
    [autoIcon, setValue, watch],
  )

  // Debounced URL parsing
  useEffect(() => {
    if (!url) return
    const debounce = setTimeout(() => parseUrl(url), 500)
    return () => clearTimeout(debounce)
  }, [url, parseUrl])

  // Tag autocomplete
  useEffect(() => {
    if (!tagInput) {
      setTagSuggestions([])
      return
    }
    const lower = tagInput.toLowerCase()
    const filtered = existingTags.filter(
      (tag) => tag.toLowerCase().includes(lower) && !tags.includes(tag),
    )
    setTagSuggestions(filtered.slice(0, 5))
  }, [tagInput, existingTags, tags])

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
    setTagSuggestions([])
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (tagSuggestions.length > 0) {
        addTag(tagSuggestions[0])
      } else if (tagInput.trim()) {
        addTag(tagInput)
      }
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const onSubmit = (data: BookmarkFormValues) => {
    onSave({ ...data, tags })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="text-primary h-5 w-5" />
              Add Bookmark
            </DialogTitle>
            <DialogDescription>
              Paste a URL to quickly add a new bookmark.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* URL Input */}
            <div className="grid gap-2">
              <Label htmlFor="bookmark-url">URL</Label>
              <div className="relative">
                <Link className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  id="bookmark-url"
                  placeholder="https://..."
                  className="pl-9"
                  {...register('url')}
                  autoFocus
                />
                {isParsing && (
                  <Loader2 className="text-muted-foreground absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin" />
                )}
              </div>
              {errors.url && (
                <p className="text-destructive text-sm">{errors.url.message}</p>
              )}
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="bookmark-title">Title</Label>
              <div className="flex items-center gap-2">
                {parsedFavicon && (
                  <img
                    src={parsedFavicon}
                    alt=""
                    className="h-5 w-5 flex-shrink-0 rounded-sm"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <Input
                  id="bookmark-title"
                  placeholder="Bookmark title"
                  className="flex-1"
                  {...register('title')}
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="bookmark-description">Description</Label>
              <Textarea
                id="bookmark-description"
                placeholder="Brief description..."
                className="resize-none"
                rows={2}
                {...register('description')}
              />
            </div>

            {/* Collection Selector */}
            <div className="grid gap-2">
              <Label>Collection</Label>
              <CollectionSelector
                groups={groups}
                value={watch('collectionId')}
                onChange={(id) => setValue('collectionId', id)}
                placeholder="Select collection..."
              />
            </div>

            {/* Tags */}
            <div className="grid gap-2">
              <Label>Tags</Label>
              <div className="flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-md border px-3 py-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-muted-foreground/20 ml-0.5 rounded-sm p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={tags.length === 0 ? 'Add tags...' : ''}
                  className="placeholder:text-muted-foreground min-w-[80px] flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              {tagSuggestions.length > 0 && (
                <div className="bg-popover rounded-md border p-1 shadow-md">
                  {tagSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="hover:bg-accent flex w-full items-center rounded-sm px-2 py-1.5 text-sm"
                      onClick={() => addTag(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type & Important row */}
            <div className="flex items-end gap-4">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="bookmark-type">Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(val) => setValue('type', val as ContentType)}
                >
                  <SelectTrigger id="bookmark-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(TYPE_ICONS) as [
                        ContentType,
                        typeof Globe,
                      ][]
                    ).map(([type, Icon]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="capitalize">{type}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="text-muted-foreground h-4 w-4" />
                <Label
                  htmlFor="auto-icon"
                  className="text-muted-foreground text-sm whitespace-nowrap"
                >
                  Auto Icon
                </Label>
                <Switch
                  id="auto-icon"
                  checked={autoIcon}
                  onCheckedChange={setAutoIcon}
                />
              </div>
            </div>

            {/* Important toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="grid gap-1">
                <Label htmlFor="bookmark-important">Mark as Important</Label>
                <p className="text-muted-foreground text-xs">
                  Bookmark will be highlighted with a star indicator
                </p>
              </div>
              <Switch
                id="bookmark-important"
                checked={isImportant}
                onCheckedChange={(checked: boolean) =>
                  setValue('isImportant', checked)
                }
              />
            </div>

            {/* Notes (collapsible) */}
            <Collapsible open={isNotesOpen} onOpenChange={setIsNotesOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between"
                >
                  <span className="text-muted-foreground text-sm">
                    Add notes (optional)
                  </span>
                  <ChevronDown
                    className={`text-muted-foreground h-4 w-4 transition-transform ${
                      isNotesOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Textarea
                  placeholder="Personal notes about this bookmark..."
                  className="mt-2 resize-none"
                  rows={3}
                  {...register('notes')}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isParsing}>
              {isParsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                'Save Bookmark'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
