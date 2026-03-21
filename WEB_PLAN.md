# Mochi Web Dashboard — Plan

## Goals

Build a companion web dashboard for Mochi that:
- Uses the **same Supabase backend** as the mobile app
- Allows access from desktop (study schedule management, analytics, settings)
- Prioritizes the modules with the most data-heavy or planning-heavy workflows
- Matches the existing pastel design system

---

## Recommended Tech Stack

The existing `apps/web` already has the right foundation. Build on it:

| Layer | Technology | Rationale |
|---|---|---|
| Framework | **React 19 + Vite 8** (already set up) | No need for SSR for an authenticated dashboard |
| Routing | **React Router v7** (already installed) | Nested layouts, protected routes |
| Styling | **Tailwind v4 + shadcn/ui** (already set up) | Matches existing setup, CSS variables for theming |
| Animations | **Framer Motion** (already installed) | Page transitions, chart reveals |
| Data fetching | **TanStack Query v5** | Caching, background refetch, optimistic updates |
| Charts | **Recharts** | Lightweight, composable, works with Tailwind |
| Tables | **TanStack Table v8** | For study history, exam logs |
| Empty states | **React Kawaii** (already installed) | Matches mobile feel |
| Forms | **React Hook Form + Zod** | Type-safe forms for study block creation, settings |
| AI | `@google/generative-ai` via `@mochi/ai` (when built) | Same providers as mobile |
| Deploy | **Vercel** | Already configured in `.gitignore` |

### What NOT to use

- No Next.js — not needed for an authenticated SPA, adds complexity
- No SSR — all data is user-specific and requires auth
- No Redux — TanStack Query replaces server state; local state stays in components/context

---

## Routing Structure

```
/                       → redirect to /dashboard if authenticated
/login                  → Auth UI (already exists, move to /login)
/auth/callback          → OAuth callback (already exists)
/dashboard              → Home — today's summary widget grid
/study
  /study                → Weekly schedule grid (7-day view)
  /study/new            → Create study block form
  /study/:blockId/edit  → Edit study block form
  /study/history        → Session history table with filters
  /study/exams          → Exam log list + add exam form
/exercise
  /exercise             → Routines list
  /exercise/new         → Create routine wizard
  /exercise/exercises   → Exercise bank management
/habits                 → Habit tracker with weekly calendar view
/goals                  → Goals board (kanban-style cards)
/cooking
  /cooking              → Recipe gallery grid
  /cooking/:recipeId    → Recipe detail (read-only on web — no cook mode needed)
/mood                   → Mood calendar heatmap + 7-day chart
/gratitude              → Gratitude journal entries list
/vouchers               → Voucher catalog + redemption
/profile                → Points, streak, achievements, settings
/settings               → Profile, module toggles, account
```

---

## Priority Build Order

### Phase 1 — Foundation (Week 1)

1. **Protected route wrapper** — redirect unauthenticated users to `/login`
2. **App shell** — sidebar navigation + top bar with user info + points
3. **Dashboard** — today at a glance: study blocks, routines, habit progress, points

### Phase 2 — Study Module (Week 2)

1. **Weekly schedule grid** — 7-column layout by day, time slots, color-coded blocks
2. **Create/Edit study block** — form with day picker, time pickers, color selector, AI duration suggestion
3. **Session history table** — sortable/filterable, grouped by week
4. **Exam log** — add exam form + history with grade badges

This is the highest-value web module because it's easier to manage a full weekly schedule on a large screen.

### Phase 3 — Analytics (Week 3)

1. **Study stats page** — total hours this week/month, sessions per subject (bar chart), streak history (line chart)
2. **Habit completion heatmap** — GitHub-style contribution grid per habit
3. **Goal progress dashboard** — all goals with progress bars, filter by status

### Phase 4 — Other Modules (Week 4+)

- Exercise: routine management (easier on web than mobile)
- Cooking: recipe gallery, recipe detail view
- Mood: mood calendar and trend chart
- Vouchers: redemption catalog
- Profile: achievements gallery, settings

---

## Layout Architecture

### App Shell

```tsx
// Persistent shell for authenticated routes
<AppShell>
  <Sidebar />          // Left nav: module links, points display
  <main>
    <TopBar />         // User avatar, quick actions, notifications
    <Outlet />         // Page content
  </main>
</AppShell>
```

### Sidebar Module Links

