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
