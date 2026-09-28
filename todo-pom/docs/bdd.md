# BDD y Especificaciones del Sistema

## Descripción del Producto

**Todo-Pomodoro** es una aplicación de gestión de tareas con temporizador Pomodoro integrado. Permite a los usuarios organizar sus tareas diarias y seguir el método Pomodoro para una productividad óptima.

## Funcionalidades Principales

### 1. Gestión de Tareas
- Agregar tareas nuevas con título
- Editar títulos de tareas existentes
- Eliminar tareas
- Marcar tareas como completadas
- Visualizar tareas pendientes y completadas por separado

### 2. Temporizador Pomodoro
- Ciclos de trabajo de 25 minutos (por defecto)
- Pausas cortas de 5 minutos (por defecto)
- Soporte para pausar y reanudar el temporizador
- Cancelar el temporizador actual
- Contador de ciclos Pomodoro por tarea

### 3. Persistencia
- Guardado automático en `localStorage`
- Sincronización opcional con Supabase (nube)
- Preservación de estado del temporizador al cambiar de tarea

### 4. Notificaciones
- Notificaciones del sistema al terminar un ciclo de trabajo
- Notificación al terminar una pausa
- Banner visual cuando las notificaciones están deshabilitadas

## Especificaciones de Comportamiento

### Feature: Agregar Tarea
**Como** usuario  
**Quiero** poder agregar tareas nuevas  
**Para** organizar mis pendientes

**Criterios de Aceptación**:
1. Un título vacío o solo con espacios no se acepta
2. Cada tarea nueva se añade al final de la lista activa
3. El título se trunca a 255 caracteres como máximo
4. La nueva tarea tiene `pomodoroCount = 0` y `timerState = null`

### Feature: Temporizador Pomodoro
**Como** usuario  
**Quiero** poder iniciar un temporizador Pomodoro en una tarea  
**Para** enfocarme en una sola tarea por tiempo determinado

**Criterios de Aceptación**:
1. Solo puede haber un Pomodoro activo a la vez
2. Iniciar un Pomodoro en una tarea preserva el estado de la tarea anterior
3. Completar una tarea cancela su Pomodoro activo
4. El temporizador continúa funcionando cuando la pestaña vuelve del background
5. Al completar un ciclo de trabajo, inicia automáticamente una pausa
6. Los segundos restantes se preservan exactamente al cambiar de tarea

### Feature: Editar Tarea
**Como** usuario  
**Quiero** poder editar el título de mis tareas  
**Para** corregir errores o ajustar descripciones

**Criterios de Aceptación**:
1. Doble click en el título activa el modo de edición
2. Pressionar Enter confirma la edición
3. Títulos vacíos o solo espacios mantienen el título original
4. Títulos se truncan a 255 caracteres

### Feature: Notificaciones
**Como** usuario  
**Quiero** recibir notificaciones cuando terminen los ciclos  
**Para** saber cuándo hacer una pausa o cambiar de tarea

**Criterios de Aceptación**:
1. Se solicita permiso solo la primera vez
2. Si se niega el permiso, se muestra un banner visual
3. El banner desaparece después de 4 segundos
4. Los sonidos se intentan reproducir pero no fallan si el AudioContext no está disponible

### Feature: Persistencia Local
**Como** usuario  
**Quiero** que mis tareas se guarden automáticamente  
**Para** no perder mi progreso si cierro la pestaña

**Criterios de Aceptación**:
1. Cambios se guardan inmediatamente en `localStorage`
2. El estado del temporizador se recupera al recargar
3. Si localStorage está lleno, se muestra una advertencia
4. Los datos persisten incluso si el temporizador estaba pausado

### Feature: Sincronización con Supabase
**Como** usuario  
**Quiero** sincronizar mis tareas en la nube  
**Para** acceder desde múltiples dispositivos

**Criterios de Aceptación**:
1. Los datos se envían a Supabase en cada cambio
2. No se requiere autenticación (solo write con RLS deshabilitado)
3. Las tareas existentes no se duplican
4. Los errores de sincronización no afectan el funcionamiento local

