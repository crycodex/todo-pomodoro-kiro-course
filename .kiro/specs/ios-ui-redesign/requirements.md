# iOS UI Redesign - Requirements Specification

## Overview
Rediseño completo de la interfaz de usuario de todo-pom inspirándose en iOS, implementando:
- Bordes redondeados consistentes
- Efectos de liquid glass (vidrio líquido) con blur
- Sistema de dark mode automático/manual
- Smooth animations y transitions
- Accesibilidad completa (WCAG 2.1 AA)

## Design Principles

### iOS Design Language Alignment
- **Superposition**: Elementos flotantes con sombras y profundidad
- **Clarity**: Tipografía legible, jerarquía visual clara
- **Deference**: Movimiento suave que no distrae
- **Depth**: Capas visuales mediante blur y transparencias

### Target Visual Style
- **Corner Radius**: 16px-20px para cards, 10px-12px para botones
- **Shadows**: Suaves, difusas (blur-radius 20-40px)
- **Border Width**: 1px-1.5px con transparencia (rgba blanca al 20%)
- **Tap Target**: Mínimo 44x44px (accesibilidad iOS)

## Functional Requirements

### FR1: iOS-Style Rounded Corners
- Todos los container elements deben tener border-radius consistente
- TaskInput: 14px
- TaskList: 16px
- TaskItem: 12px
- PomodoroOverlay: 20px (modal-style)
- CompletedList panel: 16px

### FR2: Liquid Glass / Frosted Glass Effects
Implementar mediante backdrop-filter CSS:
```css
.glass {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

Áreas de aplicación:
- Header (glassmorphism subtle)
- Pomodoro overlay (full glass)
- Task list container (light glass)
- Timer display area

### FR3: Blur Effects
- **Vibrancy**: Efecto de contenido superpuesto
- **Background blur**: Para elementos sobre colored backgrounds
- **Layer blur**: Para区分 capas (z-index)

### FR4: Dark Mode Support
#### Automatic Detection
```javascript
// Detectar preferencia del sistema
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
// Escuchar cambios
prefersDark.addEventListener('change', e => setTheme(e.matches ? 'dark' : 'light'))
```

#### Manual Toggle
- Toggle en header para override de tema
- Preferencia guardada en localStorage

#### Theme Colors
**Light Theme (iOS System Style)**
```css
:root {
  --color-bg: #F2F2F7;           /* iOS system gray-6 */
  --color-surface: #FFFFFF;
  --color-text: #000000;
  --color-text-secondary: #8E8E93;
  --color-border: rgba(0, 0, 0, 0.08);
  --color-accent: #007AFF;        /* iOS blue */
  --color-success: #34C759;       /* iOS green */
  --color-warning: #FF9500;       /* iOS orange */
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(255, 255, 255, 0.5);
}
```

**Dark Theme (iOS Dark Mode Style)**
```css
:root.dark {
  --color-bg: #000000;
  --color-surface: #1C1C1E;
  --color-text: #FFFFFF;
  --color-text-secondary: #8E8E93;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-accent: #0A84FF;        /* iOS blue dark */
  --color-success: #30D158;       /* iOS green dark */
  --color-warning: #FF9F0A;       /* iOS orange dark */
  --glass-bg: rgba(28, 28, 30, 0.72);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

### FR5: Smooth Animations
#### Animation Principles
- **Duration**: 200ms-400ms para micro-interactions
- **Easing**: 
  - Ease-out para entrada (spring-ish)
  - Ease-in-out para transiciones de estado
  - Linear para timers (si aplica)

#### CSS Transitions Required
```css
/* Base transition */
.transition-fast { transition: all 200ms cubic-bezier(0.25, 0.1, 0.25, 1); }
.transition-medium { transition: all 300ms cubic-bezier(0.25, 0.1, 0.25, 1); }
.transition-slow { transition: all 400ms cubic-bezier(0.25, 0.1, 0.25, 1); }

/* Spring animations */
@keyframes spring {
  0% { transform: scale(0.95); opacity: 0; }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); opacity: 1; }
}
```

### FR6: Accessibility Requirements
#### Keyboard Navigation
- Focus visible states con outline prominente
- Tab order lógico (header → input → task list → completed)
- Skip links si necesario

#### Screen Reader
- ARIA labels para todos los icon buttons
- Live regions para timer updates (rate-limited)
- Role="status" para notificaciones

#### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Color Contrast
- Ratio mínimo 4.5:1 para texto normal
- Ratio mínimo 3:1 para texto grande y UI components

## Component-Level Requirements

### TheHeader
- Glassmorphism effect (subtle)
- Sticky positioning mantiene blur effect
- Brand con iOS-style typography
- Theme toggle button con icon

### TaskInput
- iOS-style text field con rounded corners
- Focus state con inner glow
- Button con iOS blue accent
- Placeholder animado en focus

### TaskList
- Container con glass effect
- Smooth expand/collapse de items
- Hover states en TaskItems

### TaskItem
- Checkbox con iOS-style circle
- Edit mode con smooth transition
- Timer indicator con pulse animation
- Delete con haptic-like visual feedback

### CompletedList
- Collapsible accordion style
- Smooth height transition
- Chevron rotate animation

### PomodoroOverlay
- Full-screen glass effect (mobile)
- Modal-style con backdrop blur
- Big timer typography
- Control buttons iOS-style
- Break mode diferenciation (color)

### BreakTimer
- Separate visual treatment
- Glass container
- Break mode colors

### App Shell
- Layout con safe area handling
- Responsive grid changes
- Smooth transitions entre estados

## Non-Functional Requirements

### Performance
- CSS-only implementations (no JS libraries)
- GPU-accelerated animations via transform/opacity
- Efficient backdrop-filter usage
- No layout thrashing

### Browser Support
- iOS Safari 14+
- Chrome 90+
- Safari 14+
- Edge 90+
- Firefox 88+

### Code Quality
- CSS Custom Properties para theming
- Scoped styles en components
- No nuevos dependencies
- Mantenibilidad y extensibilidad

## Dependencies
- Ninguna nueva (CSS-only approach)
-现有: Vue 3, TypeScript, Vitest

## Success Criteria
1. Todos los 8 componentes implementados con iOS style
2. Dark mode automático y manual funciona
3. Lighthouse Accessibility score ≥ 95
4. Motion reduced support activo
5. Performance métricas estables
