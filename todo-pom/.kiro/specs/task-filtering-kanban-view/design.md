# Design Document: Task Filtering and Kanban View

*A feature to enhance the todo-pom application with comprehensive task filtering and a visual Kanban board view.*

---

## Architecture Overview

### Layer Separation

| Layer | Location | Purpose |
|-------|----------|---------|
| **Presentational** | `src/components/filter/`, `src/components/kanban/` | UI components for filters and Kanban board |
| **State** | `src/stores/todoStore.ts` | Extended Pinia store with filter and view state |
| **Effects** | `src/composables/useDragAndDrop.ts` | Drag-and-drop interaction layer |
| **Utilities** | `src/utils/filter.ts`, `src/utils/kanban.ts` | Pure functions for filtering and view logic |
| **Types** | `src/types/index.ts` | Extended interfaces for new fields |

### Extended State Structure

The existing Pinia store will be extended with new state for filters, categories, and view mode:

```typescript
interface AppState {
  tasks: Task[]
  pomodoro: Omit<PomodoroState, 'intervalId'>
  categories?: string[]           // Extended: user-defined categories
  viewMode?: TaskViewMode         // Extended: 'list' | 'kanban'
  filters?: TaskFilterState       // Extended: filter configuration
}
```

### Persistence Strategy

- **localStorage key**: `STORAGE_KEY = 'todo-pom-state'` (existing)
- **Extended state**: categories, viewMode, filters
- **Excluded from serialization**: Runtime-only properties (intervalId)

---

## 1. Architecture Updates

### 1.1 Pinia Store Extensions

**File**: `src/stores/todoStore.ts`

**New state fields**:
- `categories`: `ref<string[]>` — User-defined task categories (localStorage only)
- `viewMode`: `ref<TaskViewMode>` — Current view mode ('list' | 'kanban')
- `filters`: `ref<TaskFilterState>` — Active filter configuration

**Computed properties**:
- `filteredTasks`: Already exists, extends to include new filter criteria
- `activeTasks`: Filtered tasks excluding completed
- `completedTasks`: Filtered tasks that are completed
- `kanbanColumns`: `computed(() => ({ todo, in-progress, done }))` — Tasks grouped by Kanban status

**New methods**:
- `addCategory(name: string): string | null` — Add a custom category (localStorage only)
- `setTaskStatus(id: string, nextStatus: TaskStatus): void` — Update task Kanban status
- `_correctHiddenTime()` — Already exists, ensures timer accuracy

**Updated methods**:
- `addTask()` — Extended to accept category, priority, description, dueDate, tags; default status is 'todo'
- `editTask()` — Extended to update all new fields with validation
- `_persist()` — Extended to persist categories, viewMode, filters (no Supabase sync for categories)

**Supabase sync**:
- Extended `mapAppTaskToSupabase()` to include new fields
- Extended `normalizeTask()` with default values for new fields (default status: 'todo')
- Categories sync: localStorage only (no Supabase categories table for MVP)

### 1.2 New Composables

**File**: `src/composables/useFilterLogic.ts`

**Purpose**: Encapsulate filter chip display and removal UI state

**Public API**:
```typescript
export interface UseFilterLogicReturn {
  activeFilterChips: Ref<FilterChip[]>
  addFilterChip: (filterType: FilterType, value: string | TaskPriority | DueDateFilter) => void
  removeFilterChip: (index: number) => void
  clearAllFilters: () => void
}
```

**Purpose**: Encapsulate filter UI state only (store handles filtering logic)

**Implementation notes**:
- Store handles filter logic (computed properties in store)
- Composable only manages active filter chips display
- Filter logic remains in Pinia store as computed properties

### 1.3 Component Structure

**New directories**:
- `src/components/filter/` — Filter UI components
- `src/components/kanban/` — Kanban board components

**Component hierarchy**:

