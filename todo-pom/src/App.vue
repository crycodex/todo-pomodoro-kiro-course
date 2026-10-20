<script setup lang="ts">
import { computed, onMounted, ref, watchEffect } from 'vue'
import { useTodoStore } from './stores/todoStore'
import { usePomodoro } from './composables/usePomodoro'
import { formatTime } from './utils/formatTime'
import TheHeader from './components/TheHeader.vue'
import TaskInput from './components/TaskInput.vue'
import TaskList from './components/TaskList.vue'
import CompletedList from './components/CompletedList.vue'
import PomodoroOverlay from './components/PomodoroOverlay.vue'
import type { TaskStatus } from './types'
import UndoToast from './components/UndoToast.vue'

const store = useTodoStore()
const pomodoro = usePomodoro()
const isDark = ref(false)

const priorities = ['Low', 'Medium', 'High', 'Critical']
const dueOptions = [
  { value: 'all', label: 'Todas las fechas' },
  { value: 'no-due-date', label: 'Sin fecha' },
  { value: 'today', label: 'Hoy' },
  { value: 'this-week', label: 'Esta semana' },
  { value: 'this-month', label: 'Este mes' },
  { value: 'overdue', label: 'Vencidas' },
]

const allTags = computed(() => [...new Set(store.tasks.flatMap((task) => task.tags))])
const boardColumns = computed(() => [
  { key: 'todo', label: 'To Do', tasks: store.kanbanColumns.todo },
  { key: 'in-progress', label: 'In Progress', tasks: store.kanbanColumns['in-progress'] },
  { key: 'done', label: 'Done', tasks: store.kanbanColumns.done },
])

function toggleTheme(): void {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
}

function clearFilters(): void {
  store.filters = {
    category: null,
    priority: [],
    dueDate: 'all',
    tags: [],
  }
}

function onDrop(event: DragEvent, status: TaskStatus): void {
  event.preventDefault()
  const taskId = event.dataTransfer?.getData('text/plain')
  if (!taskId) return
  store.setTaskStatus(taskId, status)
}

function onDragStart(event: DragEvent, taskId: string): void {
  event.dataTransfer?.setData('text/plain', taskId)
  event.dataTransfer!.effectAllowed = 'move'
}

const THEME_KEY = 'todo-pom-theme'

onMounted(() => {
  store._loadFromStorage()

  // Restore saved theme, fall back to system preference
  const saved = localStorage.getItem(THEME_KEY)
  const prefersDark = saved !== null
    ? saved === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = prefersDark
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')

  // Follow system preference only when user has not overridden it manually
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem(THEME_KEY) !== null) return
    isDark.value = e.matches
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
  })
})

watchEffect(() => {
  if (store.pomodoro.phase !== 'idle') {
    document.title = `⏱ ${formatTime(store.pomodoro.secondsLeft)} — todo-pom`
  } else {
    document.title = 'todo-pom'
  }
})
</script>

<template>
  <div class="app-shell">
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>

    <TheHeader
      :storage-warning="store.storageWarning"
      :is-dark="isDark"
      @toggle-theme="toggleTheme"
    />

    <p v-if="store.bannerMessage" class="app-banner" role="status" aria-live="polite">
      {{ store.bannerMessage }}
    </p>

    <main
      id="main-content"
      tabindex="-1"
      class="app-layout"
      :class="{ 'with-timer': store.pomodoro.phase !== 'idle' }"
    >
      <div class="tasks-column">
        <PomodoroOverlay
          v-if="store.activeTask && store.pomodoro.phase !== 'idle'"
          class="overlay-mobile"
          :task="store.activeTask"
          :timer-state="store.pomodoro"
          @pause="pomodoro.pause"
          @resume="pomodoro.resume"
          @cancel="pomodoro.cancel"
        />

        <section class="toolbar" aria-label="Filtros y vista">
          <div class="toolbar-row view-toggle" role="tablist" aria-label="Seleccionar vista">
            <button
              type="button"
              :class="{ active: store.viewMode === 'list' }"
              @click="store.viewMode = 'list'"
            >
              Lista
            </button>
            <button
              type="button"
              :class="{ active: store.viewMode === 'kanban' }"
              @click="store.viewMode = 'kanban'"
            >
              Kanban
            </button>
          </div>

          <div class="filter-grid">
            <label>
              <span>Categoría</span>
              <select v-model="store.filters.category">
                <option :value="null">Todas</option>
                <option v-for="category in store.categories" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </label>

            <label>
              <span>Fecha</span>
              <select v-model="store.filters.dueDate">
                <option v-for="option in dueOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
          </div>

          <div class="filter-group">
            <span class="filter-title">Prioridad</span>
            <div class="chip-list">
              <label v-for="priority in priorities" :key="priority" class="chip">
                <input v-model="store.filters.priority" type="checkbox" :value="priority" />
                <span>{{ priority }}</span>
              </label>
            </div>
          </div>

          <div class="filter-group">
            <span class="filter-title">Etiquetas</span>
            <div class="chip-list">
              <label v-for="tag in allTags" :key="tag" class="chip">
                <input v-model="store.filters.tags" type="checkbox" :value="tag" />
                <span>{{ tag }}</span>
              </label>
            </div>
          </div>

          <button v-if="store.filters.category || store.filters.priority.length || store.filters.tags.length || store.filters.dueDate !== 'all'" type="button" class="clear-btn" @click="clearFilters">
            Limpiar filtros
          </button>
        </section>

        <TaskInput v-if="store.viewMode === 'list'" @add="store.addTask" />

        <div v-if="store.viewMode === 'kanban'" class="kanban-board" aria-label="Tablero Kanban">
          <div
            v-for="column in boardColumns"
            :key="column.key"
            class="kanban-column"
            @dragover.prevent
            @drop="onDrop($event, column.key as TaskStatus)"
          >
            <div class="column-header">
              <span>{{ column.label }}</span>
              <span class="column-count">{{ column.tasks.length }}</span>
            </div>

            <div v-if="column.tasks.length === 0" class="kanban-empty">Sin tareas</div>
            <div
              v-for="task in column.tasks"
              :key="task.id"
              class="kanban-card"
              :class="`priority-${task.priority.toLowerCase()}`"
              draggable="true"
              @dragstart="onDragStart($event, task.id)"
            >
              <div class="card-topline">
                <span class="priority-pill">{{ task.priority }}</span>
                <span v-if="task.dueDate" class="due-badge">{{ task.dueDate }}</span>
              </div>
              <strong>{{ task.title }}</strong>
              <p v-if="task.description">{{ task.description.slice(0, 80) }}</p>
              <div class="card-actions">
                <button
                  type="button"
                  class="card-btn complete-btn"
                  :aria-label="task.completed ? 'Marcar como pendiente' : 'Marcar como completada'"
                  @click.stop="store.toggleComplete(task.id)"
                >
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l2.8 3L10 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ task.completed ? 'Reabrir' : 'Completar' }}
                </button>
                <button
                  type="button"
                  class="card-btn delete-btn"
                  aria-label="Eliminar tarea"
                  @click.stop="store.deleteTask(task.id)"
                >
                  <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>

        <TaskList v-if="store.viewMode === 'list'" />
        <CompletedList v-if="store.viewMode === 'list'" />
      </div>

      <PomodoroOverlay
        v-if="store.activeTask && store.pomodoro.phase !== 'idle'"
        class="overlay-desktop"
        :task="store.activeTask"
        :timer-state="store.pomodoro"
        @pause="pomodoro.pause"
        @resume="pomodoro.resume"
        @cancel="pomodoro.cancel"
      />
    </main>
    <UndoToast />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
}

