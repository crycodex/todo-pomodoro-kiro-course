import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { createPinia, setActivePinia } from 'pinia'
import { useTodoStore } from '@/stores/todoStore'

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
})
