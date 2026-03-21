# Mochi

Mochi is a personal productivity app designed specifically for women students. It combines study scheduling, exercise routines, gamification, AI assistance, cooking, habits, goals, mood tracking, and gratitude journaling in a single colorful and adorable app.

---

## Tech Stack

| Layer | Mobile | Web |
|---|---|---|
| Framework | Expo 55 + React Native 0.83 | React 19 + Vite 8 |
| Language | TypeScript | TypeScript |
| Styling | NativeWind v4 (Tailwind v3 syntax) | Tailwind v4 + shadcn/ui |
| Routing | Expo Router v3 | React Router v7 |
| Animations | react-native-reanimated v4 | Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + RLS) | Supabase (same instance) |
| AI Primary | Google Gemini 2.0 Flash | Google Gemini 2.0 Flash |
| AI Fallback | OpenRouter (nvidia/nemotron free) | OpenRouter |
| Notifications | expo-notifications | — |
| Monorepo | Turborepo + pnpm | |
| Deploy | EAS (Android APK planned) | Vercel |

---

## Project Structure

```
mochi/
├── apps/
│   ├── mobile/          # Expo React Native app (production-ready)
│   └── web/             # React + Vite web app (auth only, dashboard in progress)
└── packages/
    ├── supabase/         # Shared Supabase client (@mochi/supabase)
    └── ai/               # Shared AI client (@mochi/ai) — planned
```

For a detailed breakdown of the architecture, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 9
- Expo Go (SDK 55) on your phone, or an Android emulator

### Setup

```bash
pnpm install

cp apps/web/.env.local.example apps/web/.env.local
cp apps/mobile/.env.local.example apps/mobile/.env.local
# Fill in Supabase + AI keys in both files
```

### Environment Variables

**Mobile (`apps/mobile/.env.local`):**
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_OPENROUTER_API_KEY=
```

**Web (`apps/web/.env.local`):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_OPENROUTER_API_KEY=
```

### Run

```bash
# Mobile
cd apps/mobile && pnpm start --tunnel

# Web
cd apps/web && pnpm dev
```

---

## Documentation

| File | Description |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Stack, folder structure, auth flow, gamification system |
| [`DATABASE.md`](./DATABASE.md) | Full database schema — all tables, columns, types, relationships |
| [`WEB_PLAN.md`](./WEB_PLAN.md) | Web dashboard architecture plan, routing, tech choices, build order |
| [`ROADMAP.md`](./ROADMAP.md) | Feature status (✅/🚧/❌) for both mobile and web |

---

## Completed Modules (Mobile)

| Module | Description |
|---|---|
| **Auth** | Login, signup, logout, persistent session, onboarding |
| **Study** | Weekly schedule grid, countdown timer, session history, exam logging |
| **Exercise** | Custom exercise bank, routine builder, step-by-step routine player |
| **Habits** | Daily habit tracking, 7-day dot view, all-done celebration |
| **Goals** | Manual progress tracking, target date, color coding |
| **Mood** | Daily emotional check-in (1–5), 7-day color history |
| **Gratitude** | 3-entry daily journal with history |
| **Cooking** | AI recipe generation, step-by-step cook mode with timers, Mochi Q&A |
| **Gamification** | Points, streaks, 15+ achievements, inline toast notifications |
| **Vouchers** | Points → rewards, shareable PNG vouchers |
| **Settings** | Profile editing, module toggles, notification preferences, sign-out |

---

## Design System

- **Palette:** Pastel yellow, pink, purple, mint green, baby blue
- **Style:** Colorful, adorable, Pinterest-inspired card layouts
- **Icons:** Ionicons (mobile), Lucide (web) — no emojis
- **Language:** 100% Spanish UI copy
- **Tone:** Warm, encouraging, positive — designed for women students
- **Typography:** Geist Variable (web), system font (mobile)

---

## License

MIT © SirAmong