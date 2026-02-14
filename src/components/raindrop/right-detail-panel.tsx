import { useEffect, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Globe,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Music,
  ExternalLink,
  Copy,
  Trash2,
  X,
  Star,
  Calendar,
  Clock,
  Tag,
  Link,
  PanelRightClose,
  PanelRightOpen,
  Check,
  Highlighter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { extractDomain, getFaviconUrl, getDomainColor, getDomainInitial } from "@/utils/favicon"
import type { Raindrop, Group, ContentType } from "@/lib/types"

const raindropSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Please enter a valid URL"),
  description: z.string().optional(),
  type: z.enum(["link", "article", "image", "video", "document", "audio"]),
  notes: z.string().optional(),
  isImportant: z.boolean(),
})

type RaindropFormValues = z.infer<typeof raindropSchema>

/**
 * Type icon mapping.
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
 * Props for RightDetailPanel component.
 */
interface RightDetailPanelProps {
  /** The currently selected raindrop to display/edit */
  raindrop?: Raindrop
  /** Whether the panel is open */
  isOpen: boolean
  /** Callback to close the panel */
  onClose: () => void
  /** Available groups for collection display */
  groups: Group[]
  /** Existing tag names for autocomplete */
  existingTags: string[]
  /** Callback when user saves changes to the raindrop */
  onSave: (raindrop: Raindrop) => void
  /** Callback when user deletes the raindrop */
  onDelete: (raindropId: string) => void
}

/**
 * Right-side detail panel showing selected raindrop information and edit form.
 * Displays cover image, metadata, tags, highlights, and action buttons.
 * Slides in/out from the right edge of the layout.
 *
 * @param raindrop - Selected raindrop data to display
 * @param isOpen - Controls panel visibility
 * @param onClose - Callback to close the panel
 * @param groups - Available groups for context
 * @param existingTags - Existing tags for autocomplete
 * @param onSave - Callback with updated raindrop on save
 * @param onDelete - Callback with raindrop ID on delete
 *
 * @example
 *   <RightDetailPanel
 *     raindrop={selectedRaindrop}
 *     isOpen={isDetailOpen}
 *     onClose={() => setIsDetailOpen(false)}
 *     groups={groups}
 *     existingTags={["react", "typescript"]}
 *     onSave={handleSave}
 *     onDelete={handleDelete}
 *   />
 */
