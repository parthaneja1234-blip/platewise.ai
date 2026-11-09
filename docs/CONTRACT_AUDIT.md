# PlateWise AI — Frontend/Backend API Contract Audit

This document records the comprehensive contract audit and reconciliation between the FastAPI backend response payloads and the Next.js frontend pages.

---

## 1. Executive Summary of Root Causes

Contract drift occurred across several endpoints due to independent evolution of frontend presentation features and backend mock/synthetic data generators:

1. **Naming Divergence**: Keys representing the same business concept used different identifiers across layers (e.g., `drivers` in backend vs. `turnout_drivers` in frontend; `estimated_loss_inr` vs. `cost_wasted_inr`).
2. **Missing Sub-objects / Keys**: Fields required for display (e.g. `totals`, `risk_score`, `hot_holding_temp_c`) were absent or returned under different shapes.
3. **Array vs. Object Structure**: Legacy backend returned lists of strings (e.g. `redistribution_partners: ["NGO 1", "NGO 2"]`), while frontend UI rendered contact numbers and ETAs expecting structured objects (`{ name, contact, eta_minutes }`).
4. **Unsafe Property Chaining**: Components directly invoked `.map()` or `.toLocaleString()` on properties without fallback arrays or null checks, leading to uncaught runtime `TypeError` crashes.

---

## 2. Page-by-Page Audit Matrix

### Page 1: Dashboard (`/dashboard`)
* **Endpoint**: `GET /api/v1/demo/overview`
* **Backend Return Payload**:
  * `mess_id`: `string`
  * `kpis`: `{ kg_waste_prevented, inr_saved, co2e_avoided_kg, forecast_accuracy_pct, guesswork_waste_pct, platewise_waste_pct, reduction_factor_pct, sparklines }`
  * `totals`: `{ total_prepared_guesswork_kg, total_prepared_platewise_kg, total_eaten_kg, total_waste_guesswork_kg, total_waste_platewise_kg }`
  * `trends_30d`: `Array<{ date, guesswork_waste_kg, platewise_waste_kg, waste_prevented_kg, actual_turnout, is_exam, is_holiday, is_rainy }>`
  * `top_wasted_dishes`: `Array<{ dish_id, name, dish_name, category, guesswork_waste_kg, total_waste_kg, cost_wasted_inr, estimated_loss_inr, co2e_factor }>`
  * `active_alerts`: `Array<{ id, severity, title, message, action, metric_delta }>`
  * `data_source`, `data_label`, `has_imported_logs`, `unverified_items_count`
* **Mismatches Found**:
  * `cost_wasted_inr` was previously missing from `top_wasted` (backend returned `estimated_loss_inr`).
  * `name` was previously `dish_name`.
  * `category` was omitted.
  * `action` was omitted from `active_alerts`.
  * `totals` dictionary was absent.
* **Resolution**:
  * Backend router now outputs BOTH canonical and legacy field names.
  * Frontend API client normalizes missing or legacy fields before schema validation.
  * Shared safe formatters (`formatINR`, `formatKg`, `formatPercent`, `formatNumber`) guard against `null`/`undefined`/`NaN`.
  * Every card and table is wrapped in `CardErrorBoundary`.

---

### Page 2: Today's Plan (`/today`)
* **Endpoint**: `GET /api/v1/demo/plan`
* **Backend Return Payload**:
  * `mess_id`, `mess_name`, `date`, `meal`, `is_approved`, `total_capacity`
  * `predicted_turnout`, `expected_turnout_range`, `confidence_interval`
  * `total_recommended_kg`, `total_servings`, `total_recommended_servings`, `cost_estimate_inr`, `co2e_estimate_kg`
  * `drivers`: `Array<TurnoutDriver>`
  * `turnout_drivers`: `Array<TurnoutDriver>`
  * `dishes`: `Array<DishRecommendation>`
  * `live_student_rsvp_count`, `kitchen_readiness_pct`
  * `surplus_risk`: `{ level, risk_score, shelf_life_hours, expiry_countdown_seconds, hot_holding_temp_c, redistribution_partner, redistribution_partners, safety_note }`
  * `data_source`, `data_label`, `unverified_items_count`
