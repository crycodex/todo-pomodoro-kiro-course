# Timer Persistence Fix Design

## Overview

El bug se produce cuando al cambiar de tarea, el timer se reinicia completamente en lugar de preservar el estado de cada tarea. La función `startPomodoro` siempre sobrescribe el `timerState` de la tarea con un nuevo estado fresco de 25 minutos, ignorando cualquier progreso previo guardado.

La solución modifica `startPomodoro` para verificar si la tarea ya tiene un `timerState` existente y restaurarlo en lugar de crear uno nuevo.

## Glossary

- **Bug_Condition (C)**: Condición que identifica cuando startPomodoro es llamado en una tarea que ya tiene timerState
- **Property (P)**: Comportamiento correcto - restaurar timerState existente en lugar de resetear
- **Preservation**: Comportamiento existente que debe mantenerse sin cambios
- **startPomodoro**: Función en `todoStore.ts` que inicia el timer para una tarea específica
- **timerState**: Estado del timer (phase, secondsLeft) almacenado en cada tarea
- **pomodoro**: Estado global del timer en el store

## Bug Details

### Bug Condition

El bug se manifiesta cuando `startPomodoro` es llamado en una tarea que ya tiene un `timerState` existente. La función sobrescribe el estado guardado en lugar de restaurarlo.

**Formal Specification:**
```
FUNCTION isBugCondition(taskId)
  INPUT: taskId of type string
  OUTPUT: boolean

  task := findTaskById(taskId)
  IF task = null THEN RETURN false
  IF task.completed THEN RETURN false
  RETURN task.timerState ≠ null
END FUNCTION
```

### Examples

- **Caso 1 (bug)**: Tarea A tiene timerState con 15 minutos restantes. Usuario selecciona Tarea B y llama startPomodoro. Resultado: timer de B muestra 25 minutos en lugar de restaurar estado existente o iniciar fresco.
- **Caso 2 (bug)**: Tarea A está en pausa con 10 minutos restantes. Usuario llama startPomodoro en Tarea A nuevamente. Resultado: timer resetea a 25 minutos perdiendo el progreso pausado.
- **Caso esperado**: Tarea A tiene timerState con 15 minutos restantes. Usuario llama startPomodoro. Resultado: timer restaura a 15 minutos y phase correcto.
- **Caso esperado**: Tarea nueva sin timerState. Usuario llama startPomodoro. Resultado: timer inicia fresco con 25 minutos.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- La funcionalidad de notificación al terminar work/break debe continuar funcionando
- El contador pomodoroCount debe incrementarse correctamente al completar ciclos
- El pause/resume debe funcionar igual que antes
- El cancel debe limpiar timerState correctamente
- La persistencia en storage debe continuar funcionando
- El visibilitychange correction debe seguir aplicando

**Scope:**
Todos los inputs que NO involucran startPomodoro en tareas con timerState existente deben ser completamente afectados. Esto incluye:
- pausePomodoro() - sin cambios
- resumePomodoro() - sin cambios
- cancelPomodoro() - sin cambios
- _tick() - sin cambios
- _onWorkEnd() - sin cambios
- _onBreakEnd() - sin cambios

## Hypothesized Root Cause

Basado en el análisis del código actual en `todoStore.ts:startPomodoro`, los problemas son:

1. **Sobrescritura de timerState existente**: La función siempre crea un nuevo timerState sin verificar si ya existe uno
   - Línea 106: `task.timerState = { phase: 'work', secondsLeft: WORK_DURATION_SECONDS }`
   - Siempre sobrescribe, nunca verifica ni restaura

2. **Reset de secondsLeft global**: El estado global `pomodoro.value.secondsLeft` siempre se setea a WORK_DURATION_SECONDS
   - Línea 101: `pomodoro.value.secondsLeft = WORK_DURATION_SECONDS`
   - Nunca considera restaurar desde timerState existente

3. **Falta de sincronización post-carga**: Aunque `_loadFromStorage` tiene lógica de sincronización, el flujo normal de startPomodoro no considera estados persistidos
   - El código asume siempre estado fresco

4. **Inconsistencia entre estado global y estado de tarea**: El estado global y timerState pueden desincronizarse si no se manejan correctamente

## Correctness Properties

Property 1: Bug Condition - Restaurar timerState existente

_For any_ taskId donde isBugCondition(taskId) retorna true (la tarea tiene timerState existente), la función startPomodoro fija SHALL restaurar el estado desde timerState existente en lugar de crear uno nuevo, manteniendo phase y secondsLeft correctos.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Comportamiento sin timerState

_For any_ taskId donde isBugCondition(taskId) retorna false (tarea sin timerState o completada), la función startPomodoro fixed SHALL comportarse exactamente igual que la función original, iniciando un timer fresco de 25 minutos.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

