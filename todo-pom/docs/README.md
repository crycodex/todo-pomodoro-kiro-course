# Documentación del Proyecto Todo-Pomodoro

Este proyecto es una aplicación de gestión de tareas con temporizador Pomodoro, construida con Vue 3, TypeScript y Supabase.

## Estructura de la Documentación

- **[Arquitectura](./arquitectura.md)**: Descripción de la arquitectura del sistema, patrones de diseño y organización del código.
- **[Diseño](./diseno.md)**: Documentación del diseño de la interfaz de usuario, componentes y estilo visual.
- **[Pruebas](./pruebas.md)**: Enfoque de testing, tipos de pruebas implementadas y cobertura.
- **[BDD y Especificaciones](./bdd.md)**: Comportamiento del sistema desde la perspectiva del usuario y especificaciones de negocio.

## Stack Tecnológico

- **Frontend**: Vue 3 + TypeScript + Vite
- **State Management**: Pinia
- **Base de Datos**: Supabase (PostgreSQL)
- **Testing**: Vitest + Vue Test Utils + fast-check
- **Estilos**: CSS con variables de tema (dark/light mode)

## Requisitos para Correr el Proyecto

- Node.js 18+
- pnpm, npm o yarn
- Cuenta de Supabase (opcional para sincronización en la nube)

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview

# Testing
npm run test          # Ejecutar pruebas una vez
npm run test:watch    # Modo watch

# Linting (si está configurado)
npm run lint
```

## Estructura del Proyecto

```
todo-pom/
├── src/
│   ├── components/      # Componentes Vue
│   ├── composables/     # Lógica reutilizable (composables)
│   ├── stores/          # Stores de Pinia
│   ├── types/           # Definiciones de tipos TypeScript
│   ├── utils/           # Utilidades y helpers
│   ├── assets/          # Recursos estáticos
│   └── main.ts          # Punto de entrada
├── supabase/            # Configuración de Supabase
├── tests/               # Pruebas unitarias y de propiedades
└── docs/                # Esta documentación
```