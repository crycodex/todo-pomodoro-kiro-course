# Implementation Plan: Task Filtering and Kanban View

## Overview

This feature enhances the todo-pom application with comprehensive task filtering and a Kanban board view. The implementation extends the data model with new fields (category, priority, description, due date, tags), adds state management for filters and view modes, and introduces drag-and-drop Kanban functionality. All components follow the existing Vue 3 + TypeScript architecture with Pinia state management.

## Tasks

- [ ] 1. Extend data model with new fields
  - [ ] 1.1 Create category filtering utility function
    - Implement `matchesCategoryFilter` function in `src/utils/filter.ts`
    - Validate category matching logic
    - _Requirements: 1.1, 1.2, 1.3, 24.4_
  
  - [ ]* 1.2 Write property test for category filtering
    - **Property 1: Filter round-trip preservation**
    - **Validates: Requirements 1.2, 19.3**

- [ ] 2. Add categories state management
  - [ ] 2.1 Add `addCategory` method to Pinia store
    - Implement in `src/stores/todoStore.ts`
    - Store custom categories in localStorage only (no Supabase sync for MVP)
    - _Requirements: 5.3, 18.1, 18.2, 17.3_
  
  - [ ] 2.2 Add category input component
    - Create `CategoryInput.vue` in `src/components/filter/`
    - Support default and custom categories
    - _Requirements: 5.1, 5.2_

- [ ] 3. Add priority system
  - [ ] 3.1 Add priority state to Pinia store
    - Default priorities: Low, Medium, High, Critical
    - Store in `Task` interface with `TaskPriority` type
    - _Requirements: 6.1, 6.2_
  
  - [ ] 3.2 Create priority color mappings
    - Define color constants in `src/types/index.ts` or `src/constants.ts`:
      - Low: `#3b82f6`
      - Medium: `#22c55e`
      - High: `#f59e0b`
      - Critical: `#ef4444`
    - Export `getPriorityColor(priority: TaskPriority): string` function
    - _Requirements: 13.2, 6.3, 6.4, Property 3_

- [ ] 4. Add filter state management
  - [ ] 4.1 Add filter state to Pinia store
    - Add `filters: TaskFilterState` to store state
    - Implement `resetFilters` method
    - Store handles filtering logic (computed properties)
    - _Requirements: 15.1, 15.4, 24.4_
  
  - [ ] 4.2 Implement filter logic composable
    - Create `useFilterLogic` in `src/composables/useFilterLogic.ts`
    - Handle active filter chip display and removal only
    - Store handles actual filtering logic
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [ ] 5. Add view mode state
  - [ ] 5.1 Add view mode state to Pinia store
    - Add `viewMode: TaskViewMode` with default 'list'
    - Persist to localStorage on change
    - _Requirements: 10.2, 15.3_
  
  - [ ] 5.2 Create ViewToggle component
    - Create `ViewToggle.vue` in `src/components/`
    - Toggle between list and Kanban views
    - _Requirements: 10.1, 10.3_

- [ ] 6. Create filter components
  - [ ] 6.1 Create FilterBar component
    - Create `FilterBar.vue` in `src/components/filter/`
    - Display active filter chips
    - Provide filter editor access
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 23.1, 23.2_
  
  - [ ] 6.2 Create FilterChip component
    - Create `FilterChip.vue` in `src/components/filter/`
    - Visual indicator for active filters
    - Remove individual filter functionality
    - _Requirements: 19.3, 19.4, 24.1, 24.2_
  
  - [ ] 6.3 Create TagFilter component with autocomplete
    - Create `TagFilter.vue` in `src/components/filter/`
    - Top 10 tag suggestions ordered by recent usage frequency
    - "Create new tag" option when no matches
    - _Requirements: 23.1, 23.2, 23.3, 23.4_

- [ ] 7. Create Kanban components
  - [ ] 7.1 Create KanbanBoard component
    - Create `KanbanBoard.vue` in `src/components/kanban/`
    - Horizontal scroll container for columns
    - Responsive: stack vertically on mobile (< 768px) by default
    - Optional horizontal scroll toggle button
    - _Requirements: 14.1, 14.2, 14.3, 26.1, 26.2_
  
  - [ ] 7.2 Create KanbanColumn component
    - Create `KanbanColumn.vue` in `src/components/kanban/`
    - Column header with title and task count
    - Drop zone with visual feedback
    - _Requirements: 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 7.3 Create KanbanTask component
    - Create `KanbanTask.vue` in `src/components/kanban/`
    - Task card with priority color indicator
    - Urgency indicator (yellow background + ⏰ icon for tasks due within 24 hours)
    - Priority indicator always visible on touch devices
    - Click to expand details (optional)
    - _Requirements: 13.1, 13.3, 13.4, 25.1, 25.2, 27.1, 27.2_

