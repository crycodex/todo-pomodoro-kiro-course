# Implementation Plan: todo-pom

## Overview

Implementación incremental de la SPA todo-pom con Vue 3 (Composition API), Pinia, Vite, Vitest y fast-check. El plan sigue el orden natural de dependencias: scaffolding → modelos y constantes → store → composables → persistencia → componentes → estilos → tests de propiedades.

---

## Tasks

- [x] 1. Scaffolding del proyecto
  - [x] 1.1 Inicializar proyecto Vite + Vue 3 con TypeScript
    - Crear proyecto con `npm create vite@latest todo-pom -- --template vue-ts`
    - Instalar dependencias: `pinia`, `vitest`, `@vitest/ui`, `@vue/test-utils`, `fast-check`, `jsdom`
    - Configurar `vitest.config.ts` con `environment: 'jsdom'` y alias `@` → `src/`
    - Configurar `tsconfig.json` con paths estrictos y `strict: true`
    - Eliminar código boilerplate generado por Vite (App.vue de ejemplo, estilos por defecto, componentes de ejemplo)
    - _Requirements: ninguno (infraestructura)_

  - [x] 1.2 Configurar estructura de directorios
    - Crear árbol: `src/components/`, `src/stores/`, `src/composables/`, `src/types/`, `src/utils/`, `tests/unit/`, `tests/properties/`
    - Añadir `src/main.ts` con registro de Pinia
    - _Requirements: ninguno (infraestructura)_

- [x] 2. Modelos de datos, tipos y constantes
  - [x] 2.1 Definir interfaces TypeScript y constantes
    - Crear `src/types/index.ts` con `Task`, `PomodoroPhase`, `PomodoroState`, `AppState`
    - Crear `src/utils/constants.ts` con `WORK_DURATION_SECONDS`, `BREAK_DURATION_SECONDS`, `STORAGE_KEY`, `MAX_TITLE_LENGTH`
    - _Requirements: 1, 3, 5_

  - [x] 2.2 Implementar utilidad `formatTime`
    - Crear `src/utils/formatTime.ts` que convierte segundos (número) a cadena `MM:SS`
    - Cubrir el rango completo `[0, 1500]` y también valores en descanso hasta 300
    - _Requirements: 3.8_

  - [x]* 2.3 Escribir test de propiedad para `formatTime`
    - **Property 7: Formato MM:SS cubre todo el rango válido**
    - **Validates: Requirements 3.8**
    - Usar `fc.integer({ min: 0, max: 1500 })` para generar entradas
    - Verificar que la salida coincide con el patrón `/^\d{2}:\d{2}$/` y que MM ∈ [0,25] y SS ∈ [0,59]
    - _Archivo: `tests/properties/formatTime.property.test.ts`_

