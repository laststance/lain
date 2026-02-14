import { useState } from "react"
import { Globe, FileText, Image, Video, File, Music } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  extractDomain,
  getFaviconUrl,
  getDomainColor,
  getDomainInitial,
} from "@/utils/favicon"
import type { ContentType } from "@/lib/types"

/**
 * Props for the FaviconIcon component.
 */
interface FaviconIconProps {
  /** Full URL to extract favicon from */
  url: string
  /** Content type for fallback icon selection */
  type?: ContentType
  /** Icon size in pixels */
  size?: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Map content type to its corresponding lucide icon component.
 * @param type - The content type
 * @returns React icon component
 * @example getTypeIconComponent("video") // => Video component
 */
function getTypeIconComponent(type: ContentType) {
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
 * Favicon display with multi-level fallback chain:
 * 1. Fetched favicon from Google's service
 * 2. Domain initial in a colored circle
 * 3. Content type icon
 *
 * @param url - Full URL to extract domain and fetch favicon
 * @param type - Content type for last-resort fallback icon
 * @param size - Pixel size of the icon (default 32)
 * @param className - Additional CSS classes
 *
 * @example
 *   <FaviconIcon url="https://react.dev" type="article" size={20} />
 */
export function FaviconIcon({
  url,
  type = "link",
  size = 32,
  className,
}: FaviconIconProps) {
  const [imgError, setImgError] = useState(false)
  const domain = extractDomain(url)
  const faviconUrl = getFaviconUrl(domain, size)
  const initial = getDomainInitial(domain)
  const color = getDomainColor(domain)
  const TypeIcon = getTypeIconComponent(type)

  if (!domain || imgError) {
    if (domain && !imgError) {
      return (
        <div
          className={cn(
            "flex items-center justify-center rounded-sm flex-shrink-0",
            className,
          )}
          style={{
            width: size,
            height: size,
            backgroundColor: color,
          }}
        >
          <span
            className="font-semibold text-white"
            style={{ fontSize: size * 0.5 }}
          >
            {initial}
          </span>
        </div>
      )
    }

    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-sm flex-shrink-0 bg-muted",
          className,
        )}
        style={{ width: size, height: size }}
      >
        <TypeIcon
          className="text-muted-foreground"
          style={{ width: size * 0.6, height: size * 0.6 }}
        />
      </div>
    )
  }

  return (
    <img
      src={faviconUrl}
      alt={`${domain} favicon`}
      width={size}
      height={size}
      className={cn("rounded-sm flex-shrink-0 object-cover", className)}
      onError={() => setImgError(true)}
      loading="lazy"
    />
  )
}
