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
  timer_state: import('./database').Json | null
}