- [x] 3. Store Pinia (`useTodoStore`)
  - [x] 3.1 Implementar state, getters y actions básicas de tareas
    - Crear `src/stores/todoStore.ts`
    - Implementar state: `tasks`, `pomodoro`
    - Implementar getters: `activeTasks`, `completedTasks`, `activeTask`, `pomodoroRunning`
    - Implementar actions: `addTask`, `editTask`, `deleteTask`, `toggleComplete` (sin lógica de Pomodoro aún)
    - Incluir validación de título (vacío/solo espacios, truncado a `MAX_TITLE_LENGTH`) dentro de `addTask` y `editTask`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4_

  - [x]* 3.2 Escribir test de propiedad: título vacío rechazado
    - **Property 1: Título vacío rechazado**
    - **Validates: Requirements 1.2**
    - Usar `fc.stringOf(fc.constant(' '))` y cadena vacía; verificar que `tasks` no cambia
    - _Archivo: `tests/properties/addTask.property.test.ts`_

  - [x]* 3.3 Escribir test de propiedad: añadir tarea incrementa lista en uno
    - **Property 2: Añadir tarea incrementa la lista en uno**
    - **Validates: Requirements 1.1**
    - Usar `fc.string({ minLength: 1 }).filter(s => s.trim().length > 0)`; verificar `tasks.length === prev + 1`
    - _Archivo: `tests/properties/addTask.property.test.ts`_

  - [x] 3.4 Implementar actions del Pomodoro en el store
    - Añadir `startPomodoro`, `pausePomodoro`, `resumePomodoro`, `cancelPomodoro`, `_tick`, `_onWorkEnd`, `_onBreakEnd` a `useTodoStore`
    - `startPomodoro` cancela cualquier Pomodoro activo antes de iniciar el nuevo
    - `toggleComplete` debe llamar a `cancelPomodoro` si la tarea tiene Pomodoro activo
    - `_onBreakEnd` incrementa `pomodoroCount` y transiciona a `idle`
    - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.3_

  - [x]* 3.5 Escribir test de propiedad: un solo Pomodoro activo a la vez
    - **Property 4: Un solo Pomodoro activo a la vez**
    - **Validates: Requirements 3.2, 3.3**
    - Generar secuencias de `startPomodoro` con distintos `taskId`; verificar que el store nunca tiene más de un Pomodoro activo
    - _Archivo: `tests/properties/pomodoro.property.test.ts`_

  - [x]* 3.6 Escribir test de propiedad: contador de ciclos es monotónico
    - **Property 5: Contador de ciclos es monotónico**
    - **Validates: Requirements 3.7**
    - Simular secuencias de `_onBreakEnd`; verificar que `pomodoroCount` nunca decrece
    - _Archivo: `tests/properties/pomodoro.property.test.ts`_

  - [x]* 3.7 Escribir test de propiedad: completar tarea cancela su Pomodoro
    - **Property 6: Completar una tarea cancela su Pomodoro**
    - **Validates: Requirements 2.5**
    - Generar tarea con Pomodoro en `work` o `break`; llamar `toggleComplete`; verificar `phase === 'idle'`
    - _Archivo: `tests/properties/pomodoro.property.test.ts`_

- [x] 4. Checkpoint — Tests del store
  - Asegurarse de que todos los tests del store pasan. Consultar al usuario si surgen dudas.

- [x] 5. Composable `usePomodoro`
  - [x] 5.1 Implementar `usePomodoro`
    - Crear `src/composables/usePomodoro.ts`
    - Exponer `start`, `pause`, `resume`, `cancel`, `tick`
    - Gestionar el `setInterval` interno (creación en `start`/`resume`, limpieza en `pause`/`cancel`)
    - Al recuperar estado desde `localStorage`, convertir `work`→`paused-work` y `break`→`paused-break`
    - Manejar la corrección de tiempo al retomar visibilidad (`visibilitychange` + `Date.now()`)
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 4.1, 4.3, 4.4, 5.3_

  - [x]* 5.2 Escribir tests unitarios para `usePomodoro`
    - Mockear `setInterval`/`clearInterval` con `vi.useFakeTimers()`
    - Verificar transiciones de fase: `idle → work → break → idle`
    - Verificar que `pause` detiene el tick y `resume` lo reanuda
    - Verificar la corrección de tiempo en `visibilitychange`
    - _Archivo: `tests/unit/usePomodoro.test.ts`_

- [x] 6. Composable `useNotifications`
  - [x] 6.1 Implementar `useNotifications`
    - Crear `src/composables/useNotifications.ts`
    - Exponer `requestPermission`, `notifyWorkEnd`, `notifyBreakEnd`, `playSound`
    - Solicitar permiso solo en el primer inicio de Pomodoro (guardar resultado en `ref`)
    - Implementar fallback visual (banner 4 s) cuando permiso denegado o API no disponible
    - Capturar silenciosamente errores de Web Audio API
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x]* 6.2 Escribir tests unitarios para `useNotifications`
    - Mockear `Notification` API y `AudioContext`
    - Verificar que se llama a `requestPermission` solo en el primer Pomodoro
    - Verificar que el banner visual aparece cuando el permiso es `denied`
    - Verificar que los errores de audio se capturan sin lanzar excepciones
    - _Archivo: `tests/unit/useNotifications.test.ts`_

