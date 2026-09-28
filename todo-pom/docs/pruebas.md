# Pruebas del Proyecto

## Estrategia de Testing

El proyecto utiliza un enfoque híbrido de testing que combina:

- **Testing basado en propiedades (Property-based Testing)**: Con `fast-check` para validar invariantes del sistema
- **Testing unitario**: Con `vitest` y `@vue/test-utils` para componentes y lógica individual
- **Testing de integración**: Validación del flujo completo de la aplicación

## Herramientas de Testing

| Herramienta | Uso |
|-------------|-----|
| **Vitest** | Framework de testing para Vue 3 |
| **@vue/test-utils** | Utilidades para montar y probar componentes Vue |
| **fast-check** | Property-based testing para validación de invariantes |

## Estructura de Pruebas

```
tests/
├── unit/                  # Pruebas unitarias
│   ├── components.test.ts
│   ├── useNotifications.test.ts
│   └── usePomodoro.test.ts
└── properties/            # Pruebas basadas en propiedades
    ├── addTask.property.test.ts
    ├── formatTime.property.test.ts
    ├── pomodoro.property.test.ts
    ├── startPomodoro-bug-condition.test.ts
    ├── startPomodoro-preservation.test.ts
    └── storage.property.test.ts
```

## Pruebas Unitarias

### 1. components.test.ts

Valida el comportamiento de los componentes visuales:

#### TaskInput
- ✅ Emite `add` con título válido y limpia el campo
- ✅ No emite `add` para títulos vacíos o espacios en blanco
- ✅ Deshabilita el botón submit para títulos inválidos

#### TaskItem
- ✅ Renderiza título, contador de Pomodoros y botones de acción
- ✅ entra en modo de edición con doble click y confirma título válido
- ✅ Descarta edición vacía

#### PomodoroOverlay
- ✅ Se oculta cuando el temporizador está en estado idle
- ✅ Muestra tiempo restante en formato MM:SS
- ✅ Emite eventos `pause`, `resume` y `cancel`

### 2. useNotifications.test.ts

Valida el comportamiento de notificaciones:

- ✅ Llama `requestPermission` solo en la primera invocación
- ✅ Muestra banner visual cuando el permiso es denegado
- ✅ Captura errores de Web Audio sin lanzar excepciones

## Pruebas Basadas en Propiedades

Estas pruebas validan invariantes del sistema usando inputs aleatorios.

### Property 1: Título vacío rechazado
Para cualquier título vacío o solo con espacios, `addTask` debe rechazarlo.

### Property 2: Añadir tarea incrementa la lista en uno
Cada llamada válida a `addTask` debe incrementar la lista en exactamente 1.

### Property 4: Un solo Pomodoro activo a la vez
El sistema debe mantener solo un Pomodoro activo simultáneamente, sin importar qué tarea se seleccione.

### Property 5: Contador de ciclos es monotónico
El contador de Pomodoros (`pomodoroCount`) solo puede aumentar o mantenerse, nunca disminuir.

### Property 6: Completar una tarea cancela su Pomodoro
Si hay un Pomodoro activo en una tarea y se marca como completada, el Pomodoro debe cancelarse.

### Property 7: Formato MM:SS cubre todo el rango válido
La función `formatTime` debe producir un string con formato `MM:SS` para cualquier valor de segundos entre 0 y 1500.

### Property 9: Active task TimerState sync con estado global
El `timerState` de la tarea activa debe coincidir siempre con el estado global del Pomodoro.

### Property 10-11: pause/resume actualizan ambos estados
Las funciones `pausePomodoro` y `resumePomodoro` deben actualizar tanto el estado global como el `timerState` de la tarea.

### Property 12: Ciclo completo sincroniza a break
Al completar un ciclo de trabajo, ambos estados deben actualizarse a `break`.

### Property 13: New tasks tienen null TimerState
Las tareas recién creadas deben tener `timerState` en `null`.

### Property 14: Cambio de tarea preserva segundos restantes
Al cambiar de tarea, los segundos restantes de la tarea anterior deben preservarse exactamente.

### Property 15: PomodoroOverlay muestra TimerState
El overlay debe mostrar el `timerState` correcto de la tarea activa.

## Pruebas de Persistencia (storage.property.test.ts)

Validan que el estado se guarda y carga correctamente:

- ✅ Guardar y cargar tareas
- ✅ Guardar y cargar estado del Pomodoro
- ✅ Persistencia de `timerState` de tareas específicas

## Pruebas Específicas de Bug Condition

### startPomodoro-bug-condition.test.ts
Valida que el temporizador funcione correctamente en condiciones específicas que antes causaban bugs.

### startPomodoro-preservation.test.ts
Valida que el estado de tareas previas se preserve correctamente al cambiar de tarea.

## Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm run test

# Modo watch (automático al guardar)
npm run test:watch

# Ver reporte en UI
npm run test -- --ui
```

## Cobertura de Código

El proyecto mantiene alta cobertura en:
- Lógica de negocio del store
- Funciones puras (`formatTime`)
- Validaciones de entrada
- Estado del temporizador