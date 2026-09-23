<script setup lang="ts">
import { formatTime } from '../utils/formatTime'

defineProps<{
  secondsLeft: number
}>()
</script>

<template>
  <div class="break-timer" role="status">
    <p class="label">Descanso</p>
    <p class="time">{{ formatTime(secondsLeft) }}</p>
  </div>
</template>

<style scoped>
.break-timer {
  padding: var(--space-4) var(--space-3);
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  text-align: center;
}

.break-timer .label {
  margin: 0 0 var(--space-1);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--label-tertiary);
  text-transform: uppercase;
}

.break-timer .time {
  margin: 0;
  font-family: var(--mono);
  font-size: 2.4rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--label-primary);
}
</style>
