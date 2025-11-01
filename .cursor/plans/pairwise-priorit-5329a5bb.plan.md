<!-- 5329a5bb-4bdf-41d2-a5e4-5f8aa0dca35b 19e14fb2-7220-469e-a37e-0b87350072d5 -->
# Pairwise Prioritizer Build Plan

## Architecture Summary

- **Stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **State**: Zustand with IndexedDB persistence (idb-keyval)
- **Algorithm**: Merge-sort with human comparator (O(n log n))
- **Deployment**: Static export, fully offline-capable

---

## Stage 1: Foundation & Core Data Layer

**Goal**: Establish type system, storage, and state management

### Key Files to Create:

- `domain/types.ts` - Core types (Task, TaskList, SortingState, AppState)
- `domain/storage/idb.ts` - IndexedDB wrapper with localStorage fallback
- `domain/storage/migrations.ts` - Schema versioning system
- `domain/state/store.ts` - Zustand store setup
- `hooks/usePersistentStore.ts` - IDB hydration & persistence hook
- `domain/utils/uuid.ts` - ID generation utility

### Testing:

- Unit tests for storage layer (save/retrieve)
- Test localStorage fallback when IDB unavailable
- Verify schema version handling

**Definition of Done**: Can create/save/load a TaskList with tasks in browser storage

---

## Stage 2: Sorting Engine (Merge-Sort Comparator)

**Goal**: Implement comparison algorithm with caching

### Key Files to Create:

- `domain/sortingEngine/mergeEngine.ts` - Core merge-sort logic
- `domain/sortingEngine/cache.ts` - Comparison result caching
- `domain/sortingEngine/types.ts` - Engine-specific types

### Implementation Details:

- `createSession(tasks)` - Initialize sorting state
- `requestNextPair(state)` - Get next comparison or null if done
- `commitComparison(state, aId, bId, result)` - Record decision & advance
- `finalize(state)` - Extract final taskOrder
- Implement comparison cache with `${a}|${b}` keys

### Testing:

- Unit test sorting 3, 5, 10, 50 tasks with mock comparisons
- Verify O(n log n) comparison count
- Test cache hit/miss scenarios
- Test pause/resume (serialize/deserialize state)

**Definition of Done**: Engine correctly sorts tasks with minimal comparisons and persists mid-sort state

---

## Stage 3: Basic UI Scaffold & Navigation

**Goal**: Set up app layout, routing, and design system

### Key Files:

- `app/layout.tsx` - Root layout with dark mode support
- `app/page.tsx` - Landing page (create/open list)
- `app/lists/page.tsx` - Lists overview
- `app/lists/[listId]/page.tsx` - Main list view
- `components/ui/Button.tsx, Input.tsx, Dialog.tsx` - Base components
- `styles/globals.css` - Tailwind config, custom properties

### Design System:

- Color palette: neutral/zinc base + accent color
- Typography scale (clamp for fluid sizing)
- Focus-visible rings, rounded cards (rounded-2xl)
- Dark mode via `next-themes` or custom implementation

### Testing:

- Visual regression tests (optional)
- Lighthouse accessibility audit (baseline)
- Keyboard navigation through routes

**Definition of Done**: Can navigate between pages, basic styling in place, dark mode toggle works

---

## Stage 4: Task Management UI

**Goal**: Create, edit, delete, reorder tasks

### Key Components:

- `components/list/CreateListForm.tsx` - New list creation
- `components/list/TaskEditor.tsx` - Add/edit individual tasks
- `components/list/TaskRow.tsx` - Display task with inline actions
- `components/list/BulkAddDialog.tsx` - Multi-line paste input

### Features:

- Add task (title, note, tags fields)
- Inline edit (click to edit title/note)
- Delete with confirmation
- Bulk add via textarea (split by newlines)
- Mark complete toggle
- Basic filters (all/active/done)

### Accessibility:

- Form labels with `htmlFor`
- Error messages with `aria-describedby`
- Focus management on add/edit
- Keyboard shortcuts (Cmd/Ctrl+Enter to save)

### Testing:

- Add/edit/delete tasks
- Bulk add 10 tasks via paste
- Filter tasks
- Keyboard-only task management

