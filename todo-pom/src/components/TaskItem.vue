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
  <article class="item" :class="{ completed: task.completed, active: isActive, 'has-timer': hasTimer, 'timer-paused': timerStatus === 'paused', 'timer-running': timerStatus === 'running' }">
    <button
      class="check"
      type="button"
      :aria-pressed="task.completed"
      :aria-label="task.completed ? 'Marcar como pendiente' : 'Marcar como completada'"
      @click="emit('toggle-complete', task.id)"
    >
      <span class="box" :class="{ on: task.completed }" />
    </button>

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
      >
        {{ task.title }}
      </p>
      <p class="meta">
        <span v-if="task.timerState">{{ formatTime(task.timerState.secondsLeft) }} • </span>
        {{ task.pomodoroCount }} {{ task.pomodoroCount === 1 ? 'ciclo' : 'ciclos' }}
      </p>
    </div>

    <div class="actions">
      <span v-if="hasTimer" class="timer-indicator" :class="timerStatus"></span>
      <button
        v-if="!task.completed"
        class="icon-btn"
        type="button"
        :aria-label="
          timerStatus === 'idle'
            ? 'Iniciar pomodoro'
            : 'Cancelar pomodoro'
        "
        :title="timerStatus === 'idle' ? 'Iniciar' : 'Cancelar'"
        @click="onPomodoroClick"
      >
        <span class="glyph" :class="timerStatus" />
      </button>
      <button
        class="icon-btn danger"
        type="button"
        aria-label="Eliminar tarea"
        @click="emit('delete', task.id)"
      >
        ×
      </button>
    </div>
  </article>
</template>

<style scoped>
.item {
  display: grid;
  grid-template-columns: var(--tap) minmax(0, 1fr) auto;
  gap: 4px;
  align-items: center;
  min-height: 56px;
  padding: 6px 0;
  border-bottom: 1px solid var(--color-border);
}

.item.active {
  background: var(--color-hover);
  margin-inline: -8px;
  padding-inline: 8px;
}

.check,
.icon-btn {
  width: var(--tap);
  height: var(--tap);
  border: 0;
  background: transparent;
  display: grid;
  place-items: center;
}

.box {
  width: 18px;
  height: 18px;
  border: 1.5px solid var(--color-text);
  background: transparent;
}

.box.on {
  background: var(--color-text);
}

.body {
  min-width: 0;
}

.title,
.edit {
  margin: 0;
  font-size: 1rem;
  width: 100%;
}

.edit {
  min-height: 36px;
  border: 0;
  border-bottom: 1px solid var(--color-text);
  background: transparent;
  padding: 0;
}

.title.done {
  text-decoration: line-through;
  color: var(--color-text-muted);
}

.meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.timer-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.timer-indicator.running {
  background: #10b981;
  animation: pulse 1s ease-in-out infinite;
}

.timer-indicator.paused {
  background: #f59e0b;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.icon-btn {
  font-size: 1.4rem;
  color: var(--color-text);
}

.icon-btn:hover {
  background: var(--color-hover);
}

.glyph {
  display: block;
  width: 14px;
  height: 14px;
  background: var(--color-text);
}

.glyph.idle {
  clip-path: polygon(12% 8%, 92% 50%, 12% 92%);
}

.glyph.running {
  clip-path: none;
}

.glyph.paused {
  width: 12px;
  background:
    linear-gradient(var(--color-text), var(--color-text)) 0 0 / 4px 100% no-repeat,
    linear-gradient(var(--color-text), var(--color-text)) 8px 0 / 4px 100% no-repeat;
}

.danger {
  color: var(--color-text-muted);
}
</style>
