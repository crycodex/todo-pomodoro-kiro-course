# Implementation Plan

## Tarea Exploration Test

- [x] 1. Escribir test de condición de bug para startPomodoro
  - **Property 1: Bug Condition** - startPomodoro ignora timerState existente
  - **CRITICAL**: Este test DEBE FALLAR en código no corregido - el failure confirma que el bug existe
  - **NO intentes corregir el test ni el código cuando falle**
  - **NOTA**: Este test codifica el comportamiento esperado - validará el fix cuando pase después de implementar
  - **GOAL**: Surface counterexamples que demuestran que el bug existe
  - **Scoped PBT Approach**: Para bugs deterministas, scope la propiedad a los casos concretos que fallan para asegurar reproducibilidad
  - Test que verifica: cuando startPomodoro(taskId) es llamado en tarea con timerState existente, el pomodoro.state debería restaurar phase y secondsLeft desde timerState (pero actualmente siempre resetea a 25 min)
  - Codificar la aserción del comportamiento esperado de la sección Expected Behavior en el design
  - Run test en código NO corregido
  - **EXPECTED OUTCOME**: Test FALLA (esto es correcto - prueba que el bug existe)
  - Documentar counterexamples encontrados (ej: "startPomodoro(taskConTimerState) resetea secondsLeft a 1500 en lugar de restaurar 900")
  - Marcar tarea completa cuando el test esté escrito, corrido, y el failure esté documentado
  - _Requirements: 2.1, 2.2, 2.3_

## Preservation Property Tests

- [x] 2. Escribir tests de propiedad de preservación (ANTES de implementar fix)
  - **Property 2: Preservation** - startPomodoro sin timerState inicia fresco
  - **IMPORTANT**: Seguir metodología observation-first
  - Observar comportamiento en código NO corregido para tareas sin timerState existente
  - Escribir property-based test que captura patrones de comportamiento observado de Preservation Requirements en design
  - Property-based testing genera muchos test cases para garantías más fuertes
  - Run tests en código NO corregido
  - **EXPECTED OUTCOME**: Tests PASAN (esto confirma baseline behavior a preservar)
  - Marcar tarea completa cuando tests estén escritos, corridos, y pasando en código no corregido
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

## Fix Implementation

- [ ] 3. Corregir startPomodoro para restaurar timerState existente

  - [x] 3.1 Modificar startPomodoro en todoStore.ts
    - Agregar verificación de task.timerState existente antes de crear nuevo estado
    - Si task.timerState existe: restaurar pomodoro.phase y pomodoro.secondsLeft desde timerState
    - Si NO existe: crear nuevo timerState fresco como antes (phase: 'work', secondsLeft: WORK_DURATION_SECONDS)
    - Mantener lógica existente de _clearTimer() y notifications.requestPermission()
    - _Bug_Condition: isBugCondition(input) donde task.timerState ≠ null_
    - _Expected_Behavior: expectedBehavior(result) de design - restaurar phase y secondsLeft desde timerState_
    - _Preservation: Preservation Requirements de design - funcionalidad sin timerState debe ser idéntica_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Modificar _tick() para actualizar timerState solo si existe
    - Agregar verificación de task?.timerState antes de actualizar secondsLeft
    - Esto asegura sincronización correcta después del fix
    - _Preservation: Mantener comportamiento existente de _tick() para casos sin timerState_
    - _Requirements: 2.4_

  - [x] 3.3 Mejorar sincronización en _loadFromStorage()
    - Agregar lógica para sincronizar desde task.timerState si existe
    - Si no existe, crear timerState desde estado persistido
    - Esto asegura consistencia después de recargar página
    - _Requirements: 2.4_

  - [x] 3.4 Verificar que test de condición de bug ahora pasa
    - **Property 1: Expected Behavior** - startPomodoro restaura timerState existente
    - **IMPORTANT**: Re-ejecutar el MISMO test de la tarea 1 - NO escribir un nuevo test
    - El test de la tarea 1 codifica el comportamiento esperado
    - Cuando este test pasa, confirma que el comportamiento esperado está satisfecho
    - Run test de condición de bug del paso 1
    - **EXPECTED OUTCOME**: Test PASA (confirma que el bug está corregido)
    - _Requirements: Expected Behavior Properties de design_

  - [x] 3.5 Verificar que tests de preservación siguen pasando
    - **Property 2: Preservation** - Comportamiento sin timerState preservado
    - **IMPORTANT**: Re-ejecutar los MISMOS tests de la tarea 2 - NO escribir nuevos tests
    - Run property tests de preservación del paso 2
    - **EXPECTED OUTCOME**: Tests PASAN (confirma que no hay regresiones)
    - Confirmar que todos los tests siguen pasando después del fix (no hay regresiones)

- [x] 4. Checkpoint - Asegurar que todos los tests pasan
  - Asegurar que todos los tests pasen, preguntar al usuario si surgen dudas.