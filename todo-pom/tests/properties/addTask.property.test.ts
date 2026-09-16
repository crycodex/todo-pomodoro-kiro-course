import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { createPinia, setActivePinia } from 'pinia'
import { useTodoStore } from '@/stores/todoStore'

describe('addTask properties', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => {
    useTodoStore().cancelPomodoro()
  })

  it('Property 1: Título vacío rechazado', () => {
    // Feature: todo-pom, Property 1: Título vacío rechazado
    const whitespace = fc.string({ unit: fc.constant(' '), minLength: 0, maxLength: 40 })

    fc.assert(
      fc.property(whitespace, (title) => {
        const store = useTodoStore()
        store.tasks = []
        store.addTask(title)
        expect(store.tasks.length).toBe(0)
      }),
      { numRuns: 100 },
    )
  })

  it('Property 2: Añadir tarea incrementa la lista en uno', () => {
    // Feature: todo-pom, Property 2: Añadir tarea incrementa la lista en uno
    const validTitle = fc
      .string({ minLength: 1, maxLength: 80, unit: 'grapheme-ascii' })
      .filter((value) => value.trim().length > 0)

    fc.assert(
      fc.property(validTitle, (title) => {
        const store = useTodoStore()
        const previous = store.tasks.length
        store.addTask(title)
        expect(store.tasks.length).toBe(previous + 1)
      }),
      { numRuns: 100 },
    )
  })
})
