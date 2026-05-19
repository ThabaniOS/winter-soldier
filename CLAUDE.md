# CLAUDE.md — Winter Soldier

> Agent instructions for the `winter-soldier` repository.
> Read this file in full before writing any code in this project.

---

## 1. What This Is

The Winter Soldier (TWS) is Thabani's personal 90-day deliberate-living tool. It is **not a productivity app**, **not a habit tracker**, and **not a daily logging system**. It is a calendar-driven companion that surfaces the right prompt on the right day and produces an honest log at the end of 90 days.

**Window:** Monday 18 May 2026 → Sunday 16 August 2026 (13 weeks, 90 days)
**User:** Thabani (single user, no auth, no domain, runs locally or on Vercel for personal access only)
**Identity statement:** *"I am a man who closes the loop."*

The tool exists to answer one question at Day 90: **where did I actually put my time and effort?**

---

## 2. Working Principles

These are non-negotiable. They override any feature suggestion that conflicts with them.

1. **Weekly cadence, not daily.** The only daily logging surface is SQL learning minutes. Everything else is weekly. Do not add daily streak counters, daily reminders, daily checklists, daily anything.
2. **Qualitative over quantitative.** Most of the value is in one-sentence Sunday reflections, not numbers. Numbers exist only where the trend can't be felt without them (strength PRs, running km, meditation count, SQL minutes).
3. **The tool must not punish missed days.** If Thabani skips a week, the tool greets him back without guilt. No "you've broken your streak" language. No red dots. No shame UI.
4. **Setup is once-off.** The schema and pages are built in week 1 and then locked. Do not add features mid-cycle. If a need emerges, log it for the post-90 review.
5. **The tool is a log, not a coach.** It surfaces prompts. It does not give advice, set goals, or adapt based on inputs. Thabani drives; the tool records.
6. **No tracking of nutrition, sleep hours, body weight, steps, phone usage, or anything that requires daily input.** These belong to qualitative weekly notes only.

---

## 3. Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, React Server Components where sensible
- **Styling:** Tailwind CSS v4 with custom tokens from `design.md` (NOT default Tailwind colors)
- **Backend:** Supabase (Postgres + auto-generated REST API)
- **Auth:** None. Single-user app. Supabase client uses the anon key directly.
- **Deployment:** Vercel (personal scope), no custom domain
- **Repo:** `winter-soldier` (already created on GitHub)
- **Supabase project:** `Winter Soldier` (already created)

### Why no auth
Thabani is the only user. The Supabase project is not exposed publicly beyond the Vercel preview URL, which is sufficient obscurity for a personal log. If this ever changes, auth can be added without touching the schema — every table is already single-tenant. **Do not add auth proactively.**

---

## 4. Design Language

The full design system lives in `design.md` at the repo root. Read it before writing any component. Summary:

**Aesthetic:** Terminal / digital workbench. Dark, monospace, achromatic. Stark and functional, not decorative.

**Colors (use these exactly, no other colors permitted):**
- `--color-midnight-oil: #000000` — page background
- `--color-ghost-white: #ffffff` — primary text, headers, icons
- `--color-steel-gray: #1d1d1d` — card and input backgrounds
- `--color-muted-ash: #383838` — borders and dividers
- `--color-dim-gray: #888888` — secondary text

**Typography:** Soehne Mono only. If unavailable, fall back to `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`. Single weight (400). Body size 16px. Letter spacing 0.24px. **No other fonts.**

**Border radius:** Only `0px` or `10px`. Nothing in between, nothing larger.

**Elevation:** No shadows. Depth comes from background-color steps (`#000` → `#1d1d1d`) and 1px borders (`#383838`).

**Spacing scale:** Use only values from the design tokens (5, 6, 8, 16, 19, 26, 27, 32 px). No arbitrary spacing.

**Strict prohibitions:**
- No chromatic color anywhere
- No emojis in the UI
- No icons unless monochrome line-art rendered in Ghost White
- No gradients
- No animations beyond essential state transitions (e.g., button hover state color shift)
- No images that introduce color
- No additional fonts

### Breathing tool exception
The `/breathe` page is ported from a standalone HTML file (`breathing-tool.html` in `/docs`) which originally had a celestial aesthetic (Cormorant Garamond, starfield, blue glow). **For TWS, strip that aesthetic.** The breathing animation logic (orb scale transitions, phase timings, technique configs) is preserved. The visual presentation is rebuilt in the terminal aesthetic: monospace phase labels, gray orb, no starfield, no italic serif. Same function, workbench skin.

