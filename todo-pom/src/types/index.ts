/**
 * Type definitions for todo-pom
 */

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
  completedAt: number | null
  pomodoroCount: number
  timerState: TimerState | null
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
}

// Supabase types
export type SupabaseTask = {
  id: string
  owner_id: string
  title: string
  completed: boolean | null
  created_at: string | null
  completed_at: string | null
  pomodoro_count: number | null
  timer_state: { phase: string; secondsLeft: number } | null
}

// Utility functions to convert between Supabase and app types
export function mapSupabaseTaskToApp(task: SupabaseTask): Task {
  return {
    id: task.id,
    title: task.title,
    completed: task.completed ?? false,
    createdAt: task.created_at ? new Date(task.created_at).getTime() : Date.now(),
    completedAt: task.completed_at ? new Date(task.completed_at).getTime() : null,
    pomodoroCount: task.pomodoro_count ?? 0,
    timerState: task.timer_state as TimerState | null,
  }
}

export function mapAppTaskToSupabase(task: Task): SupabaseTask {
  return {
    id: task.id,
    owner_id: '', // Will be set by auth
    title: task.title,
    completed: task.completed,
    created_at: task.createdAt ? new Date(task.createdAt).toISOString() : new Date().toISOString(),
    completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    pomodoro_count: task.pomodoroCount,
    timer_state: task.timerState,
  }
}
