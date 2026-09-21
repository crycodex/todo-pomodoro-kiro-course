# Design Document

## Introducción

Este documento describe la solución técnica para implementar temporizadores Pomodoro por tarea en la aplicación todo-pomodoro. Actualmente, el estado del temporizador se almacena de forma global en el store, lo que causa pérdida del estado al cambiar entre tareas. La solución propuesta integra el estado del temporizador (TimerState) directamente en la estructura de datos de cada tarea, permitiendo que cada tarea mantenga su propio estado de temporizador independiente.

## Arquitectura General

### Enfoque de Diseño

La solución sigue un enfoque de **estado por tarea con sincronización global**, donde cada tarea almacena su propio TimerState mientras el estado global de Pomodoro continúa gestionando el intervalo del temporizador activo y el control de visibilidad. Este diseño permite:
- Preservación del progreso del temporizador al cambiar entre tareas
- Sincronización automática entre el estado global y el estado de la tarea activa
- Persistencia independiente del estado de cada tarea

### Componentes Principales

1. **Types**: Definición de TimerState como propiedad de invoke_sub_agent
2. **Store**: Gestión de estado con sincronización bidireccional
3. **TaskItem**: Indicadores visuales del estado del temporizador
4. **PomodoroOverlay**: Visualización del temporizador de la tarea activa
5. **Storage**: Persistencia del estado incluyendo timerState por tarea

---

## 1. Modelo de Datos

### 1.1 Nuevos Tipos de Datos

Se añadirá un nuevo tipo `TimerState` que será parte de la interfaz `invoke_sub_agent`:

```typescript
// src/types/index.ts

export interface TimerState {
  phase: PomodoroPhase
  secondsLeft: number
}

export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: number
  completedAt: number | null
  pomodoroCount: number
  timerState: TimerState | null  // Nueva propiedad
}

export interface AppState {
  tasks: Task[]
  pomodoro: Omit<PomodoroState, 'intervalId'>
}
```

### 1.2 Explicación del Modelo

- **phase**: Representa la fase actual del temporizador ('idle', 'work', 'break', 'paused-work', 'paused-break')
- **secondsLeft**: Segundos restantes en la fase actual
- **timerState | null**: Cada tarea puede tener su propio estado de temporizador o null si no tiene uno activo

### 1.3 Integración con invoke_sub_agent Existente

La propiedad `timerState` se integra naturalmente en la estructura existente de invoke_sub_agent sin modificar los campos actuales. Esto mantiene la compatibilidad con el código existente mientras añade la nueva funcionalidad.

---

## 2. Cambios en el Store

### 2.1 Estructura del Store Modificado

