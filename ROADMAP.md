# Mochi — Roadmap

**Legend:** ✅ Complete · 🚧 Partial · ❌ Not started · 🔮 Future

---

## Foundation

| Task | Mobile | Web |
|---|---|---|
| Monorepo setup (Turborepo + pnpm) | ✅ | ✅ |
| TypeScript + ESLint + Prettier | ✅ | ✅ |
| Supabase shared client (`@mochi/supabase`) | ✅ | ✅ |
| Auth — login / signup / logout | ✅ | ✅ |
| Auth — OAuth (Google) | ❌ | ✅ |
| Auth — persistent session | ✅ | ✅ |
| Auth callback page | — | ✅ |
| Auto profile creation on signup | ✅ | ✅ |
| Database schema + RLS policies | ✅ | ✅ |
| App shell / navigation skeleton | ✅ | ❌ |

---

## Onboarding

| Task | Mobile | Web |
|---|---|---|
| Welcome screen (name + wake-up time) | ✅ | ❌ |
| Module selection on first launch | ✅ | ❌ |
| Notification permission request | ✅ | — |

---

## Study Module

| Task | Mobile | Web |
|---|---|---|
| Weekly schedule grid | ✅ | ❌ |
| Create study block | ✅ | ❌ |
| Edit study block | ✅ | ❌ |
| Delete study block | ✅ | ❌ |
| AI duration suggestion | ✅ | ❌ |
| 1.5h countdown timer (Pomodoro) | ✅ | ❌ |
| Mark session as complete (+5 pts) | ✅ | ❌ |
| Study session history | ✅ | ❌ |
| Exam result logging (+20 pts) | ✅ | ❌ |
| `exam_ace` achievement unlock | ✅ | ❌ |
| Study block notifications (10min before) | ✅ | — |
| Study analytics / charts | ❌ | ❌ |

---

## Exercise Module

| Task | Mobile | Web |
|---|---|---|
| Custom exercise bank (CRUD) | ✅ | ❌ |
| AI exercise description suggestion | ✅ | ❌ |
| Build weekly routines (assign days) | ✅ | ❌ |
| Routine player (timer + rest) | ✅ | ❌ |
| Mark routine as complete (+10 pts) | ✅ | ❌ |
| Streak update on completion | ✅ | ❌ |
| Exercise achievements | ✅ | ❌ |

---

## Habits Module

| Task | Mobile | Web |
|---|---|---|
| Create / delete habits (name, icon, color) | ✅ | ❌ |
| Daily completion toggle | ✅ | ❌ |
| 7-day dot tracker per habit | ✅ | ❌ |
| "All habits complete" celebration | ✅ | ❌ |
| Habit completion heatmap (calendar) | ❌ | ❌ |
| Habit notifications | ✅ | — |

---

## Goals Module

| Task | Mobile | Web |
|---|---|---|
| Create / edit / delete goals | ✅ | ❌ |
| Manual progress update (0–100%) | ✅ | ❌ |
| Mark as completed (+15 pts) | ✅ | ❌ |
| Color picker + target date | ✅ | ❌ |
| Goal analytics / board view | ❌ | ❌ |

---

## Mood Tracker

| Task | Mobile | Web |
|---|---|---|
| Daily mood check-in (1–5 scale) | ✅ | ❌ |
| Optional text note | ✅ | ❌ |
| Edit today's entry | ✅ | ❌ |
| 7-day color dot history | ✅ | ❌ |
| Mood trend chart | ❌ | ❌ |

---

## Gratitude Journal

| Task | Mobile | Web |
|---|---|---|
| Daily 3-entry gratitude log (+3 pts) | ✅ | ❌ |
| Edit today's entry | ✅ | ❌ |
| Last 5 entries history | ✅ | ❌ |
| Full journal history | ❌ | ❌ |

---

## Cooking Module

