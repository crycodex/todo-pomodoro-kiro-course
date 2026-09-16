/**
 * Type definitions for todo-pom application
 */

/**
 * Represents a task in the todo list
 */
export interface Task {
  id: string           // UUID v4
  title: string        // non-empty text, max 200 characters
  completed: boolean
  createdAt: number    // Unix timestamp in ms
  completedAt: number | null
  pomodoroCount: number // Pomodoro cycles completed for this task
}

/**
 * Status of a Pomodoro session
 */
export type PomodoroPhase = 'idle' | 'work' | 'break' | 'paused-work' | 'paused-break'

/**
 * Represents a Pomodoro session associated with a task
 */
export interface PomodoroState {
  taskId: string | null
  phase: PomodoroPhase
  secondsLeft: number
  intervalId: number | null
}

/**
 * Complete application state (persisted to localStorage)
 */
export interface AppState {
  tasks: Task[]
  pomodoro: Omit<PomodoroState, 'intervalId'>
}