.toolbar-row {
  display: flex;
  gap: 0.5rem;
}

.view-toggle button {
  flex: 1;
  border: 1px solid var(--border);
  background: transparent;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;
}

.view-toggle button.active {
  background: var(--accent-subtle);
  border-color: var(--accent);
  color: var(--accent);
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

label,
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--label-secondary);
  font-size: 0.8rem;
}

select {
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 0.55rem 0.75rem;
  background: transparent;
  color: var(--label-primary);
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
}

.clear-btn {
  align-self: flex-start;
  border: 1px solid var(--border);
  background: transparent;
  padding: 0.5rem 0.8rem;
  border-radius: 0.5rem;
  color: var(--label-primary);
  cursor: pointer;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.kanban-column {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 0.75rem;
  min-height: 260px;
  border: 1px solid var(--divider);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-weight: 600;
}

.column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 99px;
  min-width: 1.5rem;
  height: 1.5rem;
  background: var(--fill-secondary);
  color: var(--label-primary);
  font-size: 0.75rem;
}

.kanban-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--fill-secondary);
  border-left: 4px solid var(--accent);
  border-radius: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  cursor: grab;
}

.priority-low { border-left-color: #3b82f6; }
.priority-medium { border-left-color: #22c55e; }
.priority-high { border-left-color: #f59e0b; }
.priority-critical { border-left-color: #ef4444; }

.priority-pill {
  display: inline-flex;
  align-self: flex-start;
  background: rgba(255,255,255,0.08);
  padding: 0.2rem 0.45rem;
  border-radius: 999px;
  font-size: 0.7rem;
}

.card-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.due-badge {
  font-size: 0.65rem;
  opacity: 0.8;
}

.kanban-card strong {
  font-size: 0.95rem;
}

.kanban-card p {
  margin: 0;
  color: var(--label-secondary);
  font-size: 0.75rem;
}
.card-actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.25rem;
  opacity: 0;
  transition: opacity var(--duration-fast, 0.12s) ease-out;
}
.kanban-card:hover .card-actions,
.kanban-card:focus-within .card-actions {
  opacity: 1;
}
.card-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--label-secondary);
  font-size: 0.7rem;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background-color var(--duration-fast, 0.12s) ease-out, color var(--duration-fast, 0.12s) ease-out;
}
.card-btn:hover {
  background: var(--fill-secondary);
  color: var(--label-primary);
}
.card-btn.delete-btn:hover {
  background: rgba(239,68,68,0.12);
  color: #ef4444;
  border-color: rgba(239,68,68,0.3);
}
.card-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.kanban-empty {
  border: 1px dashed var(--border);
  border-radius: 0.75rem;
  color: var(--label-tertiary);
  padding: 1rem;
  text-align: center;
}

.overlay-mobile {
  display: block;
}

.overlay-desktop {
  display: none;
}

@media (min-width: 768px) {
  .overlay-mobile {
    display: none;
  }

  .overlay-desktop {
    display: block;
  }
}

@media (max-width: 767px) {
  .kanban-board {
    grid-template-columns: repeat(3, minmax(220px, 80vw));
    overflow-x: auto;
    scroll-snap-type: x proximity;
  }
}
</style>