- [ ] 8. Implement drag-and-drop functionality
  - [ ] 8.1 Create useDragAndDrop composable
    - Create `useDragAndDrop.ts` in `src/composables/`
    - Use Pointer Events API for cross-platform support
    - Fall back to keyboard navigation (Cmd/Ctrl + arrows) for accessibility
    - Touch detection: 500ms timeout on pointerdown with touch events
    - Mobile fallback: `TaskColumnSelector.vue` and `TaskLongPressModal.vue`
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 16.1, 16.2, 16.3, 16.4, 22.1, 22.2, 22.5_
  
  - [ ] 8.2 Create mobile fallback components
    - Create `TaskColumnSelector.vue` in `src/components/kanban/`
      - Dropdown with all columns (To Do, In Progress, Done)
      - Selection updates task status immediately
      - _Requirements: 22.1, 22.5_
    - Create `TaskLongPressModal.vue` in `src/components/kanban/`
      - Modal with column options
      - Long-press detection: 500ms timeout on touchstart
      - _Requirements: 22.2, 22.5_
  
  - [ ] 8.3 Implement visual drag feedback
    - Create `TaskDragGhost.vue` in `src/components/kanban/`
    - Drag placeholder visual during drag operation
    - _Requirements: 12.1, 20.1, 20.2, 20.3, 20.4_
  
  - [ ]* 8.4 Write property test for Kanban status round-trip
    - **Property 2: Kanban status consistency**
    - **Validates: Requirements 11.1, 11.2, 12.2, 15.3**

- [ ] 9. Update store methods
  - [ ] 9.1 Update addTask to accept new fields
    - Extended to accept category, priority, description, dueDate, tags
    - Default values: status = 'todo', category = 'Work', priority = 'Medium'
    - _Requirements: 11.2, 17.1, 17.4, 17.3_
  
  - [ ] 9.2 Update editTask to handle new fields
    - Support updating all new task fields
    - Validate inputs: description max 500 chars, tags max 50 chars
    - _Requirements: 5.1, 6.1, 9.1, 9.2, 21.1, 21.2_

- [ ] 10. Update Supabase sync
  - [ ] 10.1 Update mapAppTaskToSupabase
    - Include new fields in Supabase mapping
    - _Requirements: 17.3 (categories not synced to Supabase for MVP)_
  
  - [ ] 10.2 Update normalizeTask defaults
    - Default values for all new fields
    - Handle missing fields in existing tasks
    - _Requirements: 17.4, 24.4_

- [ ] 11. Update main components
  - [ ] 11.1 Update TaskList to support view mode
    - Conditionally render list or Kanban view
    - Pass viewMode to child components
    - _Requirements: 10.4, 11.3_
  
  - [ ] 11.2 Update App.vue
    - Integrate new filter components
    - Add Kanban board rendering
    - Handle view mode switching
    - _Requirements: 1.1, 10.1, 12.4, 15.2_

- [ ] 12. Accessibility implementation
  - [ ] 12.1 Add ARIA labels to Kanban components
    - Labels for Kanban board, columns, and tasks
    - Screen reader announcements for drag operations
    - _Requirements: 16.3, 16.4_
  
  - [ ] 12.2 Implement keyboard navigation
    - Cmd/Ctrl + arrows to move between columns (avoid Alt on macOS for VoiceOver)
    - Enter to select task, Space to toggle completion
    - Esc to cancel drag operation
    - _Requirements: 16.1, 16.2_
  
  - [ ]* 12.3 Write accessibility tests
    - Test focus management
    - Verify `aria-*` attributes
    - Test with VoiceOver on iOS Safari
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 27.4_

- [ ] 13. Responsive design
  - [ ] 13.1 Mobile Kanban improvements
    - Stack columns vertically by default (< 768px)
    - Horizontal scroll toggle button with persistent preference
    - Touch-friendly drop zones (min 44px height)
    - Long-press modal for task movement on touch devices
    - _Requirements: 14.1, 14.2, 14.3, 26.1, 26.2, 26.3, 26.4_
  
  - [ ] 13.2 Filter section responsiveness
    - Collapsible filter section on mobile
    - Horizontal layout on desktop
    - _Requirements: 19.1, 19.2_

- [ ] 14. Polishing and testing
  - [ ] 14.1 Fix responsive layout issues
    - Test on various viewport sizes
    - Ensure touch interactions work on mobile
    - Verify vertical stacking and horizontal scroll toggle
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 26.1, 26.2_
  
  - [ ] 14.2 Color contrast verification
    - Verify priority colors meet WCAG AA contrast
    - Ensure indicators remain visible on all backgrounds
    - _Requirements: 13.1, 13.3_
  
  - [ ]* 14.3 Write property tests for filter logic
    - **Property 1: Filter round-trip preservation**
    - **Validates: Requirements 1.2, 24.4**
    - **Property 2: Kanban status consistency**
    - **Validates: Requirements 11.1, 11.2, 12.2, 15.3**
    - **Property 8: Urgency threshold correctness**
    - **Validates: Requirements 25.1, 25.2, 25.3, 25.4**

- [ ] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Component tests validate specific behaviors and edge cases
- Accessibility features use standard ARIA patterns and keyboard navigation (Cmd/Ctrl + arrows)
- Responsive design targets mobile (< 768px) and desktop (> 768px) breakpoints
- Mobile Kanban: vertical stacking by default with horizontal scroll toggle
- Drag-and-drop uses Pointer Events API for cross-platform support
- Categories stored in localStorage only (no Supabase sync for MVP)
- Validation: description max 500 chars, tags max 50 chars
- Filter logic: OR for same type (priority, tags), AND for different types

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1", "4.1", "5.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.2", "4.2", "5.2", "6.1", "6.3", "7.1"] },
    { "id": 2, "tasks": ["6.2", "7.2", "7.3", "8.1", "9.1", "10.1"] },
    { "id": 3, "tasks": ["8.2", "8.3", "9.2", "10.2", "11.1"] },
    { "id": 4, "tasks": ["11.2", "12.1", "12.2", "13.1", "13.2"] },
    { "id": 5, "tasks": ["12.3", "14.1", "14.2", "14.3"] },
    { "id": 6, "tasks": ["15"] }
  ]
}
```