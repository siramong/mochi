# Mochi — Database Schema

All tables live in the Supabase PostgreSQL instance. Every table has **Row Level Security (RLS) enabled** with user-scoped policies and explicit `GRANT` to the `authenticated` role.

---

## Core Tables

### `profiles`

Auto-created on signup via Supabase trigger.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, references `auth.users.id` |
| `full_name` | `text` | Nullable — empty = needs onboarding |
| `wake_up_time` | `time` | Default `'05:20'` |
| `total_points` | `integer` | Default `0`. Incremented via RPC `increment_points()` |

**RLS:** Users can only read/update their own row.

---

### `user_settings`

Module toggle flags per user. Created during onboarding.

| Column | Type | Default |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id`, UNIQUE |
| `study_enabled` | `boolean` | `true` |
| `exercise_enabled` | `boolean` | `true` |
| `habits_enabled` | `boolean` | `true` |
| `cooking_enabled` | `boolean` | `true` |
| `goals_enabled` | `boolean` | `true` |
| `mood_enabled` | `boolean` | `true` |
| `gratitude_enabled` | `boolean` | `true` |
| `vouchers_enabled` | `boolean` | `true` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Upsert:** `ON CONFLICT (user_id)` — safe to upsert on every settings save.

---

## Study Module

### `study_blocks`

Weekly recurring schedule slots.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `subject` | `text` | E.g. "Cálculo", "Inglés" |
| `day_of_week` | `integer` | 0=Sunday … 6=Saturday (JS `Date.getDay()` convention) |
| `start_time` | `time` | Format `HH:MM` |
| `end_time` | `time` | Format `HH:MM` |
| `color` | `text` | One of: `pink`, `blue`, `yellow`, `teal`, `purple`, `green` |
| `created_at` | `timestamptz` | |

**Note:** When a block is deleted, `study_sessions.study_block_id` is set to `NULL` to preserve history (detach before delete pattern).

---

### `study_sessions`

One row per completed study timer session.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `study_block_id` | `uuid` | FK → `study_blocks.id`, nullable (nulled on block delete) |
| `subject` | `text` | Denormalized from block at time of completion |
| `duration_seconds` | `integer` | Full block duration |
| `completed_at` | `timestamptz` | |

**Points awarded:** +5 per completed session.

---

### `exam_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `subject` | `text` | |
| `grade` | `numeric` | |
| `max_grade` | `numeric` | Default `10` |
| `notes` | `text` | Nullable |
| `exam_date` | `date` | |
| `created_at` | `timestamptz` | |

**Points awarded:** +20 if `grade / max_grade >= 0.7`. Also unlocks `exam_ace` achievement.

---

## Exercise Module

### `exercises`

User's personal exercise library.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `name` | `text` | |
| `sets` | `integer` | |
| `reps` | `integer` | |
| `duration_seconds` | `integer` | Used as timer duration in routine player |
| `notes` | `text` | Nullable — AI-suggested description stored here |
| `created_at` | `timestamptz` | |

---

### `routines`

A named workout with assigned days.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `name` | `text` | |
| `days` | `integer[]` | Array of weekday numbers (same convention as `study_blocks`) |
| `created_at` | `timestamptz` | |

---

### `routine_exercises`

Junction table with ordering.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `routine_id` | `uuid` | FK → `routines.id` |
| `exercise_id` | `uuid` | FK → `exercises.id` |
| `order_index` | `integer` | 0-based, defines player order |

**Query pattern:** Always `select(*, routine_exercises(*, exercise:exercises(*)))` to get full routine.

---

### `routine_logs`

One row per completed routine.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `routine_id` | `uuid` | FK → `routines.id` |
| `completed_at` | `timestamptz` | |

**Points awarded:** +10 per completion. Also triggers streak update and achievement checks.

---

## Habits Module

### `habits`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `name` | `text` | |
| `icon` | `text` | Ionicon name: `leaf`, `water`, `book`, `heart`, `fitness` |
| `color` | `text` | One of: `pink`, `yellow`, `blue`, `teal`, `purple` |
| `created_at` | `timestamptz` | |

---

### `habit_logs`

One row per day a habit is checked off.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `habit_id` | `uuid` | FK → `habits.id` |
| `log_date` | `date` | `YYYY-MM-DD` |
| `created_at` | `timestamptz` | |

**Unique constraint:** `(user_id, habit_id, log_date)` — prevents duplicate completions per day.

---

## Goals Module

### `goals`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `title` | `text` | |
| `description` | `text` | Nullable |
| `progress` | `integer` | 0–100, manually updated by user |
| `color` | `text` | One of: `pink`, `purple`, `mint`, `blue`, `yellow` |
| `target_date` | `date` | Nullable |
| `is_completed` | `boolean` | Default `false` |
| `created_at` | `timestamptz` | |

**Points awarded:** +15 when goal is first marked as completed.

---

## Optional Modules

### `mood_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `mood` | `integer` | 1=Mal, 2=Regular, 3=Bien, 4=Muy bien, 5=Excelente |
| `note` | `text` | Nullable |
| `logged_date` | `date` | `YYYY-MM-DD` |
| `created_at` | `timestamptz` | |

**Unique constraint:** `(user_id, logged_date)` — one check-in per day. Upsert pattern used.

---

### `gratitude_logs`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `entry_1` | `text` | Required |
| `entry_2` | `text` | Nullable |
| `entry_3` | `text` | Nullable |
| `logged_date` | `date` | `YYYY-MM-DD` |
| `created_at` | `timestamptz` | |