- [x] 7. Capa de persistencia
  - [x] 7.1 Implementar serialización/deserialización de `AppState`
    - Crear `src/utils/storage.ts` con funciones `saveState(state: AppState): void` y `loadState(): AppState | null`
    - Excluir `intervalId` de la serialización
    - Envolver operaciones en `try/catch`; retornar `null` si la lectura falla o el JSON es inválido
    - _Requirements: 5.1, 5.2, 5.4_

  - [x] 7.2 Integrar persistencia en el store
    - Añadir `_loadFromStorage` y `_saveToStorage` al store
    - Añadir `watch` profundo en el store para llamar a `_saveToStorage` en cada cambio relevante
    - En `_loadFromStorage`, convertir fases `work`/`break` a `paused-work`/`paused-break`
    - Mostrar advertencia en header cuando `_saveToStorage` falla (emitir evento o ref global)
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x]* 7.3 Escribir test de propiedad: round-trip de persistencia
    - **Property 3: Round-trip de persistencia**
    - **Validates: Requirements 5.6**
    - Generar `AppState` arbitrario con `fc.record`; verificar que `loadState(saveState(state))` produce estado funcionalmente equivalente
    - _Archivo: `tests/properties/storage.property.test.ts`_

  - [x]* 7.4 Escribir tests unitarios para la capa de persistencia
    - Mockear `localStorage` con `vi.stubGlobal`
    - Verificar arranque con estado vacío cuando `localStorage` está vacío
    - Verificar arranque con estado vacío cuando los datos están corruptos
    - Verificar que la advertencia se emite cuando la escritura falla
    - _Archivo: `tests/unit/storage.test.ts`_

- [x] 8. Checkpoint — Tests de persistencia
  - Asegurarse de que todos los tests de persistencia pasan. Consultar al usuario si surgen dudas.

- [x] 9. Componentes Vue
  - [x] 9.1 Implementar `TheHeader.vue`
    - Mostrar texto "todo-pom" como identificador de la aplicación
    - Incluir slot o prop reactiva para mostrar advertencia de `localStorage` (no intrusiva)
    - _Requirements: 6.2, 5.5_

  - [x] 9.2 Implementar `TaskInput.vue`
    - Input controlado con `ref<string>`
    - Emitir `add(title)` al hacer submit; no emitir si el título está vacío o solo espacios
    - Limpiar el campo y restaurar el foco tras emitir
    - Deshabilitar el botón "Añadir" cuando el título es inválido
    - _Requirements: 1.1, 1.2, 1.7_

  - [x] 9.3 Implementar `TaskItem.vue`
    - Recibir props `task: Task` e `isActive: boolean`
    - Emitir `toggle-complete`, `edit`, `delete`, `start-pomodoro`, `cancel-pomodoro`
    - Edición inline al hacer doble clic (cambiar a `<input>` editable)
    - Descartar edición vacía y restaurar título anterior
    - Mostrar `pomodoroCount` y botón con ícono según la fase del temporizador (`idle / running / paused`)
    - _Requirements: 1.4, 1.5, 1.6, 2.1, 2.2, 3.4, 3.5, 3.6_

  - [x] 9.4 Implementar `TaskList.vue` y `CompletedList.vue`
    - `TaskList` muestra tareas activas ordenadas por `createdAt` descendente; itera con `TaskItem`
    - `CompletedList` muestra tareas completadas ordenadas por `completedAt` descendente; sección colapsable
    - Ambos conectan eventos de `TaskItem` con las acciones del store
    - _Requirements: 2.3, 2.4_

  - [x] 9.5 Implementar `BreakTimer.vue`
    - Componente puramente presentacional; recibe `secondsLeft: number`
    - Mostrar indicador visual diferenciado de la WorkPhase
    - _Requirements: 4.2_

  - [x] 9.6 Implementar `PomodoroOverlay.vue`
    - Recibir props `task: Task` y `timerState: PomodoroState`
    - Mostrar: nombre de tarea, tiempo restante en `MM:SS`, fase (trabajo/descanso), controles (pause/resume/cancel)
    - Ocultar cuando `timerState.phase === 'idle'`
    - Incluir `BreakTimer` cuando la fase es `break` o `paused-break`
    - Emitir `pause`, `resume`, `cancel`
    - _Requirements: 3.4, 3.5, 3.6, 3.8, 4.2_

  - [x] 9.7 Ensamblar `App.vue`
    - Componer todos los componentes: `TheHeader`, `TaskInput`, `TaskList`, `CompletedList`, `PomodoroOverlay`
    - Conectar eventos de componentes con acciones del store (`useTodoStore`)
    - Inicializar el store con `_loadFromStorage` en `onMounted`
    - Pasar `activeTask` y `pomodoro` state al `PomodoroOverlay`
    - _Requirements: 1, 2, 3, 4, 5_

  - [x]* 9.8 Escribir tests unitarios de componentes
    - Testear `TaskInput`: submit con título válido emite evento; submit vacío no emite; limpia el campo tras emitir
    - Testear `TaskItem`: renderiza título, conteo y botones; edición inline; descarta edición vacía
    - Testear `PomodoroOverlay`: se oculta en `idle`; muestra `MM:SS`; emite eventos de control
    - _Archivo: `tests/unit/components.test.ts`_

