# Plan de Implementación: Timer por Tarea

## Descripción General

Este plan implementa temporizadores Pomodoro por tarea, permitiendo que cada tarea mantenga su propio estado de temporizador independiente. La solución integra `TimerState` directamente en la estructura de datos de cada tarea, con sincronización bidireccional entre el estado global y el estado de la tarea activa.

## Tareas

- [ ] 1. Actualizar tipos en src/types/index.ts
  - [x] 1.1 Definir nuevo tipo TimerState
    - Crear interfaz TimerState con propiedades phase y secondsLeft
    - Exportar el nuevo tipo para uso en componentes y store
    - _Requisitos: 4.1, 4.2, 4.4_

  - [x] 1.2 Añadir timerState a la interfaz invoke_sub_agent
    - Agregar propiedad timerState de tipo TimerState | null
    - Actualizar la documentación de la interfaz
    - _Requisitos: 1.1, 4.1_

  - [ ]* 1.3 Escribir test de tipos para TimerState
    - Verificar que TimerState contenga las propiedades phase y secondsLeft
    - Verificar que invoke_sub_agent.timerState acepte TimerState | null
    - _Requisitos: 4.1, 4.2_

- [ ] 2. Modificar store todoStore.ts para sincronización bidireccional
  - [x] 2.1 Actualizar función addTask para inicializar timerState en null
    - Modificar la creación de tareas para incluir timerState: null
    - _Requisitos: 4.3, 13_

  - [x] 2.2 Actualizar función startPomodoro para sincronización bidireccional
    - Inicializar timerState de la tarea activa con phase 'work' y segundos completos
    - Mantener sincronización con estado global
    - _Requisitos: 1.1, 2.2, 4.1_

  - [x] 2.3 Actualizar función pausePomodoro para sincronizar estados
    - Actualizar timerState.phase de la tarea activa al pausar
    - Mantener ambos estados sincronizados
    - _Requisitos: 6.3, 10_

  - [x] 2.4 Actualizar función resumePomodoro para sincronizar estados
    - Actualizar timerState.phase de la tarea activa al reanudar
    - Mantener ambos estados sincronizados
    - _Requisitos: 6.4, 11_

  - [x] 2.5 Actualizar función cancelPomodoro para limpiar timerState
    - Establecer timerState de la tarea actual en null al cancelar
    - Limpiar estado global
    - _Requisitos: 1.4, 3_

  - [x] 2.6 Actualizar función _tick para sincronizar segundos restantes
    - Actualizar task.timerState.secondsLeft en cada tick
    - Mantener sincronización de segundos
    - _Requisitos: 6.2, 9_

  - [x] 2.7 Actualizar función _onWorkEnd para sincronización
    - Actualizar timerState a phase 'break' con BREAK_DURATION_SECONDS
    - Incrementar pomodoroCount de la tarea
    - _Requisitos: 6.5, 12_

  - [x] 2.8 Actualizar función _onBreakEnd para limpieza
    - Establecer timerState de la tarea en null al finalizar break
    - Resetear estado global a idle
    - _Requisitos: 1.3_

  - [x] 2.9 Actualizar función deleteTask para eliminación correcta
    - Verificar si la tarea a eliminar tiene timer activo
    - Cancelar pomodoro si es necesario antes de eliminar
    - _Requisitos: 1.4, 3_

  - [ ]* 2.10 Escribir tests unitarios para sincronización del store
    - Testear sincronización bidireccional en pause/resume
    - Testear preservación de timerState al cambiar entre tareas
    - Testear limpieza de timerState en deleteTask
    - _Requisitos: 6.2, 6.3, 6.4_

- [ ] 3. Actualizar TaskItem.vue con indicadores visuales
  - [x] 3.1 Actualizar computed timerStatus para usar timerState de la tarea
    - Leer timerState de props.task en lugar de props.timerPhase
    - Mantener lógica de 'idle', 'paused', 'running'
    - _Requisitos: 3.1, 4_

  - [x] 3.2 Añadir computed hasTimer para detectar timer asociado
    - Verificar si timerState existe y no está en fase 'idle'
    - _Requisitos: 3.1_

  - [x] 3.3 Añadir clases CSS dinámicas según estado del timer
    - Clase 'has-timer' cuando tiene timer asociado
    - Clase 'timer-paused' cuando está en pausa
    - Clase 'timer-running' cuando está activo
    - _Requisitos: 3.1, 3.2, 3.3_

  - [x] 3.4 Añadir indicador visual del temporizador en acciones
    - Añadir elemento timer-indicator-icon con punto indicador
    - Estilos: verde animate para running, naranja para paused
    - _Requisitos: 3.1, 3.2, 3.3_

  - [x] 3.5 Añadir indicador de tiempo en meta info
    - Mostrar tiempo restante junto al contador de pomodoros
    - Usar formatTime para mostrar segundos restantes
    - _Requisitos: 3.1_

  - [ ]* 3.6 Escribir test de компоненты para indicadores visuales
    - Verificar renderizado de clases según estado del timer
    - Verificar visualización de indicador de tiempo
    - _Requisitos: 4, 5, 6_