Only show modules that are enabled in `user_settings`. Fetch settings on app load and store in a `SettingsContext`.

### Responsive Strategy

- **Desktop (≥1024px):** Sidebar always visible
- **Tablet (768–1023px):** Collapsible sidebar (icon-only mode)  
- **Mobile (<768px):** Bottom nav bar (same 5 tabs as mobile app) — redirect users to the app for full mobile experience

---

## Data Layer with TanStack Query

### Setup Pattern

```tsx
// hooks/useStudyBlocks.ts
export function useStudyBlocks(dayOfWeek?: number) {
  const { session } = useSession()
  return useQuery({
    queryKey: ['study-blocks', session?.user.id, dayOfWeek],
    queryFn: async () => {
      let query = supabase
        .from('study_blocks')
        .select('*')
        .eq('user_id', session!.user.id)
        .order('start_time', { ascending: true })
      if (dayOfWeek !== undefined) query = query.eq('day_of_week', dayOfWeek)
      const { data, error } = await query
      if (error) throw error
      return data
    },
    enabled: !!session,
  })
}

export function useCreateStudyBlock() {
  const queryClient = useQueryClient()
  const { session } = useSession()
  return useMutation({
    mutationFn: async (block: NewStudyBlock) => {
      const { error } = await supabase.from('study_blocks').insert({ ...block, user_id: session!.user.id })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study-blocks'] }),
  })
}
```

---

## Code Reuse from Mobile

The following logic can be extracted into `packages/` and shared between mobile and web:

| Module | What to extract |
|---|---|
| `lib/gamification.ts` | `addPoints`, `unlockAchievement`, `checkX` functions → `@mochi/gamification` |
| `lib/ai.ts` | All AI functions → `@mochi/ai` package (already planned) |
| `types/database.ts` | All TypeScript interfaces → `@mochi/types` or `packages/supabase/src/types.ts` |
| Design tokens | Pastel color palette → shared Tailwind preset in `packages/ui` |

The UI components themselves cannot be shared (NativeWind ≠ Tailwind CSS), but the logic hooks and data fetching patterns should be identical.

---

## Web-Only Features (No Mobile Equivalent)

1. **Weekly schedule drag-and-drop** — rearrange study blocks visually
2. **Bulk exam import** — CSV upload for multiple exam grades
3. **Study analytics export** — PDF weekly report (Phase 6 in roadmap)
4. **Admin view for Doménica** — manage voucher templates and view all users (superuser only)
5. **Calendar sync** — Google Calendar integration (Phase 6)

---

## Web-Specific Design Decisions

### Colors

Use the same pastel palette as mobile but mapped to Tailwind CSS custom properties instead of NativeWind inline classes:

```css
/* src/index.css additions */
:root {
  --color-mochi-yellow: oklch(0.97 0.08 90);
  --color-mochi-pink: oklch(0.95 0.06 350);
  --color-mochi-purple: oklch(0.85 0.10 290);
  --color-mochi-mint: oklch(0.94 0.08 165);
  --color-mochi-blue: oklch(0.92 0.06 220);
}
```

### Empty States

Use **React Kawaii** characters (Koala, Planet, SpeechBubble, etc.) matching the `MochiCharacter` spirit from mobile.

### Feedback States

All CRUD actions show:
- Optimistic UI update (TanStack Query mutation)
- Toast notification on success/error (use shadcn `sonner` or a custom pastel toast)
- Never block the UI with full-screen loaders

---

## Key Files to Create First

```
apps/web/src/
├── routes/
│   ├── _layout.tsx           # AppShell with Sidebar + TopBar
│   ├── _protected.tsx        # Auth guard wrapper
│   ├── dashboard/
│   │   └── index.tsx
│   └── study/
│       ├── index.tsx         # Weekly grid
│       ├── new.tsx
│       └── history.tsx
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   ├── study/
│   │   ├── WeeklyGrid.tsx
│   │   ├── StudyBlockCard.tsx
│   │   └── StudyBlockForm.tsx
│   └── common/
│       ├── PastelBadge.tsx
│       ├── PointsDisplay.tsx
│       └── EmptyState.tsx
├── hooks/
│   ├── useSession.ts         # Already exists
│   ├── useStudyBlocks.ts
│   ├── useProfile.ts
│   └── useUserSettings.ts
└── contexts/
    ├── SessionContext.tsx
    └── SettingsContext.tsx   # Loaded once, provides module toggles
```