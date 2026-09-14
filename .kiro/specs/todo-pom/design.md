# Design: todo-pom

## Overview

**todo-pom** es una aplicación web SPA construida con Vue 3 (Composition API) que combina una lista de tareas minimalista con un temporizador Pomodoro integrado. El diseño es estrictamente monocromático (blanco, negro y escalas de gris), sin dependencias externas de UI — solo CSS personalizado.

La app opera completamente en el navegador: no hay backend, toda la persistencia se gestiona mediante `localStorage`. El ciclo de vida del Pomodoro (25 min trabajo → 5 min descanso) se controla con un único temporizador activo a la vez, asociado a una tarea específica.

### Objetivos de diseño

- **Simplicidad**: interfaz sin distracciones, una sola pantalla, sin rutas.
- **Fiabilidad del temporizador**: el estado del temporizador sobrevive a recargas de página.
- **Accesibilidad progresiva**: las notificaciones de sistema son opcionales; la UI siempre ofrece un fallback visual.
- **Separación de responsabilidades**: lógica de negocio en composables y store; componentes solo presentan y delegan.

---

## Architecture

La arquitectura sigue el patrón **Composable-Store-Component** propio del ecosistema Vue 3:

```
┌─────────────────────────────────────────────┐
│                  App.vue                    │
│  ┌────────────┐   ┌────────────────────┐    │
│  │ TodoList   │   │  PomodoroTimer     │    │
│  │ Component  │   │  Component         │    │
│  └──────┬─────┘   └────────┬───────────┘    │
│         │                  │                │
│         └────────┬─────────┘                │
│                  ▼                           │
│           Pinia Store (useTodoStore)         │
│     ┌────────────────────────────────┐      │
│     │  tasks[ ]  |  pomodoroState   │      │
│     └──────────────────────────────--┘      │
│                  ▼                           │
│   Composables: usePomodoro, useNotifications │
│                  ▼                           │
│             localStorage                    │
└─────────────────────────────────────────────┘
```

### Flujo de datos

- **Unidireccional**: el store es la única fuente de verdad.
- Los componentes leen estado reactivo del store y despachan acciones.
- Los composables (`usePomodoro`, `useNotifications`) encapsulan lógica con efectos secundarios y son instanciados dentro del store.
- La persistencia es un efecto secundario del store: un `watch` profundo serializa a `localStorage` en cada cambio relevante.

### Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Estado global | Pinia |
| Build | Vite |
| Estilos | CSS Variables + Scoped CSS (sin frameworks externos) |
| Persistencia | `localStorage` nativo |
| Notificaciones | Web Notifications API + Audio API |
| Testing | Vitest + Vue Test Utils + fast-check (PBT) |

---

## Components and Interfaces

### Árbol de componentes

```
App.vue
├── TheHeader.vue          — Logo/título "todo-pom"
├── TaskInput.vue          — Input + botón para crear tarea
├── TaskList.vue           — Contenedor de tareas activas
│   └── TaskItem.vue       — Fila de tarea individual
├── CompletedList.vue      — Sección colapsable de tareas completadas
│   └── TaskItem.vue       — (reutilizado)
└── PomodoroOverlay.vue    — Panel flotante del temporizador activo
    └── BreakTimer.vue     — Indicador de descanso 5 min
```

### Props / Emits por componente

#### `TaskInput.vue`
```typescript
// Props: ninguna
// Emits:
emit('add', title: string)
```
- Gestiona el estado local del input (`ref<string>`).
- Valida que el título no esté vacío ni sea solo espacios antes de emitir.
- Al emitir, limpia el input y lo devuelve al foco.

#### `TaskItem.vue`
```typescript
// Props:
defineProps<{
  task: Task
  isActive: boolean   // si tiene el Pomodoro activo
}>()

// Emits:
emit('toggle-complete', id: string)
emit('edit', id: string, newTitle: string)
emit('delete', id: string)
emit('start-pomodoro', id: string)
emit('cancel-pomodoro', id: string)
```
- Renderiza el título editable inline (doble clic → `<input>`).
- Muestra el conteo de ciclos completados (`task.pomodoroCount`).
- El botón Pomodoro cambia de ícono según el estado del temporizador (`idle / running / paused`).

#### `PomodoroOverlay.vue`
```typescript
// Props:
defineProps<{
  task: Task
  timerState: PomodoroState
}>()

// Emits:
emit('pause')
emit('resume')
emit('cancel')
```
- Muestra nombre de la tarea, tiempo restante (`MM:SS`), estado (trabajo/descanso) y controles.
- Se oculta cuando no hay Pomodoro activo (`timerState.phase === 'idle'`).

#### `BreakTimer.vue`
```typescript
// Props:
defineProps<{
  secondsLeft: number
}>()
// Sin emits propios — solo presentacional
```

