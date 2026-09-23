<script setup lang="ts">
import { ref } from 'vue'
import { useTodoStore } from '../stores/todoStore'
import TaskItem from './TaskItem.vue'

const store = useTodoStore()
const open = ref(false)
</script>

<template>
  <section v-if="store.completedTasks.length > 0" class="completed">
    <button class="toggle" type="button" :aria-expanded="open" @click="open = !open">
      <span>Completadas ({{ store.completedTasks.length }})</span>
      <span class="chevron" :class="{ open }">▾</span>
    </button>
    <div class="panel" :class="{ open }">
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
  </section>
</template>

<style scoped>
.completed {
  margin-top: var(--space-4);
  background: var(--bg-grouped);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.completed .toggle {
  width: 100%;
  min-height: var(--tap);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-2);
  border: 0;
  background: transparent;
  color: var(--label-primary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--duration-theme) var(--ease-ios-spring);
}

.completed .toggle:hover {
  background: var(--fill-secondary);
}

.completed .chevron {
  transition: transform var(--duration-theme) var(--ease-ios-spring);
}

.completed .chevron.open {
  transform: rotate(180deg);
}

.panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-theme) var(--ease-ios-spring);
}

.panel.open {
  grid-template-rows: 1fr;
}

.panel :deep(.item),
.panel {
  overflow: hidden;
}

.panel .item:last-child {
  border-bottom: none;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}
</style>
