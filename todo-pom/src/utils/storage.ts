import type { AppState, PomodoroPhase, Task } from '../types'
import { STORAGE_KEY } from './constants'

const PHASES: readonly PomodoroPhase[] = [
  'idle',
  'work',
  'break',
  'paused-work',
  'paused-break',
]

function isTimerState(value: unknown): value is { phase: string; secondsLeft: number } {
  if (!value || typeof value !== 'object') return false
  const state = value as Record<string, unknown>
  return (
    typeof state.phase === 'string' &&
    typeof state.secondsLeft === 'number'
  )
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
    (task.timerState === null || isTimerState(task.timerState))
  )
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const state = value as Record<string, unknown>
  if (!Array.isArray(state.tasks) || !state.tasks.every(isTask)) return false
  if (!state.pomodoro || typeof state.pomodoro !== 'object') return false
  const pomodoro = state.pomodoro as Record<string, unknown>
  return (
    (pomodoro.taskId === null || typeof pomodoro.taskId === 'string') &&
    typeof pomodoro.phase === 'string' &&
    PHASES.includes(pomodoro.phase as PomodoroPhase) &&
    typeof pomodoro.secondsLeft === 'number'
  )
}

function toSerializable(state: AppState): AppState {
  return {
    tasks: state.tasks,
    pomodoro: {
      taskId: state.pomodoro.taskId,
      phase: state.pomodoro.phase,
      secondsLeft: state.pomodoro.secondsLeft,
    },
  }
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
    return toSerializable(parsed)
  } catch {
    return null
  }
}