export function RightDetailPanel({
  raindrop,
  isOpen,
  onClose,
  groups,
  existingTags,
  onSave,
  onDelete,
}: RightDetailPanelProps) {
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [faviconError, setFaviconError] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<RaindropFormValues>({
    resolver: zodResolver(raindropSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      type: "link",
      notes: "",
      isImportant: false,
    },
  })

  const selectedType = watch("type")
  const isImportant = watch("isImportant")
  const currentUrl = watch("url")

  // Reset form when raindrop changes
  useEffect(() => {
    if (raindrop) {
      reset({
        title: raindrop.title,
        url: raindrop.url,
        description: raindrop.description || "",
        type: raindrop.type,
        notes: raindrop.notes || "",
        isImportant: raindrop.isImportant || false,
      })
      setTags(raindrop.tags || [])
      setFaviconError(false)
    }
  }, [raindrop, reset])

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
    setTagInput("")
    setTagSuggestions([])
  }

  const removeTag = (tagName: string) => {
    setTags(tags.filter((t) => t !== tagName))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (tagSuggestions.length > 0) {
        addTag(tagSuggestions[0])
      } else if (tagInput.trim()) {
        addTag(tagInput)
      }
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleCopyUrl = useCallback(async () => {
    if (!currentUrl) return
    try {
      await navigator.clipboard.writeText(currentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may not be available in all contexts
    }
  }, [currentUrl])

  const handleOpenUrl = useCallback(() => {
    if (!currentUrl) return
    window.shell.openExternal(currentUrl)
  }, [currentUrl])

  const onSubmit = (data: RaindropFormValues) => {
    if (!raindrop) return
    onSave({
      ...raindrop,
      ...data,
      tags,
    })
  }

  const handleDelete = () => {
    if (!raindrop) return
    onDelete(raindrop.id)
    onClose()
  }

  const domain = currentUrl ? extractDomain(currentUrl) : ""
  const faviconUrl = domain ? getFaviconUrl(domain) : ""
  const domainColor = domain ? getDomainColor(domain) : "oklch(0.7 0.15 250)"
  const domainInitial = domain ? getDomainInitial(domain) : "?"

  const TypeIcon = selectedType ? TYPE_ICONS[selectedType] : Globe

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return dateStr
    }
  }

  // Find collection name from groups
  const collectionName = (() => {
    if (!raindrop) return ""
    for (const group of groups) {
      for (const col of group.collections) {
        if (col.id === raindrop.collectionId) return col.name
        if (col.children) {
          for (const child of col.children) {
            if (child.id === raindrop.collectionId) return child.name
          }
        }
      }
    }
    return "Unknown"
  })()

  return (
    <div
      className={cn(
        "h-screen border-l bg-background transition-all duration-200 ease-in-out flex flex-col",
        isOpen ? "w-[360px] min-w-[360px]" : "w-0 min-w-0 overflow-hidden border-l-0",
      )}
    >
      {isOpen && raindrop && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
            <div className="flex items-center gap-2">
              <TypeIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-[200px]">
                Details
              </span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onClose}
                  >
                    <PanelRightClose className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Close panel</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <ScrollArea className="flex-1">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="p-4 space-y-4"
            >
              {/* Cover Image */}
              {raindrop.coverImage && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={raindrop.coverImage}
                    alt={raindrop.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                  <Badge
                    variant="secondary"
                    className="absolute top-2 right-2 capitalize"
                  >
                    {raindrop.type}
                  </Badge>
                </div>
              )}

              {/* Favicon + Domain header */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {!faviconError && faviconUrl ? (
                    <img
                      src={faviconUrl}
                      alt=""
                      className="h-8 w-8 rounded-md"
                      onError={() => setFaviconError(true)}
                    />
                  ) : (
                    <div
                      className="h-8 w-8 rounded-md flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: domainColor }}
                    >
                      {domainInitial}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground truncate">
                    {domain}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    in {collectionName}
                  </p>
                </div>
                {isImportant && (
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
              </div>

              <Separator />

              {/* Title */}
              <div className="grid gap-2">
                <Label htmlFor="detail-title">Title</Label>
                <Input
                  id="detail-title"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* URL */}
              <div className="grid gap-2">
                <Label htmlFor="detail-url">URL</Label>
                <div className="flex gap-1">
                  <div className="relative flex-1">
                    <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="detail-url"
                      className="pl-8 text-xs"
                      {...register("url")}
                    />
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 flex-shrink-0"
                          onClick={handleOpenUrl}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Open in browser</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 flex-shrink-0"
                          onClick={handleCopyUrl}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {copied ? "Copied!" : "Copy URL"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                {errors.url && (
                  <p className="text-sm text-destructive">
                    {errors.url.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="detail-description">Description</Label>
                <Textarea
                  id="detail-description"
                  className="resize-none text-sm"
                  rows={3}
                  placeholder="Add a description..."
                  {...register("description")}
                />
              </div>

              {/* Type */}
              <div className="grid gap-2">
                <Label htmlFor="detail-type">Type</Label>
                <Select
                  value={selectedType}
                  onValueChange={(val) =>
                    setValue("type", val as ContentType)
                  }
                >
                  <SelectTrigger id="detail-type">
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

              {/* Tags */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Tags
                </Label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-md border px-3 py-2 min-h-[40px]">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5"
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
                    placeholder={tags.length === 0 ? "Add tags..." : ""}
                    className="flex-1 min-w-[60px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {tagSuggestions.length > 0 && (
                  <div className="rounded-md border bg-popover p-1 shadow-md">
                    {tagSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => addTag(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Important toggle */}
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="detail-important"
                  className="flex items-center gap-1.5"
                >
                  <Star className="h-3.5 w-3.5" />
                  Important
                </Label>
                <Switch
                  id="detail-important"
                  checked={isImportant}
                  onCheckedChange={(checked: boolean) =>
                    setValue("isImportant", checked)
                  }
                />
              </div>

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="detail-notes">Notes</Label>
                <Textarea
                  id="detail-notes"
                  className="resize-none text-sm"
                  rows={4}
                  placeholder="Personal notes..."
                  {...register("notes")}
                />
              </div>

              {/* Highlights */}
              {raindrop.highlights && raindrop.highlights.length > 0 && (
                <div className="grid gap-2">
                  <Label className="flex items-center gap-1.5">
                    <Highlighter className="h-3.5 w-3.5" />
                    Highlights
                  </Label>
                  <div className="space-y-2">
                    {raindrop.highlights.map((highlight, index) => (
                      <div
                        key={index}
                        className="rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2"
                      >
                        <p className="text-sm italic text-foreground/80">
                          &ldquo;{highlight}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Metadata */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created: {formatDate(raindrop.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Updated: {formatDate(raindrop.updatedAt)}</span>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!isDirty && tags.join(",") === (raindrop.tags || []).join(",")}
                >
                  Save Changes
                </Button>
              </div>

              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Move to Trash
              </Button>
            </form>
          </ScrollArea>
        </>
      )}

      {/* Collapsed toggle button (shown when panel is closed) */}
      {!isOpen && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-l-md rounded-r-none border-r-0"
                  onClick={() => {
                    /* Panel open is controlled by parent */
                  }}
                >
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Open detail panel</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}