---

## 5. Database Schema

Ten tables. Deployed via Supabase SQL migrations. Thabani writes some of these migrations himself as part of SQL learning — when he asks for a table to be created, present the SQL and explain it before running.

```sql
-- =============================================================
-- weeks: the spine of the application
-- =============================================================
CREATE TABLE weeks (
  id SERIAL PRIMARY KEY,
  week_number INTEGER NOT NULL UNIQUE CHECK (week_number BETWEEN 1 AND 13),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  identity_score INTEGER CHECK (identity_score BETWEEN 1 AND 10),
  identity_note TEXT,
  sleep_note TEXT,
  create_consume_note TEXT,
  raiis_note TEXT,
  blocker_note TEXT,
  next_week_priorities TEXT,
  reviewed_at TIMESTAMPTZ
);

-- =============================================================
-- strength_targets: the four PR journeys, seeded once
-- =============================================================
CREATE TABLE strength_targets (
  id SERIAL PRIMARY KEY,
  lift_name TEXT NOT NULL UNIQUE,
  baseline_weight NUMERIC,
  baseline_reps INTEGER,
  target_weight NUMERIC,
  target_reps INTEGER,
  target_type TEXT CHECK (target_type IN ('weight_for_reps', 'reps_unbroken'))
);

-- =============================================================
-- strength_sessions: each gym visit
-- =============================================================
CREATE TABLE strength_sessions (
  id SERIAL PRIMARY KEY,
  week_id INTEGER REFERENCES weeks(id),
  session_date DATE NOT NULL,
  session_type TEXT CHECK (session_type IN ('push','pull','legs','upper','lower','full')),
  notes TEXT
);

-- =============================================================
-- strength_logs: every set of every tracked lift
-- =============================================================
CREATE TABLE strength_logs (
  id SERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES strength_sessions(id) ON DELETE CASCADE,
  lift_name TEXT NOT NULL,
  weight NUMERIC,
  reps INTEGER,
  set_number INTEGER,
  notes TEXT
);

-- =============================================================
-- running_logs: weekly mileage, individual runs
-- =============================================================
CREATE TABLE running_logs (
  id SERIAL PRIMARY KEY,
  week_id INTEGER REFERENCES weeks(id),
  run_date DATE NOT NULL,
  distance_km NUMERIC NOT NULL,
  notes TEXT
);

-- =============================================================
-- athletic_sessions: boxing, yoga, pilates, anything non-strength/non-run
-- =============================================================
CREATE TABLE athletic_sessions (
  id SERIAL PRIMARY KEY,
  week_id INTEGER REFERENCES weeks(id),
  session_date DATE NOT NULL,
  activity TEXT,
  notes TEXT
);

-- =============================================================
-- sport_sessions: golf and padel, monthly cadence
-- =============================================================
CREATE TABLE sport_sessions (
  id SERIAL PRIMARY KEY,
  session_date DATE NOT NULL,
  sport TEXT CHECK (sport IN ('golf', 'padel')),
  notes TEXT
);

-- =============================================================
-- meditation_sessions: auto-logged by the breathing tool
-- =============================================================
CREATE TABLE meditation_sessions (
  id SERIAL PRIMARY KEY,
  session_start TIMESTAMPTZ NOT NULL,
  session_end TIMESTAMPTZ NOT NULL,
  technique TEXT CHECK (technique IN ('478', 'box', 'coherent', 'calm')),
  cycles_completed INTEGER,
  duration_seconds INTEGER
);

-- =============================================================
-- sql_learning_log: the one daily habit
-- =============================================================
CREATE TABLE sql_learning_log (
  id SERIAL PRIMARY KEY,
  log_date DATE NOT NULL,
  minutes_spent INTEGER NOT NULL,
  resource TEXT CHECK (resource IN ('mode', 'datalemur', 'supabase', 'other')),
  topic TEXT,
  notes TEXT
);

-- =============================================================
-- books_read: one row per book started
-- =============================================================
CREATE TABLE books_read (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  started_date DATE NOT NULL,
  finished_date DATE,
  notes TEXT
);

-- =============================================================
-- writing_pieces: one row per finished piece
-- =============================================================
CREATE TABLE writing_pieces (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('journal','linkedin_post','thabani_os_post','other')),
  finished_date DATE NOT NULL,
  link_or_location TEXT,
  notes TEXT
);

-- =============================================================
-- phase_markers: Day 0, 30, 45, 60, 90
-- =============================================================
CREATE TABLE phase_markers (
  id SERIAL PRIMARY KEY,
  day_number INTEGER NOT NULL CHECK (day_number IN (0, 30, 45, 60, 90)),
  marker_date DATE NOT NULL,
  reflection_text TEXT,
  completed_at TIMESTAMPTZ
);
```