Property 3: Sincronización de estado

_For any_ llamada a startPomodoro, el estado global pomodoro SHALL sincronizarse correctamente con el timerState de la tarea después de la operación.

**Validates: Requirements 2.4**

## Fix Implementation

### Opciones de Solución Consideradas

**Opción 1: Verificación y Restauración de timerState (SELECCIONADA)**

Modificar startPomodoro para verificar si task.timerState existe:
- Si existe: restaurar estado desde timerState
- Si no existe: crear nuevo estado fresco

Pros:
- Mantiene la lógica existente de timerState
- Cambio mínimo y focalizado
- Preserva todos los comportamientos existentes
- Fáciles de testear

Cons:
- Requiere manejo careful de edge cases

**Opción 2: Nueva estructura de datos con estado activo**

Crear una nueva estructura que trackea qué tarea está "activa" vs cuál tiene timerState guardado.

Pros:
- Separación clara de conceptos

Cons:
- Mayor cambio arquitectural
- Más código para mantener
- Más propenso a errores

**Opción 3: Reset completo con migración**

Hacer reset completo pero migrar timerState existente a un campo separado "lastTimerState".

Pros:
- Código más simple

Cons:
- Rompe el modelo mental actual
- Más complejo de reason about
- Duplicación de estado

### Solución Seleccionada

**Opción 1: Verificación y Restauración de timerState**

Justificación:
- Cambio mínimo que resuelve el problema raíz
- Mantiene compatibilidad con la arquitectura actual
- Facilita testing y mantenimiento
- Preserva todos los comportamientos existentes

### Cambios Requeridos

**Archivo**: `todo-pom/src/stores/todoStore.ts`

**Función**: `startPomodoro`

**Cambios específicos**:

```typescript
function startPomodoro(taskId: string): void {
  const task = tasks.value.find((item) => item.id === taskId)
  if (!task || task.completed) return

  _clearTimer()
  pomodoro.value.taskId = taskId

  // === INICIO CAMBIOS ===
  // Verificar si task.timerState ya existe para restaurar o crear nuevo
  if (task.timerState) {
    // Restaurar desde timerState existente
    pomodoro.value.phase = task.timerState.phase
    pomodoro.value.secondsLeft = task.timerState.secondsLeft
  } else {
    // Crear nuevo timerState fresco
    pomodoro.value.phase = 'work'
    pomodoro.value.secondsLeft = WORK_DURATION_SECONDS
    task.timerState = {
      phase: 'work',
      secondsLeft: WORK_DURATION_SECONDS,
    }
  }
  // === FIN CAMBIOS ===

  void notifications.requestPermission()

  _startTimer()
}
```

**Cambios en _tick()**: Actualizar timerState solo si existe

```typescript
function _tick(): void {
  if (pomodoro.value.phase !== 'work' && pomodoro.value.phase !== 'break') return

  pomodoro.value.secondsLeft -= 1
  const task = activeTask.value
  // Solo actualizar timerState si existe (después del fix, siempre debería existir cuando hay timer activo)
  if (task?.timerState) {
    task.timerState.secondsLeft = pomodoro.value.secondsLeft
  }
```

**Cambios en _loadFromStorage()**: Sincronización mejorada

```typescript
function _loadFromStorage(): void {
  const loaded = loadState()
  if (!loaded) return

  tasks.value = loaded.tasks

  const phaseMap: Record<string, PomodoroPhase> = {
    work: 'paused-work',
    break: 'paused-break',
  }

  const mappedPhase = phaseMap[loaded.pomodoro.phase] ?? loaded.pomodoro.phase

  pomodoro.value = {
    taskId: loaded.pomodoro.taskId,
    phase: mappedPhase,
    secondsLeft: loaded.pomodoro.secondsLeft,
    intervalId: null,
  }

  // Sincronización mejorada post-carga
  const activeTaskId = loaded.pomodoro.taskId
  if (activeTaskId && mappedPhase !== 'idle') {
    const task = tasks.value.find((t) => t.id === activeTaskId)
    if (task) {
      // Si task.timerState existe, sincronizar desde ahí
      if (task.timerState) {
        pomodoro.value.phase = task.timerState.phase
        pomodoro.value.secondsLeft = task.timerState.secondsLeft
      } else {
        // Si no existe, crearlo desde el estado persistido
        task.timerState = {
          phase: mappedPhase,
          secondsLeft: loaded.pomodoro.secondsLeft,
        }
      }
    }
  }
}
```

## Testing Strategy

### Exploratory Bug Condition Checking

**Goal**: Confirmar que el bug existe y entender el comportamiento actual antes de implementar el fix.

**Test Plan**: Escribir tests que demuestren el bug en el código actual, verificando que startPomodoro ignora timerState existente.