```
src/components/
├── filter/
│   ├── FilterBar.vue           # Main filter controls
│   ├── FilterChip.vue          # Active filter badge
│   ├── CategoryFilter.vue      # Category dropdown/chips
│   ├── PriorityFilter.vue      # Priority multi-select
│   ├── DueDateFilter.vue       # Due date range selector
│   ├── TagFilter.vue           # Tag input and selection
│   └── FilterSection.vue       # Collapsible filter section
├── kanban/
│   ├── KanbanBoard.vue         # Main Kanban container
│   ├── KanbanColumn.vue        # Individual column component
│   ├── KanbanTask.vue          # Task in Kanban view
│   └── TaskDragGhost.vue       # Drag placeholder visual
├── TaskDetails.vue             # Extended task details (modal or inline)
└── ViewToggle.vue              # List/Kanban toggle button
```

---

## 2. Data Model Extensions

### 2.1 Extended Task Interface

**File**: `src/types/index.ts`

```typescript
export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
  completedAt: number | null
  pomodoroCount: number
  timerState: TimerState | null
  // NEW FIELDS
  category: TaskCategory        // Extended: user category
  priority: TaskPriority        // NEW: task importance level
  description: string           // NEW: detailed description
  dueDate: string | null        // NEW: ISO date string
  tags: string[]                // NEW: user-defined labels
  status: TaskStatus            // NEW: Kanban status (default: 'todo')
}
```

### 2.2 New Type Definitions

**Categories**:
```typescript
export const DEFAULT_TASK_CATEGORIES = ['Work', 'Personal', 'Study', 'Health', 'Other'] as const
export type TaskCategory = (typeof DEFAULT_TASK_CATEGORIES)[number] | (string & {})
```

**Priorities**:
```typescript
export const DEFAULT_TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
export type TaskPriority = (typeof DEFAULT_TASK_PRIORITIES)[number]
```

**Due Date Filters**:
```typescript
export type DueDateFilter = 
  | 'all' 
  | 'no-due-date' 
  | 'today' 
  | 'this-week' 
  | 'this-month' 
  | 'overdue'
```

**Kanban Statuses**:
```typescript
export const KANBAN_STATUSES = ['todo', 'in-progress', 'done'] as const
export type TaskStatus = (typeof KANBAN_STATUSES)[number]
```

**View Modes**:
```typescript
export type TaskViewMode = 'list' | 'kanban'
```

### 2.3 Filter State Management

**Extended Filter State**:
```typescript
export interface TaskFilterState {
  category: string | null          // Selected category (null = all)
  priority: TaskPriority[]         // Selected priorities (empty = all)
  dueDate: DueDateFilter           // Due date filter
  tags: string[]                   // Selected tags (empty = all)
}
```

**Default Filters**:
```typescript
const DEFAULT_FILTERS: TaskFilterState = {
  category: null,
  priority: [],
  dueDate: 'all',
  tags: [],
}
```

### 2.4 Supabase Schema Updates

**File**: `src/types/database.ts` (new)

```typescript
// New columns for tasks table
export type SupabaseTask = {
  id: string
  title: string
  completed: boolean | null
  created_at: string | null
  completed_at: string | null
  pomodoro_count: number | null
  timer_state: { phase: PomodoroPhase; secondsLeft: number } | null
  // NEW FIELDS
  category?: string | null
  priority?: string | null
  description?: string | null
  due_date?: string | null
  tags?: string[] | null
  status?: string | null
}

// Categories are stored in localStorage only (no categories table for MVP)
// If categories need full CRUD, create categories table
// For MVP: categories stored in localStorage alongside tasks
```

**Migration Strategy**:
- New tasks automatically include all fields with defaults
- Existing tasks: `normalizeTask()` handles missing fields
- Sync to Supabase: only inserts tasks that don't exist remotely

---

## 3. Component Design

### 3.1 Filter UI Components

**FilterBar.vue** — Main filter container
- Toggle filter section visibility
- Display active filter chips
- Provide filter editor access

**FilterChip.vue** — Active filter badge
- Visual indicator for each active filter
- Click to re-open filter editor with that filter pre-selected
- X button to remove individual filter

**CategoryFilter.vue**
- Dropdown with existing categories
- Custom category input field
- Multi-select or single-select based on UX preference

