import type { AppState, PomodoroPhase, Task, TaskFilterState, TaskPriority, TaskStatus, TaskViewMode } from '../types'
import { DEFAULT_TASK_CATEGORIES, DEFAULT_TASK_PRIORITIES } from '../types'
import { STORAGE_KEY } from './constants'

const PHASES: readonly PomodoroPhase[] = [
  'idle',
  'work',
  'break',
  'paused-work',
  'paused-break',
]

const DEFAULT_FILTERS: TaskFilterState = {
  category: null,
  priority: [],
  dueDate: 'all',
  tags: [],
}

function isTimerState(value: unknown): value is { phase: string; secondsLeft: number } {
  if (!value || typeof value !== 'object') return false
  const state = value as Record<string, unknown>
  return typeof state.phase === 'string' && typeof state.secondsLeft === 'number'
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false
  const task = value as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.createdAt === 'number' &&
    (task.completedAt === null || typeof task.completedAt === 'number') &&
    typeof task.pomodoroCount === 'number' &&
    (task.timerState === null || isTimerState(task.timerState)) &&
    (task.category === undefined || typeof task.category === 'string') &&
    (task.priority === undefined || typeof task.priority === 'string') &&
    (task.description === undefined || typeof task.description === 'string') &&
    (task.dueDate === undefined || task.dueDate === null || typeof task.dueDate === 'string') &&
    (task.tags === undefined || Array.isArray(task.tags)) &&
    (task.status === undefined || typeof task.status === 'string')
  )
}

function sanitizeCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_TASK_CATEGORIES]
  return value.filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
}

function sanitizeViewMode(value: unknown): TaskViewMode {
  return value === 'kanban' ? 'kanban' : 'list'
}

function sanitizeFilters(value: unknown): TaskFilterState {
  if (!value || typeof value !== 'object') return { ...DEFAULT_FILTERS }
  const filters = value as Record<string, unknown>
  const priorities = Array.isArray(filters.priority)
    ? filters.priority.filter((entry): entry is TaskPriority => typeof entry === 'string' && DEFAULT_TASK_PRIORITIES.includes(entry as TaskPriority))
    : []
  const tags = Array.isArray(filters.tags)
    ? filters.tags.filter((tag): tag is string => typeof tag === 'string')
    : []
  return {
    category: typeof filters.category === 'string' && filters.category.length > 0 ? filters.category : null,
    priority: priorities,
    dueDate: ['all', 'no-due-date', 'today', 'this-week', 'this-month', 'overdue'].includes(String(filters.dueDate))
      ? String(filters.dueDate) as TaskFilterState['dueDate']
      : 'all',
    tags,
  }
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const state = value as Record<string, unknown>
  if (!Array.isArray(state.tasks) || !state.tasks.every(isTask)) return false
  if (!state.pomodoro || typeof state.pomodoro !== 'object') return false
  const pomodoro = state.pomodoro as Record<string, unknown>
  if (
    (pomodoro.taskId === null || typeof pomodoro.taskId === 'string') &&
    typeof pomodoro.phase === 'string' &&
    PHASES.includes(pomodoro.phase as PomodoroPhase) &&
    typeof pomodoro.secondsLeft === 'number'
  ) {
    return true
  }
  return false
}

function toSerializable(state: AppState): AppState {
  const serialized: AppState = {
    tasks: state.tasks,
    pomodoro: {
      taskId: state.pomodoro.taskId,
      phase: state.pomodoro.phase,
      secondsLeft: state.pomodoro.secondsLeft,
    },
  }

  if (Array.isArray(state.categories)) {
    serialized.categories = state.categories
  }
  if (state.viewMode) {
    serialized.viewMode = sanitizeViewMode(state.viewMode)
  }
  if (state.filters) {
    serialized.filters = sanitizeFilters(state.filters)
  }

  return serialized
}

/**
 * Serializes AppState to localStorage, excluding intervalId.
 * Throws if the write fails so callers can surface a warning.
 */
export function saveState(state: AppState): void {
  const payload = JSON.stringify(toSerializable(state))
  localStorage.setItem(STORAGE_KEY, payload)
}

/**
 * Reads AppState from localStorage.
 * Returns null when empty, corrupt, or unreadable.
 */
export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isAppState(parsed)) return null

    const result: AppState = {
      tasks: parsed.tasks.map((task) => ({ ...task })),
      pomodoro: {
        taskId: parsed.pomodoro.taskId,
        phase: parsed.pomodoro.phase,
        secondsLeft: parsed.pomodoro.secondsLeft,
      },
    }

    if (Array.isArray(parsed.categories)) {
      result.categories = sanitizeCategories(parsed.categories)
    }
    if (parsed.viewMode !== undefined) {
      result.viewMode = sanitizeViewMode(parsed.viewMode)
    }
    if (parsed.filters !== undefined) {
      result.filters = sanitizeFilters(parsed.filters)
    }

    return result
  } catch {
    return null
  }
}
