# Mochi — Copilot Instructions

## Proyecto

Mochi es una app de productividad personal (estudio + ejercicio + rutina diaria) con una estética colorida y adorable inspirada en Pinterest. Monorepo con web y mobile.

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Web**: React + Vite + TypeScript + Tailwind v4 + shadcn/ui
- **Mobile**: Expo + React Native + TypeScript + NativeWind (Tailwind v3)
- **Backend**: Supabase (Auth + PostgreSQL con RLS)
- **Paquete compartido**: `@mochi/supabase` en `packages/supabase`

## Estructura de carpetas

```
apps/web/src/
  components/    # Componentes React (UI en /ui, features fuera)
  hooks/         # Custom hooks (useSession, etc.)
  lib/           # Utilidades y cliente supabase
  pages/         # Vistas principales (cuando se agregue router)

apps/mobile/
  app/           # Rutas de Expo Router
  components/    # Componentes React Native
  hooks/         # Custom hooks compartidos con web cuando sea posible
  lib/           # Cliente supabase mobile
```

## Convenciones de código

- Siempre TypeScript estricto. Sin `any`.
- Componentes funcionales con hooks, nunca clases.
- Imports con alias `@/` en web (apunta a `src/`) y en mobile (apunta a raíz).
- Paquete compartido importado como `@mochi/supabase`.
- Variables de entorno: `VITE_` en web, `EXPO_PUBLIC_` en mobile.
- Estilos con clases de Tailwind/NativeWind. Sin estilos inline salvo casos muy específicos.
- En mobile, usar `className` con NativeWind en componentes nativos (`View`, `Text`, etc.).

## Base de datos (Supabase)

Todas las tablas tienen RLS. Las queries siempre son del usuario autenticado (`auth.uid()`).

Tablas principales:
- `profiles(id, full_name, wake_up_time)`
- `study_blocks(id, user_id, subject, day_of_week, start_time, end_time, color)`
- `exercises(id, user_id, name, sets, reps, duration_seconds, notes)`
- `routines(id, user_id, name, days)`
- `routine_exercises(id, routine_id, exercise_id, order_index)`
- `routine_logs(id, user_id, routine_id, completed_at)`

## Diseño

- Paleta: amarillo, rosado, morado, verde pastel, azul pastel.
- Estética tipo Pinterest: cards redondeadas, sombras suaves, masonry grid.
- React Kawaii para estados vacíos y logros.
- Animaciones con Framer Motion (web) y React Native Reanimated (mobile).
- NO usar diseño plano ni minimalista extremo. La app debe verse colorida y alegre.
- Jamás usar emojis, preferir iconos de librerias.

## Lo que Copilot debe evitar

- No usar `npm` ni `yarn`. Siempre `pnpm`.
- No crear estilos en archivos `.css` separados salvo `index.css` en web.
- No usar `StyleSheet.create` en mobile salvo casos donde NativeWind no sea suficiente.
- No crear componentes en la raíz de `apps/`. Siempre dentro de `components/`.
- No hardcodear colores fuera del sistema de tokens de Tailwind.