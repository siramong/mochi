# Mochi — Architecture

## Overview

Mochi is a personal productivity app for women students. It is built as a **Turborepo monorepo** with a shared Supabase backend, an Expo mobile app (production-ready), and a React web app (in progress).

---

## Monorepo Structure

```
mochi/
├── apps/
│   ├── mobile/                 # Expo 55 + React Native + NativeWind v4
│   └── web/                    # React 19 + Vite 8 + Tailwind v4 + shadcn/ui
├── packages/
│   ├── supabase/               # Shared Supabase client (@mochi/supabase)
│   │   └── src/client.ts       # createSupabaseClient() factory
│   ├── ai/                     # Planned: shared AI client (@mochi/ai)
│   ├── ui/                     # Shared UI primitives (minimal, mostly unused)
│   ├── eslint-config/          # Shared ESLint configs
│   └── typescript-config/      # Shared tsconfig bases
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### Key Conventions

| Rule | Detail |
|---|---|
| Package manager | `pnpm` only (workspace protocol `workspace:*`) |
| Language | TypeScript everywhere — no `.js` in `apps/` |
| UI copy | 100% Spanish — all labels, placeholders, error messages |
| Icons | Ionicons (mobile) / Lucide (web) — no emojis |
| Async style | `async/await` only — never `.then()` |
| Styling mobile | NativeWind v4 (Tailwind v3 syntax) — never `StyleSheet.create` |
| Styling web | Tailwind v4 with CSS variables — no `tailwind.config.js` |
| Supabase client | Always from `@mochi/supabase/client` — never direct import |

---

## Mobile App (`apps/mobile`)

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 55 + React Native 0.83 |
| Navigation | Expo Router v3 (file-based) |
| Styling | NativeWind v4 (`className` prop, Tailwind v3 syntax) |
| Animations | `react-native-reanimated` v4 |
| AI | OpenAI SDK → OpenRouter (`nvidia/nemotron-3-super-120b-a12b:free`) |
| Notifications | `expo-notifications` with AsyncStorage preference persistence |
| Auth storage | `@react-native-async-storage/async-storage` |
| Screenshots | `react-native-view-shot` + `expo-sharing` (for voucher sharing) |

### Folder Structure

```
apps/mobile/
├── app/                        # Expo Router screens (file = route)
│   ├── _layout.tsx             # Root layout — auth guard, session init, system bars
│   ├── index.tsx               # Home (tab switcher: home/study/exercise/habits/cooking)
│   ├── login.tsx
│   ├── onboarding.tsx          # 2-step: profile + module selection
│   ├── study-create.tsx
│   ├── study-edit.tsx
│   ├── study-timer.tsx         # Pomodoro-style countdown timer
│   ├── study-history.tsx
│   ├── exam-log.tsx
│   ├── exercise-create.tsx
│   ├── exercise-list.tsx
│   ├── routine-create.tsx
│   ├── routine-player.tsx      # Step-by-step exercise player with rest timers
│   ├── habits.tsx
│   ├── goals.tsx
│   ├── mood.tsx
│   ├── gratitude.tsx
│   ├── cooking.tsx             # Recipe list + AI generation
│   ├── recipe-detail.tsx       # Recipe view with serving scaler
│   ├── recipe-player.tsx       # Step-by-step cook mode with timers + Mochi Q&A
│   ├── vouchers.tsx
│   ├── profile.tsx             # Points, streak, achievements grid
│   └── settings.tsx            # Profile, modules, notifications, sign-out
├── components/
│   ├── AchievementToast.tsx    # Slide-in toast for unlocked achievements
│   ├── BottomNav.tsx           # 5-tab bottom navigation (home/study/exercise/habits/cooking)
│   ├── CustomAlert.tsx         # Reusable modal alert (replaces Alert.alert)
│   ├── DailyMotivation.tsx     # AI-powered greeting card
│   ├── ExerciseRoutine.tsx     # Routine list with animated cards
│   ├── GoalCard.tsx            # Progress bar card for goals
│   ├── HabitCard.tsx           # Habit row with 7-day dot tracker
│   ├── HomeDashboard.tsx       # Main dashboard with today's blocks/routines/cooking
│   ├── MochiCharacter.tsx      # Floating animated app mascot (mood variants)
│   ├── StudySchedule.tsx       # Weekly study grid with day selector
│   └── TimePickerModal.tsx     # Scrollable HH:MM picker modal
├── context/
│   ├── AchievementContext.tsx  # Global achievement toast queue
│   ├── SessionContext.tsx      # Auth session + onboarding status
│   └── SystemBarsContext.tsx   # Status/nav bar style control
├── hooks/
│   └── useScreenTheme.ts       # Sync system bar style per screen
├── lib/
│   ├── ai.ts                   # All AI calls: motivation, exercise desc, recipe gen, cooking Q&A
│   ├── gamification.ts         # addPoints, unlockAchievement, checkX achievements, updateStreak
│   ├── notifications.ts        # Schedule/cancel expo-notifications, persist prefs in AsyncStorage
│   ├── supabase.ts             # Supabase client init + AppState auto-refresh
│   └── timeContext.ts          # Time-of-day helpers for greetings/colors
└── types/
    └── database.ts             # All TypeScript interfaces matching DB tables
