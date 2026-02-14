import { useEffect, useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CollectionSelector } from "@/components/raindrop/collection-selector"
import type { Group, Collection } from "@/lib/types"

const PRESET_COLORS = [
  "#8b5cf6",
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#22c55e",
  "#eab308",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
]

const ICON_OPTIONS = [
  "Folder",
  "FolderOpen",
  "Star",
  "Heart",
  "Bookmark",
  "Code2",
  "Palette",
  "Brain",
  "BookOpen",
  "CookingPot",
  "Plane",
  "Music",
  "Camera",
  "GamepadIcon",
  "Briefcase",
  "GraduationCap",
  "Wrench",
  "Shield",
  "Globe",
  "Zap",
  "Sparkles",
  "Component",
  "Layout",
  "FileText",
  "Image",
  "Video",
  "Home",
  "ShoppingBag",
  "Coffee",
  "Dumbbell",
]

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  icon: z.string(),
  color: z.string(),
  groupId: z.string().min(1, "Group is required"),
  parentId: z.string().optional(),
  viewMode: z.enum(["list", "grid", "table", "directory"]),
  isPublic: z.boolean(),
})

type CollectionFormValues = z.infer<typeof collectionSchema>

/**
 * Props for CollectionDialog component.
 */
interface CollectionDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void
  /** Available groups for the group selector */
  groups: Group[]
  /** Existing collection to edit (undefined for create mode) */
  collection?: Collection
  /** Callback when user saves the collection */
  onSave: (data: CollectionFormValues & { id?: string }) => void
}

/**
 * Dialog for creating or editing a collection.
 * Supports icon selection, color picking, parent collection nesting,
 * group assignment, view mode preference, and public toggle.
 *
 * @param open - Controls dialog visibility
 * @param onOpenChange - Callback when dialog open state changes
 * @param groups - Available groups for organizing collections
 * @param collection - If provided, enters edit mode with pre-filled values
 * @param onSave - Callback with form data on save
 *
 * @example
 *   <CollectionDialog
 *     open={isOpen}
 *     onOpenChange={setIsOpen}
 *     groups={groups}
 *     collection={editingCollection}
 *     onSave={(data) => console.log("Save:", data)}
 *   />
 */
export function CollectionDialog({
  open,
  onOpenChange,
  groups,
  collection,
  onSave,
}: CollectionDialogProps) {
  const isEditing = !!collection
  const [iconSearch, setIconSearch] = useState("")

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      icon: "Folder",
      color: "#8b5cf6",
      groupId: groups[0]?.id || "",
      parentId: undefined,
      viewMode: "list",
      isPublic: false,
    },
  })

  const selectedColor = watch("color")
  const selectedIcon = watch("icon")
  const selectedGroupId = watch("groupId")
  const isPublic = watch("isPublic")

  useEffect(() => {
    if (open) {
      if (collection) {
        reset({
          name: collection.name,
          icon: collection.icon || "Folder",
          color: collection.color || "#8b5cf6",
          groupId: collection.groupId,
          parentId: collection.parentId || undefined,
          viewMode: "list",
          isPublic: false,
        })
      } else {
        reset({
          name: "",
          icon: "Folder",
          color: "#8b5cf6",
          groupId: groups[0]?.id || "",
          parentId: undefined,
          viewMode: "list",
          isPublic: false,
        })
      }
      setIconSearch("")
    }
  }, [open, collection, groups, reset])

  const filteredIcons = useMemo(() => {
    if (!iconSearch) return ICON_OPTIONS
    const lower = iconSearch.toLowerCase()
    return ICON_OPTIONS.filter((icon) => icon.toLowerCase().includes(lower))
  }, [iconSearch])

  const onSubmit = (data: CollectionFormValues) => {
    onSave({
      ...data,
      id: collection?.id,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Collection" : "Create Collection"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update collection settings and appearance."
                : "Create a new collection to organize your bookmarks."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="collection-name">Name</Label>
              <Input
                id="collection-name"
                placeholder="e.g., Frontend Resources, Reading List..."
                {...register("name")}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Group Selector */}
            <div className="grid gap-2">
              <Label htmlFor="collection-group">Group</Label>
              <Select
                value={selectedGroupId}
                onValueChange={(val) => setValue("groupId", val)}
              >
                <SelectTrigger id="collection-group">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.groupId && (
                <p className="text-sm text-destructive">
                  {errors.groupId.message}
                </p>
              )}
            </div>

            {/* Parent Collection */}
            <div className="grid gap-2">
              <Label>Parent Collection</Label>
              <CollectionSelector
                groups={groups}
                value={watch("parentId")}
                onChange={(id) => setValue("parentId", id || undefined)}
                placeholder="None (root level)"
                allowNone
              />
            </div>

            {/* Color Picker */}
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-7 w-7 rounded-md border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        selectedColor === color
                          ? "var(--color-foreground)"
                          : "transparent",
                    }}
                    onClick={() => setValue("color", color)}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="grid gap-2">
              <Label>Icon</Label>
              <Input
                placeholder="Search icons..."
                value={iconSearch}
                onChange={(e) => setIconSearch(e.target.value)}
                className="h-8"
              />
              <ScrollArea className="h-[120px]">
                <div className="grid grid-cols-6 gap-1">
                  {filteredIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`flex h-10 w-full items-center justify-center rounded-md text-xs transition-colors hover:bg-accent ${
                        selectedIcon === icon
                          ? "bg-accent ring-2 ring-primary"
                          : ""
                      }`}
                      onClick={() => setValue("icon", icon)}
                      title={icon}
                    >
                      <span className="truncate px-1 text-[10px]">
                        {icon}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* View Preference */}
            <div className="grid gap-2">
              <Label htmlFor="collection-view">Default View</Label>
              <Select
                value={watch("viewMode")}
                onValueChange={(val) =>
                  setValue(
                    "viewMode",
                    val as "list" | "grid" | "table" | "directory",
                  )
                }
              >
                <SelectTrigger id="collection-view">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="directory">Directory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between gap-2">
              <div className="grid gap-1">
                <Label htmlFor="collection-public">Public</Label>
                <p className="text-xs text-muted-foreground">
                  Allow others to view this collection
                </p>
              </div>
              <Switch
                id="collection-public"
                checked={isPublic}
                onCheckedChange={(checked: boolean) =>
                  setValue("isPublic", checked)
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEditing ? "Save Changes" : "Create Collection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
