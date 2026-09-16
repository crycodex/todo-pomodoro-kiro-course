import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, PomodoroState } from '../types'
import { POMODORO_DURATION } from '../utils/constants'

/**
 * Pinia store for managing todo tasks and Pomodoro state.
 * Handles task CRUD operations and Pomodoro timer state management.
 */
export const useTodoStore = defineStore('todo', () => {
  // ============ State ============

  /** Array of all tasks */
  const tasks = ref<Task[]>([])

  /** Current Pomodoro state */
  const pomodoro = ref<PomodoroState>({
    taskId: null,
    phase: 'idle',
    secondsLeft: POMODORO_DURATION,
    intervalId: null
  })

  /** Total completed Pomodoro cycles (across all tasks) */
  const completedPomodoros = ref(0)

  /** Current cycle number (1-4), resets on long break */
  const currentCycle = ref(1)

  // ============ Getters ============

  /**
   * Returns all active (non-completed) tasks, ordered by creation date descending.
   */
  const activeTasks = computed(() => {
    const active = tasks.value.filter(t => !t.completed)
    return [...active].sort((a, b) => b.createdAt - a.createdAt)
  })

  /**
   * Returns all completed tasks, ordered by completion date descending.
   */
  const completedTasks = computed(() => {
    const completed = tasks.value.filter(t => t.completed)
    return [...completed].sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  })

  /**
   * Count of pending (active) tasks.
   */
  const pendingTaskCount = computed(() => activeTasks.value.length)

  // ============ Actions ============

  /**
   * Creates a new task with the given title.
   * Validates that title is not empty or whitespace-only.
   * Truncates title to MAX_TITLE_LENGTH if exceeded.
   *
   * @param title - The title for the new task
   */
  function addTask(title: string): void {
    const trimmedTitle = title.trim()

    if (trimmedTitle.length === 0) {
      return // Reject empty or whitespace-only titles
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
      pomodoroCount: 0
    }

    tasks.value.push(newTask)
  }

  /**
   * Toggles the completed status of a task.
   *
   * @param id - The ID of the task to toggle
   */
  function toggleTask(id: string): void {
    const task = tasks.value.find(t => t.id === id)
    if (!task) return

    task.completed = !task.completed
    task.completedAt = task.completed ? Date.now() : null
  }

  /**
   * Removes a task from the list permanently.
   *
   * @param id - The ID of the task to delete
   */
  function deleteTask(id: string): void {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value.splice(index, 1)
    }
  }

  /**
   * Updates the title of a task.
   * Validates that new title is not empty or whitespace-only.
   *
   * @param id - The ID of the task to update
   * @param newTitle - The new title for the task
   */
  function updateTaskTitle(id: string, newTitle: string): void {
    const task = tasks.value.find(t => t.id === id)
    if (!task) return

    const trimmedTitle = newTitle.trim()

    // Reject empty or whitespace-only titles
    if (trimmedTitle.length === 0) {
      return
    }

    task.title = trimmedTitle
  }

  return {
    // State
    tasks,
    pomodoro,
    completedPomodoros,
    currentCycle,
    // Getters
    activeTasks,
    completedTasks,
    pendingTaskCount,
    // Actions
    addTask,
    toggleTask,
    deleteTask,
    updateTaskTitle
  }
})