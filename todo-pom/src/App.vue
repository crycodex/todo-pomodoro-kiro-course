<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue'
import { useTodoStore } from './stores/todoStore'
import { usePomodoro } from './composables/usePomodoro'
import { formatTime } from './utils/formatTime'
import TheHeader from './components/TheHeader.vue'
import TaskInput from './components/TaskInput.vue'
import TaskList from './components/TaskList.vue'
import CompletedList from './components/CompletedList.vue'
import PomodoroOverlay from './components/PomodoroOverlay.vue'

const store = useTodoStore()
const pomodoro = usePomodoro()
const isDark = ref(false)

function toggleTheme(): void {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  store._loadFromStorage()

  // Auto-detect prefers-color-scheme
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = prefersDark
  document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')

  // Also react to OS-level changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    isDark.value = e.matches
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
  })
})

// Dynamic document title — shows countdown when timer active
watchEffect(() => {
  if (store.pomodoro.phase !== 'idle') {
    document.title = `⏱ ${formatTime(store.pomodoro.secondsLeft)} — todo-pom`
  } else {
    document.title = 'todo-pom'
  }
})
</script>

<template>
  <div class="app-shell">
    <!-- Skip link — first focusable element for keyboard users -->
    <a href="#main-content" class="skip-link">Saltar al contenido principal</a>

    <TheHeader
      :storage-warning="store.storageWarning"
      :is-dark="isDark"
      @toggle-theme="toggleTheme"
    />

    <p v-if="store.bannerMessage" class="app-banner" role="status" aria-live="polite">
      {{ store.bannerMessage }}
    </p>

    <main
      id="main-content"
      tabindex="-1"
      class="app-layout"
      :class="{ 'with-timer': store.pomodoro.phase !== 'idle' }"
    >
      <!-- On mobile: overlay appears first (above input) when timer is active -->
      <div class="tasks-column">
        <PomodoroOverlay
          v-if="store.activeTask && store.pomodoro.phase !== 'idle'"
          class="overlay-mobile"
          :task="store.activeTask"
          :timer-state="store.pomodoro"
          @pause="pomodoro.pause"
          @resume="pomodoro.resume"
          @cancel="pomodoro.cancel"
        />
        <TaskInput @add="store.addTask" />
        <TaskList />
        <CompletedList />
      </div>

      <!-- On desktop: overlay lives in the sidebar column -->
      <PomodoroOverlay
        v-if="store.activeTask && store.pomodoro.phase !== 'idle'"
        class="overlay-desktop"
        :task="store.activeTask"
        :timer-state="store.pomodoro"
        @pause="pomodoro.pause"
        @resume="pomodoro.resume"
        @cancel="pomodoro.cancel"
      />
    </main>
  </div>
</template>

<style scoped>
/* Mobile: show overlay inside tasks column (above input) */
.overlay-mobile {
  display: block;
}

.overlay-desktop {
  display: none;
}

@media (min-width: 768px) {
  /* Desktop: mobile copy hidden, desktop copy shown in sidebar */
  .overlay-mobile {
    display: none;
  }

  .overlay-desktop {
    display: block;
  }
}
</style>
