<script setup lang="ts">
import { useTodoStore } from '../stores/todoStore'
import TaskItem from './TaskItem.vue'

const store = useTodoStore()
</script>

<template>
  <section class="list" aria-label="Tareas pendientes" aria-live="polite">
    <TransitionGroup name="task" tag="div" class="list-inner">
      <TaskItem
        v-for="task in store.activeTasks"
        :key="task.id"
        :task="task"
        :is-active="store.pomodoro.taskId === task.id && store.pomodoro.phase !== 'idle'"
        @toggle-complete="store.toggleComplete"
        @edit="store.editTask"
        @delete="store.deleteTask"
        @start-pomodoro="store.startPomodoro"
        @cancel-pomodoro="store.cancelPomodoro"
      />
    </TransitionGroup>
    <p v-if="store.activeTasks.length === 0" class="empty">
      Añade una tarea para empezar.
    </p>
  </section>
</template>

<style scoped>
.list {
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: background-color var(--duration-theme) var(--ease-smooth);
}

.list-inner {
  display: contents;
}

.empty {
  margin: 0;
  padding: var(--space-6) var(--space-4);
  color: var(--label-tertiary);
  font-size: 0.9rem;
  text-align: center;
}

/* Task enter/leave transitions */
.task-enter-active,
.task-leave-active {
  transition:
    opacity var(--duration-base) var(--ease-out),
    transform var(--duration-base) var(--ease-out);
}

.task-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.task-leave-to {
  opacity: 0;
  transform: translateX(8px);
}
</style>
