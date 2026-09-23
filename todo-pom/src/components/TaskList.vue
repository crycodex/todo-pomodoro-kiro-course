<script setup lang="ts">
import { useTodoStore } from '../stores/todoStore'
import TaskItem from './TaskItem.vue'

const store = useTodoStore()
</script>

<template>
  <section class="list" aria-label="Tareas pendientes">
    <p v-if="store.activeTasks.length === 0" class="empty">
      Añade una tarea para empezar.
    </p>
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
  </section>
</template>

<style scoped>
.list {
  background: var(--bg-grouped);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.list .empty {
  margin: var(--space-4) var(--space-2);
  color: var(--label-tertiary);
  font-size: 0.95rem;
}

.list .item {
  display: grid;
  grid-template-columns: var(--tap) minmax(0, 1fr) auto;
  gap: var(--space-1);
  align-items: center;
  min-height: 56px;
  padding: var(--space-1) var(--space-2);
  border-bottom: 1px solid var(--divider);
  transition: background-color var(--duration-theme) var(--ease-ios-spring);
}

.list .item:hover {
  background: var(--fill-secondary);
}

.list .item:last-child {
  border-bottom: none;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
</style>