**Unique constraint:** `(user_id, logged_date)`. Upsert with `ON CONFLICT (user_id, logged_date)`.

**Points awarded:** +3 per daily entry.

---

## Cooking Module

### `recipes`

AI-generated recipes owned by user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `title` | `text` | |
| `description` | `text` | Nullable |
| `total_time_minutes` | `integer` | `prep + cook` |
| `prep_time_minutes` | `integer` | |
| `cook_time_minutes` | `integer` | |
| `servings` | `integer` | Default 2 |
| `difficulty` | `text` | One of: `'fácil'`, `'media'`, `'difícil'` |
| `cuisine_type` | `text` | Nullable |
| `tags` | `text[]` | E.g. `['vegetariana', 'rápida']` |
| `user_prompt` | `text` | Nullable — original free-text input from user |
| `personal_notes` | `text` | Nullable — user's own notes |
| `is_favorite` | `boolean` | Default `false` |
| `image_url` | `text` | Nullable (not yet used) |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

**Points awarded:** +5 when recipe is generated.

---

### `recipe_ingredients`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `recipe_id` | `uuid` | FK → `recipes.id` |
| `order_index` | `integer` | Display order |
| `name` | `text` | |
| `amount` | `numeric` | Nullable (e.g. "al gusto") |
| `unit` | `text` | Nullable (e.g. `g`, `ml`, `taza`) |
| `notes` | `text` | Nullable (e.g. "rebanado", "al gusto") |

---

### `recipe_steps`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `recipe_id` | `uuid` | FK → `recipes.id` |
| `step_number` | `integer` | 1-based |
| `title` | `text` | Short label for the step |
| `instructions` | `text` | Full instructions |
| `duration_seconds` | `integer` | Nullable — drives the in-player countdown timer |
| `temperature` | `text` | Nullable — e.g. "180°C" |
| `tip` | `text` | Nullable — Mochi's contextual cooking tip |

---

### `recipe_cook_sessions`

Tracks an active or completed cook session. Enables resume-from-step.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `recipe_id` | `uuid` | FK → `recipes.id` |
| `last_step_completed` | `integer` | Updated as user advances through steps |
| `is_finished` | `boolean` | Default `false` |
| `servings_cooked` | `integer` | Nullable |
| `rating` | `integer` | Nullable, 1–5 stars |
| `session_notes` | `text` | Nullable |
| `started_at` | `timestamptz` | |
| `finished_at` | `timestamptz` | Nullable |

**Points awarded:** +15 when `is_finished = true`.

---

## Gamification Tables

### `achievements`

Global catalog (seeded, not per-user).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `key` | `text` | UNIQUE. Used as identifier in code (e.g. `'first_study'`) |
| `title` | `text` | Display name |
| `description` | `text` | |
| `icon` | `text` | Ionicon name |
| `category` | `text` | E.g. `study`, `exercise`, `streak`, `cooking`, `special` |
| `points` | `integer` | Points added when unlocked |
| `is_secret` | `boolean` | Hidden until unlocked |

---

### `user_achievements`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `achievement_id` | `uuid` | FK → `achievements.id` |
| `unlocked_at` | `timestamptz` | |

**Unique constraint:** `(user_id, achievement_id)`. Upsert with `ignoreDuplicates: true` — idempotent unlock.

---

### `streaks`

One row per user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id`, UNIQUE |
| `current_streak` | `integer` | Days in current streak |
| `longest_streak` | `integer` | All-time record |
| `last_activity_date` | `date` | Updated on any streak-worthy action |

**Logic:** See `updateStreak()` in `apps/mobile/lib/gamification.ts`.

---

## Voucher System

### `voucher_templates`

Global catalog of redeemable reward templates (managed by admin).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `title` | `text` | |
| `description` | `text` | |
| `points_cost` | `integer` | |
| `icon` | `text` | Ionicon name |
| `color` | `text` | One of the pastel color keys |
| `created_at` | `timestamptz` | |

---

### `vouchers`

User-generated vouchers (created by redeeming points against a template).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `profiles.id` |
| `template_id` | `uuid` | FK → `voucher_templates.id`, nullable |
| `title` | `text` | Copied from template at creation time |
| `description` | `text` | Copied from template |
| `points_cost` | `integer` | Copied from template |
| `icon` | `text` | |
| `color` | `text` | |
| `is_redeemed` | `boolean` | Default `false` |
| `redeemed_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | |

**Flow:** Points are subtracted from `profiles.total_points` atomically, then a voucher row is inserted. Vouchers are shareable as PNG screenshots via `react-native-view-shot`.

---

## Supabase RPC Functions

### `increment_points(user_id uuid, points integer)`

Atomically adds `points` to `profiles.total_points` for the given user. Used by `addPoints()` in `lib/gamification.ts` to avoid race conditions on concurrent point awards.

```sql
-- Example implementation
UPDATE profiles
SET total_points = total_points + points
WHERE id = user_id;
```

---

## RLS Policy Pattern

Every table follows this pattern:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Read own rows
CREATE POLICY "Users can read own rows"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- Insert own rows
CREATE POLICY "Users can insert own rows"
  ON table_name FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update own rows
CREATE POLICY "Users can update own rows"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id);

-- Delete own rows
CREATE POLICY "Users can delete own rows"
  ON table_name FOR DELETE
  USING (auth.uid() = user_id);

-- Grant to authenticated role
GRANT ALL ON table_name TO authenticated;
```

Global tables (`achievements`, `voucher_templates`) have public read access but no user-level write.