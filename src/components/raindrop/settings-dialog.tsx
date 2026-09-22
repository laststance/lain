import React from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatShortcut } from '@/lib/shortcut-utils'
import type { ViewMode } from '@/lib/types'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  SHORTCUT_DEFINITIONS,
  setDefaultViewMode,
  setTheme,
} from '@/store/slices/settingsSlice'
import type { ShortcutCategory } from '@/store/slices/settingsSlice'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTab?: string
}

const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  navigation: 'Navigation',
  editing: 'Editing',
  view: 'View',
  system: 'System',
}

const CATEGORY_ORDER: ShortcutCategory[] = [
  'navigation',
  'editing',
  'view',
  'system',
]

/**
 * Settings dialog with General and Keyboard Shortcuts tabs.
 * Shortcuts tab is read-only in PR1; editing ships in PR2.
 *
 * @example
 *   <SettingsDialog open={isOpen} onOpenChange={setIsOpen} defaultTab="shortcuts" />
 */
export const SettingsDialog = React.memo(function SettingsDialog({
  open,
  onOpenChange,
  defaultTab,
}: SettingsDialogProps) {
  const dispatch = useAppDispatch()
  const shortcuts = useAppSelector((s) => s.settings.shortcuts)
  const theme = useAppSelector((s) => s.settings.theme)
  const defaultViewMode = useAppSelector((s) => s.settings.defaultViewMode)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your Lain experience.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab ?? 'general'}>
          <TabsList className="w-full">
            <TabsTrigger value="general" className="flex-1">
              General
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex-1">
              Keyboard Shortcuts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-muted-foreground text-xs">
                  Choose your preferred color scheme.
                </p>
              </div>
              <select
                value={theme}
                onChange={(e) =>
                  dispatch(
                    setTheme(e.target.value as 'light' | 'dark' | 'system'),
                  )
                }
                className="bg-background border-input h-8 rounded-md border px-2 text-sm"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Default View Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Default View</p>
                <p className="text-muted-foreground text-xs">
                  Default view mode for collections.
                </p>
              </div>
              <select
                value={defaultViewMode}
                onChange={(e) =>
                  dispatch(setDefaultViewMode(e.target.value as ViewMode))
                }
                className="bg-background border-input h-8 rounded-md border px-2 text-sm"
              >
                <option value="list">List</option>
                <option value="grid">Grid</option>
                <option value="table">Table</option>
                <option value="directory">Directory</option>
              </select>
            </div>
          </TabsContent>

          <TabsContent value="shortcuts" className="pt-4">
            <div className="max-h-[400px] overflow-y-auto">
              {CATEGORY_ORDER.map((category) => {
                const defs = SHORTCUT_DEFINITIONS.filter(
                  (d) => d.category === category,
                )
                if (defs.length === 0) return null
                return (
                  <div key={category} className="mb-4">
                    <h4 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                      {CATEGORY_LABELS[category]}
                    </h4>
                    <div className="space-y-1">
                      {defs.map((def) => {
                        const binding = shortcuts[def.actionId]
                        return (
                          <div
                            key={def.actionId}
                            className="flex items-center justify-between rounded-md px-2 py-1.5"
                          >
                            <span className="text-sm">{def.label}</span>
                            {binding && (
                              <kbd className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-xs">
                                {formatShortcut(binding)}
                              </kbd>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
})
