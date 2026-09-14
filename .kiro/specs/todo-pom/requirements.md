# Requirements Document

## Introduction

**todo-pom** es una aplicación web SPA que combina una lista de tareas minimalista con un temporizador Pomodoro integrado. El usuario puede crear, editar y eliminar tareas, asociar ciclos Pomodoro (25 min trabajo + 5 min descanso) a cada una, y recibir señales visuales, sonoras y de sistema al finalizar cada fase. Toda la persistencia es local (localStorage), el diseño es estrictamente monocromático y la interfaz es responsive.

---

## Glossary

- **App**: la aplicación web SPA todo-pom en su conjunto.
- **Task**: unidad de trabajo definida por el usuario, con título, estado de completitud y conteo de ciclos Pomodoro.
- **TaskList**: componente que agrupa y muestra las tareas activas (no completadas).
- **CompletedList**: sección que agrupa y muestra las tareas completadas.
- **TaskInput**: componente de entrada para crear nuevas tareas.
- **Validator**: módulo que verifica que el título de una tarea cumpla las restricciones de negocio.
- **PomodoroTimer**: módulo que controla el ciclo trabajo/descanso asociado a una tarea.
- **BreakTimer**: indicador visual del período de descanso de 5 minutos.
- **Store**: store Pinia (`useTodoStore`) que actúa como única fuente de verdad del estado de la aplicación.
- **Storage**: capa de persistencia basada en `localStorage`.
- **NotificationService**: módulo responsable de emitir señales sonoras y notificaciones del sistema al finalizar fases Pomodoro.
- **WorkPhase**: fase de trabajo activa de 25 minutos dentro de un ciclo Pomodoro.
- **BreakPhase**: fase de descanso de 5 minutos que sigue a una WorkPhase completada.
- **PomodoroCount**: número de ciclos Pomodoro completados asociados a una tarea concreta.
- **AppState**: representación serializable del estado completo de la aplicación (tareas + estado Pomodoro sin `intervalId`).

---

## Requirements

### Requirement 1: Gestión de tareas

**User Story:** Como usuario, quiero crear, editar y eliminar tareas, para que pueda organizar mi trabajo de forma eficiente.

#### Acceptance Criteria

1. WHEN el usuario envía un título válido en el TaskInput, THE Store SHALL añadir una nueva Task a la lista de tareas activas.
2. WHEN el usuario intenta crear una tarea con un título vacío o compuesto únicamente de espacios, THE Validator SHALL rechazar la operación sin modificar la lista de tareas.
3. WHEN el usuario envía un título que supera 200 caracteres, THE Validator SHALL truncar el título a 200 caracteres antes de crear la Task.
4. WHEN el usuario confirma la edición de una tarea con un título válido, THE Store SHALL actualizar el título de la Task con el nuevo valor.
5. WHEN el usuario intenta confirmar la edición de una tarea con un título vacío o solo espacios, THE Validator SHALL descartar el cambio y restaurar el título anterior de la Task.
6. WHEN el usuario elimina una tarea, THE Store SHALL eliminar permanentemente esa Task de la lista.
7. THE TaskInput SHALL limpiar el campo de texto y devolver el foco al input tras cada creación exitosa de tarea.

---

### Requirement 2: Estado de las tareas

**User Story:** Como usuario, quiero marcar tareas como completadas o pendientes y verlas separadas visualmente, para que pueda distinguir rápidamente lo que ya terminé de lo que aún está pendiente.

#### Acceptance Criteria

1. WHEN el usuario marca una tarea como completada, THE Store SHALL mover esa Task al estado `completed` y trasladarla visualmente a la CompletedList.
2. WHEN el usuario desmarca una tarea completada, THE Store SHALL mover esa Task al estado pendiente y trasladarla de vuelta a la TaskList.
3. THE TaskList SHALL mostrar únicamente las tareas con estado pendiente, ordenadas por fecha de creación descendente.
4. THE CompletedList SHALL mostrar únicamente las tareas con estado `completed`, ordenadas por fecha de completado descendente.
5. WHEN el usuario marca una tarea con PomodoroTimer activo como completada, THE Store SHALL cancelar el PomodoroTimer asociado y transicionarlo al estado `idle`.

---

### Requirement 3: Temporizador Pomodoro por tarea

**User Story:** Como usuario, quiero iniciar un temporizador Pomodoro de 25 minutos asociado a una tarea específica, para que pueda medir y registrar mis sesiones de trabajo concentrado.

#### Acceptance Criteria

1. WHEN el usuario inicia un Pomodoro sobre una tarea, THE PomodoroTimer SHALL comenzar una WorkPhase de exactamente 1500 segundos para esa Task.
2. WHEN el usuario inicia un Pomodoro sobre una tarea mientras otro Pomodoro está activo, THE Store SHALL cancelar el Pomodoro activo anterior antes de iniciar el nuevo.
3. THE Store SHALL garantizar que como máximo una Task tenga un PomodoroTimer activo en cualquier momento.
4. WHEN el PomodoroTimer está en estado activo, THE PomodoroTimer SHALL permitir al usuario pausarlo.
5. WHEN el PomodoroTimer está pausado, THE PomodoroTimer SHALL permitir al usuario reanudarlo.
6. WHEN el usuario cancela un Pomodoro activo o pausado, THE PomodoroTimer SHALL transicionar al estado `idle` sin incrementar el PomodoroCount de la tarea.
7. WHEN la WorkPhase llega a cero segundos, THE Store SHALL incrementar en uno el PomodoroCount de la Task asociada.
8. THE App SHALL mostrar el tiempo restante del Pomodoro activo en formato MM:SS, actualizado cada segundo.