```typescript
// src/stores/todoStore.ts

export const useTodoStore = defineStore('todo', () => {
  const tasks = ref<invoke_sub_agent[]>([])
  const pomodoro = ref<PomodoroState>(createIdlePomodoro())
  
  // Computed properties unchanged
  const activeTasks = computed(...)
  const completedTasks = computed(...)
  
  const activeTask = computed(() => {
    if (!pomodoro.value.taskId) return undefined
    return tasks.value.find((task) => task.id === pomodoro.value.taskId)
  })
  
  const pomodoroRunning = computed(
    () => pomodoro.value.phase === 'work' || pomodoro.value.phase === 'break'
  )
  
  // Métodos actualizados
  function addTask(title: string): void {
    const normalized = normalizeTitle(title)
    if (normalized === null) return

    tasks.value.push({
      id: createId(),
      title: normalized,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
      pomodoroCount: 0,
      timerState: null  // Inicialmente null
    })
  }

  function startPomodoro(taskId: string): void {
    const task = tasks.value.find((item) => item.id === taskId)
    const previousActiveTask = activeTask.value
    
    if (!task || task.completed) return

    // Preservar estado de la tarea anterior si existe
    if (previousActiveTask && previousActiveTask.id !== taskId) {
      // El estado ya está sincronizado, no necesitamos acción adicional
    }

    cancelPomodoro()
    void notifications.requestPermission()

    pomodoro.value.taskId = taskId
    pomodoro.value.phase = 'work'
    pomodoro.value.secondsLeft = WORK_DURATION_SECONDS
    
    // Inicializar timerState de la nueva tarea activa
    task.timerState = {
      phase: 'work',
      secondsLeft: WORK_DURATION_SECONDS
    }
    
    _startTimer()
  }

  function pausePomodoro(): void {
    const task = activeTask.value
    if (!task) return

    if (pomodoro.value.phase === 'work') {
      pomodoro.value.phase = 'paused-work'
      if (task.timerState) {
        task.timerState.phase = 'paused-work'
      }
      _clearTimer()
    } else if (pomodoro.value.phase === 'break') {
      pomodoro.value.phase = 'paused-break'
      if (task.timerState) {
        task.timerState.phase = 'paused-break'
      }
      _clearTimer()
    }
  }

  function resumePomodoro(): void {
    const task = activeTask.value
    if (!task) return

    if (pomodoro.value.phase === 'paused-work') {
      pomodoro.value.phase = 'work'
      if (task.timerState) {
        task.timerState.phase = 'work'
      }
      _startTimer()
    } else if (pomodoro.value.phase === 'paused-break') {
      pomodoro.value.phase = 'break'
      if (task.timerState) {
        task.timerState.phase = 'break'
      }
      _startTimer()
    }
  }

  function cancelPomodoro(): void {
    const currentTask = activeTask.value
    _clearTimer()
    pomodoro.value = createIdlePomodoro()
    
    // Limpiar timerState de la tarea actual
    if (currentTask) {
      currentTask.timerState = null
    }
  }

  function deleteTask(id: string): void {
    const task = tasks.value.find((item) => item.id === id)
    const wasActive = pomodoro.value.taskId === id
    
    if (wasActive) {
      cancelPomodoro()
    }
    
    // El timerState se elimina automáticamente al filtrar las tareas
    tasks.value = tasks.value.filter((task) => task.id !== id)
  }

  function _tick(): void {
    if (pomodoro.value.phase !== 'work' && pomodoro.value.phase !== 'break') return

    pomodoro.value.secondsLeft -= 1
    
    const task = activeTask.value
    if (task && task.timerState) {
      task.timerState.secondsLeft = pomodoro.value.secondsLeft
    }
    
    if (pomodoro.value.secondsLeft > 0) return

    if (pomodoro.value.phase === 'work') {
      _onWorkEnd()
    } else {
      _onBreakEnd()
    }
  }

  function _onWorkEnd(): void {
    const task = activeTask.value
    if (task) {
      task.pomodoroCount += 1
      if (task.timerState) {
        task.timerState.phase = 'break'
        task.timerState.secondsLeft = BREAK_DURATION_SECONDS
      }
      notifications.notifyWorkEnd(task.title)
    } else {
      notifications.notifyWorkEnd('tarea')
    }

    pomodoro.value.phase = 'break'
    pomodoro.value.secondsLeft = BREAK_DURATION_SECONDS
  }

  function _onBreakEnd(): void {
    const task = activeTask.value
    notifications.notifyBreakEnd()
    _clearTimer()
    
    if (task) {
      task.timerState = null  // Limpiar estado después del break
    }
    
    pomodoro.value = createIdlePomodoro()
  }

  function _saveToStorage(): void {
    try {
      saveState({
        tasks: tasks.value,  // Ahora incluye timerState por tarea
        pomodoro: {
          taskId: pomodoro.value.taskId,
          phase: pomodoro.value.phase,
          secondsLeft: pomodoro.value.secondsLeft,
        },
      })
      storageWarning.value = false
    } catch {
      storageWarning.value = true
    }
  }

  function _loadFromStorage(): void {
    const loaded = loadState()
    if (!loaded) return

    tasks.value = loaded.tasks
    
    // Restaurar sincronización entre estado global y tarea activa
    const activeTaskId = loaded.pomodoro.taskId
    const phase =
      loaded.pomodoro.phase === 'work'
        ? 'paused-work'
        : loaded.pomodoro.phase === 'break'
          ? 'paused-break'
          : loaded.pomodoro.phase

    pomodoro.value = {
      taskId: activeTaskId,
      phase,
      secondsLeft: loaded.pomodoro.secondsLeft,
      intervalId: null,
    }
    
    // Verificar sincronización después de cargar
    if (activeTaskId && pomodoro.value.phase !== 'idle') {
      const task = tasks.value.find(t => t.id === activeTaskId)
      if (task && task.timerState) {
        // Asegurar sincronización inicial
        pomodoro.value.phase = task.timerState.phase
        pomodoro.value.secondsLeft = task.timerState.secondsLeft
      }
    }
  }

  return {
    tasks,
    pomodoro,
    storageWarning,
    bannerMessage: notifications.bannerMessage,
    activeTasks,
    completedTasks,
    activeTask,
    pomodoroRunning,
    addTask,
    editTask,
    deleteTask,
    toggleComplete,
    startPomodoro,
    pausePomodoro,
    resumePomodoro,
    cancelPomodoro,
    _tick,
    _onWorkEnd,
    _onBreakEnd,
    _applyElapsed,
    _correctHiddenTime,
    _loadFromStorage,
    _saveToStorage,
  }
})
```