**PriorityFilter.vue**
- Multi-select checkboxes or toggle buttons
- Visual priority indicators (color-coded)
- "Any" option to reset filter

**DueDateFilter.vue**
- Dropdown with predefined ranges
- Custom date range picker (optional)
- Visual urgency indicators

**TagFilter.vue**
- Tag input with autocomplete
- Top 10 suggestions ordered by recent usage frequency
- "Create new tag" option when no matches
- Multi-select tag chips

### 3.2 Kanban Board Component

**KanbanBoard.vue**
- Horizontal scroll container for multiple columns
- Responsive: stack vertically on mobile (< 768px)
- Draggable container for task reordering
- Drop zones for each column

**KanbanColumn.vue**
- Column header with title and task count
- Drop zone with visual feedback
- Task list within column
- Customizable column order (optional)

**KanbanTask.vue**
- Task card with priority color indicator
- Minimal metadata (title, due date, tags)
- Click to expand details (optional)
- Drag handle for reordering
- Urgency indicator (yellow background + ⏰ icon for tasks due within 24 hours)
- Priority indicator always visible on touch devices (no hover required)

**TaskDetails.vue**
- Modal or inline panel for task details
- Fields: title, category, priority, description, due date, tags
- Edit mode with save/cancel
- Delete button
- Description validation: max 500 chars with error message
- Tag validation: max 50 chars, truncate or error on exceed
- Real-time character count feedback

### 3.3 View Toggle

**ViewToggle.vue**
- Toggle button: list/kanban icons
- Active state indicator
- Persisted across reloads

### 3.4 Responsive Behavior

**Desktop (> 768px)**:
- Kanban board: horizontal layout, all columns visible
- Filter section: horizontal layout with dropdowns

**Mobile (< 768px)**:
- Kanban board: stack columns vertically by default, with horizontal scroll toggle
- Filter section: collapsible section
- View toggle: always visible
- Touch-friendly drop zones (min 44px height)
- Mobile drag & drop fallback: column selection dropdown or long-press modal

**Touch Support**:
- Pointer Events for drag-and-drop on desktop
- Long-press gesture detection on mobile using Pointer Events API (touchstart/touchend timing >= 500ms)
- Alternative interaction methods: dropdown selection or modal for touch devices
- Keyboard shortcuts: Cmd/Ctrl + arrows (not Alt on macOS for VoiceOver)

**Touch Detection Strategy**:
- Use Pointer Events `touchstart` and `touchend` events to detect touch capability
- Long-press detection: timeout >= 500ms on pointerdown with touch events
- If touchstart fires before timeout: not a long-press
- If timeout fires first: show modal with column options

**Component Structure**:
- `TaskColumnSelector.vue` in `src/components/kanban/` — Dropdown with all columns
- `TaskLongPressModal.vue` in `src/components/kanban/` — Modal with column options

---

## 4. Interaction Design

### 4.1 Drag and Drop Strategy

**API Choice**: Pointer Events (not HTML5 Drag & Drop)
- Pros: Cross-platform (mouse + touch), custom visuals, better mobile support
- Cons: More implementation work

**Implementation**:
1. **Pointer down** on task → Set dragging state, show drag ghost
2. **Pointer move** → Move ghost with pointer
3. **Pointer over column** → Highlight drop zone
4. **Pointer up** → Drop task, update status
5. **Escape key** → Cancel drag

**Touch Device Fallback**:
- Detect touch capability using Pointer Events API (`touchstart` event)
- If touch detected, show long-press modal after 500ms timeout
- Long-press detection: timeout >= 500ms on pointerdown with touch events
- Modal provides column options for task movement
- Alternative: column selection dropdown for each task

**Visual Feedback**:
- Drag ghost: semi-transparent task clone
- Drop zone: dashed border with highlight
- Not allowed: "not-allowed" cursor, red indicator

**Accessibility**:
- Keyboard shortcuts: arrow keys to move between columns
- ARIA labels: "Drag task to column"
- Screen reader: announce drag start/end, column drop