* **Mismatches Found**:
  * `plan.turnout_drivers` was undefined (backend only returned `drivers`). Line 442 crashed on `.map()`.
  * `surplus_risk.risk_score` was missing.
  * `surplus_risk.hot_holding_temp_c` was missing.
  * `surplus_risk.redistribution_partners` was an array of strings, while frontend expected structured objects.
  * `surplus_risk.level` was lowercase `"low"`, while frontend compared against `"Low"`.
  * `kitchen_readiness_pct` was missing.
* **Resolution**:
  * Backend now provides `turnout_drivers` (aliased with `drivers`), `kitchen_readiness_pct: 94`, and structured `redistribution_partners` with contacts and ETAs.
  * Frontend `api.ts` normalizes `turnout_drivers: raw.turnout_drivers || raw.drivers || []` and transforms string partner arrays into objects.
  * Frontend Zod schema defines `.default([])` on all arrays, preventing `undefined.map(...)` crashes.
  * All sections (Hero targets, Dish cards, Turnout drivers, Surplus meter) wrapped in `CardErrorBoundary`.

---

### Page 3: Forecast Lab (`/forecast`)
* **Endpoint**: `POST /api/v1/demo/forecast`
* **Backend Return Payload**:
  * `predicted_turnout`, `turnout_range` (`p10`, `p50`, `p90`), `nominal_base_turnout`
  * `drivers`: `Array<TurnoutDriver>`
  * `dish_recommendations`: `Array<DishRecommendation>`
  * `total_recommended_kg`, `total_recommended_servings`
  * `guesswork_comparison`: `{ guesswork_prep_kg, platewise_prep_kg, prevented_prep_kg }`
  * `mess_id`, `data_source`
* **Mismatches Found**:
  * None structurally, but missing defensive guards around `drivers.map()` and `dish_recommendations.map()` if a partial or empty object was returned.
* **Resolution**:
  * Added Zod schema with `.default([])` for `drivers` and `dish_recommendations`.
  * Wrapped forecast parameters card, results summary card, dish recommendation table, and driver waterfall in `CardErrorBoundary`.

---

### Page 4: Service Rush Simulation (`/simulate`)
* **Endpoint**: `GET /api/v1/demo/simulate-day`
* **Backend Return Payload**:
  * `service_name`, `service_window`, `total_diners`
  * `guesswork_prepared_kg`, `platewise_prepared_kg`, `actual_consumed_kg`
  * `guesswork_leftover_kg`, `platewise_leftover_kg`
  * `timeline`: `Array<{ time, arrivals, cumulative_eaten_kg, guesswork_remaining_kg, platewise_remaining_kg }>`
  * `data_source`
* **Mismatches Found**:
  * `data.timeline[currentTickIndex]` was accessed directly without checking if `data.timeline` was empty or `undefined`.
* **Resolution**:
  * In `api.ts`, `timeline` is defaulted to `[]`.
  * In `simulate/page.tsx`, `currentTick` now defaults to a fallback object if `timeline` is empty.
  * Wrapped simulation control bar, kitchen split view, and efficiency metric cards in `CardErrorBoundary`.

---

### Page 5: Meal Weigh-Scale Logs (`/log`)
* **Endpoints**: `GET /api/v1/demo/logs`, `POST /api/v1/demo/log`, `PUT /api/v1/demo/logs/{id}`, `DELETE /api/v1/demo/logs/{id}`, `POST /api/v1/demo/logs/import`
* **Backend Return Payload**:
  * `logs`: `Array<MealLog>` (`id, mess_id, date, meal, dish_id, prepared_kg, consumed_kg, leftover_kg, turnout, is_synthetic_seed, created_at`)
  * `total_active_logs`: `number`
  * `data_source`: `string`
* **Mismatches Found**:
  * Schema aligned, but needed defaults for `logs: []` and `total_active_logs: 0` when query returns empty.
* **Resolution**:
  * Added Zod validation with defaults.
  * Wrapped manual log entry card, CSV import card, and historical log table in `CardErrorBoundary`.

---

### Page 6: Menu Planner (`/menu`)
* **Endpoints**: `GET /api/v1/demo/menus`, `POST /api/v1/demo/menus/cell`, `POST /api/v1/demo/menus/optimize`
* **Backend Return Payload**:
  * `mess_id`: `string`
  * `menus`: `Array<{ id, mess_id, day_of_week, meal, dish_ids }>`
  * `count`: `number`
  * `data_source`: `string`
