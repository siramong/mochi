# 🍡 Mochi

Aplicación personal para ayudar a estudiar, armar rutinas de ejercicio y organizar el día. Diseñada con una estética colorida y adorable inspirada en Pinterest.

## Stack

| Capa | Tecnología |
|------|-----------|
| Monorepo | Turborepo + pnpm |
| Web | React + Vite + TypeScript |
| Mobile | Expo + React Native + TypeScript |
| Estilos Web | Tailwind v4 + shadcn/ui |
| Estilos Mobile | NativeWind (Tailwind v3) |
| Backend | Supabase (Auth + PostgreSQL) |
| Animaciones | Framer Motion / React Native Reanimated |
| Deploy | Vercel (web) |

## Estructura

```
mochi/
├── apps/
│   ├── web/          # React + Vite (dashboard web)
│   └── mobile/       # Expo + React Native
└── packages/
    ├── supabase/     # Cliente compartido de Supabase
    ├── ui/           # Componentes base compartidos
    ├── eslint-config/
    └── typescript-config/
```

## Inicio rápido

### Requisitos

- Node.js >= 18
- pnpm >= 9
- Cuenta en Supabase

### Setup

```bash
# Instalar dependencias
pnpm install

# Variables de entorno
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
# Rellenar con tus keys de Supabase
```

### Desarrollo

```bash
# Web
cd apps/web && pnpm dev

# Mobile
cd apps/mobile && pnpm start --tunnel
```

## Variables de entorno

**Web** (`apps/web/.env.local`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Mobile** (`apps/mobile/.env.local`):
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

## Base de datos

El schema de Supabase incluye:

- `profiles` — datos del usuario y hora de despertar
- `study_blocks` — bloques de estudio por día y hora
- `exercises` — ejercicios personalizados
- `routines` — rutinas con días asignados
- `routine_exercises` — relación rutina ↔ ejercicio
- `routine_logs` — historial de rutinas completadas

Todas las tablas tienen RLS activado. Cada usuario solo accede a sus propios datos.

## Licencia

MIT © SirAmong