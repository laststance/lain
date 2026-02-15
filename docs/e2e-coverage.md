# E2E SPEC.md Coverage Report

Generated: 2026-02-15

## Summary

| Category           | Total  | Covered | Coverage  |
| ------------------ | ------ | ------- | --------- |
| Feature (F1-F8)    | 43     | 3       | 7.0%      |
| API Endpoints      | 36     | 8       | 22.2%     |
| Keyboard Shortcuts | 20     | 1       | 5.0%      |
| **Total**          | **99** | **12**  | **12.1%** |

## Coverage Details

### F1: Scoped Search (0/4)

- [ ] **F1.1** — Search only returns results from current collection when scoped
- [ ] **F1.2** — Scope badge shows current collection name
- [ ] **F1.3** — Toggle to global search is one click away
- [ ] **F1.4** — Empty state shows "No results in [collection]" with option to search globally

### F2: Field-Specific Search (0/5)

- [ ] **F2.1** — URL-only search finds bookmarks by domain or URL substring
- [ ] **F2.2** — Title-only search matches against bookmark titles
- [ ] **F2.3** — Description-only search matches against excerpts
- [ ] **F2.4** — Matched field is highlighted in search results
- [ ] **F2.5** — Scope persists across searches (stored in searchSlice)

### F3: Multiple View Modes (1/5)

- [x] **F3.1** — All 4 view modes render correctly with real data — `e2e/specs/crud.spec.ts:210`, `e2e/specs/crud.spec.ts:222`, `e2e/specs/crud.spec.ts:248`
- [ ] **F3.2** — View mode persists across app restarts
- [ ] **F3.3** — Per-collection view mode overrides global default
- [ ] **F3.4** — Cmd+1-4 shortcuts switch view mode
- [ ] **F3.5** — Smooth transition between modes (no layout flash)

### F4: Auto-Icon Assignment (0/4)

- [ ] **F4.1** — New bookmarks auto-fetch icon from suggest API
- [ ] **F4.2** — Fallback to Google Favicon API when suggest returns no icon
- [ ] **F4.3** — Display domain first letter when no icon available
- [ ] **F4.4** — Background icon resolution doesn't block UI

### F5: Fuzzy Collection Search (0/5)

- [ ] **F5.1** — Typing "rct" finds "React Resources" collection
- [ ] **F5.2** — Match highlights show which characters matched
- [ ] **F5.3** — Performance: <10ms for 100 collections
- [ ] **F5.4** — Works in sidebar filter AND collection selector dropdowns
- [ ] **F5.5** — Empty query shows all collections

### F6: Group ↔ Collection Editing (0/7)

- [ ] **F6.1** — Drag collection between groups updates API
- [ ] **F6.2** — Reorder within group works and persists
- [ ] **F6.3** — Double-click enables inline rename
- [ ] **F6.4** — Right-click context menu with all options
- [ ] **F6.5** — Drag preview shows collection icon + name
- [ ] **F6.6** — Drop indicator shows insertion point
- [ ] **F6.7** — Optimistic updates: UI updates immediately, reverts on error

### F7: Enhanced Readability (2/6)

- [ ] **F7.1** — Collection icons use synced Raindrop.io colors
- [ ] **F7.2** — Groups expand/collapse with persistent state
- [x] **F7.3** — Breadcrumb shows full path: Group > Collection — `e2e/specs/crud.spec.ts:23`
- [x] **F7.4** — Bookmark counts visible on collections — `e2e/specs/crud.spec.ts:124`
- [ ] **F7.5** — Content type has distinct icon per type
- [ ] **F7.6** — Arrow key navigation works in all view modes

### F8: Keyboard Shortcut Editor (0/7)

- [ ] **F8.1** — Settings dialog has "Keyboard Shortcuts" tab listing all actions
- [ ] **F8.2** — Click "Edit" on any shortcut → captures next key combo → saves
- [ ] **F8.3** — Conflict detection warns when binding already assigned, offers swap
- [ ] **F8.4** — "Reset to Defaults" restores all shortcuts to defaults
- [ ] **F8.5** — Search filter finds actions by name
- [ ] **F8.6** — Custom shortcuts persist across app restarts (localStorage)
- [ ] **F8.7** — Cmd+Shift+K opens shortcut editor from anywhere

### API Endpoints (8/36)