* **Mismatches Found**:
  * In `optimizeMenu`, `suggestions` might be undefined on empty menu data.
  * In `applySuggestion`, `current.dish_ids.map(...)` lacked null check.
* **Resolution**:
  * Added fallback array operators `(res.suggestions || [])` and `(current.dish_ids || [])`.
  * Added Zod validation for menu responses.
  * Wrapped 7x3 weekly cyclical roster and AI optimizer suggestions drawer in `CardErrorBoundary`.

---

### Page 7: Environmental & Cost Impact (`/impact`)
* **Endpoint**: `GET /api/v1/demo/impact`
* **Backend Return Payload**:
  * `kg_food_saved`: `float`
  * `inr_saved`: `float`
  * `co2e_avoided_kg`: `float`
  * `co2e_avoided_tonnes`: `float`
  * `equivalents`: `{ trees_planted_equivalent, car_km_avoided, household_days_powered, meals_redistributed_potential }`
  * `assumptions`: `{ default_cost_per_kg_inr, default_emission_factor_co2e, source, notes }`
  * `data_source`: `string`
* **Mismatches Found**:
  * Page used hardcoded state instead of dynamically querying `/api/v1/demo/impact`.
* **Resolution**:
  * Wired page to query `demoApi.getImpact()`.
  * Wrapped 3D forest scene and impact ledger metric cards in `CardErrorBoundary`.

---

### Page 8: Student App (`/student`)
* **Endpoints**: `GET /api/v1/app/student/today`, `POST /api/v1/app/student/rsvp`, `POST /api/v1/demo/rsvp`, `POST /api/v1/demo/plates`
* **Backend Return Payload**:
  * `mess_id`, `mess_name`, `date`, `day_name`, `current_meal`, `cutoff_time`, `is_cutoff_passed`
  * `menu_items`: `Array<FoodItem>`
  * `my_rsvp`: `"eating" | "skipping" | null`
* **Mismatches Found**:
  * Direct `.map()` on `menu_items` without fallback if empty.
* **Resolution**:
  * Added `(todayData.menu_items ?? []).map` fallback.
  * Wrapped each tab (Today Menu, Plate Studio, Rate & Feedback, Me Profile) in `CardErrorBoundary`.

---

### Page 9: Plate Studio (`/plate-studio`)
* **Endpoints**: `GET /api/v1/demo/foods`, `GET /api/v1/demo/plates/popular`, `POST /api/v1/demo/plates/evaluate`, `POST /api/v1/demo/plates`
* **Backend Return Payload**:
  * `popular_plates`: `Array<Plate>`
  * `plates`: `Array<Plate>` (aliased for legacy)
  * `count`: `number`
* **Mismatches Found**:
  * Direct `.map()` on `popularPlates` could fail if API returned empty object.
* **Resolution**:
  * Added fallback array operators `(popularPlates ?? []).map`.
  * Wrapped 3D plate viewport, food selector palette, live nutritional summary, and popular plates shelf in `CardErrorBoundary`.

---

## 3. Standardized Defenses Deployed

1. **Zod Runtime Schema Validation with Defaults**:
   Every API endpoint in `src/lib/api.ts` validates responses against schemas using `.default(...)` on all numbers (`0`), arrays (`[]`), and strings (`""` or canonical defaults). If the backend returns `{}` or omits fields, the client warns in the console and automatically furnishes safe defaults.
2. **Safe Formatters with Explicit `'en-IN'` Locale**:
   [`formatINR`](file:///Users/parth/Projects/platewise-ai/frontend/src/lib/formatters.ts#L22), [`formatNumber`](file:///Users/parth/Projects/platewise-ai/frontend/src/lib/formatters.ts#L44), [`formatPercent`](file:///Users/parth/Projects/platewise-ai/frontend/src/lib/formatters.ts#L65), and [`formatKg`](file:///Users/parth/Projects/platewise-ai/frontend/src/lib/formatters.ts#L87) gracefully accept `null`, `undefined`, `NaN`, `""`, and non-finite numbers and return an em dash (`—`).
3. **Card-Level Error Boundaries**:
   [`CardErrorBoundary`](file:///Users/parth/Projects/platewise-ai/frontend/src/components/CardErrorBoundary.tsx) is wrapped around every card, chart, and table across all 9 pages with isolated reset state and `onRetry` callbacks.
