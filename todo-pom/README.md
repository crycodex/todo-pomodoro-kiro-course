# todo-pom

Aplicación de gestión de tareas con técnica Pomodoro construida con Vue 3, TypeScript y Vite.

## Estructura del proyecto

- `/` - Landing page del producto
- `/app/` - Aplicación Vue principal

## Stack tecnológico

- **Framework**: Vue 3 con Composition API
- **State Management**: Pinia
- **Build Tool**: Vite
- **Testing**: Vitest + @vue/test-utils + fast-check

## Script del proyecto

Ejecute los siguientes comandos en el directorio `todo-pom/`:

### Desarrollo

```bash
npm run dev
```

La landing page estará disponible en `http://localhost:5173/` y la app en `http://localhost:5173/app/`.

### Build

```bash
npm run build
```

### Preview del build

```bash
npm run preview
```

### Testing

```bash
npm run test
```

## Estructura del código

| Capa | Ubicación | Propósito |
|------|-----------|-----------|
| **Presentational** | `src/components/` | Componentes de UI que reciben props y emiten eventos |
| **State** | `src/stores/` | Stores de Pinia que mantienen el estado reactivo |
| **Effects** | `src/composables/` | Efectos secundarios (timers, notificaciones) |
| **Utilities** | `src/utils/` | Funciones puras, persistencia, cliente Supabase |
| **Types** | `src/types/` | Interfaces de TypeScript y mapeos |

## Configuración del build

El build produce dos entradas:

1. **Landing page** (`/`): Archivo HTML estático con estilos embebidos
2. **App Vue** (`/app/`): Archivos JS/CSS con hash para cache

```bash
dist/
├── index.html              # Landing page
├── favicon.svg
├── icons.svg
├── app/
│   ├── index.html         # App Vue (con script inyectado)
│   └── assets/
│       ├── app-*.js       # Bundle JS con hash
│       └── app-*.css      # Styles con hash
└── assets/
    └── [other assets]     # Assets de la landing (si hay)
```

## Supabase Integration (Opcional)

Para usar Supabase, configure las siguientes variables de entorno:

```env
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

See `src/types/database.ts` for the Supabase schema.