- [x] 10. Checkpoint — Tests de componentes
  - Asegurarse de que todos los tests de componentes pasan. Consultar al usuario si surgen dudas.

- [x] 11. Estilos CSS monocromáticos y responsive
  - [x] 11.1 Definir variables CSS y estilos globales
    - Crear `src/assets/main.css` con variables CSS: `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-hover`
    - Paleta estrictamente monocromática (blanco, negro, grises)
    - Tipografía sans-serif (system-ui o similar)
    - Reset/normalize básico, `box-sizing: border-box`
    - _Requirements: 6.1, 6.3, 6.6_

  - [x] 11.2 Aplicar estilos scoped a cada componente
    - `TheHeader`: layout fijo superior, tipografía prominente
    - `TaskInput`: input de ancho completo con botón alineado
    - `TaskItem`: fila con checkbox, título editable, conteo y controles
    - `TaskList` / `CompletedList`: lista con separadores sutiles; collapsible con transición CSS
    - `PomodoroOverlay`: panel flotante centrado o sidebar; display en grande del tiempo restante
    - `BreakTimer`: indicador visual diferenciado (p.ej. borde o fondo con tono diferente dentro de la misma escala gris)
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

  - [x] 11.3 Implementar layout responsive
    - Breakpoint en 768px: sobre ese valor layout de dos columnas (lista + overlay); bajo ese valor layout de columna única con overlay como modal inferior
    - Asegurar que todos los controles son accesibles en móvil (tamaño mínimo de tap target 44px)
    - _Requirements: 6.4, 6.5_

- [x] 12. Checkpoint final — Suite completa de tests
  - Ejecutar `vitest --run` y verificar que todos los tests (unitarios y de propiedades) pasan sin errores.
  - Consultar al usuario si surgen dudas o fallos.

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia los requisitos específicos para trazabilidad.
- Los checkpoints garantizan validación incremental antes de avanzar a la siguiente capa.
- Los tests de propiedades validan invariantes universales con `fast-check` (mínimo 100 iteraciones cada uno).
- Los tests unitarios validan ejemplos concretos y casos borde.
- La implementación de `intervalId` nunca se serializa a `localStorage`; al restaurar, las fases activas se tratan como pausadas.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "3.2", "3.3", "3.4"] },
    { "id": 4, "tasks": ["3.5", "3.6", "3.7", "5.1", "7.1"] },
    { "id": 5, "tasks": ["5.2", "6.1", "7.2"] },
    { "id": 6, "tasks": ["6.2", "7.3", "7.4", "9.1", "9.2", "9.3"] },
    { "id": 7, "tasks": ["9.4", "9.5", "9.6"] },
    { "id": 8, "tasks": ["9.7"] },
    { "id": 9, "tasks": ["9.8", "11.1"] },
    { "id": 10, "tasks": ["11.2"] },
    { "id": 11, "tasks": ["11.3"] }
  ]
}
```
