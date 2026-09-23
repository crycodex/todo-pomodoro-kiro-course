<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTodoStore } from './stores/todoStore'
import { usePomodoro } from './composables/usePomodoro'
import TheHeader from './components/TheHeader.vue'
import TaskInput from './components/TaskInput.vue'
import TaskList from './components/TaskList.vue'
import CompletedList from './components/CompletedList.vue'
import PomodoroOverlay from './components/PomodoroOverlay.vue'

const store = useTodoStore()
const pomodoro = usePomodoro()
const isDark = ref(false)

const onCreateThemeToggle = () => {
  const newTheme = isDark.value ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', newTheme)
  isDark.value = newTheme === 'dark'
}

onMounted(() => {
  store._loadFromStorage()
  
  // Auto-detect prefers-color-scheme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = prefersDark
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
})
</script>

<template>
  <div class="app-shell">
    <TheHeader :storage-warning="store.storageWarning" />
    <p v-if="store.bannerMessage" class="app-banner" role="status">
      {{ store.bannerMessage }}
    </p>
    <main class="app-layout" :class="{ 'with-timer': store.pomodoro.phase !== 'idle' }">
      <div class="tasks-column">
        <TaskInput @add="store.addTask" />
        <TaskList />
        <CompletedList />
      </div>
      <PomodoroOverlay
        v-if="store.activeTask"
        :task="store.activeTask"
        :timer-state="store.pomodoro"
        @pause="pomodoro.pause"
        @resume="pomodoro.resume"
        @cancel="pomodoro.cancel"
      />
    </main>
  </div>
</template>
