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
  gap: var(--space-2);
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
  padding: 0 var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-grouped);
  font-size: 1rem;
  font-family: inherit;
  color: inherit;
  transition: border-color var(--duration-theme) var(--ease-ios-spring),
              box-shadow var(--duration-theme) var(--ease-ios-spring);
}

input:focus {
  border-color: var(--system-blue);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
  outline: none;
}

button {
  min-width: var(--tap);
  min-height: var(--tap);
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

button:active {
  transform: scale(0.95);
}

button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background: var(--fill-secondary);
}
</style>