**Test Cases**:
1. **Restoration Test**: Crear tarea con timerState existente, llamar startPomodoro, verificar que secondsLeft se restaura (FALLA en código actual)
2. **Fresh Start Test**: Crear tarea sin timerState, llamar startPomodoro, verificar que secondsLeft = WORK_DURATION_SECONDS (PASA en código actual)
3. **Multiple Tasks Test**: Crear múltiples tareas con diferentes timerStates, alternar entre ellas, verificar que cada una restaura su estado (FALLA en código actual)

**Expected Counterexamples**:
- startPomodoro ignora task.timerState existente
- secondsLeft siempre se setea a WORK_DURATION_SECONDS
- phase siempre se setea a 'work'

### Fix Checking

**Goal**: Verificar que para todos los inputs donde el bug condition holds, la función fixed produce el comportamiento esperado.

**Pseudocode:**
```
FOR ALL taskId WHERE isBugCondition(taskId) DO
  result := startPomodoro_fixed(taskId)
  ASSERT result.phase = task.timerState.phase
  ASSERT result.secondsLeft = task.timerState.secondsLeft
END FOR
```

### Preservation Checking

**Goal**: Verificar que para todos los inputs donde el bug condition NO holds, la función fixed produce el mismo resultado que la original.

**Pseudocode:**
```
FOR ALL taskId WHERE NOT isBugCondition(taskId) DO
  resultOriginal := startPomodoro_original(taskId)
  resultFixed := startPomodoro_fixed(taskId)
  ASSERT resultOriginal.phase = resultFixed.phase
  ASSERT resultOriginal.secondsLeft = resultFixed.secondsLeft
END FOR
```

### Unit Tests

**Test: startPomodoro restaura timerState existente**
- Setup: Crear tarea con timerState = { phase: 'work', secondsLeft: 900 }
- Action: Llamar startPomodoro(taskId)
- Assert: pomodoro.phase = 'work', pomodoro.secondsLeft = 900

**Test: startPomodoro crea nuevo timerState si no existe**
- Setup: Crear tarea sin timerState
- Action: Llamar startPomodoro(taskId)
- Assert: pomodoro.phase = 'work', pomodoro.secondsLeft = WORK_DURATION_SECONDS
- Assert: task.timerState existe con valores correctos

**Test: startPomodoro preserva fase correcta**
- Setup: Tarea con timerState = { phase: 'paused-work', secondsLeft: 600 }
- Action: Llamar startPomodoro(taskId)
- Assert: pomodoro.phase = 'paused-work'

**Test: Tarea completada no inicia timer**
- Setup: Tarea completada con timerState
- Action: Llamar startPomodoro(taskId)
- Assert: No cambia estado global

**Test: Tarea no encontrada no causa error**
- Action: Llamar startPomodoro(idInexistente)
- Assert: No throw, estado sin cambios

### Property-Based Tests

**Property: Restauración de estado**
Para cualquier taskId válido con timerState existente:
- La fase debe restaurarse exactamente
- secondsLeft debe restaurarse exactamente

**Property: Fresh start**
Para cualquier taskId válido sin timerState:
- phase debe ser 'work'
- secondsLeft debe ser WORK_DURATION_SECONDS
- Nuevo timerState debe crearse

**Property: Sincronización post-carga**
Para cualquier estado cargado desde storage:
- Si task.timerState existe, pomodoro debe sincronizar desde timerState
- Si no existe, debe crearse desde pomodoro.persistido

### Integration Tests

**Test: Cambio entre tareas preserva estados**
1. Crear Tarea A, iniciar timer, avanzar 5 minutos
2. Crear Tarea B, iniciar timer, avanzar 10 minutos
3. Volver a Tarea A, iniciar timer
4. Verificar: Tarea A muestra 20 minutos restantes (25 - 5)
5. Verificar: Tarea B muestra 15 minutos restantes (25 - 10)

**Test: Persistencia con timerStates múltiples**
1. Crear tareas con diferentes timerStates
2. Recargar página
3. Verificar que cada tarea mantiene su timerState
4. Verificar que timer activo restaura desde timerState correcto

**Test: Overlay muestra timerState correcto**
1. Cambiar entre tareas con timerStates
2. Abrir overlay
3. Verificar que muestra el timerState de la tarea seleccionada

### Consideraciones Adicionales de Testing

**Edge Cases a cubrir:**
- Timer en pausa con timerState existente
- Timer en break phase
-secondsLeft = 0 (caso límite)
- Carga de storage con timerStates inconsistentes

**Mock Requirements:**
- Mock de notifications para evitar spam en tests
- Mock de Date.now() para control de tiempo
- Mock de setInterval/clearInterval para testing determinístico

**Test Coverage Targets:**
- 100% de cobertura en startPomodoro
- 100% de cobertura en _loadFromStorage
- Cobertura completa de paths de preservación