# Mochi

Mochi is a personal productivity app designed specifically for women students. It combines study organization, exercise routines, gamification, and AI assistance in a single colorful and adorable app.

---

## Tech Stack

| Layer | Web | Mobile |
|---|---|---|
| Framework | React + Vite | Expo (React Native) |
| Language | TypeScript | TypeScript |
| Styling | Tailwind v4 + shadcn/ui | NativeWind (Tailwind v3) |
| Routing | React Router (planned) | Expo Router |
| Backend | Supabase | Supabase |
| AI Primary | Google Gemini 2.0 Flash | Google Gemini 2.0 Flash |
| AI Fallback | OpenRouter (free models) | OpenRouter (free models) |
| Monorepo | Turborepo + pnpm | — |
| Deploy | Vercel | EAS (planned) |

---

## Project Structure

```
mochi/
├── apps/
│   ├── web/          # React + Vite web app
│   └── mobile/       # Expo React Native app
└── packages/
    ├── supabase/     # Shared Supabase client (@mochi/supabase)
    └── ai/           # Shared AI client (@mochi/ai) — planned
```

---

## Getting Started

### Prerequisites
- Node.js >= 18
- pnpm >= 9
- Expo Go (SDK 55) on your phone

### Setup

```bash
pnpm install

cp apps/web/.env.local.example apps/web/.env.local
cp apps/mobile/.env.local.example apps/mobile/.env.local
```

### Environment Variables

**Web:**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=
VITE_OPENROUTER_API_KEY=
```

**Mobile:**
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GEMINI_API_KEY=
EXPO_PUBLIC_OPENROUTER_API_KEY=
```

### Run

```bash
# Web
cd apps/web && pnpm dev

# Mobile
cd apps/mobile && pnpm start --tunnel
```

---

## Database Schema

### Core
- `profiles` — user profile, wake-up time, total points
- `study_blocks` — study schedule by subject, day and time slot
- `exercises` — custom exercises (sets, reps, duration)
- `routines` — weekly exercise routines
- `routine_exercises` — exercises within a routine
- `routine_logs` — completed routine history

### Gamification
- `achievements` — achievement catalog (study, exercise, streak, special)
- `user_achievements` — achievements unlocked per user
- `streaks` — current and longest streak per user
- `rewards` — redeemable vouchers earned by the user

All tables have Row Level Security enabled.

---

## Modules

Users can enable or disable modules from settings:

| Module | Description |
|---|---|
| Study | Weekly schedule, 1.5h blocks, session timer, exam logging |
| Exercise | Home workouts, custom exercises, routine player |
| Gamification | Points, achievements, streaks, redeemable vouchers |
| Habits | Daily custom habits — planned |
| Goals | Weekly/monthly goals with progress — planned |
| Quick Notes | Lightweight notes per subject — planned |
| Mood Tracker | Daily emotional check-in — planned |
| Gratitude Journal | Daily gratitude log — planned |

> Period tracker is intentionally excluded — use Flo or similar dedicated apps instead.

---

## AI Features

AI is integrated using Google Gemini 2.0 Flash as the primary provider (free tier) with OpenRouter free models as fallback.

Planned AI-powered features:
- Daily motivational message personalized to the user's schedule
- Study block suggestions based on existing schedule gaps
- Auto-generate exercise routines based on available days
- Smart streak analysis ("You haven't studied Biology in 3 days")
- Auto-generate exercise descriptions from a name
- Creative routine name suggestions

---

## Design System

- **Palette:** pastel yellow, pink, purple, mint green, baby blue
- **Style:** colorful, adorable, Pinterest-inspired card layouts
- **Icons:** Ionicons (mobile), Lucide (web) — no emojis anywhere
- **Language:** 100% Spanish UI copy
- **Libraries:** shadcn/ui (web), NativeWind (mobile), Framer Motion (web), React Kawaii (empty states)

---

## License

MIT © SirAmong