### 2.2 Sincronización Automática

El store implementa sincronización bidireccional automática:
- **Global → invoke_sub_agent**: En cada tick y cambio de fase, el estado de la tarea activa se actualiza
- **invoke_sub_agent → Global**: Al cargar desde storage, el estado global se sincroniza con la tarea activa

Esta sincronización es transparente y no requiere llamadas adicionales en los componentes.

---

## 3. Actualización de Componentes

### 3.1 TaskItem con Indicador Visual

```vue
<!-- src/components/TaskItem.vue -->
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { PomodoroPhase, Task, TimerState } from '../types'

const props = defineProps<{
  task: invoke_sub_agent
  isActive: boolean
}>()

const emit = defineEmits<{
  'toggle-complete': [id: string]
  edit: [id: string, newTitle: string]
  delete: [id: string]
  'start-pomodoro': [id: string]
  'cancel-pomodoro': [id: string]
}>()

const editing = ref(false)
const draft = ref(props.task.title)
const editInput = ref<HTMLInputElement | null>(null)

// Determinar estado del temporizador basado en timerState de la tarea
const timerStatus = computed(() => {
  const timerState = props.task.timerState
  
  if (!timerState || timerState.phase === 'idle') return 'idle'
  if (timerState.phase === 'paused-work' || timerState.phase === 'paused-break') return 'paused'
  return 'running'
})

// Determinar si la tarea tiene algún temporizador asociado
const hasTimer = computed(() => {
  return props.task.timerState !== null && props.task.timerState.phase !== 'idle'
})

// ... métodos existentes sin cambios
</script>

<template>
  <article 
    class="item" 
    :class="{ 
      completed: task.completed, 
      active: isActive,
      'has-timer': hasTimer,
      'timer-paused': timerStatus === 'paused',
      'timer-running': timerStatus === 'running'
    }"
  >
    <!-- Contenido existente -->
    <button
      class="check"
      type="button"
      :aria-pressed="task.completed"
      :aria-label="task.completed ? 'Marcar como pendiente' : 'Marcar como completada'"
      @click="emit('toggle-complete', task.id)"
    >
      <span class="box" :class="{ on: task.completed }" />
    </button>

    <div class="body">
      <input
        v-if="editing"
        ref="editInput"
        v-model="draft"
        class="edit"
        maxlength="200"
        @keydown.enter.prevent="confirmEdit"
        @keydown.escape.prevent="cancelEdit"
        @blur="confirmEdit"
      />
      <p
        v-else
        class="title"
        :class="{ done: task.completed }"
        @dblclick="beginEdit"
      >
        {{ task.title }}
      </p>
      <p class="meta">
        {{ task.pomodoroCount }} {{ task.pomodoroCount === 1 ? 'ciclo' : 'ciclos' }}
        <span v-if="hasTimer" class="timer-indicator">
          ({{ getTimerDisplay(timerState) }})
        </span>
      </p>
    </div>

    <div class="actions">
      <!-- Indicador visual del temporizador -->
      <div v-if="hasTimer" class="timer-indicator-icon" :class="timerStatus">
        <span class="indicator-dot" />
      </div>
      
      <button
        v-if="!task.completed"
        class="icon-btn"
        type="button"
        :aria-label="
          timerStatus === 'idle'
            ? 'Iniciar pomodoro'
            : 'Cancelar pomodoro'
        "
        :title="timerStatus === 'idle' ? 'Iniciar' : 'Cancelar'"
        @click="onPomodoroClick"
      >
        <span class="glyph" :class="timerStatus" />
      </button>
      <button
        class="icon-btn danger"
        type="button"
        aria-label="Eliminar tarea"
        @click="emit('delete', task.id)"
      >
        ×
      </button>
    </div>
  </article>
</template>

<style scoped>
/* Indicadores visuales existentes */
.glyph.idle {
  clip-path: polygon(12% 8%, 92% 50%, 12% 92%);
}

.glyph.running {
  clip-path: none;
}

.glyph.paused {
  width: 12px;
  background:
    linear-gradient(var(--color-text), var(--color-text)) 0 0 / 4px 100% no-repeat,
    linear-gradient(var(--color-text), var(--color-text)) 8px 0 / 4px 100% no-repeat;
}

/* Nuevos estilos para indicadores de timer por tarea */
.timer-indicator-icon {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-indicator-icon.running {
  background: var(--color-success, #4caf50);
  animation: pulse 1.5s infinite;
}

.timer-indicator-icon.paused {
  background: var(--color-warning, #ff9800);
}

.timer-indicator-icon.idle {
  display: none;
}

.timer-indicator {
  color: var(--color-text-muted);
  font-size: 0.75rem;
  margin-left: 4px;
}

.item.timer-paused {
  border-left: 3px solid var(--color-warning, #ff9800);
}

.item.timer-running {
  border-left: 3px solid var(--color-success, #4caf50);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
```