### 4.2 Filter Application Logic

**Filter function** (in store):
```typescript
const filteredTasks = computed(() => {
  return [...tasks.value]
    .filter((task) => {
      // Category filter (AND logic with other filter types)
      if (filters.value.category && task.category !== filters.value.category) return false
      // Priority filter (OR logic - multi-select)
      if (filters.value.priority.length > 0 && 
          !filters.value.priority.includes(task.priority)) return false
      // Due date filter (AND logic with other filter types)
      if (!matchesDueDateFilter(task, filters.value.dueDate)) return false
      // Tag filter (OR logic - multi-select)
      if (filters.value.tags.length > 0 && 
          !filters.value.tags.some((tag) => task.tags.includes(tag))) return false
      return true
    })
    .sort((a, b) => b.createdAt - a.createdAt)
})
```

**AND/OR Logic**:
- Same filter type (priority, tags): OR logic - match ANY selected
- Different filter types (category + priority): AND logic - match ALL selected
- Order: category (AND) → priority (OR) → due date (AND) → tags (OR)

### 4.3 View Toggle Mechanism

**State**: `viewMode: Ref<TaskViewMode>`
- Default: 'list'
- Toggled via `ViewToggle.vue` component
- Persisted to localStorage on change

**Implementation**:
```typescript
function toggleViewMode(): void {
  viewMode.value = viewMode.value === 'list' ? 'kanban' : 'list'
}
```

### 4.4 Keyboard Navigation

**Kanban View**:
- `Tab`: Navigate between columns
- `Enter`: Select task
- `Cmd/Ctrl + Arrow Left/Right`: Move between columns (avoid Alt on macOS for VoiceOver compatibility)
- `Space`: Toggle task completion
- `Esc`: Cancel drag operation

**Filter Section**:
- `Tab`: Navigate between filter controls
- `Enter`: Apply filter
- `Escape`: Close filter editor

**ARIA Support**:
- `aria-label`: "Kanban board", "To Do column"
- `role="grid"`: Kanban board
- `role="gridcell"`: Task cards
- `draggable="true"`: Task cards

**Accessibility Testing**:
- Verified with VoiceOver on iOS Safari
- Keyboard navigation works without mouse
- Screen reader announces drag operations and column drops

---

## 5. State Persistence

### 5.1 localStorage Structure

**Extended State**:
```typescript
interface AppState {
  tasks: Task[]
  pomodoro: { taskId: string | null; phase: PomodoroPhase; secondsLeft: number }
  categories?: string[]           // NEW
  viewMode?: TaskViewMode         // NEW
  filters?: TaskFilterState       // NEW
}
```

**Storage Key**: `'todo-pom-state'` (existing)

**Serialization Rules**:
- `intervalId`: Excluded (runtime-only)
- `categories`: String array
- `viewMode`: 'list' or 'kanban'
- `filters`: Full filter state object

### 5.2 Category Persistence

**Storage**:
- Categories saved alongside tasks
- Default categories always included
- Custom categories appended

**Migration**:
- If no categories in storage → Use defaults
- If categories exist → Load and merge with defaults

### 5.3 View Mode Persistence

**Storage**:
- Persist user's last viewed mode
- Default to 'list' if no preference

**Loading**:
- Read from storage on startup
- Apply before rendering components

---

## 6. Testing Considerations

### 6.1 Property-Based Tests

**File**: `tests/properties/`

**Property 1: Filter round-trip preservation**
- *For any* valid task list and filter state, applying the filter and then removing it should restore the original list
- **Validates**: Requirements 1.1, 1.2, 2.1, 2.2, 3.1, 4.1, 4.2

**Property 2: Kanban status round-trip**
- *For any* task moved between columns, the status should correctly update and be persisted
- **Validates**: Requirements 11.1, 11.2, 12.1, 12.2

**Property 3: Drag and drop idempotence**
- *For any* task dropped on a column, dropping it again on the same column should not change the status
- **Validates**: Requirements 12.3, 12.4

