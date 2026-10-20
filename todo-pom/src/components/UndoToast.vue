<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useTodoStore } from '../stores/todoStore'

const store = useTodoStore()

// Progress bar goes from 100% → 0% over the undo window
const UNDO_MS = 4500
const progress = ref(100)
let rafId: number | null = null
let startTime = 0

function startProgress(): void {
  startTime = Date.now()
  progress.value = 100

  function tick(): void {
    const elapsed = Date.now() - startTime
    progress.value = Math.max(0, 100 - (elapsed / UNDO_MS) * 100)
    if (progress.value > 0 && store.pendingDelete) {
      rafId = requestAnimationFrame(tick)
    }
  }
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(tick)
}

watch(
  () => store.pendingDelete,
  (val) => {
    if (val) {
      startProgress()
    } else {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    }
  },
)

const taskTitle = computed(() => store.pendingDelete?.task.title ?? '')
</script>

<template>
  <Transition name="toast">
    <div
      v-if="store.pendingDelete"
      class="toast"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="toast-progress" :style="{ width: progress + '%' }" aria-hidden="true" />
      <p class="toast-msg">
        <span class="toast-title" :title="taskTitle">«{{ taskTitle }}»</span> eliminada
      </p>
      <button
        type="button"
        class="undo-btn"
        aria-label="Deshacer eliminación"
        @click="store.undoDelete()"
      >
        Deshacer
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: var(--space-5);
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 260px;
  max-width: min(400px, calc(100vw - 2rem));
  padding: var(--space-3) var(--space-4);
  background: var(--label-primary);
  color: var(--bg-app);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg, 0 8px 24px rgba(0,0,0,.25));
  overflow: hidden;
}

.toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  transition: width 0.1s linear;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

.toast-msg {
  flex: 1;
  margin: 0;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-title {
  font-weight: 600;
}

.undo-btn {
  flex-shrink: 0;
  padding: var(--space-1) var(--space-3);
  border: 1.5px solid currentColor;
  border-radius: var(--radius-md);
  background: transparent;
  color: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: background-color var(--duration-fast) var(--ease-out);
}

.undo-btn:hover {
  background: rgba(255,255,255,0.15);
}

.undo-btn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Transition */
.toast-enter-active {
  transition:
    opacity 0.2s var(--ease-out),
    transform 0.25s var(--ease-spring, cubic-bezier(0.34,1.56,0.64,1));
}
.toast-leave-active {
  transition:
    opacity 0.18s var(--ease-out),
    transform 0.18s var(--ease-out);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(12px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