### 3.2 PomodoroOverlay Actualizado

```vue
<!-- src/components/PomodoroOverlay.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import type { PomodoroState, Task, TimerState } from '../types'
import { formatTime } from '../utils/formatTime'
import BreakTimer from './BreakTimer.vue'

const props = defineProps<{
  task: invoke_sub_agent
  timerState: TimerState  // Ahora viene de la tarea activa
}>()

const emit = defineEmits<{
  pause: []
  resume: []
  cancel: []
}>()

const visible = computed(() => props.timerState.phase !== 'idle')
const isBreak = computed(
  () => props.timerState.phase === 'break' || props.timerState.phase === 'paused-break'
)
const isPaused = computed(
  () => props.timerState.phase === 'paused-work' || props.timerState.phase === 'paused-break'
)
const phaseLabel = computed(() => {
  if (isBreak.value) return isPaused.value ? 'Descanso en pausa' : 'Descanso'
  return isPaused.value ? 'Trabajo en pausa' : 'Trabajo'
})
</script>

<template>
  <aside v-if="visible" class="overlay" :class="{ break: isBreak, sheet: true }">
    <p class="task-name">{{ task.title }}</p>
    <p class="phase">{{ phaseLabel }}</p>

    <BreakTimer v-if="isBreak" :seconds-left="timerState.secondsLeft" />
    <p v-else class="time">{{ formatTime(timerState.secondsLeft) }}</p>

    <div class="controls">
      <button v-if="isPaused" type="button" @click="emit('resume')">Reanudar</button>
      <button v-else type="button" @click="emit('pause')">Pausar</button>
      <button class="ghost" type="button" @click="emit('cancel')">Cancelar</button>
    </div>
  </aside>
</template>

<!-- estilos sin cambios significativos -->
```

