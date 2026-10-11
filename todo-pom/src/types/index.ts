/**
 * Type definitions for todo-pom
 */

export const DEFAULT_TASK_CATEGORIES = ['Work', 'Personal', 'Study', 'Health', 'Other'] as const
export const DEFAULT_TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
export const KANBAN_STATUSES = ['todo', 'in-progress', 'done'] as const

export type TaskCategory = (typeof DEFAULT_TASK_CATEGORIES)[number] | (string & {})
export type TaskPriority = (typeof DEFAULT_TASK_PRIORITIES)[number]
export type TaskStatus = (typeof KANBAN_STATUSES)[number]
export type TaskViewMode = 'list' | 'kanban'
export type DueDateFilter = 'all' | 'no-due-date' | 'today' | 'this-week' | 'this-month' | 'overdue'

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
  completedAt: number | null
  pomodoroCount: number
  timerState: TimerState | null
  category: TaskCategory
  priority: TaskPriority
  description: string
  dueDate: string | null
  tags: string[]
  status: TaskStatus
}

export interface TaskFilterState {
  category: string | null
  priority: TaskPriority[]
  dueDate: DueDateFilter
  tags: string[]
}

export type PomodoroPhase = 'idle' | 'work' | 'break' | 'paused-work' | 'paused-break'

export interface TimerState {
  phase: PomodoroPhase
  secondsLeft: number
  isRunning?: boolean
}

export interface PomodoroState {
  taskId: string | null
  phase: PomodoroPhase
  secondsLeft: number
  intervalId: number | null
}

export interface AppState {
  tasks: Task[]
  pomodoro: Omit<PomodoroState, 'intervalId'>
  categories?: string[]
  viewMode?: TaskViewMode
  filters?: TaskFilterState
}

// Supabase types
export type SupabaseTask = {
  id: string
  title: string
  completed: boolean | null
  created_at: string | null
  completed_at: string | null
  pomodoro_count: number | null
  timer_state: { phase: PomodoroPhase; secondsLeft: number } | null
  category?: string | null
  priority?: string | null
  description?: string | null
  due_date?: string | null
  tags?: string[] | null
  status?: string | null
}

export function normalizeTask(task: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    id: task.id,
    title: task.title,
    completed: Boolean(task.completed),
    createdAt: task.createdAt ?? Date.now(),
    completedAt: task.completedAt ?? null,
    pomodoroCount: task.pomodoroCount ?? 0,
    timerState: task.timerState ?? null,
    category: typeof task.category === 'string' && task.category.trim().length > 0 ? task.category : 'Other',
    priority: task.priority === 'Low' || task.priority === 'Medium' || task.priority === 'High' || task.priority === 'Critical' ? task.priority : 'Medium',
    description: typeof task.description === 'string' ? task.description : '',
    dueDate: typeof task.dueDate === 'string' && task.dueDate.length > 0 ? task.dueDate : null,
    tags: Array.isArray(task.tags) ? task.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    status: task.status === 'todo' || task.status === 'in-progress' || task.status === 'done' ? task.status : 'todo',
  }
}

// Utility functions to convert between Supabase and app types
export function mapSupabaseTaskToApp(task: SupabaseTask): Task {
  return normalizeTask({
    id: task.id,
    title: task.title,
    completed: task.completed ?? false,
    createdAt: task.created_at ? new Date(task.created_at).getTime() : Date.now(),
    completedAt: task.completed_at ? new Date(task.completed_at).getTime() : null,
    pomodoroCount: task.pomodoro_count ?? 0,
    timerState: task.timer_state as TimerState | null,
    category: task.category ?? 'Other',
    priority: (task.priority as TaskPriority | undefined) ?? 'Medium',
    description: task.description ?? '',
    dueDate: task.due_date ?? null,
    tags: Array.isArray(task.tags) ? task.tags : [],
    status: (task.status as TaskStatus | undefined) ?? 'todo',
  })
}

export function mapAppTaskToSupabase(task: Task): SupabaseTask {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    created_at: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
    completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    pomodoro_count: task.pomodoroCount,
    timer_state: task.timerState,
    category: task.category,
    priority: task.priority,
    description: task.description,
    due_date: task.dueDate,
    tags: task.tags,
    status: task.status,
  }
}
