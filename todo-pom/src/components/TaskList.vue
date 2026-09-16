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
      :timer-phase="store.pomodoro.taskId === task.id ? store.pomodoro.phase : 'idle'"
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 8px 12px 4px;
}

.empty {
  margin: 18px 8px;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}
</style>