## Modelo de Dominio

```
┌─────────────────────────────────────────────────────────────┐
│                     Usuario                                 │
│  (persona que usa la aplicación)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Tarea                                  │
│  • id (UUID)                                                │
│  • title (string, max 255 chars)                           │
│  • completed (boolean)                                      │
│  • createdAt (timestamp)                                    │
│  • completedAt (timestamp, nullable)                       │
│  • pomodoroCount (integer)                                  │
│  • timerState (TimerState, nullable)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Temporizador Pomodoro                      │
│  • taskId (string, nullable)                               │
│  • phase ('idle' | 'work' | 'break' |                      │
│           'paused-work' | 'paused-break')                 │
│  • secondsLeft (integer)                                    │
└─────────────────────────────────────────────────────────────┘
```

## Flujos de Usuario

### Flujo: Agregar y Completar Tarea
1. Usuario escribe título y presiona Enter
2. Tarea aparece en la lista activa
3. Usuario completa la tarea
4. Tarea se mueve a la lista de completadas
5. Si había un Pomodoro activo, se cancela

### Flujo: Usar Temporizador Pomodoro
1. Usuario hace click en el botón de iniciar de una tarea
2. Overlay muestra la tarea y tiempo restante
3. Temporizador cuenta hacia atrás (25 min)
4. Usuario pausa/continúa si es necesario
5. Al terminar, suena alarma y comienza pausa (5 min)
6. Al terminar pausa, temporizador se resetea

### Flujo: Cambiar entre Tareas
1. Usuario tiene una tarea con Pomodoro activo
2. Usuario inicia Pomodoro en otra tarea
3. Estado de la primera tarea se preserva
4. nueva tarea se convierte en activa
5. Overlay muestra la nueva tarea

## Reglas de Negocio

1. **Un solo Pomodoro activo**: El sistema debe garantizar que nunca haya más de un Pomodoro en estado `work` o `break`

2. **Preservación de estado**: Cuando se cambia de tarea, el `timerState` de la tarea anterior debe conservarse exactamente

3. **Monotonicidad del contador**: El `pomodoroCount` de una tarea solo puede aumentar, nunca disminuir

4. **Cancelación automática**: Completar una tarea cancela cualquier Pomodoro activo en ella

5. **Persistencia automática**: Todo cambio en el estado debe activar un guardado automático

6. **Sync con nube**: Los cambios se sincronizan con Supabase pero no bloquean la UI si fallan

7. **Corrección de tiempo**: Cuando la pestaña vuelve del estado hidden, el temporizador se ajusta automáticamente

## Pruebas de Propiedades (Property Tests)

Las propiedades principales validadas son:

| # | Propiedad | Validación |
|---|-----------|------------|
| 1 | Título vacío rechazado | `addTask("") → tasks.length unchanged` |
| 2 | Incremento unitario | `addTask(valid) → tasks.length + 1` |
| 4 | Un solo Pomodoro activo | `startPomodoro → pomodoro.phase ≤ 1 active` |
| 5 | Contador monotónico | `cycle → pomodoroCount[i] ≥ pomodoroCount[i-1]` |
| 6 | Cancelación al completar | `toggleComplete(active) → pomodoro.phase = idle` |
| 7 | Formato MM:SS | `formatTime(0..1500) → /^\d{2}:\d{2}$/` |
| 9-11 | Sync estado global | `task.timerState === pomodoro.*` |
| 12 | Transición work→break | `onWorkEnd → phase = break` |
| 13-15 | Inicialización y visualización | `new task → timerState = null` |

## Arquitectura de Pruebas

El testing sigue el enfoque:

1. **Property-based testing**: Valida invariantes del sistema con inputs aleatorios
2. **Unit testing**: Valida componentes y funciones individuales
3. **Snapshot testing**: Valida la estructura HTML de componentes

```bash
npm run test          # Ejecutar todo
npm run test:watch    # Modo watch
```