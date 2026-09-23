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
  gap: var(--space-1);
  align-items: center;
  min-height: 56px;
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--divider);
  transition: background-color var(--duration-theme) var(--ease-ios-spring);
}

.item.active {
  background: var(--fill-secondary);
  margin-inline: -8px;
  padding-inline: 8px;
}

.item.completed {
  opacity: 0.7;
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
  width: 26px;
  height: 26px;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  transition: background-color var(--duration-theme) var(--ease-ios-spring),
              border-color var(--duration-theme) var(--ease-ios-spring),
              transform var(--duration-theme) var(--ease-ios-spring);
}

.box.on {
  background: var(--system-blue);
  border-color: var(--system-blue);
}

.check:active .box {
  transform: scale(1.05);
}

.body {
  min-width: 0;
}

.title,
.edit {
  margin: 0;
  font-size: 1rem;
  width: 100%;
  font-family: inherit;
  color: var(--label-primary);
}

.title {
  padding: var(--space-1) 0;
}

.edit {
  min-height: 36px;
  border: 0;
  border-bottom: 2px solid var(--border);
  background: transparent;
  padding: 0;
  border-radius: var(--radius-sm);
  font-family: inherit;
  color: inherit;
}

.edit:focus {
  border-bottom-color: var(--system-blue);
  outline: none;
}

.title.done {
  text-decoration: line-through;
  color: var(--label-tertiary);
}

.meta {
  margin: var(--space-1) 0 0;
  font-size: 0.75rem;
  color: var(--label-tertiary);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.timer-indicator {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
}

.timer-indicator.running {
  background: var(--system-green);
  animation: pulse 1s ease-in-out infinite;
}

.timer-indicator.paused {
  background: var(--system-orange);
}

.timer-indicator.idle {
  background: transparent;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.icon-btn {
  font-size: 1.4rem;
  color: var(--label-primary);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--duration-theme) var(--ease-ios-spring);
}

.icon-btn:hover {
  background: var(--fill-secondary);
}

.icon-btn.danger:hover {
  background: rgba(255, 59, 48, 0.1);
}

.glyph {
  display: block;
  width: 14px;
  height: 14px;
  background: var(--label-primary);
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
    linear-gradient(var(--label-primary), var(--label-primary)) 0 0 / 4px 100% no-repeat,
    linear-gradient(var(--label-primary), var(--label-primary)) 8px 0 / 4px 100% no-repeat;
}
</style>
