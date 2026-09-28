# Diseño de la Interfaz

## Tema y Estilo Visual

El proyecto soporta dos temas: **light** y **dark**, que se detectan automáticamente según las preferencias del sistema (`prefers-color-scheme`).

### Variables CSS
```css
:root {
  --color-bg: #ffffff;
  --color-text: #333333;
  --color-accent: #42b883; /* Verde Vue */
  --color-border: #eaeaea;
}

[data-theme='dark'] {
  --color-bg: #1a1a1a;
  --color-text: #e0e0e0;
  --color-accent: #42b883;
  --color-border: #333333;
}
```

## Componentes de la UI

### 1. TheHeader
Cabecera del aplicativo que muestra:
- El título del proyecto
- Un banner de estado (notificaciones del sistema)
- Advertencia sobre el almacenamiento local si hay problemas de cuota

**Props**:
- `storageWarning`: boolean para mostrar advertencia de localStorage

### 2. TaskInput
Componente de entrada de texto para agregar nuevas tareas.
- Input con validación de longitud máxima (255 caracteres)
- Evento `@add` que emite el título de la nueva tarea
- Placeholder: "¿Qué necesitas hacer?"

### 3. TaskList
Lista de tareas pendientes.
- Muestra tareas ordenadas por fecha de creación (más recientes primero)
- Usa `TaskItem` para cada tarea
- Interactúa con el store para editar, eliminar y completar tareas

### 4. TaskItem
Componente individual de tarea que muestra:
- Título editable
- Indicador de estado (completado o no)
- Contador de Pomodoros completados
- Botones de acción:
  - ✓ Concluir tarea
  - ✎ Editar título
  - ✕ Eliminar tarea

**Interacciones**:
- Doble click en el título → Edición
- Click en check → Toggle completado
- Si hay un Pomodoro activo en esta tarea, mostrar botón de pausa/continuar

### 5. CompletedList
Lista de tareas completadas.
- Muestra tareas con estilo visual diferente
- Permite ver el historial de tareas concluidas

### 6. PomodoroOverlay
Overlay que se muestra cuando hay un Pomodoro activo.
- Muestra:
  - Título de la tarea activa
  - Tiempo restante en formato MM:SS
  - Fase actual (trabajo o descanso)
  - Contador de Pomodoros de la tarea
- Controles:
  - ⏸ Pausar
  - ▶️ Reanudar
  - ⏹ Cancelar

**Posicionamiento**: Overlay flotante con position: fixed

## Layout y Estructura

```
┌────────────────────────────────────────────────────────────┐
│                    TheHeader                               │
│  [Logo/Título]  [Banner de estado]  [Storage Warning]     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │  TaskInput      │  │                                 │ │
│  │                 │  │  TaskList (activas)             │ │
│  │  [Input texto]  │  │  ┌─────────────────────────┐    │ │
│  │                 │  │  │ TaskItem (editar, borrar)│    │ │
│  └─────────────────┘  │  └─────────────────────────┘    │ │
│                       │  ...                            │ │
│                       │                                 │ │
│                       │  CompletedList                  │ │
│                       │  ┌─────────────────────────┐    │ │
│                       │  │ TaskItem (completada)   │    │ │
│                       │  └─────────────────────────┘    │ │
│                       └─────────────────────────────────┘ │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │            PomodoroOverlay (overlay)               │   │
│  │  [Tarea]  [Tiempo: 24:59] [Fase: trabajo] [X]     │   │
│  └────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

## Animaciones y Transiciones

El proyecto utiliza las transition hooks de Vue para animaciones suaves:
- `fade`: Transición de opacidad para overlays y banners
- `slide`: Animación de entrada para listas

## Accesibilidad

El proyecto cumple con ciertos estándares de accesibilidad:
- Semántica HTML (main, header, article, aside)
- Atributos `role` en banners de estado
- Colores con contraste suficiente
- Soporte para teclado (tabindex, enter para acciones)