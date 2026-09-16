import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
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

    cancelPomodoro()
    void notifications.requestPermission()

    pomodoro.value.taskId = taskId
    pomodoro.value.phase = 'work'
    pomodoro.value.secondsLeft = WORK_DURATION_SECONDS
    _startTimer()
  }

  function pausePomodoro(): void {
    if (pomodoro.value.phase === 'work') {
      pomodoro.value.phase = 'paused-work'
      _clearTimer()
    } else if (pomodoro.value.phase === 'break') {
      pomodoro.value.phase = 'paused-break'
      _clearTimer()
    }
  }

  function resumePomodoro(): void {
    if (pomodoro.value.phase === 'paused-work') {
      pomodoro.value.phase = 'work'
      _startTimer()
    } else if (pomodoro.value.phase === 'paused-break') {
      pomodoro.value.phase = 'break'
      _startTimer()
    }
  }

  function cancelPomodoro(): void {
    _clearTimer()
    pomodoro.value = createIdlePomodoro()
  }

  function _tick(): void {
    if (pomodoro.value.phase !== 'work' && pomodoro.value.phase !== 'break') return

    pomodoro.value.secondsLeft -= 1
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
      notifications.notifyWorkEnd(task.title)
    } else {
      notifications.notifyWorkEnd('tarea')
    }

    pomodoro.value.phase = 'break'
    pomodoro.value.secondsLeft = BREAK_DURATION_SECONDS
  }

  function _onBreakEnd(): void {
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