| Task | Mobile | Web |
|---|---|---|
| AI recipe generation from free-text prompt | ✅ | ❌ |
| Recipe list / gallery | ✅ | ❌ |
| Recipe detail (ingredients, steps, serving scaler) | ✅ | ❌ |
| Mark as favorite | ✅ | ❌ |
| Personal notes on recipe | ✅ | ❌ |
| Step-by-step cook mode with timers | ✅ | ❌ |
| Resume cook session | ✅ | ❌ |
| Star rating after completion (+15 pts) | ✅ | ❌ |
| Mochi in-cook Q&A | ✅ | ❌ |
| Cooking achievements | ✅ | ❌ |
| Cooking reminder notification | ✅ | — |

---

## Gamification

| Task | Mobile | Web |
|---|---|---|
| Points system (`profiles.total_points`) | ✅ | ❌ |
| `increment_points` RPC | ✅ | ❌ |
| Achievement catalog (seeded) | ✅ | ❌ |
| Achievement unlock (idempotent upsert) | ✅ | ❌ |
| Achievement toast (inline, queued) | ✅ | ❌ |
| Achievements profile page | ✅ | ❌ |
| Daily streak tracking | ✅ | ❌ |
| Streak achievements | ✅ | ❌ |

---

## Voucher System

| Task | Mobile | Web |
|---|---|---|
| Voucher template catalog | ✅ | ❌ |
| Generate voucher (deduct points) | ✅ | ❌ |
| Mark voucher as redeemed | ✅ | ❌ |
| Share voucher as PNG image | ✅ | ❌ |
| Admin: manage templates | ❌ | ❌ |

---

## Settings

| Task | Mobile | Web |
|---|---|---|
| Edit profile (name, wake-up time) | ✅ | ❌ |
| Module toggles (enable/disable) | ✅ | ❌ |
| Sign out with confirmation | ✅ | ✅ |
| Notification preferences | ✅ | — |

---

## AI Integration

| Task | Mobile | Web |
|---|---|---|
| `@mochi/ai` shared package | ❌ | ❌ |
| Gemini 2.0 Flash primary | ✅ | ❌ |
| OpenRouter fallback | ✅ | ❌ |
| Daily motivational message | ✅ | ❌ |
| Exercise description suggestion | ✅ | ❌ |
| Study duration suggestion | ✅ | ❌ |
| Recipe generation | ✅ | ❌ |
| In-cook Q&A | ✅ | ❌ |

---

## Notifications (Mobile Only)

| Task | Mobile |
|---|---|
| Permission request | ✅ |
| Morning reminder (at wake-up time) | ✅ |
| Study block reminders (10min before) | ✅ |
| Daily habit reminder (configurable time) | ✅ |
| Cooking reminder (configurable time) | ✅ |
| Notification deep linking | ✅ |

---

## Planned / Future

| Feature | Priority |
|---|---|
| `@mochi/ai` shared package (Gemini + OpenRouter) | High |
| `@mochi/types` or `packages/supabase/src/types.ts` shared types | High |
| Web dashboard Phase 1 (shell + study module) | High |
| Web analytics (study stats, habit heatmap) | Medium |
| Quick Notes module | Medium |
| Push notifications EAS | Medium |
| EAS Build — Android APK | Medium |
| PDF weekly report export | Low |
| Google Calendar sync | Low |
| iOS support | Low |
| Unlockable visual themes | Low |
| Admin superuser dashboard | Low |
| Public multi-user launch | Low |

---

## Module Status Summary

| Module | Mobile | Web |
|---|---|---|
| Auth | ✅ | ✅ |
| Onboarding | ✅ | ❌ |
| Study | ✅ | ❌ |
| Exercise | ✅ | ❌ |
| Habits | ✅ | ❌ |
| Goals | ✅ | ❌ |
| Mood Tracker | ✅ | ❌ |
| Gratitude Journal | ✅ | ❌ |
| Cooking | ✅ | ❌ |
| Gamification | ✅ | ❌ |
| Vouchers | ✅ | ❌ |
| Settings | ✅ | 🚧 (sign-out only) |
| Profile | ✅ | ❌ |
| Notifications | ✅ | — |
| AI integration | ✅ | ❌ |
| Web Dashboard Shell | — | ❌ |
| Web Analytics | — | ❌ |