### Seed Data

Run on first deploy:

```sql
-- 13 weeks of the cycle
INSERT INTO weeks (week_number, start_date, end_date) VALUES
  (1,  '2026-05-18', '2026-05-24'),
  (2,  '2026-05-25', '2026-05-31'),
  (3,  '2026-06-01', '2026-06-07'),
  (4,  '2026-06-08', '2026-06-14'),
  (5,  '2026-06-15', '2026-06-21'),
  (6,  '2026-06-22', '2026-06-28'),
  (7,  '2026-06-29', '2026-07-05'),
  (8,  '2026-07-06', '2026-07-12'),
  (9,  '2026-07-13', '2026-07-19'),
  (10, '2026-07-20', '2026-07-26'),
  (11, '2026-07-27', '2026-08-02'),
  (12, '2026-08-03', '2026-08-09'),
  (13, '2026-08-10', '2026-08-16');

-- Day Zero strength baselines (Mon 18 May 2026)
INSERT INTO strength_targets (lift_name, baseline_weight, baseline_reps, target_weight, target_reps, target_type) VALUES
  ('bench_press', 75, 7,   100, 6,   'weight_for_reps'),
  ('hack_squat',  70, 7,   120, 6,   'weight_for_reps'),
  ('pull_ups',    NULL, 10, NULL, 20, 'reps_unbroken'),
  ('push_ups',    NULL, 25, NULL, 40, 'reps_unbroken');

-- Phase markers
INSERT INTO phase_markers (day_number, marker_date) VALUES
  (0,  '2026-05-18'),
  (30, '2026-06-17'),
  (45, '2026-07-02'),
  (60, '2026-07-18'),
  (90, '2026-08-16');

-- The first book
INSERT INTO books_read (title, started_date) VALUES
  ('The Power of Positive Thinking', '2026-05-18');
```

---

## 6. Page Structure

Six pages. Build in this exact order.

