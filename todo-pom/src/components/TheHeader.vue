<script setup lang="ts">
import { computed } from 'vue'

defineProps<{
  storageWarning?: boolean
}>()

const emit = defineEmits<{
  toggleTheme: []
}>()

const theme = computed(() => {
  return document.documentElement.getAttribute('data-theme') || 'light'
})

function toggleTheme(): void {
  emit('toggleTheme')
}
</script>

<template>
  <header class="header">
    <p class="brand">todo-pom</p>
    <button
      class="theme-toggle"
      type="button"
      :aria-label="theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'"
      @click="toggleTheme"
    >
      <span class="glyph" :class="theme" />
    </button>
    <p v-if="storageWarning" class="warning" role="status">
      No se puede guardar el estado
    </p>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
}

.header .brand {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1;
  color: var(--label-primary);
}

.theme-toggle {
  width: var(--tap);
  height: var(--tap);
  border: 0;
  background: transparent;
  border-radius: var(--radius-full);
  color: var(--label-primary);
  cursor: pointer;
  transition: background-color var(--duration-theme) var(--ease-ios-spring);
  display: grid;
  place-items: center;
}

.theme-toggle:hover {
  background: var(--fill-secondary);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--system-blue);
  outline-offset: 2px;
}

.glyph {
  display: block;
  width: 18px;
  height: 18px;
}

.glyph.light {
  background: var(--label-primary);
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--fill-tertiary);
}

.glyph.dark {
  background: var(--label-primary);
  clip-path: polygon(
    50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%,
    50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%
  );
  box-shadow: 0 0 0 3px var(--fill-tertiary);
}

.warning {
  margin: 0;
  font-size: 0.8rem;
  color: var(--label-tertiary);
  text-align: right;
}

@media (min-width: 768px) {
  .header {
    padding: var(--space-3) var(--space-6);
  }

  .brand {
    font-size: 1.75rem;
  }
}
</style>