---

## 4. Estrategia de Persistencia

### 4.1 Formato de Storage Actualizado

```typescript
// src/utils/storage.ts

export interface StoredState {
  tasks: invoke_sub_agent[]  // Ahora incluye timerState
  pomodoro: {
    taskId: string | null
    phase: PomodoroPhase
    secondsLeft: number
  }
}

function saveState(state: StoredState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function loadState(): StoredState | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  
  try {
    const parsed = JSON.parse(raw)
    // Validación básica de estructura
    if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}
```

### 4.2 Consideraciones de Persistencia

1. **timerState se serializa automáticamente**: Al ser parte de invoke_sub_agent, se incluye en la serialización JSON sin cambios adicionales
2. **Recuperación robusta**: La carga verifica la estructura de datos y maneja casos corruptos
3. **Sincronización post-carga**: Después de cargar, el estado global se sincroniza con el timerState de la tarea activa

---

## 5. Sincronización entre Estados

### 5.1 Flujo de Sincronización

```
┌─────────────────────────────────────────────────────────────────┐
│                    Flujo de Sincronización                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐                               ┌────────────┐ │
│   │   invoke_sub_agent A     │                      │   invoke_sub_agent B     │ │
│   │ timerState: work (1500s) │                      │ timerState: null         │ │
│   └──────────────┘                               └────────────┘ │
│          │                                               │        │
│          │                                               │        │
│          ▼                                               ▼        │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │              Global PomodoroState                        │   │
│   │              taskId: "A"                                │   │
│   │              phase: work                                │   │
│   │              secondsLeft: 1500                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│          │                                               │        │
│          │          startPomodoro("B")                    │        │
│          │─────────────────────────────────────────────────►       │
│          │                                               │        │
│          ▼                                               ▼        │
│   ┌──────────────┐                               ┌────────────┐ │
│   │   invoke_sub_agent A     │                      │   invoke_sub_agent B     │ │
│   │ timerState: work (1480s) │                      │ timerState: work (1500s) │ │
│   └──────────────┘                               └────────────┘ │
│          ▲                                               │        │
│          │                                               │        │
│          │              Global PomodoroState              │        │
│   │              taskId: "B"                                │   │
│   │              phase: work                                │   │
│   │              secondsLeft: 1500                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Puntos de Sincronización

| Operación | Sincronización Global → invoke_sub_agent | Sincronización invoke_sub_agent → Global |
|-----------|------------------------------------------|------------------------------------------|
| `startPomodoro` | Se inicializa timerState de la nueva tarea | Se actualiza taskId y phase |
| `pausePomodoro` | Se actualiza phase en timerState | Se actualiza phase |
| `resumePomodoro` | Se actualiza phase en timerState | Se actualiza phase |
| `_tick` | Se actualiza secondsLeft en timerState | N/A (es la fuente) |
| `_onWorkEnd` | Se actualiza a break con secondsLeft | Se actualiza phase y secondsLeft |
| `_onBreakEnd` | Se establece timerState en null | Se resetea a idle |
| `_loadFromStorage` | Se sincroniza con timerState restaurado | Se restaura desde storage |

---

## 6. Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: invoke_sub_agent Timer State Initialization

*For any* valid task and valid invocation of `startPomodoro(taskId)`, the task's `timerState` SHALL be set to a non-null value with `phase='work'` and `secondsLeft=WORK_DURATION_SECONDS`.

**Validates: Requirements 1.1, 4.1, 4.2**

### Property 2: Timer State Preservation on invoke_sub_agent Switch

*For any* tasks A and B where A has an active timer (`timerState.phase` is 'work' or 'break'), when `startPomodoro(B.id)` is called, task A's `timerState` SHALL preserve its previous `phase` and `secondsLeft` values.

**Validates: Requirements 1.2, 2.1, 2.3**

### Property 3: Timer State Deletion on invoke_sub_agent Deletion

*For any* task with a non-null `timerState`, when `deleteTask(task.id)` is called, the task and its `timerState` SHALL be removed from the tasks collection.

**Validates: Requirements 1.4**

### Property 4: Visual Indicator for Non-Idle Timer States

*For any* task where `timerState.phase` is not 'idle', the rendered `TaskItem` component SHALL display a visual indicator showing the timer is associated with the task.

**Validates: Requirements 3.1**

### Property 5: Paused Timer Visual Distinction

*For any* task where `timerState.phase` is 'paused-work' or 'paused-break', the rendered `TaskItem` component SHALL display a distinctive visual indicator (e.g., orange border, paused icon) different from active timers.

**Validates: Requirements 3.2**

### Property 6: Active Timer Visual Confirmation

*For any* task where `timerState.phase` is 'work' or 'break', the rendered `TaskItem` component SHALL display a running indicator (e.g., green border, pulsing dot) showing the timer is active.

**Validates: Requirements 3.3**

### Property 7: Timer State Persistence Inclusion

*For any* task in the tasks collection when `_saveToStorage()` is called, the serialized data SHALL include the complete `timerState` property for each task.

**Validates: Requirements 5.1**

### Property 8: Timer State Persistence Restoration

*For any* application state with tasks containing non-null `timerState` values, when `_loadFromStorage()` is called, the loaded tasks SHALL have identical `timerState` values to the original state.

**Validates: Requirements 5.2**

### Property 9: Active invoke_sub_agent Timer State Sync

*For any* application state where `pomodoro.taskId` references a task with non-null `timerState`, the global `pomodoro` phase and `secondsLeft` SHALL match the active task's `timerState.phase` and `timerState.secondsLeft`.

**Validates: Requirements 6.2**

### Property 10: Pause Updates Both States

*For any* active task with non-null `timerState`, when `pausePomodoro()` is called, both the global `pomodoro.phase` and the active task's `timerState.phase` SHALL be updated to 'paused-work' or 'paused-break' (depending on previous phase).

**Validates: Requirements 6.3**

### Property 11: Resume Updates Both States

*For any* active task with non-null `timerState` where phase is 'paused-work' or 'paused-break', when `resumePomodoro()` is called, both the global `pomodoro.phase` and the active task's `timerState.phase` SHALL be updated to 'work' or 'break' (respectively).

**Validates: Requirements 6.4**

### Property 12: Cycle Completion Syncs Both States

*For any* active task with non-null `timerState` during work phase, when the timer reaches zero, both the global `pomodoro.phase` and the active task's `timerState.phase` SHALL be updated to 'break' with `BREAK_DURATION_SECONDS`.

**Validates: Requirements 6.5**

### Property 13: New Tasks Have Null Timer State

*For any* task created via `addTask(title)`, the new task's `timerState` SHALL be initialized to `null`.

**Validates: Requirements 4.3**

### Property 14: Task Switch Preserves Remaining Seconds

*For any* tasks A and B, when switching from A to B while A has a paused or running timer with `secondsLeft=X`, task A's `timerState.secondsLeft` SHALL equal X after the switch.

**Validates: Requirements 2.1, 2.3**

### Property 15: Overlay Displays Active invoke_sub_agent Timer State

*For any* active task with non-null `timerState`, the `PomodoroOverlay` component SHALL display the `timerState.phase` and `timerState.secondsLeft` values from that task.

**Validates: Requirements 1.3, 5.4**

---

## Resumen de Cambios

| Componente | Cambio | Impacto |
|------------|--------|---------|
| `types/index.ts` | Añadir `TimerState` como propiedad de `invoke_sub_agent` | Tipado completo |
| `todoStore.ts` | Sincronización bidireccional entre estado global y timerState | Lógica central |
| `TaskItem.vue` | Indicadores visuales para timerState | UX mejorada |
| `PomodoroOverlay.vue` | Uso de timerState de la tarea activa | Visualización correcta |
| `storage.ts` | Persistencia automática de timerState | Datos persistentes |

La solución mantiene backward compatibility con el código existente mientras añade la funcionalidad de temporizadores por tarea completamente integrada.