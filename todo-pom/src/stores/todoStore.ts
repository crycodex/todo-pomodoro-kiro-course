import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { supabase } from '../utils/supabase'
import type { PomodoroState, Task } from '../types'
import { BREAK_DURATION_SECONDS, MAX_TITLE_LENGTH, WORK_DURATION_SECONDS } from '../utils/constants'
import { loadState, saveState } from '../utils/storage'
import { useNotifications } from '../composables/useNotifications'

function createId(): string {
  return crypto.randomUUID()
}

function normalizeTitle(title: string): string | null {
  const trimmed = title.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, MAX_TITLE_LENGTH)
}

function createIdlePomodoro(): PomodoroState {
  return {
    taskId: null,
    phase: 'idle',
    secondsLeft: WORK_DURATION_SECONDS,
    intervalId: null,
  }
}

export const useTodoStore = defineStore('todo', () => {
  const notifications = useNotifications()

  const tasks = ref<Task[]>([])
  const pomodoro = ref<PomodoroState>(createIdlePomodoro())
  const storageWarning = ref(false)
  const supabaseAuthenticated = ref(false)

  let lastTickAt = 0

  const activeTasks = computed(() =>
    [...tasks.value.filter((task) => !task.completed)].sort((a, b) => b.createdAt - a.createdAt),
  )

  const completedTasks = computed(() =>
    [...tasks.value.filter((task) => task.completed)].sort(
      (a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0),
    ),
  )

  const activeTask = computed(() => {
    if (!pomodoro.value.taskId) return undefined
    return tasks.value.find((task) => task.id === pomodoro.value.taskId)
  })

  const pomodoroRunning = computed(
    () => pomodoro.value.phase === 'work' || pomodoro.value.phase === 'break',
  )

  function _clearTimer(): void {
    if (pomodoro.value.intervalId != null) {
      clearInterval(pomodoro.value.intervalId)
      pomodoro.value.intervalId = null
    }
  }

  function _startTimer(): void {
    _clearTimer()
    lastTickAt = Date.now()
    pomodoro.value.intervalId = window.setInterval(() => {
      lastTickAt = Date.now()
      _tick()
    }, 1000)
  }

  function addTask(title: string): void {
    const normalized = normalizeTitle(title)
    if (normalized === null) return

    tasks.value.push({
      id: createId(),
      title: normalized,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
      pomodoroCount: 0,
      timerState: null,
    })
  }

  function editTask(id: string, title: string): void {
    const task = tasks.value.find((item) => item.id === id)
    if (!task) return

    const normalized = normalizeTitle(title)
    if (normalized === null) return

    task.title = normalized
  }

  function deleteTask(id: string): void {
    if (pomodoro.value.taskId === id) {
      cancelPomodoro()
    }
    tasks.value = tasks.value.filter((task) => task.id !== id)
  }

  function toggleComplete(id: string): void {
    const task = tasks.value.find((item) => item.id === id)
    if (!task) return

    const completing = !task.completed
    task.completed = completing
    task.completedAt = completing ? Date.now() : null

    if (completing && pomodoro.value.taskId === id && pomodoro.value.phase !== 'idle') {
      cancelPomodoro()
    }
  }

  function startPomodoro(taskId: string): void {
    const task = tasks.value.find((item) => item.id === taskId)
    if (!task || task.completed) return

    // Clear timer and reset global state WITHOUT clearing previous task's timerState
    // This preserves the timerState of the previously active task
    _clearTimer()
    pomodoro.value.taskId = taskId

    // Restore from existing timerState or start fresh
    if (task?.timerState) {
      pomodoro.value.phase = task.timerState.phase
      pomodoro.value.secondsLeft = task.timerState.secondsLeft
    } else {
      pomodoro.value.phase = 'work'
      pomodoro.value.secondsLeft = WORK_DURATION_SECONDS
    }

    void notifications.requestPermission()

    // Initialize task timer state and sync with global state
    task.timerState = {
      phase: 'work',
      secondsLeft: WORK_DURATION_SECONDS,
    }

    _startTimer()
  }

  function pausePomodoro(): void {
    if (pomodoro.value.phase === 'work') {
      pomodoro.value.phase = 'paused-work'
      const task = activeTask.value
      if (task?.timerState) {
        task.timerState.phase = 'paused-work'
      }
      _clearTimer()
    } else if (pomodoro.value.phase === 'break') {
      pomodoro.value.phase = 'paused-break'
      const task = activeTask.value
      if (task?.timerState) {
        task.timerState.phase = 'paused-break'
      }
      _clearTimer()
    }
  }

  function resumePomodoro(): void {
    const task = activeTask.value
    if (pomodoro.value.phase === 'paused-work') {
      pomodoro.value.phase = 'work'
      if (task?.timerState) {
        task.timerState.phase = 'work'
      }
      _startTimer()
    } else if (pomodoro.value.phase === 'paused-break') {
      pomodoro.value.phase = 'break'
      if (task?.timerState) {
        task.timerState.phase = 'break'
      }
      _startTimer()
    }
  }

  function cancelPomodoro(): void {
    const task = activeTask.value
    if (task) {
      task.timerState = null
    }
    _clearTimer()
    pomodoro.value = createIdlePomodoro()
  }

  function _tick(): void {
    if (pomodoro.value.phase !== 'work' && pomodoro.value.phase !== 'break') return

    pomodoro.value.secondsLeft -= 1

    // Buscar la tarea activa y sincronizar timerState si existe
    const activeTaskItem = tasks.value.find(t => t.id === pomodoro.value.taskId)
    if (activeTaskItem?.timerState) {
      activeTaskItem.timerState.secondsLeft = pomodoro.value.secondsLeft
      activeTaskItem.timerState.phase = pomodoro.value.phase
    }

    if (pomodoro.value.secondsLeft > 0) return

    if (pomodoro.value.phase === 'work') {
      _onWorkEnd()
    } else {
      _onBreakEnd()
    }
  }

  function _onWorkEnd(): void {
    const task = activeTask.value
    if (task) {
      task.pomodoroCount += 1
      task.timerState = {
        phase: 'break',
        secondsLeft: BREAK_DURATION_SECONDS,
      }
      notifications.notifyWorkEnd(task.title)
    } else {
      notifications.notifyWorkEnd('tarea')
    }

    pomodoro.value.phase = 'break'
    pomodoro.value.secondsLeft = BREAK_DURATION_SECONDS
  }

  function _onBreakEnd(): void {
    const task = activeTask.value
    if (task) {
      task.timerState = null
    }
    notifications.notifyBreakEnd()
    _clearTimer()
    pomodoro.value = createIdlePomodoro()
  }

  function _applyElapsed(elapsedSeconds: number): void {
    if (!pomodoroRunning.value || elapsedSeconds <= 0) return

    if (elapsedSeconds >= pomodoro.value.secondsLeft) {
      pomodoro.value.secondsLeft = 0
      if (pomodoro.value.phase === 'work') {
        _onWorkEnd()
      } else {
        _onBreakEnd()
      }
      return
    }

    pomodoro.value.secondsLeft -= elapsedSeconds
  }

  function _correctHiddenTime(): void {
    if (!pomodoroRunning.value || lastTickAt === 0) return
    const elapsed = Math.floor((Date.now() - lastTickAt) / 1000)
    if (elapsed > 0) {
      _applyElapsed(elapsed)
      lastTickAt = Date.now()
    }
  }

  function _saveToStorage(): void {
    try {
      saveState({
        tasks: tasks.value,
        pomodoro: {
          taskId: pomodoro.value.taskId,
          phase: pomodoro.value.phase,
          secondsLeft: pomodoro.value.secondsLeft,
        },
      })
      storageWarning.value = false
    } catch {
      storageWarning.value = true
    }
  }

  function _loadFromStorage(): void {
    const loaded = loadState()
    if (!loaded) return

    tasks.value = loaded.tasks
    const phase =
      loaded.pomodoro.phase === 'work'
        ? 'paused-work'
        : loaded.pomodoro.phase === 'break'
          ? 'paused-break'
          : loaded.pomodoro.phase

    pomodoro.value = {
      taskId: loaded.pomodoro.taskId,
      phase,
      secondsLeft: loaded.pomodoro.secondsLeft,
      intervalId: null,
    }

    // Sincronización post-carga: asegurar que el estado global refleje timerState
    const activeTaskId = loaded.pomodoro.taskId
    if (activeTaskId && phase !== 'idle') {
      const task = tasks.value.find((t) => t.id === activeTaskId)
      if (task?.timerState) {
        pomodoro.value.phase = task.timerState.phase
        pomodoro.value.secondsLeft = task.timerState.secondsLeft
      } else if (activeTaskId) {
        // Crear timerState desde el estado persistido si no existe
        const task = tasks.value.find((t) => t.id === activeTaskId)
        if (task) {
          task.timerState = {
            phase: pomodoro.value.phase,
            secondsLeft: pomodoro.value.secondsLeft,
            isRunning: false,
          }
        }
      }
    }
  }

  watch(
    [tasks, pomodoro],
    () => {
      _saveToStorage()
    },
    { deep: true, flush: 'sync' },
  )

  return {
    tasks,
    pomodoro,
    storageWarning,
    supabaseAuthenticated,
    bannerMessage: notifications.bannerMessage,
    activeTasks,
    completedTasks,
    activeTask,
    pomodoroRunning,
    addTask,
    editTask,
    deleteTask,
    toggleComplete,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    cancelPomodoro,
    _tick,
    _onWorkEnd,
    _onBreakEnd,
    _applyElapsed,
    _correctHiddenTime,
    _loadFromStorage,
    _saveToStorage,
  }
})