- [x] **API.1** — GET /raindrops/{collectionId} — Browse bookmarks in collection — `e2e/specs/crud.spec.ts:24`, `e2e/specs/crud.spec.ts:108`, `e2e/specs/crud.spec.ts:190`, `e2e/specs/crud.spec.ts:271`, `e2e/specs/crud.spec.ts:285`, `e2e/specs/smoke.spec.ts:22`
- [x] **API.2** — GET /raindrop/{id} — View bookmark details — `e2e/specs/crud.spec.ts:364`, `e2e/specs/crud.spec.ts:394`, `e2e/specs/crud.spec.ts:422`
- [x] **API.3** — POST /raindrop — Create new bookmark — `e2e/specs/crud.spec.ts:42`
- [ ] **API.4** — PUT /raindrop/{id} — Edit bookmark (title, tags, notes)
- [ ] **API.5** — DELETE /raindrop/{id} — Delete bookmark
- [ ] **API.6** — PUT /raindrop/{id}/cover — Upload cover image
- [ ] **API.7** — GET /raindrop/{id}/cache — Open permanent copy
- [ ] **API.8** — GET /raindrop/suggest — Auto-fill URL metadata
- [ ] **API.9** — GET /raindrop/{id}/suggest — Re-fetch metadata for existing
- [ ] **API.10** — PUT /raindrop/file — Upload file as bookmark
- [ ] **API.11** — POST /raindrops — Batch create (≤100)
- [x] **API.12** — PUT /raindrops/{collectionId} — Batch update (move, tag, important) — `e2e/specs/crud.spec.ts:141`, `e2e/specs/crud.spec.ts:164`, `e2e/specs/crud.spec.ts:463`
- [x] **API.13** — DELETE /raindrops/{collectionId} — Batch delete to Trash / purge — `e2e/specs/crud.spec.ts:306`, `e2e/specs/crud.spec.ts:339`
- [x] **API.14** — GET /collections — Load root collection tree — `e2e/specs/crud.spec.ts:13`, `e2e/specs/smoke.spec.ts:32`
- [x] **API.15** — GET /collections/childrens — Load nested collections — `e2e/specs/crud.spec.ts:14`, `e2e/specs/smoke.spec.ts:33`
- [ ] **API.16** — POST /collection — Create collection
- [ ] **API.17** — GET /collection/{id} — Load collection for editing
- [ ] **API.18** — PUT /collection/{id} — Update collection (name, icon, color, parent)
- [ ] **API.19** — DELETE /collection/{id} — Delete collection
- [ ] **API.20** — PUT /collection/{id}/cover — Upload collection cover
- [ ] **API.21** — PUT /collections — Reorder / expand / collapse
- [ ] **API.22** — PUT /collections/merge — Merge collections
- [ ] **API.23** — PUT /collections/clean — Remove empty collections
- [ ] **API.24** — DELETE /collections/trash — Empty trash
- [ ] **API.25** — GET /tags/{collectionId} — List tags
- [ ] **API.26** — GET /tags/0 — List all tags
- [ ] **API.27** — PUT /tags — Rename tag
- [ ] **API.28** — DELETE /tags — Delete tag(s)
- [x] **API.29** — GET /user — Current user profile — `e2e/specs/smoke.spec.ts:13`
- [ ] **API.30** — PUT /user — Update user preferences
- [ ] **API.31** — GET /user/{id} — Public user profile
- [ ] **API.32** — GET /filters/{collectionId} — Type/tag filter counts
- [ ] **API.33** — POST /import/url — Parse URL metadata
- [ ] **API.34** — GET /raindrops/{collectionId}/export — Export as HTML/CSV
- [ ] **API.35** — GET /backups — List backups
- [ ] **API.36** — POST /backup — Generate backup

### Keyboard Shortcuts (1/20)

- [ ] **KB.1** — Cmd+K opens global search
- [ ] **KB.2** — Cmd+N opens new bookmark dialog
- [ ] **KB.3** — Cmd+Shift+N opens new collection dialog
- [ ] **KB.4** — Cmd+1 switches to grid view
- [ ] **KB.5** — Cmd+2 switches to list view
- [ ] **KB.6** — Cmd+3 switches to table view
- [ ] **KB.7** — Cmd+4 switches to directory view
- [ ] **KB.8** — Cmd+, opens settings
- [ ] **KB.9** — Cmd+Backspace deletes selected bookmark(s)
- [ ] **KB.10** — Cmd+A selects all bookmarks in view
- [ ] **KB.11** — Arrow Up moves selection up
- [ ] **KB.12** — Arrow Down moves selection down
- [ ] **KB.13** — Enter opens selected bookmark in browser
- [ ] **KB.14** — Space toggles detail panel for selected
- [x] **KB.15** — Escape closes active panel/dialog — `e2e/specs/crud.spec.ts:61`, `e2e/specs/crud.spec.ts:84`
- [ ] **KB.16** — Cmd+Shift+K opens shortcut editor
- [ ] **KB.17** — Cmd+F focuses search bar (scoped to current collection)
- [ ] **KB.18** — Cmd+Shift+F opens global search across all collections
- [ ] **KB.19** — Cmd+D toggles important flag on selected
- [ ] **KB.20** — Cmd+Shift+T opens tag management

## Uncovered Requirements by Phase

### P2 (28 uncovered)

