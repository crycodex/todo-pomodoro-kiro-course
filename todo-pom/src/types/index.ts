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
}

export type PomodoroPhase = 'idle' | 'work' | 'break' | 'paused-work' | 'paused-break'

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