**Definition of Done**: Can manage a full task list without comparison sorting

---

## Stage 5: Comparator UI (Core Feature)

**Goal**: Implement pairwise comparison interface

### Key Components:

- `components/sorting/ComparatorCard.tsx` - Main comparison UI
- `components/sorting/ProgressBar.tsx` - Visual progress indicator
- `components/sorting/PauseResumeControls.tsx` - Session management

### Features:

- Display two tasks side-by-side
- Buttons: "Pick Left", "Pick Right", "Tie", "Pause"
- Keyboard shortcuts: ←/→/=/Esc
- Progress: "12 of 37 comparisons" + percentage bar
- ARIA live region announcements
- Focus trap during comparison
- Resume banner when session exists

### UX Details:

- Show task notes in comparison cards
- Highlight keyboard shortcuts visually
- Smooth transitions between comparisons (respect prefers-reduced-motion)
- Auto-focus on comparator when opened

### Testing:

- Complete full sorting session
- Test pause/resume
- Verify keyboard controls
- Screen reader testing (NVDA/VoiceOver)
- Test with 3, 10, 50 tasks

**Definition of Done**: Can complete a prioritization session with keyboard or mouse, pause/resume works

---

## Stage 6: Results & Reordering

**Goal**: Display sorted results with manual override capability

### Key Components:

- `components/list/ResultsList.tsx` - Ranked task display
- `components/list/DragHandle.tsx` - Accessible drag handle
- `components/list/ReorderControls.tsx` - Up/down buttons

### Features:

- Display tasks in priority order
- Drag-and-drop reordering (via @dnd-kit or similar)
- Keyboard reorder buttons (↑/↓)
- Mark complete (moves to collapsed "Done" section)
- "Re-prioritize" button to start fresh sort
- "Refine" to continue with cached comparisons

### Accessibility:

- Announce position changes to screen readers
- Keyboard-only reordering
- Skip link to results from comparator

### Testing:

- Manual reorder via drag
- Manual reorder via keyboard
- Mark tasks complete
- Re-run prioritization

**Definition of Done**: Sorted results are usable and manually adjustable

---

## Stage 7: Export/Import & Data Portability

**Goal**: Backup and restore functionality

### Key Components:

- `components/export/ExportButton.tsx` - Download JSON
- `components/export/ImportDialog.tsx` - Upload & validate JSON
- `domain/utils/exportImport.ts` - Serialization logic

### Features:

- Export single list or all lists as JSON
- Import with schema validation
- Preview import changes before applying
- Handle version mismatches (migrate if needed)
- Error handling for corrupt files

### Testing:

- Export → Import round-trip
- Import file from older schema version
- Import invalid JSON (should error gracefully)
- Large file handling (500+ tasks)

**Definition of Done**: Data is portable and recoverable

---

## Stage 8: Multi-List Support

**Goal**: Manage multiple task lists

### Key Features:

- List selector/switcher in header
- Create new list
- Rename list
- Delete list (with confirmation)
- Duplicate list
- Archive list (future enhancement)

### UI Updates:

- Update `app/lists/page.tsx` with list cards
- Add list switcher to `app/lists/[listId]/page.tsx`
- Persist `activeListId` in store

### Testing:

- Create 3 lists, switch between them
- Delete a list
- Duplicate a list with active sort session

**Definition of Done**: Can work with multiple independent lists

---

## Stage 9: PWA & Offline Enhancement

**Goal**: Make app installable and fully offline-capable

### Implementation:

- Set up service worker via `next-pwa` or custom SW
- Create `manifest.json` with icons
- Cache static assets
- Add "Install App" prompt
- Offline status indicator

### Files:

- `public/manifest.json`
- `public/icons/` (various sizes)
- `next.config.ts` - PWA plugin configuration

### Testing:

- Install on mobile/desktop
- Test offline functionality (airplane mode)
- Cache invalidation on updates
- Lighthouse PWA audit (score 100)

**Definition of Done**: App installable and works offline

---

## Stage 10: Polish & Performance Optimization

**Goal**: Refine UX, performance, accessibility

### Optimizations:

