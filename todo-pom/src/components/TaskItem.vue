<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { Task } from '../types'
import { formatTime } from '../utils/formatTime'

const props = defineProps<{
  task: Task
  isActive: boolean
}>()

const emit = defineEmits<{
  'toggle-complete': [id: string]
  edit: [id: string, newTitle: string]
  delete: [id: string]
  'start-pomodoro': [id: string]
  'cancel-pomodoro': [id: string]
}>()

const editing = ref(false)
const draft = ref(props.task.title)
const editInput = ref<HTMLInputElement | null>(null)

const timerStatus = computed(() => {
  if (!props.task.timerState || props.task.timerState.phase === 'idle') return 'idle'
  if (props.task.timerState.phase === 'paused-work' || props.task.timerState.phase === 'paused-break') return 'paused'
  return 'running'
})

const hasTimer = computed(() => {
  return !!props.task.timerState && props.task.timerState.phase !== 'idle'
})

// Limit dots to 8, show "N+" after that
const DOTS_MAX = 8
const pomodoroDotsCount = computed(() => Math.min(props.task.pomodoroCount, DOTS_MAX))
const pomodoroOverflow = computed(() => props.task.pomodoroCount > DOTS_MAX)

async function beginEdit(): Promise<void> {
  if (props.task.completed) return
  draft.value = props.task.title
  editing.value = true
  await nextTick()
  editInput.value?.focus()
  editInput.value?.select()
}

function confirmEdit(): void {
  const next = draft.value.trim()
  editing.value = false
  if (!next) {
    draft.value = props.task.title
    return
  }
  emit('edit', props.task.id, next)
}

function cancelEdit(): void {
  draft.value = props.task.title
  editing.value = false
}

function onPomodoroClick(): void {
  if (props.task.completed) return
  if (props.isActive) {
    emit('cancel-pomodoro', props.task.id)
    return
  }
  emit('start-pomodoro', props.task.id)
}
</script>

<template>
  <article
    v-memo="[task.id, task.title, task.completed, task.pomodoroCount, task.timerState?.phase, task.timerState?.secondsLeft, isActive]"
    class="item"
    :class="{
      'is-completed': task.completed,
      'is-active': isActive && timerStatus === 'running',
      'is-paused': timerStatus === 'paused',
      'is-editing': editing,
    }"
  >
    <!-- Checkbox -->
    <button
      class="check"
      type="button"
      :aria-pressed="task.completed"
      :aria-label="task.completed ? 'Marcar como pendiente' : 'Marcar como completada'"
      @click="emit('toggle-complete', task.id)"
    >
      <span class="check-ring" :class="{ checked: task.completed }" aria-hidden="true">
        <svg v-if="task.completed" class="check-mark" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.8 7L9 1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>

    <!-- Body -->
    <div class="body">
      <input
        v-if="editing"
        ref="editInput"
        v-model="draft"
        class="edit"
        maxlength="200"
        @keydown.enter.prevent="confirmEdit"
        @keydown.escape.prevent="cancelEdit"
        @blur="confirmEdit"
      />
      <p
        v-else
        class="title"
        :class="{ done: task.completed }"
        @dblclick="beginEdit"
      >{{ task.title }}</p>

      <!-- Meta: timer time + pomodoro dots -->
      <div class="meta">
        <span v-if="hasTimer" class="timer-time">
          {{ formatTime(task.timerState!.secondsLeft) }}
        </span>
        <span
          v-if="task.pomodoroCount > 0"
          class="pomo-dots"
          :title="`${task.pomodoroCount} ${task.pomodoroCount === 1 ? 'ciclo completado' : 'ciclos completados'}`"
          :aria-label="`${task.pomodoroCount} ${task.pomodoroCount === 1 ? 'ciclo completado' : 'ciclos completados'}`"
        >
          <span
            v-for="i in pomodoroDotsCount"
            :key="i"
            class="dot"
            aria-hidden="true"
          />
          <span v-if="pomodoroOverflow" class="dot-overflow" aria-hidden="true">+</span>
        </span>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <!-- Edit button — visible on hover and always focusable -->
      <button
        v-if="!task.completed && !editing"
        class="icon-btn edit-btn"
        type="button"
        aria-label="Editar tarea"
        @click="beginEdit"
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9.5 2L12 4.5L4.5 12H2v-2.5L9.5 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Pomodoro toggle -->
      <button
        v-if="!task.completed"
        class="icon-btn pomo-btn"
        :class="{ 'pomo-active': timerStatus !== 'idle' }"
        type="button"
        :aria-label="timerStatus === 'idle' ? 'Iniciar pomodoro' : 'Cancelar pomodoro'"
        @click="onPomodoroClick"
      >
        <!-- Play triangle -->
        <svg v-if="timerStatus === 'idle'" aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2l9 5-9 5V2Z" fill="currentColor"/>
        </svg>
        <!-- Pause bars (running) -->
        <svg v-else-if="timerStatus === 'running'" aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="2" width="3.5" height="10" rx="1" fill="currentColor"/>
          <rect x="8.5" y="2" width="3.5" height="10" rx="1" fill="currentColor"/>
        </svg>
        <!-- Resume arrow (paused) -->
        <svg v-else aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2l9 5-9 5V2Z" fill="currentColor" opacity="0.5"/>
          <circle cx="10.5" cy="10.5" r="3.5" fill="var(--system-orange)"/>
          <path d="M9.5 10.5h2M10.5 9.5v2" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </button>

      <!-- Delete -->
      <button
        class="icon-btn delete-btn"
        type="button"
        aria-label="Eliminar tarea"
        @click="emit('delete', task.id)"
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
  </article>
