import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTodoStore } from './todoStore'

describe('useTodoStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('addTask', () => {
    it('should add a task to the tasks array', () => {
      const store = useTodoStore()
      expect(store.tasks).toHaveLength(0)

      store.addTask('Test task')
      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0].title).toBe('Test task')
    })

    it('should reject empty title', () => {
      const store = useTodoStore()
      store.addTask('')
      expect(store.tasks).toHaveLength(0)
    })

    it('should reject whitespace-only title', () => {
      const store = useTodoStore()
      store.addTask('   ')
      expect(store.tasks).toHaveLength(0)
    })

    it('should reject title with only spaces', () => {
      const store = useTodoStore()
      store.addTask('     ')
      expect(store.tasks).toHaveLength(0)
    })

    it('should trim title and add valid task', () => {
      const store = useTodoStore()
      store.addTask('  My Task  ')
      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0].title).toBe('My Task')
    })

    it('should generate UUID for task id', () => {
      const store = useTodoStore()
      store.addTask('Test task')
      const id = store.tasks[0].id
      // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })

    it('should set completed to false', () => {
      const store = useTodoStore()
      store.addTask('Test task')
      expect(store.tasks[0].completed).toBe(false)
    })

    it('should set completedAt to null', () => {
      const store = useTodoStore()
      store.addTask('Test task')
      expect(store.tasks[0].completedAt).toBeNull()
    })

    it('should set pomodoroCount to 0', () => {
      const store = useTodoStore()
      store.addTask('Test task')
      expect(store.tasks[0].pomodoroCount).toBe(0)
    })

    it('should set createdAt to current timestamp', () => {
      const store = useTodoStore()
      const before = Date.now()
      store.addTask('Test task')
      const after = Date.now()
      expect(store.tasks[0].createdAt).toBeGreaterThanOrEqual(before)
      expect(store.tasks[0].createdAt).toBeLessThanOrEqual(after)
    })
  })

  describe('toggleTask', () => {
    it('should toggle completed status', () => {
      const store = useTodoStore()
      store.addTask('Test task')
      const taskId = store.tasks[0].id

      expect(store.tasks[0].completed).toBe(false)

      store.toggleTask(taskId)
      expect(store.tasks[0].completed).toBe(true)
      expect(store.tasks[0].completedAt).not.toBeNull()

      store.toggleTask(taskId)
      expect(store.tasks[0].completed).toBe(false)
      expect(store.tasks[0].completedAt).toBeNull()
    })

    it('should do nothing if task not found', () => {
      const store = useTodoStore()
      store.addTask('Test task')

      store.toggleTask('non-existent-id')
      expect(store.tasks).toHaveLength(1)
    })
  })

  describe('deleteTask', () => {
    it('should remove task from array', () => {
      const store = useTodoStore()
      store.addTask('Task 1')
      store.addTask('Task 2')
      expect(store.tasks).toHaveLength(2)

      store.deleteTask(store.tasks[0].id)
      expect(store.tasks).toHaveLength(1)
      expect(store.tasks[0].title).toBe('Task 2')
    })

    it('should do nothing if task not found', () => {
      const store = useTodoStore()
      store.addTask('Task 1')
      expect(store.tasks).toHaveLength(1)

      store.deleteTask('non-existent-id')
      expect(store.tasks).toHaveLength(1)
    })
  })

  describe('updateTaskTitle', () => {
    it('should update task title', () => {
      const store = useTodoStore()
      store.addTask('Original title')
      const taskId = store.tasks[0].id

      store.updateTaskTitle(taskId, 'New title')
      expect(store.tasks[0].title).toBe('New title')
    })

    it('should reject empty title', () => {
      const store = useTodoStore()
      store.addTask('Original title')
      const taskId = store.tasks[0].id

      store.updateTaskTitle(taskId, '')
      expect(store.tasks[0].title).toBe('Original title')
    })

    it('should reject whitespace-only title', () => {
      const store = useTodoStore()
      store.addTask('Original title')
      const taskId = store.tasks[0].id

      store.updateTaskTitle(taskId, '   ')
      expect(store.tasks[0].title).toBe('Original title')
    })

    it('should trim title when updating', () => {
      const store = useTodoStore()
      store.addTask('Original title')
      const taskId = store.tasks[0].id

      store.updateTaskTitle(taskId, '  New title  ')
      expect(store.tasks[0].title).toBe('New title')
    })

    it('should do nothing if task not found', () => {
      const store = useTodoStore()
      store.addTask('Original title')
      const originalTitle = store.tasks[0].title

      store.updateTaskTitle('non-existent-id', 'New title')
      expect(store.tasks[0].title).toBe(originalTitle)
    })
  })

  describe('getters', () => {
    beforeEach(() => {
      setActivePinia(createPinia())
    })

    describe('activeTasks', () => {
      it('should return only non-completed tasks', () => {
        const store = useTodoStore()
        // Manually create tasks with different timestamps
        store.tasks.push({
          id: '1',
          title: 'Task 1',
          completed: false,
          createdAt: 1000,
          completedAt: null,
          pomodoroCount: 0
        })
        store.tasks.push({
          id: '2',
          title: 'Task 2',
          completed: true,
          createdAt: 2000,
          completedAt: 3000,
          pomodoroCount: 0
        })
        store.tasks.push({
          id: '3',
          title: 'Task 3',
          completed: false,
          createdAt: 3000,
          completedAt: null,
          pomodoroCount: 0
        })

        expect(store.activeTasks).toHaveLength(2)
        expect(store.activeTasks.map(t => t.title)).toEqual(['Task 3', 'Task 1'])
      })

      it('should be empty when all tasks are completed', () => {
        const store = useTodoStore()
        store.addTask('Task 1')
        store.addTask('Task 2')

        store.toggleTask(store.tasks[0].id)
        store.toggleTask(store.tasks[1].id)

        expect(store.activeTasks).toHaveLength(0)
      })
    })

    describe('completedTasks', () => {
      it('should return only completed tasks', () => {
        const store = useTodoStore()
        // Manually create tasks with different timestamps
        store.tasks.push({
          id: '1',
          title: 'Task 1',
          completed: true,
          createdAt: 1000,
          completedAt: 4000,
          pomodoroCount: 0
        })
        store.tasks.push({
          id: '2',
          title: 'Task 2',
          completed: false,
          createdAt: 2000,
          completedAt: null,
          pomodoroCount: 0
        })
        store.tasks.push({
          id: '3',
          title: 'Task 3',
          completed: true,
          createdAt: 3000,
          completedAt: 2000,
          pomodoroCount: 0
        })

        expect(store.completedTasks).toHaveLength(2)
        expect(store.completedTasks.map(t => t.title)).toEqual(['Task 1', 'Task 3'])
      })
    })

    describe('pendingTaskCount', () => {
      it('should return count of active tasks', () => {
        const store = useTodoStore()
        expect(store.pendingTaskCount).toBe(0)

        store.addTask('Task 1')
        expect(store.pendingTaskCount).toBe(1)

        store.addTask('Task 2')
        expect(store.pendingTaskCount).toBe(2)

        store.toggleTask(store.tasks[0].id)
        expect(store.pendingTaskCount).toBe(1)
      })
    })
  })

  describe('initial state', () => {
    it('should initialize with empty tasks array', () => {
      const store = useTodoStore()
      expect(store.tasks).toEqual([])
    })

    it('should initialize pomodoro state correctly', () => {
      const store = useTodoStore()
      expect(store.pomodoro.taskId).toBeNull()
      expect(store.pomodoro.phase).toBe('idle')
      expect(store.pomodoro.secondsLeft).toBe(1500) // 25 minutes
      expect(store.pomodoro.intervalId).toBeNull()
    })

    it('should initialize completedPomodoros to 0', () => {
      const store = useTodoStore()
      expect(store.completedPomodoros).toBe(0)
    })

    it('should initialize currentCycle to 1', () => {
      const store = useTodoStore()
      expect(store.currentCycle).toBe(1)
    })
  })
})