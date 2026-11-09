# PlateWise AI — Implementation Status

## Section 12: Multi-Role Production Stages

| Stage | Scope | Status | Key Files Involved |
| :--- | :--- | :--- | :--- |
| **STAGE 1** | Security foundation: fix migration `b2f8a71c3d92` (`sa.false()`), student/join_codes/ratings migration, review fixes (bounded IP login failure limiter, SQL atomic lockout, Origin check, 10s grace rotation, JWT/CORS/SameSite fixes, rightmost untrusted XFF, CSRF compare_digest, remove seed_admin pass, user deactivation, relax CSP only for /docs non-prod, tests + PostgreSQL suite) | **Done** | `backend/alembic/versions/`, `backend/app/routers/auth.py`, `backend/app/models/`, `backend/app/security/`, `backend/app/deps.py`, `backend/app/middleware/`, `backend/tests/` |
| **STAGE 2** | Authenticated API `/api/v1/app/*`: reuse repository layer; scoped by user assigned messes; student limited to menu, RSVP, plates, ratings, own data; manager CRUD in mess; admin all; audit logging; IDOR tests | **Done** | `backend/app/routers/app_api.py`, `backend/app/routers/auth.py`, `backend/app/deps.py`, `backend/tests/security/test_idor_roles.py` |
| **STAGE 3** | Frontend auth: login, join-code signup, logout, CSRF header, Next 16 server route guards, role route groups, redirect by role, session expiry handling, "Try the demo" path | **Done** | `frontend/src/middleware.ts`, `frontend/src/app/(auth)/login/page.tsx`, `frontend/src/app/(auth)/register/page.tsx`, `frontend/src/lib/api.ts`, `frontend/src/context/AuthContext.tsx` |
| **STAGE 4** | Student App: phone-first (390x844, 44px touch targets, 16px inputs), bottom tabs: Today (menu, Eating/Skipping before cutoff), Plate (3D Studio + kcal), Rate (ratings & feedback), Me (plates, streak, settings) | **Done** | `frontend/src/app/student/layout.tsx`, `frontend/src/app/student/page.tsx` |
| **STAGE 5** | Mess Owner/Manager Console & Admin Console: Owner = their messes only (Engagement, Surplus Rescue, Reports, Settings with join codes); Admin = Messes & Owners, Users, Audit Logs, Data Import, System Health, Assumptions | **Not started** | `frontend/src/app/owner/`, `frontend/src/app/admin/`, `frontend/src/components/admin/` |
| **STAGE 6** | In-app help: first-run tour per role, "?" tooltips on every metric, "How is this calculated?" drawers (drivers, kcal, savings, CO2e), Help page with glossary | **Not started** | `frontend/src/components/help/`, `frontend/src/app/help/` |
| **STAGE 7** | Graphics from GLB registry: liquid pouring loader scene (transmissive glass, rising liquid, bubbles, splash particles, useProgress), auto-map roles in `modelRoles.ts`, quality setting cookie, fallback | **Not started** | `frontend/src/components/3d/LiquidPouringScene.tsx`, `frontend/src/lib/assets/modelRoles.ts` |
| **STAGE 8** | PWA and iOS: manifest (#0E2412, #FAF8F2, 192/512/maskable), apple-touch-icon, appleWebApp, viewport-fit=cover, 100dvh, overscroll containment, service worker with offline page (never cache /api), install UX | **Not started** | `frontend/public/manifest.json`, `frontend/public/sw.js`, `frontend/src/app/offline/page.tsx`, `frontend/src/components/pwa/` |
| **STAGE 9** | Deployment files: `docker-compose.prod.yml`, `.env.production.example`, `docs/DEPLOY.md`, `docs/PHONE_TEST.md`, enforce `COOKIE_SECURE=true` in production | **Not started** | `docker-compose.prod.yml`, `.env.production.example`, `docs/DEPLOY.md`, `docs/PHONE_TEST.md` |
| **STAGE 10** | QA: Playwright e2e (phone & laptop viewports for student, owner, admin + role isolation IDOR), dead-button crawler, console/hydration/non-2xx checks, `docs/TAB_CHECKLIST.md`, `README.md`, `DEMO_SCRIPT.md`, `KNOWN_LIMITATIONS.md` | **Not started** | `tests/e2e/`, `scripts/dead_button_crawler.py`, `README.md`, `DEMO_SCRIPT.md`, `KNOWN_LIMITATIONS.md` |

---

## Prior Section 11 Implementation History

| Step | Scope | Status | Key Files Involved |
| :--- | :--- | :--- | :--- |
| **STEP A** | Hydration fix via SSR cookies (`pw_mess`, `pw_role`), AppContext, real mess switcher, Add Mess dialog | **Done** | `frontend/src/context/AppContext.tsx`, `frontend/src/app/(app)/layout.tsx`, `frontend/src/components/shell/TopBar.tsx`, `frontend/src/components/shell/Sidebar.tsx`, `frontend/src/components/shell/AddMessModal.tsx`, `frontend/src/app/(app)/dashboard/page.tsx`, `frontend/src/app/(app)/today/page.tsx`, `frontend/src/app/(app)/forecast/page.tsx`, `frontend/src/app/(app)/log/page.tsx` |
| **STEP B** | Backend persistence: `demo_` tables (SQLAlchemy `create_all`), repository layer, seed-if-empty, CRUD endpoints for messes, foods (with kcal), menus, logs, plates, rsvps; reconciled catalog; tests | **Done** | `backend/app/demo/models.py`, `backend/app/demo/repository.py`, `backend/app/demo/schemas.py`, `backend/app/demo/router.py`, `backend/app/demo/seed.py`, `backend/app/main.py`, `backend/tests/test_demo_api.py` |
| **STEP C** | Manager screens frontend: Foods & Calories manager (table + drawer + asset picker for Kenney images and GLB models), Menu Planner editing (assign foods to 7x3 grid per mess), Log Meals editable table, Mess settings page | **Done** | `frontend/src/app/(app)/foods/page.tsx`, `frontend/src/app/(app)/menu/page.tsx`, `frontend/src/app/(app)/log/page.tsx`, `frontend/src/app/(app)/settings/page.tsx`, `frontend/src/components/foods/FoodDrawer.tsx`, `frontend/src/components/foods/AssetPickerModal.tsx` |
| **STEP D** | Plate Studio working version: food palette, +/- drop-in counters, live totals (kcal, macros, cost, CO2e), Light/Moderate/Hearty descriptor with editable thresholds, disclaimer note, save plate, popular plates, mess tab bar (Overview \| Plan \| Plate Studio \| Logs), Dashboard widget, Student App step | **Done** | `frontend/src/app/(app)/plate-studio/page.tsx`, `frontend/src/components/plate/PlateStudio.tsx`, `frontend/src/components/plate/Plate3DCanvas.tsx`, `frontend/src/components/shell/MessTabs.tsx`, `frontend/src/app/(app)/dashboard/page.tsx`, `frontend/src/app/(app)/student/page.tsx` |
| **STEP E** | Tab audit & Smoke test: `docs/TAB_CHECKLIST.md` with action status, fix dead ends, remove/hide unfinished elements, smoke test script verifying routes and API endpoints | **Done** | `docs/TAB_CHECKLIST.md`, `scripts/smoke_test.py` |
| **GRAPHICS PHASE** | Complete 3D & GLB graphics implementation: model roles mapping (`modelRoles.ts`), Tier 1 hero moments (oven splash boot, route loader, today tray, dashboard kitchen parallax, plate studio drop-in/burst, impact forest), Tier 2 cheap loaders, Tier 3 quality (cookie setting, DPR cap, ACES, fallbacks) | **Done** | `frontend/src/lib/assets/modelRoles.ts`, `frontend/src/components/3d/SplashOvenBoot.tsx`, `frontend/src/components/3d/RouteLoader3D.tsx`, `frontend/src/components/3d/TodayCookTray.tsx`, `frontend/src/components/3d/DashboardKitchenScene.tsx`, `frontend/src/components/3d/ImpactForestScene.tsx`, `frontend/src/components/plate/Plate3DCanvas.tsx`, `frontend/src/components/loaders/KenneySpriteLoader.tsx`, `frontend/src/app/(app)/about/page.tsx` |
| **REAL DATA & ERROR FIXES** | 4 Runtime error fixes (`Plate3DCanvas` Html unmount, `removeChild` React 19 portal race, `/menu` & `/log` aliases + ErrorStateCard), Foods CSV import/export with formula protection, cross-checks, source badges, ingredient library & recipe batch calculator, real meal-log import with truthful dataset labeling, 32 pytests, 31 smoke tests | **Done** | `backend/app/demo/router.py`, `backend/app/demo/repository.py`, `backend/app/demo/schemas.py`, `backend/app/demo/models.py`, `frontend/src/components/foods/FoodCsvImportModal.tsx`, `frontend/src/components/foods/IngredientLibraryModal.tsx`, `frontend/src/components/foods/FoodDrawer.tsx`, `frontend/src/app/(app)/foods/page.tsx`, `frontend/src/app/(app)/dashboard/page.tsx`, `frontend/src/app/(app)/today/page.tsx`, `frontend/src/app/(app)/log/page.tsx`, `frontend/src/app/(app)/menu/page.tsx`, `data/foods_template.csv`, `docs/DATA_COLLECTION.md` |

---

## Detailed Step Log

### Step A: Hydration & Multi-Mess Role Architecture (Done)
- Fixed hydration mismatches by reading `pw_mess` and `pw_role` cookies on server in `(app)/layout.tsx` and passing initial values to `AppContextProvider`.
- Removed non-deterministic date string formatting in `TopBar.tsx` (using explicit weekday and month arrays).
- Made the mess switcher dynamic across `TopBar` and `Sidebar`, linked to `useAppContext()`.
- Added `AddMessModal` with validation bounds (capacity, timings, location label) and wired to Cmd+K palette.
- Verified in browser with 0 console hydration warnings and verified `npm run build` succeeds (14/14 static pages).

### Step B: Persistence & Repository Layer (Done)
- Created SQLAlchemy models with `demo_` prefix (`DemoMess`, `DemoFood`, `DemoWeeklyMenu`, `DemoMealLog`, `DemoPlate`, `DemoPlateItem`, `DemoRsvp`) created idempotently at startup via `Base.metadata.create_all(bind=engine)` in `main.py` without touching Alembic or security code.
- Reconciled dishes and foods into a single 24-item authentic catalog in `seed.py` with Kenney sprite IDs, 201 GLB model IDs, IFCT nutritional macros, serving weights, and "estimate, edit me" notes.
- Built comprehensive repository layer in `repository.py` handling CRUD for messes, foods, weekly menus, meal logs (capped at 500), student RSVPs (capped at 1000), custom plates (capped at 500), and `get_recent_log_shift()`.
- Wired feedback loop: recent meal logs update forecast turnout and inject the `Recent Meal Logs Feedback` driver chip into predictions.
- Full test suite in `backend/tests/test_demo_api.py` with 26/26 tests passing in 0.64s.

### Step C: Manager Screens Frontend (Done)
- Created Foods & Calories Manager (`/foods`) with interactive catalog table, search & category filtering, and `FoodDrawer` for creating/editing institutional items with verified vs estimate badges.
- Built `AssetPickerModal` with visual tabbed selection across 201 Kenney GLB 3D models and 2D icon sprites.
- Rebuilt Menu Planner (`/menu`) into a full 7x3 cyclical weekly roster per dining hall with per-cell predicted waste and cost, dish add/remove, and AI optimization with instant swap application.
- Enhanced Log Meals (`/log`) with dynamic catalog dish choices, inline editing, and deletion with persistent database sync.
- Created Mess Settings (`/settings`) enabling capacity changes, operating hours configuration, facility location updates, and protected deletion.
- Added navigation links in `Sidebar.tsx` and compiled Next.js cleanly (16/16 pages).

### Step D: Plate Studio Working Version (Done)
- Built interactive 3D Plate Studio on `/plate-studio` with `PlateStudio.tsx` and `Plate3DCanvas.tsx` supporting both stainless steel thali and ceramic plate variants with orbital controls.
- Integrated food catalog palette with `+` / `-` portion counters, live tweened totals (kcal, protein, carbs, fat, raw cost in INR, supply-chain CO2e in grams).
- Implemented `Light / Moderate / Hearty` neutral meal descriptor with interactive threshold sliders and non-medical advisory disclaimer.
- Added Save Plate form feeding persistent pre-order demand signal into PostgreSQL and Popular Plates shelf with one-click preset loading.
- Added uniform mess tab bar (`Overview | Plan | Plate Studio | Logs`) across all dining hall views.
- Wired live Plate Studio widget on Dashboard (`/dashboard`) and interactive RSVP/pre-order flow in Student Portal (`/student`).

### Step E: Tab Audit & Smoke Test (Done)
- Audited all routes, pages, dialogs, and navigation links. Verified zero dead ends, 404s, or placeholder links.
- Created `docs/TAB_CHECKLIST.md` documenting every screen, tab, user action, and verification status.
- Implemented `scripts/smoke_test.py` testing all 12 Next.js routes and 13 FastAPI endpoints with 100% (25/25) pass rate.

### Graphics Phase: 3D & GLB Tier 1, 2, and 3 Integration (Done)
- **Model Roles Mapping**: Created single editable mapping file `src/lib/assets/modelRoles.ts` mapping Kenney GLBs (`loaf-round`, `croissant`, `plate-dinner`, `bowl-soup`, `rice-ball`, etc.) and procedural fallback geometries.
- **Tier 1 Hero Moments (Max 1-2 Canvases per screen, lazy loaded, frameloop="demand")**:
  1. *Splash/Boot Screen (`SplashOvenBoot.tsx`)*: First session load (after client mount, skippable, never SSR). Rising dough shifting from `#f7eedb` to golden crust `#853d0e` with emissive glow, flickering coils, steam particles, preheating text, and embedded clip detection via `useAnimations`.
  2. *Route-Transition Loader (`RouteLoader3D.tsx` & `loading.tsx`)*: Bobbing and spinning golden croissant with progress hint.
  3. *Today's Plan Instanced Tray (`TodayCookTray.tsx`)*: Instanced batch plates reflecting recommended servings count, pop animation, steam puff and confetti leaf sparkles on Approve Plan, optional Web Audio API harmonic chime.
  4. *Dashboard Glass Panel (`DashboardKitchenScene.tsx`)*: Mini kitchen scene with glowing oven chamber, floating staple props, and mouse/pointer parallax.
  5. *Plate Studio Drop-in (`Plate3DCanvas.tsx`)*: Animated piece drop-in with settling spring, contact settling shadows, count badge pop, and Save Plate celebration burst.
  6. *Impact Living Forest (`ImpactForestScene.tsx`)*: Procedural trees dynamically scaling and populating proportional to cumulative CO2e avoided.
  7. *Success Moments*: Steam puff and emerald confetti leaf particle bursts on Approve Plan & Save Plate.
- **Tier 2 Cheap Loaders (No WebGL)**:
  - Created `KenneySpriteLoader.tsx` with CSS-animated bobbing, steaming, and plate-spin states.
  - Added gentle floating bobbing animation to empty states in `EmptyStateCard.tsx`.
- **Tier 3 Quality & Safety**:
  - Cookie-persisted `pw_graphics` (`auto` | `low` | `off`) read on the server in `layout.tsx` for zero hydration mismatch.
  - Capped DPR at 1.5 with `PerformanceMonitor` auto-decline and `ACESFilmicToneMapping`.
  - Static poster fallbacks on `off`, mobile viewports, or `prefers-reduced-motion`.
  - Preloaded key GLBs with meshopt decoder in `FoodModel.tsx`.
  - Added dedicated About & Credits screen at `/about` and linked in sidebar.

### Real Data System & Runtime Error Fixes (Done)
- **Runtime Error 1 & 2 Fix (`Plate3DCanvas.tsx` & `removeChild`)**:
  - Identified root cause of React 19 concurrent reconciler crash: `@react-three/drei`'s `<Html>` creates React root portals inside Canvas DOM nodes; during rapid piece additions/removals, Three.js reconciler unmounts collide with React DOM unmounts, producing `"Attempted to synchronously unmount a root while React was already rendering"` and `"Failed to execute removeChild on Node"`.
  - Removed `<Html>` entirely from `AnimatedFoodPiece`. Replaced with a pure HTML/DOM overlay outside the Canvas.
  - Maintained single Canvas per page and memoized pieces with stable keys `${it.food_id}-${c}`.
- **Route Mismatches & 404 Fix (Errors 3 & 4)**:
  - Audited backend vs frontend routes. Added bidirectional route aliases in `backend/app/demo/router.py`: `@router.get("/menu")` alongside `/menus`, `@router.post("/menu/cell")`, `@router.post("/menu/optimize")`, `@router.get("/log")` alongside `/logs`, and `@router.post("/logs")` alongside `/log`.
  - Designed and deployed uniform `ErrorStateCard` with `onRetry` button across `/dashboard`, `/today`, `/forecast`, `/simulate`, `/log`, `/menu`, and `/foods`.
- **Foods CSV Import/Export**:
  - Columns: `id, name, category, veg, unit_label, serving_weight_g, kcal_per_100g, kcal_per_serving, protein_g, carbs_g, fat_g, fiber_g, cost_inr_per_serving, source_type, source_note, measured_on, verified, model_id, icon_id, max_per_plate`.
  - Neutralized CSV formula injection: cells starting with `=`, `+`, `-`, `@` are prepended with `'`.
  - Dry-run preview modal with creates/updates breakdown, per-row validation errors, and cross-checks before saving. Limits: 1 MB, 500 rows.
  - Cross-checks: serving weight vs kcal/100g (>15%), macro energy `4*P + 4*C + 9*F` vs kcal (>20%), and physical bounds (5-800g, 0-1500 kcal).
- **Verification UI & Source Badges**:
  - Every food displays source badge (`Label`, `Recipe`, `Measured`, `Reference`) and Verified tick.
  - "Needs verification" filter chip in `/foods`.
  - Truthful dataset label ("College data (imported)" vs "Demo data (synthetic)") and "Includes N unverified items" warning banners displayed on `/dashboard`, `/today`, and `/log`.
- **Ingredient Library & Batch Recipe Calculator**:
  - Raw ingredient library with full CRUD (`/v1/demo/ingredients`), seeded EMPTY with zero invented numbers.
  - Batch recipe drawer calculator: select ingredients with batch weights, servings count, and compute kcal/macros per portion with automatic `source_type=recipe` save.
- **Fieldwork Preparation**:
  - Created blank fieldwork template `data/foods_template.csv` prefilled with model and icon IDs.
  - Created fieldwork guide `docs/DATA_COLLECTION.md` detailing digital weigh-scale procedures and invoice cost derivations.
- **Real Meal-Log Import**:
  - Validated CSV upload of daily headcount and food weights (`date, meal, food_id, prepared_kg, consumed_kg, leftover_kg, turnout`).
  - Automatically switches mess dataset attribution to `"College data (imported)"` and updates closed-loop forecast calibration.
- **Production Build & Verification**:
  - 32/32 pytest backend demo & real data tests passing (`backend/tests/test_demo_api.py`, `backend/tests/test_real_data.py`).
  - 150/150 security and system pytest tests passing.
  - 37/37 smoke tests passing in `scripts/smoke_test.py` (12/12 Next.js frontend routes, 19/19 FastAPI demo endpoints, 6/6 partial/empty resilience edge tests).
  - Production build (`npm run build`) succeeded with 21/21 static and dynamic routes.

### Dashboard Runtime Crash Fix & Resilience Hardening (Done)
- **Root Cause & Schema Fix**:
  - `src/app/(app)/dashboard/page.tsx:696` crashed on `dish.cost_wasted_inr.toLocaleString()` because `GET /api/v1/demo/overview` returned `{ dish_id, dish_name, total_waste_kg, estimated_loss_inr, co2e_factor }`, whereas the frontend expected `{ dish_id, name, category, guesswork_waste_kg, cost_wasted_inr }`.
  - Reconciled both sides: backend router now outputs canonical and legacy keys; frontend client normalizes missing or legacy fields.
- **Shared Safe Formatters (`src/lib/formatters.ts`)**:
  - Implemented `formatINR`, `formatNumber`, `formatPercent`, `formatKg` with explicit `'en-IN'` locale to prevent hydration mismatches. All return an em dash (`—`) when given `null`, `undefined`, `NaN`, `""`, or non-finite values.
  - Replaced all direct `.toLocaleString()` and `.toFixed()` calls across the frontend.
- **CardErrorBoundary (`src/components/CardErrorBoundary.tsx`)**:
  - React error boundary wrapped around every dashboard KPI card, 30-day chart, next service window, operational alerts, top wasted dishes table, 3D kitchen scene, and Plate Studio widget. Displays a graceful "Could not load [cardTitle]" message with an interactive Retry button.
- **Typed Runtime API Validation (Zod)**:
  - Added `validateApiResponse` in `src/lib/api.ts` with Zod schemas logging console warnings naming missing fields on partial payloads without crashing.
- **Extended Smoke & Resilience Test**:
  - Added `scripts/test-resilience.mjs` (30/30 checks passed) and extended `scripts/smoke_test.py` (37/37 checks passed) covering empty/partial edge data.

