# PlateWise AI: App Brief (single source of truth)

## 1. Purpose
Tagline: "Cook what's needed. Save what matters."
Deck line: "Don't just save food, save the climate behind it."
PlateWise AI is an AI food-demand forecasting application for college mess halls and cafeterias. Kitchens today cook on guesswork: example 100 kg prepared, 75 kg eaten, 25 kg wasted (illustrative, from the deck). Every wasted meal also wastes land, water, energy, transport and cooking, and landfill food releases methane.
How it works (deck): six inputs, namely expected student turnout, past consumption and leftover records, dish and menu popularity, day of week, weather, holidays/exams/campus events, go into a Prediction Engine that learns demand per meal per day and outputs recommended servings/kg to prepare. A live dashboard tracks waste prevented, money saved and estimated carbon-emission reduction, meal after meal.
Differentiators to build: Indian mess context (thali menu, INR), works with manual entry, explainable forecasts (why this number), student Eating/Skipping loop that feeds turnout, Surplus Rescue with a food-safety timer, honest accuracy backtest.

## 2. Users and roles (demo role switcher, no login)
Mess Manager (primary), Admin/Warden/Sustainability Officer, Student.

## 3. One application
- Single origin: the browser only ever uses http://localhost:3000. Next.js rewrites /api/* to FastAPI (host dev: http://127.0.0.1:8000, Docker: http://backend:8000). No hardcoded port 8000 in client code. One typed API client with relative URLs.
- One start command (scripts/dev.sh) and one full-Docker command (scripts/up.sh).
- Backend demo API at /api/v1/demo with seeded synthetic data. All demo data is labelled "Demo data (synthetic)" in the UI and "data_source":"synthetic_demo" in responses. No number on any screen may be hardcoded in the UI; everything comes from the API.
- Do NOT modify existing auth/security code (backend/app/security, deps.py, routers/auth.py, the Phase 2 migration, .env).

## 4. Visual identity
Theme name: "Harvest Green". Warm, premium, calm, sustainable, not a startup-template look.
Color tokens (CSS variables):
- forest-950 #0E2412 (sidebar, hero), forest-900 #1A3A1A (deck green), forest-700 #2F5E2F, leaf-500 #3E9B66, leaf-400 #5BBE85, mint-100 #E6F4EA
- cream-50 #FAF8F2 (app background), cream-100 #F3EFE4, border #E3DED0
- amber-500 #E8A33D (accent/CTA), amber-600 #C9831F
- terracotta-500 #C8553D (waste, alerts), teal-500 #2F8F9D (carbon)
- ink-900 #14211A, ink-600 #4A5A50
Metric color language, used consistently everywhere: kg saved = leaf green, INR = amber, CO2e = teal, waste = terracotta.
Typography (next/font, with system fallbacks): Fraunces (serif) for display headings, Inter for UI, tabular-nums for all numbers.
Shape: cards radius 16, hero panels 24, soft green-tinted shadows, hairline borders, glass panels only over 3D scenes. Icons: lucide-react plus FoodIcon/3D models. No emoji in UI.
Motion: durations 150/250/500 ms, ease-out; count-up KPIs; staggered card entrance; chart draw-in; number tweening; page transitions; 3D idle loops. Respect prefers-reduced-motion.
Realism for 3D: HDRI environment (public/hdri if present, else a drei preset), ACES tone mapping, ContactShadows, subtle bloom on emissive only, correct color management.