### `/` — Current Week Dashboard *(build first)*
The default landing view. Shows the current TWS week (computed from today's date against the `weeks` table).

Surfaces, top to bottom:
- Week banner: `WEEK 1 OF 13 · MAY 18 — MAY 24`
- Identity line: `"I am a man who closes the loop."` (always present, small, dim gray)
- Bucket cards (Steel Gray surfaces, 10px radius), one per bucket:
  - **STRENGTH** — sessions this week (count) + days since last session
  - **RUNNING** — km this week / 10km floor
  - **ATHLETIC** — last activity logged, or `none yet`
  - **SPORT** — sessions this month
  - **MEDITATION** — sessions this week (from breathing tool)
  - **SQL** — minutes this week, current resource
  - **READING** — currently reading title, days in
- One CTA at bottom: `SUNDAY REVIEW →` (visible all week, action enabled only on Saturday and Sunday)

No graphs on this page. No progress bars. Just text in monospace, plainly.

### `/log` — Quick Log *(build second)*
A vertical list of large click targets. Each opens an inline form (no modal, no route change — form expands inline, submits, collapses back).

Buttons:
- `[ + ] STRENGTH SESSION`
- `[ + ] RUN`
- `[ + ] ATHLETIC SESSION`
- `[ + ] SPORT SESSION`
- `[ + ] SQL LEARNING`
- `[ + ] FINISHED BOOK`
- `[ + ] FINISHED WRITING PIECE`

Forms are intentionally minimal. Strength session form has nested lift logging (one form, multiple sets, all the way through to submit).

### `/breathe` — Breathing Tool *(build third)*
Port from `/docs/breathing-tool.html`. Preserve all four technique configs and the animation timings. Replace the aesthetic entirely:
- Background: `--color-midnight-oil`
- Orb: `--color-steel-gray` fill, `--color-muted-ash` 1px border, no glow, no shadow, no gradient
- Phase label: Soehne Mono, `--color-ghost-white`, uppercase, no italic
- Cycle counter and timer: Soehne Mono, `--color-dim-gray`
- Technique selector: row of Ghost Buttons (transparent, 1px ash border, 10px radius)
- No starfield
- No hue-rotate aurora background

On `stopBreathing()`, before resetting state, write a row to `meditation_sessions` with the start timestamp, end timestamp, technique, cycles completed, and duration. If duration is under 30 seconds, do not log (assume it was a misclick).

### `/review` — Sunday Review *(build fourth)*
The 20-minute weekly form. Loads the current week's row from `weeks`. If `reviewed_at` is already set, show a read-only view with a note: `REVIEW SUBMITTED · click to append`.

Form fields, in order:
1. **Identity score (1–10):** large numeric input or button row
2. **Identity question:** *"Did I close the loop this week?"* — one-sentence text
3. **Sleep:** *"How did I sleep this week?"* — text
4. **Create / consume:** *"Did I create more than I consumed?"* — text
5. **Raiis:** *"What did I do this week to move Raiis forward?"* — text
6. **Blocker:** *"What's blocking me?"* — text
7. **Next week priorities:** *"Three things for next week"* — text (any format)

On submit, write all fields and set `reviewed_at = now()`.

### `/log/history` — The Long View *(build fifth)*
Vertical timeline. Each week is a card (Steel Gray, 10px radius, 26px internal padding). Shows:
- Week number and date range
- Identity score (if reviewed)
- The seven Sunday review answers (if reviewed)
- Activity summary: strength sessions count, running km, athletic sessions, meditation count, SQL minutes
- Books finished that week
- Writing pieces finished that week

Phase marker rows are visually distinct — Muted Ash 1px top and bottom border, slightly larger padding, prefixed with `[ DAY 30 · 17 JUN 2026 ]` etc. Phase marker reflections sit inside their own card.

### `/strength` — Strength Progression *(build sixth, optional in week 1)*
The one numeric-heavy page. Four sections, one per lift. Each section shows:
- Lift name, target, current best
- A simple text-based progression view (no chart libraries, no SVG). Each session is one line:
  ```
  18 MAY · 75kg × 7      ━━━━━━━━━━━━━━━━━━░░░░░░░░ 75/100kg
  21 MAY · 77.5kg × 6    ━━━━━━━━━━━━━━━━━━━░░░░░░░ 77.5/100kg
  25 MAY · 80kg × 5      ━━━━━━━━━━━━━━━━━━━━░░░░░░ 80/100kg
  ```
  The bar is ASCII (`━` and `░` characters), rendered in monospace. This is on-brand for the terminal aesthetic and avoids any chart library dependency.

### Phase marker logic
On any page load, check today's date against `phase_markers`. If today equals a marker date and `completed_at` is null, render a banner at the top of the page (Ghost White text on Steel Gray surface, 1px Muted Ash border):

```
[ DAY 30 · 30-DAY REFLECTION ]
Halfway through Phase 1. Open reflection →
```

Clicking opens `/markers/[day_number]` with a single textarea and a submit button. Submitting sets `completed_at` and `reflection_text`.

---

## 7. Build Order — Week 1 (Day 0 to Day 7)

Each day below is a Claude Code session. Estimated 1–2 hours each.

- **Day 0 (Mon 18 May):** This file lives in repo. Read it. Confirm understanding.
- **Day 1 (Tue 19 May):** Next.js scaffold, Tailwind v4 with `design.md` tokens, Supabase client setup, deploy empty homepage to Vercel.
- **Day 2 (Wed 20 May):** Supabase migrations for the 11 tables. Run seed data. Verify in Supabase dashboard. (This is Thabani's first SQL writing exercise — walk him through CREATE TABLE syntax as you go.)
- **Day 3 (Thu 21 May):** `/` Current Week Dashboard. Read-only.
- **Day 4 (Fri 22 May):** `/log` Quick Log with all seven form types.
- **Day 5 (Sat 23 May):** `/breathe` ported with new aesthetic and Supabase write.
- **Day 6 (Sun 24 May):** `/review` Sunday Review form. First real review submitted same day.
- **Day 7 (Mon 25 May):** `/log/history` timeline view. Soft launch.

`/strength` and the SQL sandbox come in week 2 if there's bandwidth. Otherwise they're deferred and the tool is locked.

---

## 8. Conventions

**File structure (Next.js App Router):**
```
app/
  layout.tsx          ← global styles, font loading
  page.tsx            ← /
  log/
    page.tsx          ← /log
    history/
      page.tsx        ← /log/history
  breathe/
    page.tsx
  review/
    page.tsx
  strength/
    page.tsx
  markers/
    [day]/
      page.tsx
  api/
    (only if needed for Supabase server-side ops; prefer client-side)
lib/
  supabase.ts         ← client singleton
  dates.ts            ← week computation helpers
  types.ts            ← TypeScript types matching schema
components/
  BucketCard.tsx
  Button.tsx          ← ghost, subtle, high-contrast variants
  Input.tsx
  Banner.tsx          ← phase marker banner
  BreathingOrb.tsx
docs/
  breathing-tool.html ← original, for reference
  design.md
public/
  (only essential static assets, no decorative imagery)
```

**Component naming:** PascalCase. Component files match the component name.
**Variable naming:** camelCase for JS, snake_case for SQL columns (matches Supabase convention).
**No barrel exports.** Import each component directly.
**No styled-components, no CSS-in-JS.** Tailwind v4 only.
**Buttons:** Use the three variants from `design.md` — Ghost (outlined), Subtle Filled (Steel Gray), High Contrast (Ghost White on Midnight Oil). No other button styles.
**Date display:** Always in the form `18 MAY 2026` (DD MMM YYYY) for human-facing dates. ISO format (`2026-05-18`) only in database and code.
**Text case:** UPPERCASE for labels, section headers, button text, navigation. Sentence case for body text and user-entered content.

---

## 9. What NOT To Build

A non-exhaustive list of things that will be tempting and must be resisted:

- **Daily streak counters of any kind.** This violates the weekly cadence principle.
- **Push notifications, email reminders, SMS.** Thabani opens the tool when he wants to.
- **Goal-setting wizards.** Targets are seeded once. They don't change.
- **AI features.** No GPT calls, no "ask Claude what I should do today." This is a log, not a coach.
- **Social features.** No sharing, no public profiles, no leaderboards.
- **Charts using Recharts, Chart.js, D3.** Use ASCII bars in monospace. If a real chart is ever justified, it gets built bespoke in SVG with achromatic styling.
- **Color anywhere.** Including state colors (no green "success", no red "error" — use text and borders).
- **Mobile native apps.** Web only. Mobile browser is fine; the layouts should be responsive but desktop-first.
- **Export to PDF / print stylesheets.** Day 90 export is plain text or a single HTML page rendered to PDF manually.
- **A "settings" page.** There is nothing to configure.
- **Onboarding.** Thabani built this. He doesn't need onboarding.

---

## 10. Day 90 Output

On Sunday 16 August 2026, the tool's job is to produce one artifact: a single page (could be `/log/history` itself, or a dedicated `/day-90`) that contains, in plain monospace text:

- The identity statement at the top
- All 13 weeks of reviews, in order
- All five phase marker reflections
- Activity totals: total strength sessions, total km run, cumulative km toward the 200km long-term target, total meditation sessions, total SQL minutes, books finished, writing pieces finished
- Final strength snapshot: each lift's first logged session vs. last logged session
- A closing prompt: *"Plan or decline the next 90-day cycle."*

This is the deliverable. Everything else is scaffolding.

---

## 11. Communicating With Thabani

When working in this repo:

- **Explain SQL as you write it.** Thabani is using this project to learn SQL. Don't just run migrations — walk through `CREATE TABLE`, `REFERENCES`, `CHECK` constraints, etc. as they appear.
- **Surface schema decisions.** If a query starts to feel awkward, that's a signal the schema might need refinement — flag it, propose, wait for Thabani's call.
- **Push back on scope creep.** If Thabani asks for a feature mid-cycle that conflicts with Section 9, say so plainly. The system's value depends on the discipline.
- **No emojis in commit messages or code comments.** Match the aesthetic.
- **Write commits in imperative present tense.** `add Current Week dashboard` not `Added Current Week dashboard.`
- **When uncertain, ask before generating.** Better one clarifying question than 500 lines of wrong code.

---

## 12. Useful References

- `/docs/design.md` — the full design system, read this before any UI work
- `/docs/breathing-tool.html` — original aesthetic, animation logic to preserve
- `/docs/winter-soldier-brief.md` — the identity statement, targets, and interview answers (add this file to the repo after first commit)
- Supabase project: `Winter Soldier` (URL and anon key in `.env.local`, never committed)
- GitHub repo: `winter-soldier`

---

*This file is the contract. When in doubt, re-read it. When something is missing from it that you need, ask Thabani to add it rather than improvising.*
