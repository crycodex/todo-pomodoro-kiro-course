<script setup lang="ts">
import { computed } from 'vue'
import type { PomodoroState, Task } from '../types'
import { formatTime } from '../utils/formatTime'
import { BREAK_DURATION_SECONDS, WORK_DURATION_SECONDS } from '../utils/constants'

const props = defineProps<{
  task: Task
  timerState: PomodoroState
}>()

const emit = defineEmits<{
  pause: []
  resume: []
  cancel: []
}>()

const isBreak = computed(
  () => props.timerState.phase === 'break' || props.timerState.phase === 'paused-break',
)
const isPaused = computed(
  () => props.timerState.phase === 'paused-work' || props.timerState.phase === 'paused-break',
)

const phaseLabel = computed(() => {
  if (isBreak.value) return isPaused.value ? 'Descanso · Pausa' : 'Descanso'
  return isPaused.value ? 'Trabajo · Pausa' : 'En trabajo'
})

// Total duration for progress arc calculation
const totalDuration = computed(() =>
  isBreak.value ? BREAK_DURATION_SECONDS : WORK_DURATION_SECONDS,
)

// Progress as 0–1 (elapsed fraction)
const progress = computed(() => {
  const elapsed = totalDuration.value - props.timerState.secondsLeft
  return Math.max(0, Math.min(1, elapsed / totalDuration.value))
})

// SVG arc: circle r=54, circumference = 2π*54 ≈ 339.29
const CIRCUMFERENCE = 2 * Math.PI * 54
const strokeDashoffset = computed(() => CIRCUMFERENCE * (1 - progress.value))

// Announce to screen readers only when minute changes (not every second)
const minuteAnnouncement = computed(() => {
  const mins = Math.floor(props.timerState.secondsLeft / 60)
  return `${mins} ${mins === 1 ? 'minuto' : 'minutos'} restantes`
})
</script>

<template>
  <aside
    class="overlay"
    :class="{ 'is-break': isBreak, 'is-paused': isPaused }"
    aria-label="Temporizador Pomodoro activo"
  >
    <!-- Phase label -->
    <p class="phase-label">{{ phaseLabel }}</p>

    <!-- Task name -->
    <p class="task-name" :title="task.title">{{ task.title }}</p>

    <!-- Arc + time display -->
    <div class="timer-display">
      <svg
        class="arc-svg"
        viewBox="0 0 120 120"
        aria-hidden="true"
        role="presentation"
      >
        <!-- Track ring -->
        <circle
          cx="60" cy="60" r="54"
          class="arc-track"
          fill="none"
          stroke-width="4"
        />
        <!-- Progress ring -->
        <circle
          cx="60" cy="60" r="54"
          class="arc-progress"
          :class="{ 'arc-break': isBreak }"
          fill="none"
          stroke-width="4"
          stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE"
          :stroke-dashoffset="strokeDashoffset"
          transform="rotate(-90 60 60)"
        />
      </svg>

      <!-- Time — aria-live announces only on minute change -->
      <div
        class="time-block"
        role="timer"
        :aria-live="isPaused ? 'off' : 'polite'"
        aria-atomic="true"
        :aria-label="minuteAnnouncement"
      >
        <span class="time" :class="{ 'time-break': isBreak }">
          {{ formatTime(timerState.secondsLeft) }}
        </span>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button
        v-if="isPaused"
        class="btn-primary"
        type="button"
        @click="emit('resume')"
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2.5 1.5l10 5.5-10 5.5V1.5Z" fill="currentColor"/>
        </svg>
        Reanudar
      </button>
      <button
        v-else
        class="btn-primary"
        type="button"
        @click="emit('pause')"
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="2" width="3.5" height="10" rx="1" fill="currentColor"/>
          <rect x="8.5" y="2" width="3.5" height="10" rx="1" fill="currentColor"/>
        </svg>
        Pausar
      </button>

      <button
        class="btn-cancel"
        type="button"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
    </div>
  </aside>
</template>

<style scoped>
.overlay {
  background: var(--bg-surface);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  padding: var(--space-6) var(--space-5);
  text-align: center;
  transition:
    background-color var(--duration-theme) var(--ease-smooth),
    border-color var(--duration-theme) var(--ease-smooth),
    box-shadow var(--duration-theme) var(--ease-smooth);
}

/* Phase label */
.phase-label {
  margin: 0 0 var(--space-2);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--label-tertiary);
}

.overlay.is-break .phase-label {
  color: var(--system-green);
}

.overlay.is-paused .phase-label {
  color: var(--system-orange);
}

/* Task name */
.task-name {
  margin: 0 0 var(--space-5);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--label-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 var(--space-2);
}

/* Arc timer */
.timer-display {
  position: relative;
  width: 148px;
  height: 148px;
  margin: 0 auto var(--space-6);
}

.arc-svg {
  width: 100%;
  height: 100%;
}

.arc-track {
  stroke: var(--border);
}

.arc-progress {
  stroke: var(--accent);
  transition: stroke-dashoffset 0.9s linear, stroke var(--duration-base) var(--ease-out);
}

.arc-progress.arc-break {
  stroke: var(--system-green);
}

.time-block {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.time {
  font-family: var(--font-mono);
  font-size: 2.6rem;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  color: var(--label-primary);
  line-height: 1;
}

.time.time-break {
  color: var(--system-green);
}

/* Controls */
.controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  min-height: var(--tap);
  padding: 0 var(--space-5);
  border: 0;
  border-radius: var(--radius-full);
  background: var(--label-primary);
  color: var(--bg-surface);
  font-size: 0.9rem;
  font-weight: 500;
  font-family: var(--font-sans);
  letter-spacing: 0.01em;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-spring);
}

.btn-primary:hover {
  background: var(--label-secondary);
}

.btn-primary:active {
  transform: scale(0.97);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn-cancel {
  border: 0;
  background: transparent;
  color: var(--label-tertiary);
  font-size: 0.85rem;
  font-family: var(--font-sans);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition:
    color var(--duration-fast) var(--ease-out),
    background-color var(--duration-fast) var(--ease-out);
}

.btn-cancel:hover {
  color: var(--system-red);
  background: rgba(217, 64, 64, 0.06);
}

.btn-cancel:focus-visible {
  outline: 2px solid var(--system-red);
  outline-offset: 2px;
}

/* Mobile: flows in the column, no sticky overlay issues */
@media (max-width: 767px) {
  .overlay {
    /* Natural flow — no fixed or sticky positioning */
    padding: var(--space-5) var(--space-4);
  }

  .timer-display {
    width: 128px;
    height: 128px;
  }

  .time {
    font-size: 2.2rem;
  }
}

/* Desktop: sticky in the sidebar column */
@media (min-width: 768px) {
  .overlay {
    position: sticky;
    top: calc(var(--header-height) + var(--space-6));
  }
}
</style>