- Code splitting: lazy-load import/export dialogs
- Memoize TaskRow components
- Virtualize results list for 500+ tasks (react-window)
- Debounce persistence writes (300ms)
- Add loading states and skeletons
- Optimize bundle size (analyze with @next/bundle-analyzer)

### UX Enhancements:

- Add keyboard shortcut help modal (?)
- Toast notifications for actions
- Empty states with illustrations
- Onboarding tour for first-time users
- Add undo last comparison

### Accessibility Audit:

- Run axe DevTools
- Test with NVDA, JAWS, VoiceOver
- Verify color contrast (4.5:1 minimum)
- Test with 200% zoom
- Test keyboard-only navigation

### Testing:

- Lighthouse scores: 100/100/100/100
- Test with 1000 tasks (virtualization)
- Measure interaction metrics (FID, CLS)

**Definition of Done**: Production-ready quality and performance

---

## Stage 11: Advanced Features (Nice-to-Haves)

**Goal**: Implement optional enhancements

### Features:

- Tags with filtering
- Effort/Impact fields (optional)
- Impact/Effort matrix view
- Quick-add keyboard shortcut (global)
- Comparison history view
- Decision confidence tracking
- Auto-export reminders
- Multi-tab sync warning

### Testing:

- Each feature individually
- Integration with existing flows

**Definition of Done**: Enhanced features work seamlessly

---

## Testing Strategy (Cross-Stage)

### Unit Tests (Vitest):

- Sorting engine (100% coverage)
- Storage helpers
- Migrations
- Utility functions

### Integration Tests (Testing Library):

- Task CRUD operations
- Sorting flow end-to-end
- Export/import round-trip
- Accessibility (jest-axe)

### E2E Tests (Playwright):

- Happy path: add tasks → prioritize → export
- Pause/resume flow
- Multi-list management
- PWA installation

### Performance Tests:

- Large dataset (500, 1000 tasks)
- Lighthouse CI in GitHub Actions
- Bundle size monitoring

---

## Deployment Checklist

- [ ] TypeScript strict mode enabled
- [ ] All tests passing
- [ ] Lighthouse 100/100/100/100
- [ ] PWA manifest configured
- [ ] Error boundaries in place
- [ ] CSP headers configured
- [ ] Static export working (`next build`)
- [ ] Vercel/Netlify deployment
- [ ] Custom domain configured
- [ ] Analytics (privacy-respecting, optional)
- [ ] README with screenshots
- [ ] License file

---

## File Structure Reference

```
app/
  layout.tsx
  page.tsx
  lists/
    page.tsx
    [listId]/
      page.tsx
      edit/page.tsx
components/
  list/[CreateListForm, TaskEditor, TaskRow, ResultsList, BulkAddDialog].tsx
  sorting/[ComparatorCard, ProgressBar, PauseResumeControls].tsx
  export/[ExportButton, ImportDialog].tsx
  ui/[Button, Input, Dialog, Toast, VisuallyHidden].tsx
domain/
  types.ts
  sortingEngine/[mergeEngine, cache, types].ts
  storage/[idb, migrations].ts
  state/store.ts
  utils/[uuid, time, exportImport].ts
hooks/
  [usePersistentStore, useKeyboardShortcuts, useDarkMode].ts
public/
  manifest.json
  icons/
styles/
  globals.css
tests/
  unit/
  integration/
  e2e/
```

### To-dos

- [ ] Foundation & Core Data Layer - types, storage, state management
- [ ] Sorting Engine - merge-sort comparator with caching
- [ ] Basic UI Scaffold - layout, routing, design system
- [ ] Task Management UI - CRUD operations, bulk add, filters
- [ ] Comparator UI - pairwise comparison interface with keyboard support
- [ ] Results & Reordering - display sorted tasks with manual adjustments
- [ ] Export/Import - data portability and backup
- [ ] Multi-List Support - manage multiple independent lists
- [ ] PWA & Offline Enhancement - service worker, manifest, installability
- [ ] Polish & Performance - optimization, accessibility audit, UX refinement
- [ ] Advanced Features - tags, effort/impact, matrix view (nice-to-haves)