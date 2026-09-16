<script setup lang="ts">
import { computed } from 'vue'
import type { PomodoroState, Task } from '../types'
import { formatTime } from '../utils/formatTime'
import BreakTimer from './BreakTimer.vue'

const props = defineProps<{
  task: Task
  timerState: PomodoroState
}>()

const emit = defineEmits<{
  pause: []
  resume: []
  cancel: []
}>()

const visible = computed(() => props.timerState.phase !== 'idle')
const isBreak = computed(
  () => props.timerState.phase === 'break' || props.timerState.phase === 'paused-break',
)
const isPaused = computed(
  () => props.timerState.phase === 'paused-work' || props.timerState.phase === 'paused-break',
)
const phaseLabel = computed(() => {
  if (isBreak.value) return isPaused.value ? 'Descanso en pausa' : 'Descanso'
  return isPaused.value ? 'Trabajo en pausa' : 'Trabajo'
})
</script>

<template>
  <aside v-if="visible" class="overlay" :class="{ break: isBreak, sheet: true }">
    <p class="task-name">{{ task.title }}</p>
    <p class="phase">{{ phaseLabel }}</p>

    <BreakTimer v-if="isBreak" :seconds-left="timerState.secondsLeft" />
    <p v-else class="time">{{ formatTime(timerState.secondsLeft) }}</p>

    <div class="controls">
      <button v-if="isPaused" type="button" @click="emit('resume')">Reanudar</button>
      <button v-else type="button" @click="emit('pause')">Pausar</button>
      <button class="ghost" type="button" @click="emit('cancel')">Cancelar</button>
    </div>
  </aside>
</template>

<style scoped>
.overlay {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 20px 16px 16px;
  text-align: center;
}

.task-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.phase {
  margin: 4px 0 16px;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.time {
  margin: 0 0 20px;
  font-family: var(--mono);
  font-size: 3.4rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.06em;
  line-height: 1;
}

.controls {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 16px;
}

button {
  min-height: var(--tap);
  min-width: var(--tap);
  padding: 0 16px;
  border: 1px solid var(--color-text);
  background: var(--color-text);
  color: var(--color-surface);
  font-weight: 600;
}

button.ghost {
  background: transparent;
  color: var(--color-text);
}

@media (max-width: 767px) {
  .overlay {
    position: sticky;
    bottom: 0;
    z-index: 8;
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
    box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.08);
  }
}

@media (min-width: 768px) {
  .overlay {
    position: sticky;
    top: calc(var(--header-height) + 24px);
  }
}
</style>
