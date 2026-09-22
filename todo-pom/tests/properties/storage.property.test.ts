import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { loadState, saveState } from '@/utils/storage'
import { STORAGE_KEY } from '@/utils/constants'
import type { AppState, PomodoroPhase } from '@/types'

const phases = ['idle', 'work', 'break', 'paused-work', 'paused-break'] as const satisfies readonly PomodoroPhase[]

const idArb = fc.string({
  minLength: 8,
  maxLength: 16,
  unit: fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'),
})

const taskArb = fc.record({
  id: idArb,
  title: fc.string({ minLength: 1, maxLength: 40, unit: 'grapheme-ascii' }).filter((s) => s.trim().length > 0),
  completed: fc.boolean(),
  createdAt: fc.integer({ min: 0, max: 2_000_000_000_000 }),
  completedAt: fc.option(fc.integer({ min: 0, max: 2_000_000_000_000 }), { nil: null }),
  pomodoroCount: fc.integer({ min: 0, max: 80 }),
  timerState: fc.option(
    fc.record({
      phase: fc.constantFrom(...phases),
      secondsLeft: fc.integer({ min: 0, max: 1500 }),
      isRunning: fc.option(fc.boolean(), { nil: undefined }),
    }),
    { nil: null },
  ),
})

const stateArb: fc.Arbitrary<AppState> = fc.record({
  tasks: fc.array(taskArb, { maxLength: 8 }),
  pomodoro: fc.record({
    taskId: fc.option(idArb, { nil: null }),
    phase: fc.constantFrom(...phases),
    secondsLeft: fc.integer({ min: 0, max: 1500 }),
  }),
})

describe('storage properties', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('Property 3: Round-trip de persistencia', () => {
    // Feature: todo-pom, Property 3: Round-trip de persistencia
    fc.assert(
      fc.property(stateArb, (state) => {
        localStorage.removeItem(STORAGE_KEY)
        saveState(state)
        const loaded = loadState()
        expect(loaded).not.toBeNull()
        expect(loaded?.tasks).toEqual(state.tasks)
        expect(loaded?.pomodoro).toEqual(state.pomodoro)
      }),
      { numRuns: 100 },
    )
  })
})
describe('storage properties', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('Property 3: Round-trip de persistencia', () => {
    // Feature: todo-pom, Property 3: Round-trip de persistencia
    fc.assert(
      fc.property(stateArb, (state) => {
        localStorage.removeItem(STORAGE_KEY)
        saveState(state)
        const loaded = loadState()
        expect(loaded).not.toBeNull()
        expect(loaded?.tasks).toEqual(state.tasks)
        expect(loaded?.pomodoro).toEqual(state.pomodoro)
      }),
      { numRuns: 100 },
    )
  })

  it('Property 7: Timer State Persistence Inclusion', () => {
    // Feature: todo-pom, Requirement 5.1
    // Para cualquier tarea en la colección de tareas cuando se llama _saveToStorage(),
    // los datos serializados DEBEN incluir la propiedad timerState completa para cada tarea.
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 1, maxLength: 5 }),
        (tasks) => {
          const state: AppState = {
            tasks,
            pomodoro: { taskId: null, phase: 'idle', secondsLeft: 0 },
          }
          localStorage.removeItem(STORAGE_KEY)
          saveState(state)
          const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
          expect(raw).toHaveProperty('tasks')
          expect(Array.isArray(raw.tasks)).toBe(true)

          // Verificar que cada tarea tiene timerState
          for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i]
            expect(raw.tasks[i]).toHaveProperty('timerState')
            if (task.timerState === null) {
              expect(raw.tasks[i].timerState).toBeNull()
            } else {
              expect(raw.tasks[i].timerState.phase).toBe(task.timerState.phase)
              expect(raw.tasks[i].timerState.secondsLeft).toBe(task.timerState.secondsLeft)
            }
          }
        },
      ),
      { numRuns: 50 },
    )
  })

  it('Property 8: Timer State Persistence Restoration', () => {
    // Feature: todo-pom, Requirement 5.2
    // Para cualquier estado de aplicación con tareas conteniendo valores timerState no-nulos,
    // cuando se llama _loadFromStorage(), las tareas cargadas DEBEN tener valores timerState idénticos al estado original.
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 1, maxLength: 5 }),
        (tasks) => {
          // Filtrar solo tareas con timerState no-nulo
          const tasksWithTimer = tasks.map((task) => {
            if (task.timerState === null) {
              // Asignar un timerState para la prueba
              return {
                ...task,
                timerState: { phase: 'work' as const, secondsLeft: 900, isRunning: false },
              }
            }
            return task
          })

          const originalTimerStates = tasksWithTimer.map((t) => t.timerState)

          const state: AppState = {
            tasks: tasksWithTimer,
            pomodoro: { taskId: null, phase: 'idle', secondsLeft: 0 },
          }
          localStorage.removeItem(STORAGE_KEY)
          saveState(state)
          const loaded = loadState()

          expect(loaded).not.toBeNull()
          expect(loaded?.tasks).toHaveLength(tasksWithTimer.length)

          // Verificar que timerStates restaurados son idénticos
          for (let i = 0; i < tasksWithTimer.length; i++) {
            expect(loaded?.tasks[i].timerState).toEqual(originalTimerStates[i])
          }
        },
      ),
      { numRuns: 50 },
    )
  })

  it('Property 9: Active Task Timer State Sync', () => {
    // Feature: todo-pom, Requirement 6.2
    // Para cualquier estado de aplicación donde pomodoro.taskId referencia una tarea con timerState no-nulo,
    // el phase global de pomodoro y secondsLeft DEBEN coincidir con timerState.phase y timerState.secondsLeft de la tarea activa.
    fc.assert(
      fc.property(
        fc.array(taskArb, { minLength: 1, maxLength: 5 }),
        fc.option(
          fc.record({
            phase: fc.constantFrom(...phases),
            secondsLeft: fc.integer({ min: 0, max: 1500 }),
          }),
          { nil: null },
        ),
        (tasks, activeTimerState) => {
          // Seleccionar una tarea para ser la activa
          const activeTask = tasks[0]
          activeTask.timerState = activeTimerState

          const state: AppState = {
            tasks,
            pomodoro: {
              taskId: activeTask.id,
              phase: activeTimerState?.phase ?? 'idle',
              secondsLeft: activeTimerState?.secondsLeft ?? 0,
            },
          }

          // Guardar y cargar
          localStorage.removeItem(STORAGE_KEY)
          saveState(state)

          // Simular la carga en el store
          const loaded = loadState()
          expect(loaded).not.toBeNull()

          // Verificar sincronización post-carga
          if (activeTimerState !== null) {
            const loadedTask = loaded?.tasks.find((t) => t.id === activeTask.id)
            expect(loadedTask?.timerState).not.toBeNull()
            expect(loaded?.pomodoro.phase).toBe(activeTimerState.phase)
            expect(loaded?.pomodoro.secondsLeft).toBe(activeTimerState.secondsLeft)
          }
        },
      ),
      { numRuns: 50 },
    )
  })
})