## 5. Layout (a real app, not a website)
- Shell: left sidebar 264px collapsible to a 72px icon rail. Contents: logo (leaf + plate mark, "PlateWise.ai"), mess switcher card with live status dot, nav groups: Operate (Dashboard, Today's Plan, Log Meals), Intelligence (Forecast Lab, Simulate Today, Menu Planner), Impact (Impact and Reports), Experience (Student App, Plate Studio). Footer: Demo Director, About/Credits, role badge.
- Top bar: page title and breadcrumb, current meal chip (Breakfast/Lunch/Dinner with countdown to next service), global search / Cmd+K command palette, notifications bell (alerts: exam, rain, surplus), "Demo data (synthetic)" badge, role switcher.
- Content: 12-column grid, max width 1440, sticky page headers, right-side detail drawers. Every mess page gets a tab bar: Overview | Plan | Plate Studio | Logs.
- Mobile: bottom tab bar (5 items) plus a "Log meal" floating action button. Student App renders inside a phone frame on desktop and full-screen on mobile.
- Everywhere: loading skeletons, empty states, error states with Retry, toasts, optimistic updates, keyboard shortcuts (g then d/p/f etc.), visible focus rings.
- Demo Director: floating panel (bottom-right): Reset demo, Fast-forward service, toggle Exam day / Rain / Campus event, Presenter mode (larger text, hides dev routes), and a 6-step guided tour mapped to the deck slides (problem, inputs, engine, output, impact, student loop).

## 6. Screens
1. Dashboard: KPI strip (kg saved, INR saved, CO2e avoided, forecast accuracy) with count-up and sparklines; "With vs Without PlateWise" waste chart (30 days); Next Service card (meal, time, recommended total kg, turnout range gauge, Approve Plan button); alerts feed (e.g., "Tomorrow: exam + rain, expect 18% lower turnout"); top wasted dishes; compact 3D kitchen scene in a glass panel; Plate Studio widget (today's average plate kcal, most popular plate, pre-plates for the next meal, and a "Build a plate" button).
2. Today's Plan: meal tabs; per-dish cards (icon or 3D thumbnail, recommended servings and kg, vs last week, confidence bar, driver chips); turnout gauge; driver waterfall chart; surplus-risk meter with food-safety countdown and redistribution suggestions; 3D tray where plate count equals recommended servings; baking/prep progress tied to Approve Plan.
3. Forecast Lab: the six deck inputs as live controls (turnout, history window, menu popularity, day of week, temperature and rain, exam/holiday/event toggles) -> animated flow Inputs -> Prediction Engine -> Recommended servings/kg (pulses on change) -> result with range and driver waterfall; backtest card (error vs two baselines).
4. Simulate Today: split view "Guesswork" vs "PlateWise"; arrival timeline 12:00-14:00; plates filling and emptying; counters 100/75/25 vs PlateWise numbers; play/pause/speed; final savings summary.
5. Log Meals: keyboard-first form (meal, dish, prepared kg, consumed kg, leftover kg, turnout), recent logs table, CSV upload with client-side validation, success toasts; shows how logs affect accuracy.
6. Menu Planner: week grid 7x3, dish chips, per-cell predicted waste and cost, deterministic "Optimize" suggestions that swap high-waste dishes.
7. Impact and Reports: totals, friendly equivalents, editable assumptions (INR per kg, CO2e per kg, with a note to verify the source), monthly trend, print-optimized report (window.print), 3D forest that grows with CO2e avoided.
8. Student App: today's menu cards, Eating/Skipping toggle with cutoff time, rating, "waste warrior" points; tapping Skipping visibly changes the manager's forecast; plate builder step.
9. Welcome/About: the story and a credits page for all 3D models (reads public/models/CREDITS.md).
10. Plate Studio: a 3D plate (and a thali variant). A food palette; tapping + / - adds or removes pieces with a drop-in animation and count badges. Totals tween live: calories, optional macros, cost in INR, CO2e, and a data-driven hint. Neutral wording only, no "good/bad food" labels, a descriptor Light / Moderate / Hearty with editable thresholds, and the note "General information, not medical or dietary advice". Save plate (counts as a pre-order that feeds a capped demand signal), a shareable plate card, and a "popular plates" row. Foods without a GLB use their Kenney image as a billboard sprite or a procedural shape (roti disc, rice mound).

## 7. Data and API (demo mode, setting DEMO_MODE default true in development, false in production)
Dataset: deterministic seeded; 120 days x 3 meals x 2 messes ("Boys Hostel Mess A", "Central Cafeteria"); 16 dishes (dal tadka, jeera rice, roti, paneer butter masala, rajma, chole bhature, poha, idli sambar, veg biryani, aloo gobi, kadhi pakora, curd, gulab jamun, tea, mixed veg, salad) with popularity, cost per kg, serving weight; weekday effects, exams, holidays, events, rain, temperature. Guesswork baseline wastes 22-28%; PlateWise should land around 8-12% on the held-out period, computed honestly, never hardcoded.
Model: explainable (driver contributions per prediction, p10-p90 range). Train on first ~92 days, backtest last ~28, compare MAPE with cook-for-capacity and same-weekday-last-week.
Per-item foods: Data lives in ONE editable file, backend/app/demo/foods.json: id, name, category, veg flag, unit label ("1 piece"), kcal_per_unit, optional protein_g / carbs_g / fat_g, cost_inr_per_unit, co2e_g_per_unit, max_per_plate, model_id (optional GLB id), icon_id (optional Kenney image id), note. Put a comment: "kcal values are approximate per standard serving; verify against IFCT 2017, USDA FoodData Central or packaging before the demo." For now seed about 20 common mess foods with placeholder values and mark every one "verified": false; I will replace this file with my own table. No calorie number may be hardcoded in the UI.
Endpoints (/api/v1/demo): GET /messes, GET /overview, GET /plan, POST /forecast (what-if, strict Pydantic bounds), GET /backtest, GET /simulate-day, GET /impact (with assumptions block, using DEFAULT_COST_PER_KG_INR and DEFAULT_EMISSION_FACTOR_CO2E), POST /log (in-memory, capped 500), POST /rsvp (in-memory, capped; feeds turnout), POST /reset, GET /foods, POST /plates/evaluate (items [{food_id, count}], max 12 distinct items, count 1-10, strict Pydantic bounds), POST /plates (in-memory, capped at 500), GET /plates/popular.

## 8. 3D and GLB integration
- Originals live in frontend/assets-src/models (git-ignored). Optimized copies in public/models. Keep the model registry and the dev-only /dev/models inspector.
- Before using models, INSPECT the registry and propose a role mapping to me (model -> screen role). Roles: kitchen hero props (Dashboard glass panel and Welcome); Today's Plan tray (instanced plates/bowls = servings); baking sequence (bread or loaf: dough rises and shifts raw -> golden via material color and emissive, steam sprites, flickering oven glow, bound to prep progress); Impact forest (growth tied to CO2e; use procedural trees if no tree model); micro 3D loaders and empty states; Plate Studio (plate/thali, snap-to-slot, soft shadows, orbit controls, one Canvas on that page).
- Budgets: max 3 Canvas per page, DPR <= 1.5, frameloop "demand" when off-screen, each model <= 1.5 MB, <= 6 MB GLB per screen, meshopt decoder, preloading, Suspense fallbacks, static poster fallback on mobile or reduced motion.

## 9. Definition of done
One URL works end to end; no hardcoded numbers; every screen has loading/error/empty states; keyboard accessible; npm run build and backend tests pass; Demo Director tour completes in 3 minutes; README and DEMO_SCRIPT.md written; known limitations listed honestly; Plate Studio works in every mess tab, on the Dashboard and in the Student App; no nutrition number is hardcoded in the UI.

## 10. Rules
Work in phases; after each phase list changed files, show build/test results, tell me exactly what to open, then STOP until I type "next". No commits, no docker commands (give me the commands), no .env edits (tell me what to add). Keep files small. Fix your own build errors.
Phases: Phase 1 also builds the foods and plates endpoints with tests (no UI). New PHASE 4b: Plate Studio UI. Step 1: plate evaluation UI with 2D icons and live totals. Step 2: the 3D plate, thali, drop-in animations and GLB/sprite integration. Step 3: hints, per-mess tabs, Dashboard widget and Student App step.