- API.4 — PUT /raindrop/{id} — Edit bookmark (title, tags, notes)
- API.5 — DELETE /raindrop/{id} — Delete bookmark
- API.6 — PUT /raindrop/{id}/cover — Upload cover image
- API.7 — GET /raindrop/{id}/cache — Open permanent copy
- API.8 — GET /raindrop/suggest — Auto-fill URL metadata
- API.9 — GET /raindrop/{id}/suggest — Re-fetch metadata for existing
- API.10 — PUT /raindrop/file — Upload file as bookmark
- API.11 — POST /raindrops — Batch create (≤100)
- API.16 — POST /collection — Create collection
- API.17 — GET /collection/{id} — Load collection for editing
- API.18 — PUT /collection/{id} — Update collection (name, icon, color, parent)
- API.19 — DELETE /collection/{id} — Delete collection
- API.20 — PUT /collection/{id}/cover — Upload collection cover
- API.21 — PUT /collections — Reorder / expand / collapse
- API.22 — PUT /collections/merge — Merge collections
- API.23 — PUT /collections/clean — Remove empty collections
- API.24 — DELETE /collections/trash — Empty trash
- API.25 — GET /tags/{collectionId} — List tags
- API.26 — GET /tags/0 — List all tags
- API.27 — PUT /tags — Rename tag
- API.28 — DELETE /tags — Delete tag(s)
- API.30 — PUT /user — Update user preferences
- API.31 — GET /user/{id} — Public user profile
- API.32 — GET /filters/{collectionId} — Type/tag filter counts
- API.33 — POST /import/url — Parse URL metadata
- API.34 — GET /raindrops/{collectionId}/export — Export as HTML/CSV
- API.35 — GET /backups — List backups
- API.36 — POST /backup — Generate backup

### P3 (14 uncovered)

- F1.1 — Search only returns results from current collection when scoped
- F1.2 — Scope badge shows current collection name
- F1.3 — Toggle to global search is one click away
- F1.4 — Empty state shows "No results in [collection]" with option to search globally
- F2.1 — URL-only search finds bookmarks by domain or URL substring
- F2.2 — Title-only search matches against bookmark titles
- F2.3 — Description-only search matches against excerpts
- F2.4 — Matched field is highlighted in search results
- F2.5 — Scope persists across searches (stored in searchSlice)
- F5.1 — Typing "rct" finds "React Resources" collection
- F5.2 — Match highlights show which characters matched
- F5.3 — Performance: <10ms for 100 collections
- F5.4 — Works in sidebar filter AND collection selector dropdowns
- F5.5 — Empty query shows all collections

### P4 (11 uncovered)

- F4.1 — New bookmarks auto-fetch icon from suggest API
- F4.2 — Fallback to Google Favicon API when suggest returns no icon
- F4.3 — Display domain first letter when no icon available
- F4.4 — Background icon resolution doesn't block UI
- F6.1 — Drag collection between groups updates API
- F6.2 — Reorder within group works and persists
- F6.3 — Double-click enables inline rename
- F6.4 — Right-click context menu with all options
- F6.5 — Drag preview shows collection icon + name
- F6.6 — Drop indicator shows insertion point
- F6.7 — Optimistic updates: UI updates immediately, reverts on error

### P5 (34 uncovered)

- F3.2 — View mode persists across app restarts
- F3.3 — Per-collection view mode overrides global default
- F3.4 — Cmd+1-4 shortcuts switch view mode
- F3.5 — Smooth transition between modes (no layout flash)
- F7.1 — Collection icons use synced Raindrop.io colors
- F7.2 — Groups expand/collapse with persistent state
- F7.5 — Content type has distinct icon per type
- F7.6 — Arrow key navigation works in all view modes
- F8.1 — Settings dialog has "Keyboard Shortcuts" tab listing all actions
- F8.2 — Click "Edit" on any shortcut → captures next key combo → saves
- F8.3 — Conflict detection warns when binding already assigned, offers swap
- F8.4 — "Reset to Defaults" restores all shortcuts to defaults
- F8.5 — Search filter finds actions by name
- F8.6 — Custom shortcuts persist across app restarts (localStorage)
- F8.7 — Cmd+Shift+K opens shortcut editor from anywhere
- KB.1 — Cmd+K opens global search
- KB.2 — Cmd+N opens new bookmark dialog
- KB.3 — Cmd+Shift+N opens new collection dialog
- KB.4 — Cmd+1 switches to grid view
- KB.5 — Cmd+2 switches to list view
- KB.6 — Cmd+3 switches to table view
- KB.7 — Cmd+4 switches to directory view
- KB.8 — Cmd+, opens settings
- KB.9 — Cmd+Backspace deletes selected bookmark(s)
- KB.10 — Cmd+A selects all bookmarks in view
- KB.11 — Arrow Up moves selection up
- KB.12 — Arrow Down moves selection down
- KB.13 — Enter opens selected bookmark in browser
- KB.14 — Space toggles detail panel for selected
- KB.16 — Cmd+Shift+K opens shortcut editor
- KB.17 — Cmd+F focuses search bar (scoped to current collection)
- KB.18 — Cmd+Shift+F opens global search across all collections
- KB.19 — Cmd+D toggles important flag on selected
- KB.20 — Cmd+Shift+T opens tag management
