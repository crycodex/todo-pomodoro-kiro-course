import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { supabase } from '../utils/supabase'
import type { PomodoroState, Task, TaskFilterState, TaskStatus, TaskViewMode } from '../types'
import { BREAK_DURATION_SECONDS, MAX_TITLE_LENGTH, WORK_DURATION_SECONDS } from '../utils/constants'
import { loadState, saveState } from '../utils/storage'
import { useNotifications } from '../composables/useNotifications'
import { DEFAULT_TASK_CATEGORIES, normalizeTask } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const DEFAULT_FILTERS: TaskFilterState = {
  category: null,
  priority: [],
  dueDate: 'all',
  tags: [],
}

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

function matchesDueDateFilter(task: Task, filter: TaskFilterState['dueDate']): boolean {
  if (filter === 'all') return true
  if (filter === 'no-due-date') return task.dueDate === null
  if (!task.dueDate) return false

  const due = new Date(task.dueDate)
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  if (filter === 'overdue') {
    return due < startOfToday && !task.completed
  }

  if (filter === 'today') {
    const endOfToday = new Date(startOfToday)
    endOfToday.setDate(endOfToday.getDate() + 1)
    return due >= startOfToday && due < endOfToday
  }

  if (filter === 'this-week') {
    const startOfWeek = new Date(startOfToday)
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 7)
    return due >= startOfWeek && due < endOfWeek
  }

  if (filter === 'this-month') {
    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1)
    const endOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 1)
    return due >= startOfMonth && due < endOfMonth
  }

  return true
}

