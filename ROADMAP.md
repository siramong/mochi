# Mochi — Roadmap

---

## Phase 0 — Foundation (Done)

- [x] Monorepo setup with Turborepo + pnpm
- [x] Web: React + Vite + TypeScript + Tailwind v4 + shadcn/ui
- [x] Mobile: Expo + React Native + TypeScript + NativeWind
- [x] Shared Supabase package (`@mochi/supabase`)
- [x] Auth flow (login, register, persistent session, logout) — web & mobile
- [x] Database schema with RLS policies and grants
- [x] Auto profile creation on signup
- [x] Gamification schema (achievements, streaks, rewards, points)
- [x] 11 base achievements seeded

---

## Phase 1 — Core Features (Current)

### Onboarding
- [ ] Welcome screen with name and wake-up time input
- [ ] Module selection on first launch

### Study Module
- [ ] Weekly schedule grid view (by day and time)
- [ ] Add / edit / delete study blocks
- [ ] 1.5h session countdown timer
- [ ] Exam result logging (grade input)
- [ ] Daily study streak tracking

### Exercise Module
- [ ] Create custom exercises (sets, reps or duration)
- [ ] Build weekly routines (assign exercises to days)
- [ ] Step-by-step routine player with rest timers
- [ ] Mark routine as completed
- [ ] Exercise streak tracking

---

## Phase 2 — Gamification

### Points & Achievements
- [ ] Award points on routine completion, study block completion and exam logging
- [ ] Auto-unlock achievements based on activity
- [ ] Profile screen with total points and unlocked achievements
- [ ] Daily streak display (Duolingo-style)
- [ ] Secret achievements that surprise the user

### Voucher System (Rewards)
- [ ] Generate redeemable vouchers with accumulated points
- [ ] Shareable voucher (screenshot or link) to send to a partner
- [ ] Predefined editable voucher templates
- [ ] Public users: visual recognition only (achievements, streaks, badges)

---

## Phase 3 — AI Integration

Primary: Google Gemini 2.0 Flash (free tier)
Fallback: OpenRouter free models (Llama 3, Mistral, etc.)

- [ ] Shared `@mochi/ai` package with provider abstraction and automatic fallback
- [ ] Daily personalized motivational message based on schedule
- [ ] Study block suggestions based on schedule gaps
- [ ] Auto-generate exercise routines based on available days
- [ ] Smart streak analysis and nudges
- [ ] Auto-generate exercise descriptions from name
- [ ] Creative routine name suggestions

---

## Phase 4 — Optional Modules

Each module can be toggled on/off from settings.

- [ ] **Habits** — daily custom habits (drink water, read, meditate, etc.)
- [ ] **Goals** — weekly/monthly goals with visual progress
- [ ] **Quick Notes** — lightweight notes per subject
- [ ] **Mood Tracker** — daily emotional check-in (no diagnostics)
- [ ] **Gratitude Journal** — daily gratitude log (3 things)

> Period tracker intentionally excluded — use Flo or similar dedicated apps.

---

## Phase 5 — Polish & Launch

- [ ] Push notifications for study blocks and exercise reminders
- [ ] Full pastel theme applied across all screens
- [ ] React Kawaii empty states and completion celebrations
- [ ] Framer Motion animations on web
- [ ] Vercel deploy for web
- [ ] EAS Build for Android APK
- [ ] User settings screen (name, wake-up time, active modules)
- [ ] Superuser dashboard (Doménica) for managing vouchers and users

---

## Phase 6 — Future

- [ ] Public multi-user launch
- [ ] Google Calendar sync
- [ ] iOS support
- [ ] Unlockable visual themes with points
- [ ] Export weekly report as PDF