- [ ] 4. Actualizar PomodoroOverlay.vue para usar timerState de la tarea
  - [x] 4.1 Cambiar prop timerState para recibir de la tarea activa
    - Actualizar tipo de prop de PomodoroState a TimerState
    - Usar task.timerState en lugar de timerState global
    - _Requisitos: 1.3, 15_

  - [x] 4.2 Verificar que la lógica de visualización funcione correctamente
    - Verificar computed visible, isBreak, isPaused
    - Verificar phaseLabel
    - _Requisitos: 1.3, 15_

  - [ ]* 4.3 Escribir test de componentes para PomodoroOverlay
    - Verificar visualización con timerState de tarea
    - Verificar controles de pause/resume
    - _Requisitos: 1.3, 15_

- [ ] 5. Verificar y actualizar persistencia para incluir timerState
  - [ ] 5.1 Verificar que storage.ts incluya timerState en serialización
    - La serialización JSON de invoke_sub_agent ya incluye timerState automáticamente
    - Verificar que loadState maneje estructura correctamente
    - _Requisitos: 5.1, 7_

  - [ ] 5.2 Verificar sincronización post-carga
    - Después de cargar, el estado global debe sincronizarse con timerState
    - _Requisitos: 5.2, 8, 9_

  - [ ]* 5.3 Escribir tests de persistencia para timerState
    - Testear serialización y deserialización de timerState
    - Testear restauración correcta después de recarga
    - _Requisitos: 5.1, 5.2, 7, 8_

- [x] 6. Checkpoint - Verificar que todos los tests pasen
  - Asegurar que todos los tests pasen, hacer preguntas al usuario si surgen dudas.

- [ ] 7. Property-based tests para propiedades de correctness
  - [x] 7.1 Escribir property test para Property 1: TimerState Initialization
    - Para cualquier tarea válida, startPomodoro debe inicializar timerState con phase='work' y segundos completos
    - **Property 1**
    - **Valida: Requisitos 1.1, 4.1, 4.2**
    - _Requisitos: 1.1, 4.1, 4.2_

  - [x] 7.2 Escribir property test para Property 2: TimerState Preservation on invoke_sub_agent Switch
    - Al cambiar de tarea, el timerState de la tarea anterior debe preservarse
    - **Property 2**
    - **Valida: Requisitos 1.2, 2.1, 2.3, 14**
    - _Requisitos: 1.2, 2.1, 2.3, 14_

  - [x] 7.3 Escribir property test para Property 3: TimerState Deletion
    - Al eliminar una tarea, su timerState debe eliminarse con la tarea
    - **Property 3**
    - **Valida: Requisitos 1.4**
    - _Requisitos: 1.4_

  - [x] 7.4 Escribir property test para Property 9: Active invoke_sub_agent Timer State Sync
    - El estado global debe coincidir con el timerState de la tarea activa
    - **Property 9**
    - **Valida: Requisitos 6.2, 9**
    - _Requisitos: 6.2, 9_

  - [x] 7.5 Escribir property test para Property 10: Pause Updates Both States
    - pausePomodoro debe actualizar tanto estado global como timerState
    - **Property 10**
    - **Valida: Requisitos 6.3, 10**
    - _Requisitos: 6.3, 10_

  - [x] 7.6 Escribir property test para Property 11: Resume Updates Both States
    - resumePomodoro debe actualizar tanto estado global como timerState
    - **Property 11**
    - **Valida: Requisitos 6.4, 11**
    - _Requisitos: 6.4, 11_

  - [x] 7.7 Escribir property test para Property 12: Cycle Completion Syncs Both States
    - Al completar ciclo, ambos estados deben actualizarse a break
    - **Property 12**
    - **Valida: Requisitos 6.5, 12**
    - _Requisitos: 6.5, 12_

  - [x] 7.8 Escribir property test para Property 13: New Tasks Have Null Timer State
    - Las tareas nuevas deben tener timerState null
    - **Property 13**
    - **Valida: Requisitos 4.3**
    - _Requisitos: 4.3_

  - [x] 7.9 Escribir property test para Property 14: invoke_sub_agent Switch Preserves Remaining Seconds
    - Al cambiar de tarea, los segundos restantes de la tarea anterior se preservan
    - **Property 14**
    - **Valida: Requisitos 2.1, 2.3, 14**
    - _Requisitos: 2.1, 2.3, 14_

  - [x] 7.10 Escribir property test para Property 15: Overlay Displays Active invoke_sub_agent Timer State
    - PomodoroOverlay debe mostrar timerState de la tarea activa
    - **Property 15**
    - **Valida: Requisitos 1.3, 5.4**
    - _Requisitos: 1.3, 5.4_

- [x] 8. Checkpoint final - Verificar que todos los tests pasen
  - Asegurar que todos los tests pasen, hacer preguntas al usuario si surgen dudas.

## Notas

- Las tareas marcadas con * son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades universales de correctitud
- Los tests unitarios validan ejemplos específicos y casos borde

## Gráfico de Dependencias de Tareas

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "2.6"] },
    { "id": 3, "tasks": ["2.7", "2.8", "2.9", "2.10"] },
    { "id": 4, "tasks": ["3.1", "3.2", "3.3"] },
    { "id": 5, "tasks": ["3.4", "3.5", "3.6"] },
    { "id": 6, "tasks": ["4.1", "4.2", "4.3"] },
    { "id": 7, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 8, "tasks": ["6"] },
    { "id": 9, "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5"] },
    { "id": 10, "tasks": ["7.6", "7.7", "7.8", "7.9", "7.10"] },
    { "id": 11, "tasks": ["8"] }
  ]
}
```