```

### Navigation Architecture

The app uses a **tab + stack hybrid**:

- `apps/mobile/app/index.tsx` acts as a tab shell, rendering one of `{HomeDashboard, StudySchedule, ExerciseRoutine, HabitsScreen, CookingScreen}` based on `currentScreen` state.
- All other routes (`/goals`, `/vouchers`, `/mood`, `/gratitude`, `/settings`, `/profile`, `/recipe-detail`, `/recipe-player`, etc.) are **full-screen stack routes** navigated with `router.push()`.
- The root `_layout.tsx` handles auth redirect: unauthenticated → `/login`, no profile name → `/onboarding`, else → `/`.

### Auth Flow

```
App launch
  └─ SessionContext.initializeSession()
       ├─ supabase.auth.getSession()
       └─ fetchOnboardingStatus(userId)  ← checks profiles.full_name
            ├─ full_name empty  → requiresOnboarding = true
            └─ full_name set    → requiresOnboarding = false

_layout.tsx effect:
  ├─ !session          → router.replace('/login')
  ├─ requiresOnboarding → router.replace('/onboarding')
  └─ else              → router.replace('/')

AppState listener: active → startAutoRefresh(), background → stopAutoRefresh()
```

---

## Gamification System

### Points

Points are stored in `profiles.total_points`. The `addPoints()` function calls a Supabase RPC `increment_points(user_id, points)` to atomically increment.

### Achievements

Achievements are seeded globally in the `achievements` table (11+ entries). Unlocks are tracked per-user in `user_achievements`. The `unlockAchievement()` function uses `upsert` with `ignoreDuplicates: true` to be idempotent — if inserted, returns the achievement data; if already existed, returns `null`.

Achievement keys and their triggers:

| Key | Trigger |
|---|---|
| `first_study` | 1 study session completed |
| `study_10` | 10 study sessions |
| `exam_ace` | Exam grade ≥ 70% |
| `first_routine` | 1 exercise routine completed |
| `routine_7` | 7 routines in 7 days |
| `streak_3` / `streak_7` / `streak_30` / `streak_365` | Streak milestones |
| `first_recipe` | First AI recipe generated |
| `recipes_5` / `recipes_10` | Recipe count milestones |
| `first_cook` | First recipe cook session finished |
| `cook_streak_3` | 3 distinct recipes cooked |
| `perfect_recipe` | Cook session rated 5 stars |
| `favorite_recipe` | First recipe marked as favorite |

### Toast System

`AchievementContext` holds a `current` toast and a `queue[]`. When `showAchievement()` is called:
- If nothing is showing → display immediately
- If something is showing → push to queue

`AchievementToast` animates in from the top (slide + fade), stays for 2.8s, then slides out. On hide, the next item in queue is dequeued after a 200ms gap.

### Streaks

`updateStreak(userId)` runs after every study session or routine completion:
- If no streak row → create with `current_streak: 1`
- If `last_activity_date === today` → no-op (already counted)
- If `last_activity_date === yesterday` → increment
- Else → reset to 1

---

## AI Integration (`apps/mobile/lib/ai.ts`)

All AI calls use **OpenRouter** via `callAI(prompt)` (OpenAI SDK to `https://openrouter.ai/api/v1`).

| Function | Purpose | Caching |
|---|---|---|
| `getDailyMotivation()` | Personalized daily greeting | AsyncStorage, keyed by date+timeOfDay |
| `suggestExerciseDescription()` | Exercise name → description + duration | AsyncStorage, keyed by exercise name |
| `suggestStudyDuration()` | Subject → suggested block duration in minutes | None |
| `generateRecipe()` | Free-text prompt → full structured recipe JSON | None |
| `suggestRecipeNames()` | Ingredients → 3 creative recipe names | None |
| `askMochiWhileCooking()` | Contextual Q&A during cook sessions | None |

AI responses are always requested in Spanish.

---

## Web App (`apps/web`)

### Current State (Minimal — Auth Only)

```
apps/web/src/
├── App.tsx              # Auth gate: loading → AuthComponent → hello + sign out
├── main.tsx             # BrowserRouter with /auth/callback route
├── components/
│   ├── Auth.tsx         # @supabase/auth-ui-react with Google OAuth
│   └── ui/button.tsx    # shadcn/ui Button
├── hooks/
│   └── useSession.ts    # Session listener hook
├── lib/
│   ├── supabase.ts      # Client from @mochi/supabase
│   └── utils.ts         # cn() helper
├── pages/
│   └── AuthCallback.tsx # OAuth redirect handler
└── index.css            # Tailwind v4 + shadcn CSS variables + Geist font
```

The web app currently handles auth only. The full dashboard is planned (see `WEB_PLAN.md`).

---

## Environment Variables

### Mobile (`apps/mobile/.env.local`)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_OPENROUTER_API_KEY=
```

### Web (`apps/web/.env.local`)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_OPENROUTER_API_KEY=
```

---

## Design System

| Token | Value |
|---|---|
| Primary palette | Pastel yellow, pink, purple, mint green, baby blue |
| Style | Colorful, adorable, Pinterest-inspired card layouts |
| Border radius | `rounded-2xl` / `rounded-3xl` as default |
| Shadows | Minimal, used sparingly (`shadow-sm`) |
| Fonts | Geist Variable (web), System font (mobile) |
| Icons | Ionicons (mobile), Lucide (web) |
| Tone | Warm, encouraging, positive — audience is women students |