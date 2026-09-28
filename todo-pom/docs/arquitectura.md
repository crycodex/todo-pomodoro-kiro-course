# Arquitectura del Sistema

## Visión General

El proyecto Todo-Pomodoro sigue una arquitectura basada en componentes con separación clara de responsabilidades:

- **Presentación**: Componentes Vue responsables de renderizar la UI
- **Lógica de negocio**: Stores de Pinia que gestionan el estado y la lógica central
- **Efectos secundarios**: Composables para efectos (temporizadores, notificaciones)
- **Persistencia**: Utilidades para storage local y sincronización con Supabase
- **Tipado**: Definiciones de tipos TypeScript en un directorio centralizado

## Patrones de Diseño

### 1. Pattern: Componentes Vue (Presentational)
- **Descripción**: Componentes que solo reciben props y emiten eventos
- **Ubicación**: `src/components/`
- **Responsables**: `TaskInput`, `TaskList`, `TaskItem`, `CompletedList`, `PomodoroOverlay`, `TheHeader`

### 2. Pattern: Pinia Store (State Management)
- **Descripción**: Store centralizado para el estado de la aplicación
- **Ubicación**: `src/stores/todoStore.ts`
- **Responsabilidades**:
  - Gestión de la lista de tareas
  - Estado del temporizador Pomodoro
  - Persistencia local con `localStorage`
  - Sincronización con Supabase

### 3. Pattern: Composable (Lógica Reutilizable)
- **Descripción**: Funciones que encapsulan lógica reactiva y efectos
- **Ubicación**: `src/composables/`
- **Ejemplos**:
  - `usePomodoro`: Control de inicio/pausa/reanudación del temporizador
  - `useNotifications`: Manejo de notificaciones del sistema

### 4. Pattern: State Layer Separation
- **Descripción**: Separación entre el estado global (store) y los efectos secundarios (composables)
- **Beneficio**: Facilita el testing y la mantenibilidad

## Estructura de Datos

### Task (Tarea)
```typescript
interface Task {
  id: string              // UUID único
  title: string           // Título de la tarea
  completed: boolean      // Estado de completado
  createdAt: number       // Timestamp de creación
  completedAt: number | null
  pomodoroCount: number   // Cantidad de Pomodoros completados
  timerState: TimerState | null
}
```

### TimerState (Estado del Temporizador)
```typescript
interface TimerState {
  phase: PomodoroPhase
  secondsLeft: number
  isRunning?: boolean
}
```

### PomodoroPhase (Fases del Temporizador)
- `idle`: Sin actividad
- `work`: Tiempo de trabajo (25 min por defecto)
- `break`: Tiempo de descanso (5 min por defecto)
- `paused-work`: Pausado durante trabajo
- `paused-break`: Pausado durante descanso

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                    Componentes Vue                      │
│  (TaskInput, TaskList, PomodoroOverlay, ...)           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                  Composables (Efectos)                  │
│  usePomodoro, useNotifications                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Pinia Store (Estado)                  │
│                   useTodoStore()                        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Utilidades (Persistencia)                  │
│  storage.ts, supabase.ts                                │
└─────────────────────────────────────────────────────────┘
```

## Módulos Principales

### 1. `src/stores/todoStore.ts`
Store principal que maneja:
- Lista de tareas (activas y completadas)
- Estado del temporizador Pomodoro
- Persistencia local (`localStorage`)
- Sincronización con Supabase

### 2. `src/composables/usePomodoro.ts`
Exponen métodos públicos para controlar el temporizador:
- `start(taskId)`: Iniciar Pomodoro en una tarea
- `pause()`: Pausar el temporizador
- `resume()`: Reanudar el temporizador
- `cancel()`: Cancelar el Pomodoro actual

### 3. `src/utils/storage.ts`
Gestiona la persistencia local:
- `saveState()`: Guardar estado en localStorage
- `loadState()`: Cargar estado desde localStorage

### 4. `src/utils/supabase.ts`
Configuración y cliente de Supabase para sincronización en la nube.

## Configuración del Proyecto

### Archivos de Configuración
- `vite.config.ts`: Configuración de Vite
- `tsconfig.json`: Configuración de TypeScript
- `vitest.config.ts`: Configuración de Vitest (testing)

### Variables de Entorno
```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

## Consideraciones de Arquitectura

### Separación de Efectos
La lógica de efectos secundarios (temporizadores, notificaciones) está separada del store para facilitar el testing unitario.

### Persistencia Dual
El sistema soporta:
1. **Persistencia local**: Usando `localStorage` (sin autenticación)
2. **Sincronización remota**: Usando Supabase (opcional)

### Estado Reactivo
Todo el estado se gestiona con reactividad de Vue 3, lo que permite actualizaciones automáticas de la UI.

### Corrección de Tiempo en Background
Cuando la pestaña vuelve del estado "hidden", se calcula el tiempo transcurrido y se ajusta el temporizador automáticamente.