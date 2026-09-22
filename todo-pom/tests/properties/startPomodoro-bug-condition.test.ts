/**
 * Bug condition test for startPomodoro timerState restoration
 *
 * Bug: startPomodoro() always resets the timer to 25 minutes (WORK_DURATION_SECONDS)
 * ignoring if the task already has a saved timerState.
 *
 * Expected behavior: When startPomodoro(taskId) is called on a task with existing
 * timerState, the pomodoro.state should restore phase and secondsLeft from timerState.
 *
 * This test SHOULD FAIL on unfixed code - failure confirms the bug exists.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodoStore } from '../../src/stores/todoStore'
import { WORK_DURATION_SECONDS } from '../../src/utils/constants'
import type { TimerState } from '../../src/types'

describe('startPomodoro timerState restoration bug', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    useTodoStore().cancelPomodoro()
    vi.useRealTimers()
  })

  it('should restore phase and secondsLeft from task timerState when starting pomodoro', () => {
    const store = useTodoStore()
    store.addTask('Test task')
    const taskId = store.tasks[0]!.id

    // Simulate a task that already has timerState from previous session
    // For example: user was in the middle of a 15-minute work session (900 seconds left)
    const existingTimerState: TimerState = {
      phase: 'work',
      secondsLeft: 900, // 15 minutes remaining
    }
    store.tasks[0]!.timerState = existingTimerState

    // When startPomodoro is called with this task
    store.startPomodoro(taskId)

    // Then pomodoro.state should restore FROM the timerState, NOT reset to 25 minutes
    expect(store.pomodoro.phase).toBe('work')
    expect(store.pomodoro.secondsLeft).toBe(900)
  })

  it('should restore break phase timerState when resuming from existing state', () => {
    const store = useTodoStore()
    store.addTask('Break task')
    const taskId = store.tasks[0]!.id

    // Task has a break phase with 120 seconds remaining
    const existingTimerState: TimerState = {
      phase: 'break',
      secondsLeft: 120, // 2 minutes remaining
    }
    store.tasks[0]!.timerState = existingTimerState

    store.startPomodoro(taskId)

    expect(store.pomodoro.phase).toBe('break')
    expect(store.pomodoro.secondsLeft).toBe(120)
  })

  it('should initialize fresh timerState when task has no existing timerState', () => {
    const store = useTodoStore()
    store.addTask('Fresh task')
    const taskId = store.tasks[0]!.id

    // Task has no existing timerState
    expect(store.tasks[0]!.timerState).toBeNull()

    store.startPomodoro(taskId)

    // Should initialize to default work session
    expect(store.pomodoro.phase).toBe('work')
    expect(store.pomodoro.secondsLeft).toBe(WORK_DURATION_SECONDS)
  })
})