</template>

<style scoped>
.item {
  display: grid;
  grid-template-columns: var(--tap) minmax(0, 1fr) auto;
  align-items: center;
  min-height: 60px;
  padding: var(--space-2) var(--space-2) var(--space-2) 0;
  border-bottom: 1px solid var(--divider);
  /* Left accent border — always present to avoid layout shift */
  border-left: 3px solid transparent;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-left-color var(--duration-base) var(--ease-out);
}

.item:last-child {
  border-bottom: none;
}

.item:hover .edit-btn {
  opacity: 1;
}

/* State: active (running pomodoro) */
.item.is-active {
  border-left-color: var(--accent);
  background: var(--accent-subtle);
}

/* State: paused pomodoro */
.item.is-paused {
  border-left-color: var(--system-orange);
  background: rgba(217, 122, 26, 0.05);
}

/* State: completed */
.item.is-completed {
  opacity: 0.6;
}

/* ── Checkbox ── */
.check {
  width: var(--tap);
  height: var(--tap);
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.check:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -4px;
  border-radius: var(--radius-full);
}

.check-ring {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  border: 2px solid var(--border);
  background: transparent;
  display: grid;
  place-items: center;
  color: #fff;
  transition:
    background-color var(--duration-base) var(--ease-spring),
    border-color var(--duration-base) var(--ease-spring),
    transform var(--duration-fast) var(--ease-spring);
}

.check-ring.checked {
  background: var(--accent);
  border-color: var(--accent);
  transform: scale(1.05);
}

.check:active .check-ring {
  transform: scale(0.9);
}

.check-mark {
  width: 10px;
  height: 8px;
}

/* ── Body ── */
.body {
  min-width: 0;
  padding: var(--space-1) 0;
}

.title {
  margin: 0;
  font-size: 0.975rem;
  font-weight: 400;
  color: var(--label-primary);
  line-height: 1.4;
  /* Allow long words to break */
  overflow-wrap: break-word;
  word-break: break-word;
  cursor: default;
}

.title.done {
  text-decoration: line-through;
  color: var(--label-tertiary);
}

.edit {
  width: 100%;
  margin: 0;
  padding: 2px 0;
  border: 0;
  border-bottom: 2px solid var(--accent);
  background: transparent;
  font-size: 0.975rem;
  font-family: var(--font-sans);
  color: var(--label-primary);
  outline: none;
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-top: 2px;
}

.timer-time {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--label-tertiary);
  letter-spacing: 0.02em;
}

.pomo-dots {
  display: flex;
  align-items: center;
  gap: 3px;
}

.dot {
  display: block;
  width: 5px;
  height: 5px;
  border-radius: var(--radius-full);
  background: var(--label-tertiary);
  flex-shrink: 0;
}

.dot-overflow {
  font-size: 0.65rem;
  color: var(--label-tertiary);
  line-height: 1;
  margin-left: 1px;
}

/* ── Actions ── */
.actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.icon-btn {
  width: var(--tap);
  height: var(--tap);
  border: 0;
  background: transparent;
  border-radius: var(--radius-md);
  color: var(--label-tertiary);
  display: grid;
  place-items: center;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.icon-btn:hover {
  background: var(--fill-secondary);
  color: var(--label-primary);
}

.icon-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Edit btn — hidden until hover (but always focusable) */
.edit-btn {
  opacity: 0;
  transition:
    opacity var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

/* Always show edit button when item has focus-within (keyboard nav) */
.item:focus-within .edit-btn {
  opacity: 1;
}

/* Pomo active state — show accent color */
.pomo-btn.pomo-active {
  color: var(--accent);
}

.pomo-btn.pomo-active:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}

/* Delete hover — red tint */
.delete-btn:hover {
  background: rgba(217, 64, 64, 0.08);
  color: var(--system-red);
}
</style>