---

### Requirement 4: Descanso corto post-Pomodoro

**User Story:** Como usuario, quiero que al completar un Pomodoro se inicie automáticamente un período de descanso de 5 minutos, para que pueda recuperarme antes del siguiente ciclo.

#### Acceptance Criteria

1. WHEN la WorkPhase completa sus 1500 segundos, THE PomodoroTimer SHALL iniciar automáticamente una BreakPhase de exactamente 300 segundos.
2. WHILE la BreakPhase está activa, THE BreakTimer SHALL mostrar un indicador visual diferenciado del indicador de WorkPhase.
3. WHEN la BreakPhase llega a cero segundos, THE PomodoroTimer SHALL transicionar automáticamente al estado `idle`.
4. WHEN el usuario cancela la BreakPhase manualmente, THE PomodoroTimer SHALL transicionar al estado `idle` sin iniciar un nuevo ciclo.

---

### Requirement 5: Persistencia

**User Story:** Como usuario, quiero que el estado de mis tareas y del temporizador se conserve entre sesiones del navegador, para que no pierda mi progreso al recargar la página.

#### Acceptance Criteria

1. WHEN el estado de la aplicación cambia, THE Storage SHALL serializar el AppState (tareas y estado Pomodoro sin `intervalId`) y guardarlo en `localStorage`.
2. WHEN la App se inicializa, THE Storage SHALL leer y deserializar el AppState desde `localStorage` para restaurar el estado previo.
3. WHEN el AppState restaurado contiene un Pomodoro en fase `work` o `break`, THE Store SHALL tratar esa fase como `paused-work` o `paused-break` respectivamente, requiriendo acción explícita del usuario para reanudar.
4. IF la lectura de `localStorage` falla o los datos están corruptos, THEN THE App SHALL inicializarse con un estado vacío sin interrumpir la experiencia del usuario.
5. IF la escritura en `localStorage` falla, THEN THE App SHALL mostrar un mensaje de advertencia no intrusivo en el header e ignorar el error sin detener el flujo de la aplicación.
6. FOR ALL AppState válidos, serializar y deserializar el AppState SHALL producir un estado funcionalmente equivalente al original (round-trip).

---

### Requirement 6: Diseño visual minimalista monocromático

**User Story:** Como usuario, quiero una interfaz limpia y sin distracciones en blanco, negro y grises, para que pueda concentrarme en mis tareas sin elementos visuales innecesarios.

#### Acceptance Criteria

1. THE App SHALL utilizar exclusivamente una paleta de colores monocromática compuesta por blanco, negro y escalas de gris, sin colores de acento externos.
2. THE App SHALL mostrar el encabezado con el texto "todo-pom" como identificador visual de la aplicación.
3. THE App SHALL usar únicamente tipografías sans-serif.
4. THE App SHALL presentar una interfaz completamente funcional en viewports con ancho ≥ 768px (layout escritorio).
5. THE App SHALL presentar una interfaz completamente funcional en viewports con ancho < 768px (layout móvil), adaptando los elementos al espacio reducido.
6. THE App SHALL implementar los estilos mediante CSS personalizado sin dependencias externas de frameworks de UI.

---

### Requirement 7: Notificaciones y señales al finalizar fases

**User Story:** Como usuario, quiero recibir una señal sonora y, si lo permito, una notificación del sistema al finalizar cada fase Pomodoro, para que pueda ser avisado aunque no esté mirando la pantalla.

#### Acceptance Criteria

1. WHEN una WorkPhase o BreakPhase finaliza, THE NotificationService SHALL reproducir una señal de audio apropiada para el tipo de fase terminada.
2. WHEN el usuario inicia su primer Pomodoro, THE NotificationService SHALL solicitar permiso al usuario para enviar notificaciones del sistema.
3. WHEN una WorkPhase finaliza y el usuario ha otorgado permiso de notificaciones, THE NotificationService SHALL enviar una notificación del sistema indicando el fin del período de trabajo.
4. WHEN una BreakPhase finaliza y el usuario ha otorgado permiso de notificaciones, THE NotificationService SHALL enviar una notificación del sistema indicando el fin del período de descanso.
5. IF el usuario deniega el permiso de notificaciones o la API de notificaciones no está disponible, THEN THE App SHALL mostrar un banner visual en pantalla durante 4 segundos como fallback al finalizar cada fase.
6. IF la Web Audio API no está disponible o produce un error, THEN THE NotificationService SHALL omitir silenciosamente la señal de audio sin interrumpir el flujo de la aplicación.
7. WHERE el permiso de notificaciones del sistema ha sido denegado, THE App SHALL continuar operando con normalidad utilizando únicamente el fallback visual.