export const useTodoStore = defineStore('todo', () => {
  const notifications = useNotifications()

  const tasks = ref<Task[]>([])
  const categories = ref<string[]>([...DEFAULT_TASK_CATEGORIES])
  const viewMode = ref<TaskViewMode>('list')
  const filters = ref<TaskFilterState>({ ...DEFAULT_FILTERS })
  const pomodoro = ref<PomodoroState>(createIdlePomodoro())
  const storageWarning = ref(false)

  // Computed properties
  const filteredTasks = computed(() => {
    return [...tasks.value]
      .filter((task) => {
        if (filters.value.category && task.category !== filters.value.category) return false
        if (filters.value.priority.length > 0 && !filters.value.priority.includes(task.priority)) return false
        if (filters.value.tags.length > 0 && !filters.value.tags.some((tag) => task.tags.includes(tag))) return false
        if (!matchesDueDateFilter(task, filters.value.dueDate)) return false
        return true
      })
      .sort((a, b) => b.createdAt - a.createdAt)
  })

  const activeTasks = computed(() =>
    filteredTasks.value.filter((task) => !task.completed).sort((a, b) => b.createdAt - a.createdAt),
  )

  const completedTasks = computed(() =>
    filteredTasks.value.filter((task) => task.completed).sort(
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

  const kanbanColumns = computed(() => ({
    todo: filteredTasks.value.filter((task) => !task.completed && task.status === 'todo'),
    'in-progress': filteredTasks.value.filter((task) => !task.completed && task.status === 'in-progress'),
    done: filteredTasks.value.filter((task) => task.completed || task.status === 'done'),
  }))

  let lastTickAt = 0

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

  function _persist(): void {
    try {
      saveState({
        tasks: tasks.value,
        pomodoro: {
          taskId: pomodoro.value.taskId,
          phase: pomodoro.value.phase,
          secondsLeft: pomodoro.value.secondsLeft,
        },
        categories: categories.value,
        viewMode: viewMode.value,
        filters: filters.value,
      })
      storageWarning.value = false
    } catch {
      storageWarning.value = true
    }
  }

  function addCategory(name: string): string | null {
    const normalized = name.trim()
    if (!normalized) return null
    const unique = normalized.charAt(0).toUpperCase() + normalized.slice(1)
    if (!categories.value.includes(unique)) {
      categories.value.push(unique)
    }
    return unique
  }

  function addTask(title: string, overrides: Partial<Task> = {}): void {
    const normalized = normalizeTitle(title)
    if (normalized === null) return

    const task = normalizeTask({
      id: createId(),
      title: normalized,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
      pomodoroCount: 0,
      timerState: null,
      category: overrides.category ?? 'Other',
      priority: overrides.priority ?? 'Medium',
      description: overrides.description ?? '',
      dueDate: overrides.dueDate ?? null,
      tags: overrides.tags ?? [],
      status: overrides.status ?? 'todo',
      ...overrides,
    })

    tasks.value.push(task)
    if (!categories.value.includes(task.category)) {
      categories.value.push(task.category)
    }
    _persist()
  }

  function editTask(id: string, title: string, overrides: Partial<Task> = {}): void {
    const task = tasks.value.find((item) => item.id === id)
    if (!task) return

    const normalized = normalizeTitle(title)
    if (normalized === null) return

    task.title = normalized
    if (overrides.category) task.category = overrides.category
    if (overrides.priority) task.priority = overrides.priority
    if (overrides.description !== undefined) task.description = overrides.description
    if (overrides.dueDate !== undefined) task.dueDate = overrides.dueDate
    if (overrides.tags) task.tags = overrides.tags
    if (overrides.status) task.status = overrides.status
    if (overrides.completed !== undefined) {
      task.completed = overrides.completed
      task.completedAt = overrides.completed ? Date.now() : null
    }
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
    task.status = completing ? 'done' : 'todo'

    if (completing && pomodoro.value.taskId === id && pomodoro.value.phase !== 'idle') {
      cancelPomodoro()
    }
  }

  function setTaskStatus(id: string, nextStatus: TaskStatus): void {
    const task = tasks.value.find((item) => item.id === id)
    if (!task) return
    task.status = nextStatus
    if (nextStatus === 'done') {
      task.completed = true
      task.completedAt ??= Date.now()
    } else {
      task.completed = false
      task.completedAt = null
    }
  }

  function startPomodoro(taskId: string): void {
    const task = tasks.value.find((item) => item.id === taskId)
    if (!task || task.completed) return

    _clearTimer()
    pomodoro.value.taskId = taskId

    if (task.timerState) {
      pomodoro.value.phase = task.timerState.phase
      pomodoro.value.secondsLeft = task.timerState.secondsLeft
    } else {
      pomodoro.value.phase = 'work'
      pomodoro.value.secondsLeft = WORK_DURATION_SECONDS
    }

    void notifications.requestPermission()

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

    const activeTaskItem = tasks.value.find((t) => t.id === pomodoro.value.taskId)
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

  function _loadFromStorage(): void {
    const loaded = loadState()
    if (!loaded) {
      tasks.value = []
      categories.value = [...DEFAULT_TASK_CATEGORIES]
      viewMode.value = 'list'
      filters.value = { ...DEFAULT_FILTERS }
      return
    }

    tasks.value = loaded.tasks.map((task) => normalizeTask(task))
    categories.value = loaded.categories?.length ? loaded.categories : [...DEFAULT_TASK_CATEGORIES]
    viewMode.value = loaded.viewMode === 'kanban' ? 'kanban' : 'list'
    filters.value = loaded.filters ? { ...DEFAULT_FILTERS, ...loaded.filters } : { ...DEFAULT_FILTERS }

    pomodoro.value = {
      taskId: loaded.pomodoro.taskId,
      phase: loaded.pomodoro.phase === 'work' ? 'paused-work' : loaded.pomodoro.phase === 'break' ? 'paused-break' : loaded.pomodoro.phase,
      secondsLeft: loaded.pomodoro.secondsLeft,
      intervalId: null,
    }

    if (loaded.pomodoro.taskId && loaded.pomodoro.phase !== 'idle') {
      const task = tasks.value.find((entry) => entry.id === loaded.pomodoro.taskId)
      if (task?.timerState) {
        pomodoro.value.phase = task.timerState.phase
        pomodoro.value.secondsLeft = task.timerState.secondsLeft
      }
    }
  }

  async function _syncToSupabase(): Promise<void> {
    if (!supabaseUrl || !supabaseKey) return

    try {
      for (const task of tasks.value) {
        const { data: existing } = await supabase
          .from('tasks')
          .select('id')
          .eq('id', task.id)
          .maybeSingle()

        if (!existing) {
          const { error: insertError } = await supabase
            .from('tasks')
            .insert({
              id: task.id,
              title: task.title,
              completed: task.completed,
              created_at: new Date(task.createdAt).toISOString(),
              completed_at: task.completedAt ? new Date(task.completedAt).toISOString() : null,
              pomodoro_count: task.pomodoroCount,
              timer_state: task.timerState,
              category: task.category,
              priority: task.priority,
              description: task.description,
              due_date: task.dueDate,
              tags: task.tags,
              status: task.status,
            })
            .select()

          if (insertError) {
            console.error('Error inserting task to Supabase:', insertError)
          }
        }
      }
    } catch (error) {
      console.error('Error syncing to Supabase:', error)
    }
  }

  let _supabaseDebounceTimer: number | null = null

  function _debouncedSyncToSupabase(): void {
    if (_supabaseDebounceTimer !== null) {
      clearTimeout(_supabaseDebounceTimer)
    }
    _supabaseDebounceTimer = window.setTimeout(() => {
      void _syncToSupabase()
      _supabaseDebounceTimer = null
    }, 2000)
  }

  watch(
    [tasks, categories, viewMode, filters],
    () => { _persist() },
    { deep: true, flush: 'post' },
  )

  watch(
    tasks,
    () => { _debouncedSyncToSupabase() },
    { deep: true, flush: 'post' },
  )

  return {
    tasks,
    categories,
    viewMode,
    filters,
    pomodoro,
    storageWarning,
    bannerMessage: notifications.bannerMessage,
    filteredTasks,
    activeTasks,
    completedTasks,
    activeTask,
    pomodoroRunning,
    kanbanColumns,
    addCategory,
    addTask,
    editTask,
    deleteTask,
    toggleComplete,
    setTaskStatus,
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
    _persist,
  }
})
