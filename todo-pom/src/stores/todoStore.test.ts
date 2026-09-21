import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodoStore } from './todoStore'
import { MAX_TITLE_LENGTH, WORK_DURATION_SECONDS } from '../utils/constants'

describe('useTodoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    useTodoStore().cancelPomodoro()
    vi.useRealTimers()
  })

  describe('addTask', () => {
    it('adds a task to the tasks array', () => {
      const store = useTodoStore()
      store.addTask('Test task')
      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0]!.title).toBe('Test task')
    })

    it('rejects empty or whitespace-only titles', () => {
      const store = useTodoStore()
      store.addTask('')
      store.addTask('   ')
      expect(store.tasks).toHaveLength(0)
    })

    it('truncates titles longer than MAX_TITLE_LENGTH', () => {
      const store = useTodoStore()
      store.addTask('x'.repeat(MAX_TITLE_LENGTH + 40))
      expect(store.tasks[0]!.title).toHaveLength(MAX_TITLE_LENGTH)
    })
  })

  describe('editTask', () => {
    it('updates a valid title and restores the previous one when empty', () => {
      const store = useTodoStore()
      store.addTask('Original')
      const id = store.tasks[0]!.id
      store.editTask(id, '  Nuevo  ')
      expect(store.tasks[0]!.title).toBe('Nuevo')
      store.editTask(id, '   ')
      expect(store.tasks[0]!.title).toBe('Nuevo')
    })
  })

  describe('toggleComplete', () => {
    it('moves a task between pending and completed', () => {
      const store = useTodoStore()
      store.addTask('Test task')
      const id = store.tasks[0]!.id
      store.toggleComplete(id)
      expect(store.tasks[0]!.completed).toBe(true)
      expect(store.tasks[0]!.completedAt).not.toBeNull()
      store.toggleComplete(id)
      expect(store.tasks[0]!.completed).toBe(false)
      expect(store.tasks[0]!.completedAt).toBeNull()
    })

    it('cancels an active pomodoro when completing the task', () => {
      const store = useTodoStore()
      store.addTask('Con timer')
      const id = store.tasks[0]!.id
      store.startPomodoro(id)
      store.toggleComplete(id)
      expect(store.pomodoro.phase).toBe('idle')
    })
  })

  describe('deleteTask', () => {
    it('removes a task permanently', () => {
      const store = useTodoStore()
      store.addTask('Task 1')
      store.addTask('Task 2')
      store.deleteTask(store.tasks[0]!.id)
      expect(store.tasks).toHaveLength(1)
    })
  })

  describe('pomodoro', () => {
    it('starts a work phase of 1500 seconds and replaces any previous timer', () => {
      const store = useTodoStore()
      store.addTask('A')
      store.addTask('B')
      const [first, second] = store.tasks
      store.startPomodoro(first!.id)
      store.startPomodoro(second!.id)
      expect(store.pomodoro.taskId).toBe(second!.id)
      expect(store.pomodoro.phase).toBe('work')
      expect(store.pomodoro.secondsLeft).toBe(WORK_DURATION_SECONDS)
    })

    it('pauses, resumes and cancels without incrementing the count', () => {
      const store = useTodoStore()
      store.addTask('Focus')
      const id = store.tasks[0]!.id
      store.startPomodoro(id)
      store.pausePomodoro()
      expect(store.pomodoro.phase).toBe('paused-work')
      store.resumePomodoro()
      expect(store.pomodoro.phase).toBe('work')
      store.cancelPomodoro()
      expect(store.pomodoro.phase).toBe('idle')
      expect(store.tasks[0]!.pomodoroCount).toBe(0)
    })
  })

  describe('timerState', () => {
    it('starts with null timerState when task is created', () => {
      const store = useTodoStore()
      store.addTask('New task')
      expect(store.tasks[0]!.timerState).toBeNull()
    })

    it('initializes timerState when startPomodoro is called', () => {
      const store = useTodoStore()
      store.addTask('Task with timer')
      const id = store.tasks[0]!.id
      store.startPomodoro(id)
      expect(store.tasks[0]!.timerState).toEqual({
        phase: 'work',
        secondsLeft: WORK_DURATION_SECONDS,
      })
    })

    it('updates task timerState.phase when pausing work phase', () => {
      const store = useTodoStore()
      store.addTask('Task')
      const id = store.tasks[0]!.id
      store.startPomodoro(id)
      store.pausePomodoro()
      expect(store.tasks[0]!.timerState?.phase).toBe('paused-work')
    })

    it('updates task timerState.phase when pausing break phase', () => {
      const store = useTodoStore()
      store.addTask('Task')
      const id = store.tasks[0]!.id
      store.startPomodoro(id)
      vi.advanceTimersByTime(WORK_DURATION_SECONDS * 1000)
      store.pausePomodoro()
      expect(store.tasks[0]!.timerState?.phase).toBe('paused-break')
    })
  })

  describe('getters', () => {
    it('sorts active and completed tasks as specified', () => {
      const store = useTodoStore()
      store.tasks = [
        { id: '1', title: 'Task 1', completed: false, createdAt: 1000, completedAt: null, pomodoroCount: 0, timerState: null },
        { id: '2', title: 'Task 2', completed: true, createdAt: 2000, completedAt: 4000, pomodoroCount: 0, timerState: null },
        { id: '3', title: 'Task 3', completed: false, createdAt: 3000, completedAt: null, pomodoroCount: 0, timerState: null },
      ]
      expect(store.activeTasks.map((task) => task.title)).toEqual(['Task 3', 'Task 1'])
      expect(store.completedTasks.map((task) => task.title)).toEqual(['Task 2'])
    })
  })
})
