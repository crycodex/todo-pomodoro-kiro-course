---
inclusion: always
---
# Todo-Pomodoro Project Steering

## Project Overview
A Vue 3 + TypeScript application combining task management (todo) with Pomodoro technique timing. Uses Pinia for state management, localStorage for persistence, and optional Supabase sync.

## Tech Stack
- **Framework**: Vue 3 with Composition API
- **State Management**: Pinia
- **Build Tool**: Vite
- **Testing**: Vitest + @vue/test-utils + fast-check (property-based)
- **Backend**: Supabase (optional, anonymous access for tasks table)

## Architecture Patterns

### Layer Separation
| Layer | Location | Purpose |
|-------|----------|---------|
| **Presentational** | `src/components/` | UI components receiving props, emitting events |
| **State** | `src/stores/` | Pinia stores holding reactive state |
| **Effects** | `src/composables/` | Side effects (timers, notifications) |
| **Utilities** | `src/utils/` | Pure functions, persistence, Supabase client |
| **Types** | `src/types/` | TypeScript interfaces and mappings |

### State Management
- **Single source of truth**: `useTodoStore()` in `src/stores/todoStore.ts`
- **State is persisted**: Automatically synced to localStorage on every change
- **Supabase sync**: Write-only, runs on state changes (no auth required)

### Component Patterns
- Components receive props and emit typed events
- Use `defineProps` and `defineEmits` with explicit types
- Keep components dumb—business logic stays in stores/composables

### Composable Patterns
- Composables encapsulate side effects and reactive logic
- Expose public methods for external control
- Example: `usePomodoro()` exposes `start()`, `pause()`, `resume()`, `cancel()`

## Code Conventions

### TypeScript
- Use explicit types, avoid `any`
- Export interfaces from `src/types/index.ts`
- Supabase types defined in `src/types/database.ts`
- Use utility functions to map between Supabase and app types

### Naming
- **Stores**: `useXxxStore()` (Pinia convention)
- **Composables**: `useXxx()` (Vue convention)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `WORK_DURATION_SECONDS`)
- **Files**: PascalCase for components, camelCase for utilities/composables

### State Mutations
- All state changes happen within the Pinia store
- Composables should call store methods, not mutate state directly
- Timer state is synchronized between `pomodoro` store field and `task.timerState`

### Persistence
- localStorage key: `STORAGE_KEY = 'todo-pom-state'`
- State structure: `{ tasks: Task[]; pomodoro: { taskId, phase, secondsLeft } }`
- `intervalId` is excluded from serialization (runtime-only)

## Pomodoro Timer Conventions

### Phase States
- `idle`: No active timer
- `work`: Active work session (25 min default)
- `break`: Active break session (5 min default)
- `paused-work`: Work session paused
- `paused-break`: Break session paused

### Single Active Timer
- Only one Pomodoro can be active at a time
- Starting a Pomodoro on a new task automatically cancels the previous one
- The timer state is stored both globally (`pomodoro` store field) and per-task (`task.timerState`)

### Time Correction on Visibility Change
- Timer automatically corrects elapsed time when tab becomes visible again
- Event listener: `visibilitychange` in `usePomodoro()` composable

## Testing Strategy

### Property-Based Testing (fast-check)
- Located in `tests/properties/`
- Validates invariants across random inputs
- Run with: `npm run test` (Vitest runs fast-check files)

### Unit Testing (@vue/test-utils)
- Located in `tests/unit/` (create if needed)
- Mount components with test utils
- Mock external dependencies (notifications, Supabase)

### Key Properties to Validate
1. Empty titles rejected by `addTask`
2. Each valid `addTask` call increments task list by 1
3. Only one active Pomodoro at a time
4. Pomodoro counter is monotonic (never decreases)
5. Completing a task cancels its Pomodoro
6. Timer state syncs between global and task-level
7. Format `MM:SS` for all valid second values (0–1500)

## Supabase Integration

### Environment Variables (required for sync)
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### Sync Behavior
- Writes only (no reads from Supabase)
- Inserts new tasks that don't exist remotely
- Runs automatically on every state change via Pinia watch
- Graceful degradation if credentials missing

### Database Schema
Table: `tasks`
- `id` (text, primary key)
- `title` (text)
- `completed` (boolean)
- `created_at` (timestamp)
- `completed_at` (timestamp)
- `pomodoro_count` (integer)
- `timer_state` (jsonb)

## Design Principles

1. **Separation of Concerns**: State, effects, and UI are decoupled
2. **Reactive First**: Vue's reactivity system drives UI updates
3. **Durability**: State persisted locally, optionally synced to cloud
4. **Type Safety**: Full TypeScript coverage, no implicit `any`
5. **Testability**: Business logic isolated in pure functions and stores
6. **Graceful Degradation**: Works without Supabase, no auth required