**Property 4: Priority color mapping**
- *For any* task, the priority level always maps to the same color
- **Validates**: Requirements 13.1, 13.2

### 6.2 Component Tests

**File**: `tests/unit/components/`

**FilterBar.spec.vue**
- Test filter chip display
- Test filter removal
- Test filter editor opening

**KanbanBoard.spec.vue**
- Test column rendering
- Test task drag-and-drop simulation
- Test responsive behavior

**KanbanTask.spec.vue**
- Test priority indicator display
- Test task click handler
- Test accessibility labels

### 6.3 Accessibility Testing

**Points**:
1. All interactive elements focusable with keyboard
2. ARIA labels on Kanban columns
3. Screen reader announces drag operations
4. Color contrast for priority indicators (WCAG AA)
5. Touch targets minimum 44px height

**Test Strategy**:
- Use `@vue/test-utils` with `ariaRole` assertions
- Test focus management
- Verify `aria-*` attributes

---

## 7. Implementation Steps

### Phase 1: Data Model & State
1. Extend `Task` interface with new fields
2. Add type definitions (TaskCategory, TaskPriority, TaskStatus, etc.)
3. Update `normalizeTask()` with defaults for new fields
4. Extend `saveState()` and `loadState()` to persist new state
5. Update Supabase mapping functions

### Phase 2: Store Extensions
1. Add new state fields (categories, viewMode, filters)
2. Implement `addCategory()` method
3. Implement `setTaskStatus()` method
4. Update `addTask()` and `editTask()` to handle new fields
5. Implement Kanban column computed properties

### Phase 3: Filter Components
1. Create FilterBar, FilterChip, FilterSection components
2. Implement CategoryFilter, PriorityFilter, DueDateFilter, TagFilter
3. Connect filters to store state
4. Implement filter chip display and removal

### Phase 4: Kanban Components
1. Create KanbanBoard, KanbanColumn, KanbanTask components
2. Implement drag-and-drop with Pointer Events
3. Add priority color indicators
4. Implement responsive layout

### Phase 5: Integration
1. Add ViewToggle component
2. Connect Kanban view to filtered tasks
3. Implement keyboard navigation
4. Add accessibility attributes

### Phase 6: Testing & Polish
1. Write property tests for filter logic
2. Write component tests for Kanban
3. Test accessibility with screen reader
4. Fix responsive layout issues
5. Final visual polish

---

## 8. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Filter round-trip preservation

*For any* task list, filter state, and filter application, removing all active filters should restore the original task list

**Validates: Requirements 1.2, 2.3, 3.2, 4.3, 19.3**

### Property 2: Kanban status consistency

*For any* task moved between Kanban columns, the task's status field should always match the target column and be persisted correctly

**Validates: Requirements 11.1, 11.2, 12.2, 15.3**

### Property 3: Priority-to-color mapping

*For any* task with a priority level, the visual indicator (color) should always correspond to the priority's defined color:
- Low: `#3b82f6` (blue)
- Medium: `#22c55e` (green)
- High: `#f59e0b` (orange)
- Critical: `#ef4444` (red)

**Validates: Requirements 6.3, 6.4, 13.1, 13.2**

### Property 4: Category uniqueness

*For any* category added to the system, it should appear exactly once in the categories list

**Validates: Requirements 5.3, 18.1, 18.2**

### Property 5: Tag containment

*For any* task with tags, filtering by any of those tags should include the task in results

**Validates: Requirements 4.1, 4.2, 9.1, 9.3**

### Property 6: View mode persistence

*For any* view mode selection, reloading the page should restore the same view mode

**Validates: Requirements 10.2, 15.1, 15.4**

### Property 7: Due date filter correctness

*For any* task with a due date, the filter classification (overdue, today, this-week, etc.) should match the actual date comparison

**Validates: Requirements 3.1, 3.2, 8.3, 17.4**

### Property 8: Urgency threshold correctness

*For any* task with a due date within the next 24 hours and not completed, the urgency indicator (yellow background + ⏰ icon) should be displayed

**Validates: Requirements 25.1, 25.2, 25.3, 25.4**