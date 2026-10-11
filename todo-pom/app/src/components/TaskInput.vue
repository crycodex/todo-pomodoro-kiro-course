<script setup lang="ts">
import { computed, ref } from 'vue'

const emit = defineEmits<{
  add: [title: string]
}>()

const title = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

const isValid = computed(() => title.value.trim().length > 0)
const showCounter = computed(() => title.value.length > 150)
const charCount = computed(() => title.value.length)

function submit(): void {
  const value = title.value.trim()
  if (!value) return
  emit('add', value)
  title.value = ''
  inputRef.value?.focus()
}
</script>

<template>
  <div class="input-wrapper">
    <form class="task-input" @submit.prevent="submit">
      <label class="visually-hidden" for="task-title">Nueva tarea</label>
      <input
        id="task-title"
        ref="inputRef"
        v-model="title"
        type="text"
        maxlength="200"
        placeholder="¿Qué vas a hacer ahora?"
        autocomplete="off"
        :aria-describedby="showCounter ? 'char-count' : undefined"
      />
      <button type="submit" :disabled="!isValid" aria-label="Añadir tarea">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>Añadir</span>
      </button>
    </form>

    <!-- Character counter — always in DOM for aria-live, but only visible when near limit -->
    <p
      id="char-count"
      class="char-count"
      :class="{ visible: showCounter }"
      aria-live="polite"
      aria-atomic="true"
    >
      <span v-if="showCounter">{{ charCount }}/200</span>
    </p>
  </div>
</template>

<style scoped>
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.task-input {
  display: flex;
  gap: var(--space-2);
  align-items: stretch;
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-2);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow var(--duration-base) var(--ease-out),
    background-color var(--duration-theme) var(--ease-smooth);
}

.task-input:focus-within {
  box-shadow: var(--shadow-md), 0 0 0 2px var(--accent-muted);
}

input {
  flex: 1;
  min-height: calc(var(--tap) - 8px);
  padding: 0 var(--space-3);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  font-size: 1rem;
  font-family: var(--font-sans);
  font-weight: 400;
  color: var(--label-primary);
  outline: none;
  /* Suppress default focus ring — the wrapper handles it */
}

input::placeholder {
  color: var(--label-tertiary);
  transition: color var(--duration-base) var(--ease-out);
}

input:focus::placeholder {
  color: var(--label-quaternary);
}

button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: calc(var(--tap) - 8px);
  padding: 0 var(--space-4);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--accent);
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: var(--font-sans);
  letter-spacing: 0.01em;
  white-space: nowrap;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-spring),
    opacity var(--duration-fast) var(--ease-out);
}

button:not(:disabled):hover {
  background: var(--accent-hover);
}

button:not(:disabled):active {
  transform: scale(0.97);
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.char-count {
  margin: 0;
  padding: 0 var(--space-2);
  font-size: 0.75rem;
  color: var(--label-tertiary);
  text-align: right;
  min-height: 1.2em;
  opacity: 0;
  transition: opacity var(--duration-base) var(--ease-out);
}

.char-count.visible {
  opacity: 1;
}
</style>
