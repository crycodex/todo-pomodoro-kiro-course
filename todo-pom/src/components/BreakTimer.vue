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
  padding: 16px 12px;
  background: var(--color-inverse);
  color: var(--color-inverse-text);
  text-align: center;
}

.label {
  margin: 0 0 4px;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: #c4c4c4;
}

.time {
  margin: 0;
  font-family: var(--mono);
  font-size: 2.4rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.04em;
  line-height: 1;
}
</style>
