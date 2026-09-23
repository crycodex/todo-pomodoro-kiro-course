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
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  padding: var(--space-5) var(--space-4) var(--space-4);
  text-align: center;
  border: 1px solid var(--border);
}

.overlay .task-name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--label-primary);
}

.overlay .phase {
  margin: var(--space-1) 0 var(--space-4);
  font-size: 0.8rem;
  color: var(--label-tertiary);
}

.overlay .time {
  margin: 0 0 var(--space-5);
  font-family: var(--mono);
  font-size: 3.4rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.06em;
  line-height: 1;
  color: var(--label-primary);
}

.overlay .controls {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  margin-top: var(--space-4);
}

.overlay button {
  min-height: var(--tap);
  min-width: var(--tap);
  padding: 0 var(--space-4);
  border: 0;
  border-radius: var(--radius-xl);
  background: var(--label-primary);
  color: var(--bg-grouped);
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: transform var(--duration-theme) var(--ease-ios-spring),
              background-color var(--duration-theme) var(--ease-ios-spring);
}

.overlay button:active {
  transform: scale(0.95);
}

.overlay button:hover {
  background: var(--fill-secondary);
}

.overlay button.ghost {
  background: transparent;
  color: var(--system-red);
  border: 1px solid var(--border);
}

.overlay button.ghost:hover {
  background: rgba(255, 59, 48, 0.1);
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
