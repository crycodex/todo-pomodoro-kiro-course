<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../utils/supabase'

const status = ref<string>('Checking...')
const result = ref<string>('')

const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('tasks').select('count')
    if (error) {
      status.value = 'Error'
      result.value = error.message
    } else {
      status.value = 'Success'
      result.value = JSON.stringify(data, null, 2)
    }
  } catch (error) {
    status.value = 'Exception'
    result.value = String(error)
  }
}

const testInsert = async () => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        id: 'test-' + Date.now(),
        title: 'Test Task',
        completed: false,
        created_at: new Date().toISOString(),
        completed_at: null,
        pomodoro_count: 0,
        timer_state: null,
      })
      .select()

    if (error) {
      status.value = 'Insert Error'
      result.value = error.message
    } else {
      status.value = 'Insert Success'
      result.value = JSON.stringify(data, null, 2)
    }
  } catch (error) {
    status.value = 'Insert Exception'
    result.value = String(error)
  }
}
</script>

<template>
  <div class="test-supabase">
    <h2>Supabase Test</h2>
    <p>Status: <strong>{{ status }}</strong></p>
    <pre>{{ result }}</pre>
    <button @click="checkConnection">Check Connection</button>
    <button @click="testInsert">Test Insert</button>
  </div>
</template>

<style scoped>
.test-supabase {
  padding: 1rem;
  border: 1px solid var(--color-border);
  margin: 1rem 0;
}

pre {
  background: var(--color-background);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
