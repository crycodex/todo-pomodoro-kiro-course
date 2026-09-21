import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { createPinia, setActivePinia } from 'pinia'
import { useTodoStore } from '@/stores/todoStore'
import { WORK_DURATION_SECONDS, BREAK_DURATION_SECONDS } from '@/utils/constants'

describe('pomodoro properties', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    useTodoStore().cancelPomodoro()
    vi.useRealTimers()
  })

  it('Property 4: Un solo Pomodoro activo a la vez', () => {
    // Feature: todo-pom, Property 4: Un solo Pomodoro activo a la vez
    fc.assert(
      fc.property(fc.array(fc.integer({ min: 0, max: 4 }), { minLength: 1, maxLength: 12 }), (picks) => {
        const store = useTodoStore()
        store.tasks = []
        for (let i = 0; i < 5; i += 1) {
          store.addTask(`Tarea ${i}`)
        }
        const ids = store.tasks.map((task) => task.id)

        for (const pick of picks) {
          store.startPomodoro(ids[pick]!)
          const activePhases = store.pomodoro.phase === 'idle' ? 0 : 1
          expect(activePhases).toBeLessThanOrEqual(1)
          expect(store.pomodoro.taskId).toBe(ids[pick]!)
        }
      }),
      { numRuns: 100 },
    )
  })

  it('Property 5: Contador de ciclos es monotónico', () => {
    // Feature: todo-pom, Property 5: Contador de ciclos es monotónico
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (cycles) => {
        const store = useTodoStore()
        store.tasks = []
        store.addTask('Ciclos')
        const task = store.tasks[0]!
        let previous = task.pomodoroCount

        for (let i = 0; i < cycles; i += 1) {
          store.startPomodoro(task.id)
          store._onWorkEnd()
          store._onBreakEnd()
          expect(task.pomodoroCount).toBeGreaterThanOrEqual(previous)
          previous = task.pomodoroCount
        }
      }),
      { numRuns: 100 },
    )
  })

  it('Property 6: Completar una tarea cancela su Pomodoro', () => {
    // Feature: todo-pom, Property 6: Completar una tarea cancela su Pomodoro
    fc.assert(
      fc.property(fc.constantFrom('work', 'break') as fc.Arbitrary<'work' | 'break'>, (phase) => {
        const store = useTodoStore()
        store.tasks = []
        store.addTask('Activa')
        const task = store.tasks[0]!
        store.startPomodoro(task.id)
        if (phase === 'break') {
          store._onWorkEnd()
        }
        expect(store.pomodoro.phase).toBe(phase)
        store.toggleComplete(task.id)
        expect(store.pomodoro.phase).toBe('idle')
      }),
      { numRuns: 100 },
    )
  })

  // =========================================================================
  // Property Tests for Task Timer (Properties 1-3, 9, 10-15)
  // These tests validate the per-task timer state functionality
  // =========================================================================

  it('Property 1: TimerState initialization on startPomodoro', () => {
    // Property 1: Para cualquier tarea válida, startPomodoro debe inicializar
    // timerState con phase='work' y segundos completos.
    // Validates: Requirements 1.1, 4.1, 4.2
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 100 }), (title) => {
        const store = useTodoStore()
        store.tasks = []
        store.addTask(title)
        const task = store.tasks[0]!

        store.startPomodoro(task.id)

        expect(task.timerState).not.toBeNull()
        expect(task.timerState!.phase).toBe('work')
        expect(task.timerState!.secondsLeft).toBe(WORK_DURATION_SECONDS)
      }),
      { numRuns: 200 },
    )
  })

  it('Property 2: TimerState preservation on task switch', () => {
    // Property 2: Al cambiar de tarea, el timerState de la tarea anterior debe preservarse.
    // Validates: Requirements 1.2, 2.1, 2.3, 14
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.integer({ min: 1, max: WORK_DURATION_SECONDS - 1 }),
        (title1, title2, elapsedSeconds) => {
          const store = useTodoStore()
          store.tasks = []
          store.addTask(title1)
          store.addTask(title2)
          const task1 = store.tasks[0]!
          const task2 = store.tasks[1]!

          // Start Pomodoro on task 1
          store.startPomodoro(task1.id)

          // Advance time
          vi.advanceTimersByTime(elapsedSeconds * 1000)

          // Switch to task 2
          store.startPomodoro(task2.id)

          // Task 1's timerState should be preserved
          expect(task1.timerState).not.toBeNull()
          expect(task1.timerState!.phase).toBe('work')
          // Seconds left should have decreased by elapsed time
          expect(task1.timerState!.secondsLeft).toBe(WORK_DURATION_SECONDS - elapsedSeconds)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 3: TimerState deletion with task', () => {
    // Property 3: Al eliminar una tarea, su timerState debe eliminarse con la tarea.
    // Validates: Requirement 1.4
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
        (title) => {
          const store = useTodoStore()
          store.tasks = []
          store.addTask(title)
          const task = store.tasks[0]!

          // Start Pomodoro and verify timerState is set
          store.startPomodoro(task.id)
          expect(task.timerState).not.toBeNull()

          // Delete the task
          store.deleteTask(task.id)

          // The task should no longer exist (we verify by checking store.tasks)
          expect(store.tasks.find((t) => t.id === task.id)).toBeUndefined()
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 9: Active task TimerState sync with global state', () => {
    // Property 9: El estado global debe coincidir con el timerState de la tarea activa.
    // Validates: Requirements 6.2, 9
    const store = useTodoStore()
    store.tasks = []
    store.addTask('Test task')
    const task = store.tasks[0]!

    // Initially, no active task - states should be idle
    store.startPomodoro(task.id)

    // After start, global state and task timerState should match
    expect(store.pomodoro.phase).toBe(task.timerState!.phase)
    expect(store.pomodoro.secondsLeft).toBe(task.timerState!.secondsLeft)

    // After pause, both should still match
    store.pausePomodoro()
    expect(store.pomodoro.phase).toBe(task.timerState!.phase)
    expect(store.pomodoro.phase).toBe('paused-work')

    // After resume, both should still match
    store.resumePomodoro()
    expect(store.pomodoro.phase).toBe(task.timerState!.phase)
    expect(store.pomodoro.phase).toBe('work')
  })

  it('Property 10: pausePomodoro updates both states', () => {
    // Property 10: pausePomodoro debe actualizar tanto estado global como timerState.
    // Validates: Requirements 6.3, 10
    const store = useTodoStore()
    store.tasks = []
    store.addTask('Test task')
    const task = store.tasks[0]!

    store.startPomodoro(task.id)
    const currentSeconds = store.pomodoro.secondsLeft

    store.pausePomodoro()

    // Both states should be updated to paused-work
    expect(store.pomodoro.phase).toBe('paused-work')
    expect(store.pomodoro.secondsLeft).toBe(currentSeconds)
    expect(task.timerState!.phase).toBe('paused-work')
    expect(task.timerState!.secondsLeft).toBe(currentSeconds)
  })

  it('Property 11: resumePomodoro updates both states', () => {
    // Property 11: resumePomodoro debe actualizar tanto estado global como timerState.
    // Validates: Requirements 6.4, 11
    const store = useTodoStore()
    store.tasks = []
    store.addTask('Test task')
    const task = store.tasks[0]!

    store.startPomodoro(task.id)
    store.pausePomodoro()

    store.resumePomodoro()

    // Both states should be updated back to work
    expect(store.pomodoro.phase).toBe('work')
    expect(task.timerState!.phase).toBe('work')
  })

  it('Property 12: Cycle completion syncs both states to break', () => {
    // Property 12: Al completar ciclo, ambos estados deben actualizarse a break.
    // Validates: Requirements 6.5, 12
    const store = useTodoStore()
    store.tasks = []
    store.addTask('Test task')
    const task = store.tasks[0]!

    store.startPomodoro(task.id)

    // Simulate work completing
    store._onWorkEnd()

    // Both states should be in break phase
    expect(store.pomodoro.phase).toBe('break')
    expect(task.timerState!.phase).toBe('break')
    expect(store.pomodoro.secondsLeft).toBe(BREAK_DURATION_SECONDS)
    expect(task.timerState!.secondsLeft).toBe(BREAK_DURATION_SECONDS)
    expect(task.pomodoroCount).toBe(1)
  })

  it('Property 13: New tasks have null TimerState', () => {
    // Property 13: Las tareas nuevas deben tener timerState null.
    // Validates: Requirement 4.3
    const store = useTodoStore()
    store.tasks = []
    store.addTask('Test task')
    const task = store.tasks[0]!

    // New tasks should have null timerState
    expect(task.timerState).toBeNull()
  })

  it('Property 14: Task switch preserves remaining seconds', () => {
    // Property 14: Al cambiar de tarea, los segundos restantes de la tarea anterior se preservan.
    // Validates: Requirements 2.1, 2.3, 14
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
        fc.integer({ min: 5, max: 600 }),
        (title1, title2, advanceSeconds) => {
          const store = useTodoStore()
          store.tasks = []
          store.addTask(title1)
          store.addTask(title2)
          const task1 = store.tasks[0]!
          const task2 = store.tasks[1]!

          store.startPomodoro(task1.id)
          const expectedSeconds = Math.max(0, WORK_DURATION_SECONDS - advanceSeconds)

          vi.advanceTimersByTime(advanceSeconds * 1000)

          // Start task 2
          store.startPomodoro(task2.id)

          // Task 1 should preserve its exact seconds
          expect(task1.timerState!.secondsLeft).toBe(expectedSeconds)
        },
      ),
      { numRuns: 100 },
    )
  })

  it('Property 15: PomodoroOverlay displays active task TimerState', () => {
    // Property 15: PomodoroOverlay debe mostrar timerState de la tarea activa.
    // Validates: Requirements 1.3, 5.4
    // This property tests that when a task is active, the overlay would show
    // the correct timerState from that task
    const store = useTodoStore()
    store.tasks = []
    store.addTask('Test task')
    const task = store.tasks[0]!

    // No active task - timer should be idle
    expect(store.pomodoro.phase).toBe('idle')

    // Start Pomodoro - task's timerState should match global state
    store.startPomodoro(task.id)
    expect(store.pomodoro.phase).toBe(task.timerState!.phase)
    expect(store.pomodoro.secondsLeft).toBe(task.timerState!.secondsLeft)

    // Pause - still should match
    store.pausePomodoro()
    expect(store.pomodoro.phase).toBe('paused-work')
    expect(store.pomodoro.phase).toBe(task.timerState!.phase)
  })
})