### Interfaces de composables

#### `usePomodoro(store)`
```typescript
interface UsePomodoroReturn {
  start(taskId: string): void
  pause(): void
  resume(): void
  cancel(): void
  tick(): void          // llamado por setInterval interno
}
```

#### `useNotifications()`
```typescript
interface UseNotificationsReturn {
  requestPermission(): Promise<boolean>
  notifyWorkEnd(taskTitle: string): void
  notifyBreakEnd(): void
  playSound(type: 'work-end' | 'break-end'): void
}
```

---

## Data Models

### `Task`

```typescript
interface Task {
  id: string               // UUID v4
  title: string            // texto no vacío, máx 200 caracteres
  completed: boolean
  createdAt: number        // timestamp Unix (ms)
  completedAt: number | null
  pomodoroCount: number    // ciclos Pomodoro completados para esta tarea
}
```

### `PomodoroState`

```typescript
type PomodoroPhase = 'idle' | 'work' | 'break' | 'paused-work' | 'paused-break'

interface PomodoroState {
  taskId: string | null       // tarea a la que pertenece el Pomodoro activo
  phase: PomodoroPhase
  secondsLeft: number         // segundos restantes en la fase actual
  intervalId: number | null   // ID del setInterval (no se persiste)
}
```

> `intervalId` se excluye de la serialización a `localStorage`. Al restaurar el estado desde `localStorage`, si `phase` es `'work'` o `'break'`, se trata como `'paused-work'` / `'paused-break'` respectivamente, para que el usuario retome manualmente.

### `AppState` (persistido en localStorage)

```typescript
interface AppState {
  tasks: Task[]
  pomodoro: Omit<PomodoroState, 'intervalId'>
}
```

### Constantes

```typescript
const WORK_DURATION_SECONDS  = 25 * 60  // 1500 s
const BREAK_DURATION_SECONDS =  5 * 60  //  300 s
const STORAGE_KEY = 'todo-pom-state'
const MAX_TITLE_LENGTH = 200
```

### Store (Pinia — `useTodoStore`)

```typescript
// State
state: () => ({
  tasks: [] as Task[],
  pomodoro: {
    taskId: null,
    phase: 'idle',
    secondsLeft: WORK_DURATION_SECONDS,
    intervalId: null,
  } as PomodoroState,
})

// Getters
activeTasks:    Task[]            // !completed, ordenadas por createdAt desc
completedTasks: Task[]            // completed, ordenadas por completedAt desc
activeTask:     Task | undefined  // la tarea con Pomodoro activo
pomodoroRunning: boolean          // phase === 'work' || phase === 'break'

// Actions
addTask(title: string): void
editTask(id: string, title: string): void
deleteTask(id: string): void
toggleComplete(id: string): void
startPomodoro(taskId: string): void
pausePomodoro(): void
resumePomodoro(): void
cancelPomodoro(): void
_tick(): void                     // privado, llamado por setInterval
_onWorkEnd(): void                // transición work → break
_onBreakEnd(): void               // transición break → idle, incrementa contador
_loadFromStorage(): void
_saveToStorage(): void
```

---

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe ser verdadera en todas las ejecuciones válidas del sistema — esencialmente, una afirmación formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de correctitud verificables automáticamente.*

### Property 1: Título vacío rechazado

*Para cualquier* cadena compuesta únicamente de espacios en blanco (o la cadena vacía), intentar añadirla como tarea no debe alterar la lista de tareas.

**Validates: Requirements 1 (gestión de tareas — validación de título vacío)**

---

### Property 2: Añadir tarea incrementa la lista en uno

*Para cualquier* lista de tareas y cualquier título válido (no vacío, sin ser solo espacios), añadir esa tarea debe resultar en que la lista tenga exactamente un elemento más que antes.

**Validates: Requirements 1 (gestión de tareas — crear tarea)**

---

### Property 3: Round-trip de persistencia

*Para cualquier* estado de la aplicación (tareas + estado Pomodoro sin intervalId), serializarlo a JSON y deserializarlo debe producir un estado funcionalmente equivalente.

**Validates: Requirements 5 (persistencia en localStorage)**

---

### Property 4: Un solo Pomodoro activo a la vez

*Para cualquier* secuencia de llamadas `startPomodoro(taskId)` sobre distintas tareas, el estado del store debe contener como máximo una tarea con Pomodoro activo en cualquier momento.

**Validates: Requirements 3 (temporizador Pomodoro — solo uno activo)**

---

### Property 5: Contador de ciclos es monotónico

*Para cualquier* tarea, el campo `pomodoroCount` nunca debe disminuir a lo largo de la vida de esa tarea — solo puede incrementarse o permanecer igual.

**Validates: Requirements 3 (conteo de ciclos completados)**

---

### Property 6: Completar una tarea cancela su Pomodoro

