<script setup lang="ts">
import { ref } from 'vue'
import { useTodoStore } from '../stores/todoStore'
import TaskItem from './TaskItem.vue'

const store = useTodoStore()
const open = ref(false)

// ── Transition JS hooks for accurate height animation ──
function onBeforeEnter(el: Element) {
  const elem = el as HTMLElement
  elem.style.height = '0px'
  elem.style.overflow = 'hidden'
}

function onEnter(el: Element, done: () => void) {
  const elem = el as HTMLElement
  // Force reflow before setting height
  void elem.scrollHeight
  elem.style.height = elem.scrollHeight + 'px'
  elem.style.transition = 'height 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
  const cleanup = () => {
    elem.style.height = ''
    elem.style.overflow = ''
    elem.style.transition = ''
    done()
  }
  elem.addEventListener('transitionend', cleanup, { once: true })
}

function onAfterEnter(el: Element) {
  const elem = el as HTMLElement
  elem.style.height = ''
  elem.style.overflow = ''
}

function onBeforeLeave(el: Element) {
  const elem = el as HTMLElement
  elem.style.height = elem.scrollHeight + 'px'
  elem.style.overflow = 'hidden'
}

function onLeave(el: Element, done: () => void) {
  const elem = el as HTMLElement
  void elem.offsetHeight // force reflow
  elem.style.height = '0px'
  elem.style.transition = 'height 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
  const cleanup = () => {
    elem.style.height = ''
    elem.style.overflow = ''
    elem.style.transition = ''
    done()
  }
  elem.addEventListener('transitionend', cleanup, { once: true })
}

function onAfterLeave(el: Element) {
  const elem = el as HTMLElement
  elem.style.height = ''
  elem.style.overflow = ''
  elem.style.transition = ''
}
</script>

<template>
  <Transition name="section-fade">
    <section
      v-if="store.completedTasks.length > 0"
      class="completed"
    >
      <button
        class="toggle"
        type="button"
        :aria-expanded="open"
        aria-controls="completed-tasks-panel"
        @click="open = !open"
      >
        <span class="toggle-label">Completadas</span>
        <span class="count-badge" aria-hidden="true">{{ store.completedTasks.length }}</span>

        <svg
          class="chevron"
          :class="{ open }"
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <Transition
        name="panel"
        :css="false"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @after-enter="onAfterEnter"
        @before-leave="onBeforeLeave"
        @leave="onLeave"
        @after-leave="onAfterLeave"
      >
        <div
          v-if="open"
          id="completed-tasks-panel"
          class="panel"
          role="region"
          aria-label="Lista de tareas completadas"
        >
          <TaskItem
            v-for="task in store.completedTasks"
            :key="task.id"
            :task="task"
            :is-active="false"
            @toggle-complete="store.toggleComplete"
            @edit="store.editTask"
            @delete="store.deleteTask"
          />
        </div>
      </Transition>
    </section>
  </Transition>
</template>

<style scoped>
.completed {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: background-color var(--duration-theme) var(--ease-smooth);
}

.toggle {
  width: 100%;
  min-height: var(--tap);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-4);
  border: 0;
  background: transparent;
  color: var(--label-primary);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--font-sans);
  cursor: pointer;
  border-radius: var(--radius-lg);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-radius var(--duration-fast) var(--ease-out);
}

.toggle:hover {
  background: var(--fill-secondary);
}

.toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
  border-radius: var(--radius-lg);
}

/* When open: bottom corners of toggle become square */
.toggle[aria-expanded="true"] {
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}

.toggle-label {
  flex: 1;
  text-align: left;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 20px;
  padding: 0 var(--space-2);
  background: var(--fill-tertiary);
  color: var(--label-secondary);
  font-size: 0.72rem;
  font-weight: 600;
  border-radius: var(--radius-full);
  line-height: 1;
}

.chevron {
  color: var(--label-tertiary);
  transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
  flex-shrink: 0;
}

.chevron.open {
  transform: rotate(180deg);
}

.panel {
  border-top: 1px solid var(--divider);
  /* overflow is managed by JS hooks during animation */
}

/* Section mount/unmount fade */
.section-fade-enter-active,
.section-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-out);
}

.section-fade-enter-from,
.section-fade-leave-to {
  opacity: 0;
}
</style>
