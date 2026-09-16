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
  border-top: 1px solid var(--color-border);
}

.toggle {
  width: 100%;
  min-height: var(--tap);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.chevron {
  transition: transform 0.2s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

.panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.2s ease;
}

.panel.open {
  grid-template-rows: 1fr;
}

.panel :deep(article),
.panel {
  overflow: hidden;
}
</style>
