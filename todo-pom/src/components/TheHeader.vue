<script setup lang="ts">
defineProps<{
  storageWarning?: boolean
}>()
</script>

<template>
  <header class="header">
    <p class="brand">todo-pom</p>
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
  gap: 16px;
  padding: 12px 16px;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.brand {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.05em;
  line-height: 1;
}

.warning {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-align: right;
}

@media (min-width: 768px) {
  .header {
    padding: 16px 24px;
  }

  .brand {
    font-size: 1.75rem;
  }
}
</style>
