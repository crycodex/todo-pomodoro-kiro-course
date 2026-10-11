<script setup lang="ts">
import { formatTime } from '../utils/formatTime'

const props = defineProps<{
  secondsLeft: number
}>()
</script>

<template>
  <div class="break-timer" aria-live="polite" aria-atomic="true">
    <span class="label">Descanso</span>
    <strong class="time">{{ formatTime(props.secondsLeft) }}</strong>
  </div>
</template>

<style scoped>
.break-timer {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  background: rgba(40, 167, 69, 0.12);
  color: var(--system-green);
  border: 1px solid rgba(40, 167, 69, 0.2);
  font-family: var(--font-sans);
}

.label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.time {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}
</style>