*Para cualquier* tarea con un Pomodoro en estado `work` o `break`, marcarla como completada debe transicionar el Pomodoro al estado `idle`.

**Validates: Requirements 2 y 3 (estado de tareas + temporizador)**

---

### Property 7: Formato MM:SS cubre todo el rango válido

*Para cualquier* número de segundos en el rango `[0, 1500]`, la función de formateo debe producir una cadena con el patrón `MM:SS` donde MM ∈ [00, 25] y SS ∈ [00, 59].

**Validates: Requirements 3 (visualización del temporizador)**

---

## Error Handling

### Validación de entrada

| Condición | Comportamiento |
|---|---|
| Título vacío o solo espacios | El botón "Añadir" permanece deshabilitado; no se crea la tarea |
| Título > 200 caracteres | Se trunca silenciosamente al máximo permitido |
| Edición a título vacío | Se descarta el cambio; se restaura el título anterior |

### Errores de localStorage

- `localStorage` puede estar deshabilitado (modo privado estricto, cuota excedida). Toda operación de lectura/escritura se envuelve en `try/catch`.
- Si la lectura falla, la app arranca con estado vacío.
- Si la escritura falla, se muestra un mensaje sutil en el header ("No se puede guardar el estado") sin interrumpir el flujo.
- Si los datos almacenados están corruptos (JSON inválido), se ignoran y se parte de estado vacío.

### Errores de Notificaciones del sistema

- El permiso se solicita solo cuando el usuario inicia su primer Pomodoro.
- Si el permiso es `denied` o la API no está disponible, la app continúa normalmente — el fallback es un banner visual durante 4 segundos al finalizar cada fase.
- Los errores de la Web Audio API (contexto suspendido, codec no soportado) se capturan silenciosamente; el sonido es opcional.

### Temporizador

- Si la pestaña se oculta (`visibilitychange`), el temporizador sigue corriendo (el `setInterval` no depende de la visibilidad).
- Si el sistema suspende el navegador, la discrepancia de tiempo se corrige al retomar visibilidad comparando el timestamp guardado con `Date.now()`.

---

## Testing Strategy

### Estrategia dual: tests unitarios + tests de propiedades

La cobertura se divide en dos capas complementarias:

**Tests unitarios / de integración de componentes** (Vitest + Vue Test Utils):
- Ejemplos concretos de interacciones de UI (crear tarea, marcar completa, cancelar Pomodoro).
- Casos borde: título vacío, título con solo espacios, título al límite de 200 chars.
- Comportamiento de persistencia: arranque con datos guardados vs. localStorage vacío o corrupto.
- Integración entre store y componentes via `mount` + Pinia real.

**Tests de propiedades** (Vitest + fast-check):
- Se ejecutan con mínimo 100 iteraciones por propiedad.
- Generan datos de entrada aleatorios para verificar invariantes universales.
- Cada test referencia su propiedad del documento de diseño mediante el tag:
  `// Feature: todo-pom, Property N: <texto de la propiedad>`

### Mapeo de propiedades a tests

| Propiedad | Tipo de test | Módulo a testear |
|---|---|---|
| P1: Título vacío rechazado | PBT (gen: strings de espacios) | `useTodoStore.addTask` |
| P2: Añadir incrementa lista | PBT (gen: título válido + lista) | `useTodoStore.addTask` |
| P3: Round-trip persistencia | PBT (gen: AppState arbitrario) | `serialize` / `deserialize` |
| P4: Un solo Pomodoro activo | PBT (gen: secuencia de startPomodoro) | `useTodoStore.startPomodoro` |
| P5: Contador monotónico | PBT (gen: secuencia de ciclos) | `useTodoStore._onBreakEnd` |
| P6: Completar cancela Pomodoro | PBT (gen: tarea + estado timer) | `useTodoStore.toggleComplete` |
| P7: Formato MM:SS | PBT (gen: integer 0–1500) | `formatTime(seconds)` |

### Configuración de fast-check

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
  }
})

// En cada test de propiedad:
import * as fc from 'fast-check'

fc.assert(
  fc.property(/* arbitraries */, (input) => {
    // Feature: todo-pom, Property N: <texto>
    // ... aserciones
  }),
  { numRuns: 100 }
)
```

### Tests de UI / snapshot

- Los componentes puramente presentacionales (`TheHeader`, `BreakTimer`) se cubren con snapshot tests de Vue Test Utils.
- No se usa PBT para renderizado de componentes: se prueban con ejemplos concretos.

### Cobertura objetivo

- Lógica del store: ≥ 90% de ramas.
- Composables (`usePomodoro`, `useNotifications`): ≥ 80%, con mocks para `setInterval`, `Notification` y `AudioContext`.
- Componentes: cobertura de las rutas de interacción principales (no se busca 100% de líneas en templates).
