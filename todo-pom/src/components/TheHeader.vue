<script setup lang="ts">
defineProps<{
  storageWarning?: boolean
  isDark: boolean
}>()

defineEmits<{
  'toggle-theme': []
}>()
</script>

<template>
  <header id="site-header" class="header">
    <p class="brand">
      todo-pom<span class="brand-dot" aria-hidden="true">.</span>
    </p>

    <div class="header-end">
      <p v-if="storageWarning" class="storage-badge" role="status">
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1L11 10H1L6 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M6 5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <circle cx="6" cy="9" r="0.75" fill="currentColor"/>
        </svg>
        Sin guardar
      </p>

      <button
        class="theme-toggle"
        type="button"
        :aria-label="isDark ? 'Activar modo claro' : 'Activar modo oscuro'"
        @click="$emit('toggle-theme')"
      >
        <!-- Moon icon — shown in light mode (click to go dark) -->
        <svg
          v-if="!isDark"
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>

        <!-- Sun icon — shown in dark mode (click to go light) -->
        <svg
          v-else
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  background: var(--bg-card);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  transition:
    background-color var(--duration-theme) var(--ease-smooth),
    border-color var(--duration-theme) var(--ease-smooth);
}

.brand {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 300;
  letter-spacing: -0.025em;
  color: var(--label-primary);
  line-height: 1;
  transition: color var(--duration-theme) var(--ease-smooth);
}

.brand-dot {
  color: var(--accent);
  font-weight: 500;
}

.header-end {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.storage-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  padding: 4px var(--space-2);
  background: rgba(217, 122, 26, 0.12);
  color: var(--system-orange);
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: var(--radius-full);
  letter-spacing: 0.01em;
}

.theme-toggle {
  width: var(--tap);
  height: var(--tap);
  border: 0;
  background: transparent;
  border-radius: var(--radius-full);
  color: var(--label-secondary);
  display: grid;
  place-items: center;
  transition:
    background-color var(--duration-fast) var(--ease-out),
    color var(--duration-fast) var(--ease-out);
}

.theme-toggle:hover {
  background: var(--fill-secondary);
  color: var(--label-primary);
}

.theme-toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (min-width: 768px) {
  .header {
    padding: 0 var(--space-6);
  }

  .brand {
    font-size: 1.4rem;
  }
}
</style>
