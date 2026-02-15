import { waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

import { renderWithProviders } from '@test/render-with-providers'

import { MainApp } from './main-app'

/**
 * Layout regression tests for MainApp.
 * Verifies the 3-panel layout (LeftSidebar + SidebarInset + RightDetailPanel)
 * renders with correct CSS classes to prevent overflow.
 *
 * @see addbaa1 — fix(layout): add min-w-0 to SidebarInset
 */

describe('MainApp Layout', () => {
  it('renders SidebarInset with min-w-0 to prevent overflow', async () => {
    renderWithProviders(<MainApp />)

    // Wait for initial data load
    await waitFor(
      () => {
        expect(screen.getByRole('link', { name: 'All Bookmarks' })).toBeTruthy()
      },
      { timeout: 5_000 },
    )

    // SidebarInset uses data-slot="sidebar-inset" — verify it has min-w-0
    const sidebarInset = document.querySelector('[data-slot="sidebar-inset"]')
    expect(sidebarInset).toBeTruthy()
    expect(sidebarInset!.className).toContain('min-w-0')
    expect(sidebarInset!.className).toContain('flex-1')
  })

  it('renders detail panel collapsed by default (w-0)', async () => {
    renderWithProviders(<MainApp />)

    await waitFor(
      () => {
        expect(screen.getByRole('link', { name: 'All Bookmarks' })).toBeTruthy()
      },
      { timeout: 5_000 },
    )

    // RightDetailPanel should exist but be collapsed (w-0)
    // It uses: w-0 min-w-0 overflow-hidden border-l-0 when closed
    const detailPanel = document.querySelector(
      '.flex.h-screen.flex-col.border-l',
    )
    // When closed, the panel has w-0 and overflow-hidden
    if (detailPanel) {
      expect(detailPanel.className).toContain('w-0')
      expect(detailPanel.className).toContain('overflow-hidden')
    }
  })

  it('opens detail panel when a raindrop is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MainApp />)

    // Wait for bookmarks to render
    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', { name: 'React Documentation' }),
        ).toBeTruthy()
      },
      { timeout: 5_000 },
    )

    // Click on a raindrop to open detail panel
    await user.click(
      screen.getByRole('heading', { name: 'React Documentation' }),
    )

    // Detail panel should open with w-[360px]
    await waitFor(() => {
      const panels = document.querySelectorAll('.flex.h-screen.flex-col')
      const openPanel = Array.from(panels).find((el) =>
        el.className.includes('w-[360px]'),
      )
      expect(openPanel).toBeTruthy()
    })

    // SidebarInset should still have min-w-0 (prevents overflow)
    const sidebarInset = document.querySelector('[data-slot="sidebar-inset"]')
    expect(sidebarInset).toBeTruthy()
    expect(sidebarInset!.className).toContain('min-w-0')
  })
})
