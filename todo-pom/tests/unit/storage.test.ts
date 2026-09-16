import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { loadState, saveState } from '@/utils/storage'
import { STORAGE_KEY } from '@/utils/constants'
import { useTodoStore } from '@/stores/todoStore'
import type { AppState } from '@/types'

const sample: AppState = {
  tasks: [
    {
      id: 'task-1',
      title: 'Escribir tests',
      completed: false,
      createdAt: 1000,
      completedAt: null,
      pomodoroCount: 2,
    },
  ],
  pomodoro: {
    taskId: 'task-1',
    phase: 'work',
    secondsLeft: 900,
  },
}

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
    useTodoStore().cancelPomodoro()
  })

  it('returns null and keeps an empty store when localStorage is empty', () => {
    expect(loadState()).toBeNull()
    const store = useTodoStore()
    store._loadFromStorage()
    expect(store.tasks).toEqual([])
    expect(store.pomodoro.phase).toBe('idle')
  })

  it('returns null when stored JSON is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json')
    expect(loadState()).toBeNull()
    const store = useTodoStore()
    store._loadFromStorage()
    expect(store.tasks).toEqual([])
  })

  it('round-trips a valid payload without intervalId', () => {
    saveState(sample)
    const loaded = loadState()
    expect(loaded).toEqual(sample)
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')).not.toHaveProperty('pomodoro.intervalId')
  })

  it('restores running phases as paused', () => {
    saveState(sample)
    const store = useTodoStore()
    store._loadFromStorage()
    expect(store.pomodoro.phase).toBe('paused-work')
    expect(store.pomodoro.intervalId).toBeNull()
    expect(store.tasks).toHaveLength(1)
  })

  it('sets the header warning when writing fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    const store = useTodoStore()
    store.addTask('No se pudo guardar')
    expect(store.storageWarning).toBe(true)
  })
})
