<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  add: [title: string]
}>()

const title = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const isValid = computed(() => title.value.trim().length > 0)

function submit(): void {
  const value = title.value.trim()
  if (!value) return
  emit('add', value)
  title.value = ''
  inputRef.value?.focus()
}
</script>

<template>
  <form class="task-input" @submit.prevent="submit">
    <label class="sr-only" for="task-title">Nueva tarea</label>
    <input
      id="task-title"
      ref="inputRef"
      v-model="title"
      type="text"
      maxlength="200"
      placeholder="Qué vas a hacer ahora"
      autocomplete="off"
    />
    <button type="submit" :disabled="!isValid">Añadir</button>
  </form>
</template>

<style scoped>
.task-input {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

input {
  flex: 1;
  min-height: var(--tap);
  padding: 0 14px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-size: 1rem;
}

button {
  min-width: var(--tap);
  min-height: var(--tap);
  padding: 0 16px;
  border: 1px solid var(--color-text);
  background: var(--color-text);
  color: var(--color-surface);
  font-size: 0.95rem;
  font-weight: 600;
}

button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background: #000;
}
</style>
