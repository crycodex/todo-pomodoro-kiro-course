import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTodoStore } from '@/stores/todoStore'
import { usePomodoro } from '@/composables/usePomodoro'
import { BREAK_DURATION_SECONDS, WORK_DURATION_SECONDS } from '@/utils/constants'

describe('usePomodoro', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    useTodoStore().cancelPomodoro()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  function createRunningTimer() {
    const store = useTodoStore()
    store.addTask('Enfoque')
    const pomodoro = usePomodoro()
    pomodoro.start(store.tasks[0]!.id)
    return { store, pomodoro, id: store.tasks[0]!.id }
  }

  it('transitions idle → work → break → idle', () => {
    const { store, pomodoro } = createRunningTimer()
    expect(store.pomodoro.phase).toBe('work')
    expect(store.pomodoro.secondsLeft).toBe(WORK_DURATION_SECONDS)

    vi.advanceTimersByTime(WORK_DURATION_SECONDS * 1000)
    expect(store.pomodoro.phase).toBe('break')
    expect(store.pomodoro.secondsLeft).toBe(BREAK_DURATION_SECONDS)

    vi.advanceTimersByTime(BREAK_DURATION_SECONDS * 1000)
    expect(store.pomodoro.phase).toBe('idle')
    pomodoro.cancel()
  })

  it('pauses the tick and resumes it', () => {
    const { store, pomodoro } = createRunningTimer()
    vi.advanceTimersByTime(3000)
    pomodoro.pause()
    expect(store.pomodoro.phase).toBe('paused-work')
    const frozen = store.pomodoro.secondsLeft
    vi.advanceTimersByTime(8000)
    expect(store.pomodoro.secondsLeft).toBe(frozen)
    pomodoro.resume()
    expect(store.pomodoro.phase).toBe('work')
    vi.advanceTimersByTime(1000)
    expect(store.pomodoro.secondsLeft).toBe(frozen - 1)
  })

  it('corrects elapsed time on visibilitychange', () => {
    const { store, pomodoro } = createRunningTimer()
    const startedAt = Date.now()
    pomodoro.start(store.tasks[0]!.id)
    vi.setSystemTime(startedAt + 7000)
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(store.pomodoro.secondsLeft).toBe(WORK_DURATION_SECONDS - 7)
  })
})
