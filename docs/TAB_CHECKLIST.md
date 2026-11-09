# PlateWise AI — Tab & Screen Verification Checklist

This document is the verified audit and test checklist for all screens, tabs, forms, and interactive controls in PlateWise AI, conforming to **Section 11: Interactivity and Persistence Rules** of `docs/APP_BRIEF.md`.

---

## 1. Screen & Tab Checklist Summary

| Screen / Tab | URL Route | Purpose | Key Actions / Interactivity | Persistence / State | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard** (Overview) | `/dashboard` | Executive dining telemetry & KPIs | Count-up metrics, 30-day waste chart, Next Service gauge, Approve Plan, Alerts feed, Plate Studio Intelligence widget | `demo_overview`, `demo_plan_approval`, `pw_mess` cookie | **Complete** |
| **Today's Plan** (Batch Cook Sheet) | `/today` | Kitchen production station schedule | Meal shift tabs (Breakfast/Lunch/Dinner), per-dish recommended portions, driver chips, surplus risk countdown, print token sheet, Approve Plan | `demo_plan`, `demo_weekly_menus`, `demo_rsvps` | **Complete** |
| **Forecast Lab** | `/forecast` | What-if simulation engine | 6 deck inputs (Turnout, history, popularity, day-of-week, rain/temperature, exam/event toggles), animated input-to-engine pipeline, driver waterfall, backtest comparison | `PredictionEngine.predict()`, `demo_backtest` | **Complete** |
| **Simulate Today** | `/simulate` | Service rush split comparison | "Guesswork" (100/75/25 waste) vs "PlateWise" service rush timeline (12:00 to 14:00), cumulative eaten/leftover graphs, play/pause controls, savings summary | `/api/v1/demo/simulate-day` | **Complete** |
| **Log Meals** | `/log` | Kitchen weigh-scale ledger | Single-entry form, dynamic catalog dish selector, CSV template download & batch import, inline edit and delete on recent logs table | `demo_meal_logs` table (FIFO capped at 500) | **Complete** |
| **Menu Planner** | `/menu` | 7-day x 3-meal cyclical rotation | 7x3 cyclical grid per mess hall, dish removal & addition from catalog, live per-cell predicted waste (kg) & cost (₹), AI Menu Optimizer with high-waste swap recommendations | `demo_weekly_menus` table | **Complete** |
| **Foods & Calories** | `/foods` | Institutional dining catalog | Search & category filtering, verified vs "estimate, edit me" status badges, FoodDrawer (add/edit items with macros, costs, portions), AssetPickerModal (201 GLB models + Kenney sprites), delete confirmation | `demo_foods` table | **Complete** |
| **Plate Studio** | `/plate-studio` | 3D Plate & Thali Builder | Orbital 3D Canvas (thali vs ceramic plate), food palette portion counters (`+`/`-`), live tweened calories, macros, cost (₹), and CO2e, Light/Moderate/Hearty descriptor with editable threshold sliders, non-medical disclaimer, Save Plate pre-order signal, popular plates shelf | `demo_plates`, `demo_plate_items` (FIFO capped at 500) | **Complete** |
| **Impact Ledger** | `/impact` | Carbon & cost savings ledger | Total kg saved, INR saved, CO2e avoided, equivalence metrics (trees planted, car-km, meals redistributed), IPCC & FAO documentation accordion | Settings & environmental conversion constants | **Complete** |
| **Student Portal** | `/student` | Student dining companion | Digital meal RSVP (attending vs skipping with live turnout delta adjustment), live queue density & wait time sensors, Plate Studio launch banner, Clean Plate campus hostel leaderboard | `demo_rsvps` (FIFO capped at 1000) | **Complete** |
| **Mess Settings** | `/settings` | Dining facility administration | Edit mess name, nominal headcount capacity, location label, shift operating hours (breakfast, lunch, dinner), facility switcher, protected mess deletion (requires &gt; 1 facility) | `demo_messes` table | **Complete** |
| **Welcome Landing** | `/welcome` | Story & product introduction | Hackathon deck story ("Don't just save food, save the climate behind it"), 100/75/25 breakdown, system architecture, team credentials | Static showcase | **Complete** |

---

## 2. Shell & Global Components

| Component | Location | Interaction & Verification | Status |
| :--- | :--- | :--- | :--- |
| **TopBar** | Global Top Header | Displays deterministic date formatting, live backend status indicator, active mess hall dropdown with checkmarks, "+ Add Dining Hall..." modal trigger, search shortcut (`Cmd+K`) | **Complete** |
| **Sidebar** | Global Left Nav | Dynamic active mess card, collapsed/expanded toggle, direct links to all 10 management screens, badge tags ("Live", "AI", "Rush", "Edit", "3D") | **Complete** |
| **Add Mess Modal** | Cmd+K / Switcher | Creates persistent dining halls (`POST /api/v1/demo/messes`) with bounds validation: name, capacity (50-5000), location, and meal shift hours | **Complete** |
| **Mess Tabs** | `/dashboard`, `/today`, `/plate-studio`, `/log` | Uniform sub-navigation: `Overview | Plan | Plate Studio | Logs` preserving active mess selection | **Complete** |
| **Demo Director** | Bottom-Right Floating | Quick scenario toggles (Exam Day, Heavy Rain, Campus Event), Presenter Mode, and `POST /reset` action restoring initial seed state | **Complete** |

---

## 3. End-to-End Smoke Test Execution Results

Executed via `scripts/smoke_test.py`:

```text
=================================================================
PlateWise AI — End-to-End Application Smoke Test
=================================================================

--- [1/2] Testing Next.js Frontend Routes ---
  [PASS] /dashboard         -> HTTP 200 (44094 bytes)
  [PASS] /today             -> HTTP 200 (41988 bytes)
  [PASS] /forecast          -> HTTP 200 (41645 bytes)
  [PASS] /simulate          -> HTTP 200 (41653 bytes)
  [PASS] /log               -> HTTP 200 (52716 bytes)
  [PASS] /menu              -> HTTP 200 (43683 bytes)
  [PASS] /foods             -> HTTP 200 (45804 bytes)
  [PASS] /plate-studio      -> HTTP 200 (64462 bytes)
  [PASS] /impact            -> HTTP 200 (46376 bytes)
  [PASS] /student           -> HTTP 200 (52118 bytes)
  [PASS] /settings          -> HTTP 200 (50344 bytes)
  [PASS] /welcome           -> HTTP 200 (61698 bytes)

--- [2/2] Testing In-Process FastAPI Application (Active Workspace Code) ---
  [PASS] GET  /api/v1/demo/messes                              -> HTTP 200
  [PASS] GET  /api/v1/demo/overview?mess_id=mess-boys-a        -> HTTP 200
  [PASS] GET  /api/v1/demo/plan?mess_id=mess-boys-a&meal=Lunch -> HTTP 200
  [PASS] GET  /api/v1/demo/foods                               -> HTTP 200
  [PASS] GET  /api/v1/demo/menus?mess_id=mess-boys-a           -> HTTP 200
  [PASS] GET  /api/v1/demo/logs?limit=10                       -> HTTP 200
  [PASS] GET  /api/v1/demo/plates/popular                      -> HTTP 200
  [PASS] GET  /api/v1/demo/backtest                            -> HTTP 200
  [PASS] GET  /api/v1/demo/simulate-day                        -> HTTP 200
  [PASS] GET  /api/v1/demo/impact                              -> HTTP 200
  [PASS] GET  /api/v1/demo/foods/export                        -> HTTP 200 (CSV)
  [PASS] GET  /api/v1/demo/ingredients                         -> HTTP 200
  [PASS] GET  /api/v1/demo/menu?mess_id=mess-boys-a            -> HTTP 200 (alias)
  [PASS] GET  /api/v1/demo/log?limit=10                        -> HTTP 200 (alias)
  [PASS] POST /api/v1/demo/forecast                            -> HTTP 200
  [PASS] POST /api/v1/demo/plates/evaluate                     -> HTTP 200
  [PASS] POST /api/v1/demo/menus/optimize                      -> HTTP 200
  [PASS] POST /api/v1/demo/foods/import                        -> HTTP 200 (dry_run)
  [PASS] POST /api/v1/demo/logs/import                         -> HTTP 200

=================================================================
SMOKE TEST SUMMARY: 31/31 Passed (100% Pass: True)
  Frontend Routes (Next.js):     12/12 Passed
  Backend Endpoints (FastAPI):    19/19 Passed
=================================================================
```

Unit & Integration Test Suite (`pytest backend/tests/test_demo_api.py backend/tests/test_real_data.py`):
- **32 passed in 0.85s** (100% pass rate).

---

## 4. User Walkthrough: Exact Things to Click Through

Follow these steps in your browser at `http://localhost:3000`:

### Step 1: Mess Switcher & Hydration Verification
1. Go to `http://localhost:3000/dashboard`.
2. Notice the top bar renders immediately with zero hydration flicker or console errors.
3. Click the dining hall dropdown in the top-right (defaults to **Boys Hostel Mess A**).
4. Select **Central Dining Pavilion**. Notice that KPI figures, recent logs, and cook sheets immediately switch to Central Pavilion.
5. Click **+ Add Dining Hall...** (or press `Cmd+K` / click the plus icon in the sidebar).
6. Enter name `"Girls Hostel Mess C"`, capacity `750`, location `"South Campus - Block 11"`. Click **Create Dining Hall**. Notice it appears immediately in the switcher and sidebar.

### Step 2: Foods & Calories Manager
1. Click **Foods & Calories** in the sidebar (or visit `/foods`).
2. Observe the catalog of 24 authentic items. Notice that items have the amber pill badge `"estimate, edit me"`.
3. Click any row (e.g. **Dal Tadka**). The `FoodDrawer` slides in from the right.
4. Change calories from `150` to `165`, and check the box **Confirm verified nutritional data**.
5. Click **Change Asset...** to open the `AssetPickerModal`. Browse between the **3D GLB Models** tab (201 Kenney models) and **Kenney Icons** tab. Select an icon or model and click **Apply Selection**.
6. Click **Save Changes**. Notice Dal Tadka now displays the green **Verified** badge.
7. Click **Add New Food**, fill in `"Masala Dosa"`, category `"breakfast"`, calories `220`. Save it and verify it persists at the top of the catalog.

### Step 3: Menu Planner & AI Optimizer
1. Click **Menu Planner** in the sidebar (or visit `/menu`).
2. View the 7x3 cyclical weekly roster (Monday through Sunday x Breakfast/Lunch/Dinner) for your active mess.
3. In any cell (e.g. Monday Lunch), click **+ Add Dish**. Select an item from your catalog (including any newly created dishes). Notice it gets added with live predicted waste (kg) and cost (₹).
4. Click the small **x** on any dish chip to remove it.
5. Click the glowing **Run AI Optimizer** button in the header.
6. The AI recommendations card appears highlighting high-leftover slots (e.g., swapping Paneer Butter Masala on Thursday lunch with Dal Tadka).
7. Click **Apply Swap**. Notice the slot immediately updates with the optimized dish.

### Step 4: Plate Studio (3D & Nutrition Tweening)
1. Click **Plate Studio** in the sidebar or from the top mess tab bar (or visit `/plate-studio`).
2. The interactive 3D Canvas renders a stainless steel thali with orbital controls. Drag with your mouse to rotate the plate 360°; scroll to zoom.
3. Toggle between **Stainless Thali** and **Ceramic Plate**.
4. In the Catalog Palette on the right, click `+` and `-` on Roti, Dal Tadka, Jeera Rice, and Gulab Jamun. Watch the items appear on the 3D plate and watch the calories, macros (protein/carbs/fat), cost in INR, and CO2e in grams tween live.
5. Notice the **Light / Moderate / Hearty** descriptor changes automatically.
6. Click **Adjust Light / Moderate / Hearty thresholds** to slide the cutoffs and customize classification.
7. Enter a name in the form (e.g. `"Exam Power Thali"`) and click **Save Plate**. Notice the toast confirms pre-order demand recording.
8. Scroll down to the **Popular Campus Plates** shelf. Click **Load Onto Plate** on any preset (e.g. "High-Protein Study Plate"). Notice the 3D plate and counters instantly populate with that preset.

### Step 5: Weigh-Scale Meal Logging & Closed-Loop Calibration
1. Click **Log Meals** in the sidebar or from the mess tab bar (or visit `/log`).
2. In the **Dish Recipe** selector, observe that all items from your persistent catalog appear dynamically.
3. Log a service entry: Date `2026-11-03`, Meal `Lunch`, Prepared `70.0 kg`, Consumed `65.0 kg` (Leftover auto-fills to `5.0 kg`), Turnout `720`.
4. Click **Record Kitchen Shift**. The log appears in the table below and updates the closed-loop feedback indicator.
5. In the recent logs table, click the **Edit** icon on any row to open the edit dialog. Adjust prepared or leftover weight and click **Save Changes**.
6. Visit `/today` or `/forecast`. Notice that recent logs have recalibrated the forecast and generated the explainable **Recent Meal Logs Feedback** driver chip!

### Step 6: Student Portal & RSVP Loop
1. Click **Student App** in the sidebar (or visit `/student`).
2. Under "Will you be dining at [Active Mess] for Lunch today?", click **Skipping Meal**.
3. Notice the feedback shows the negative headcount signal has been recorded.
4. Visit `/today` and notice the **Live Student RSVPs** driver chip and adjusted p10-p90 turnout range.

### Step 7: Mess Settings & Protected Deletion
1. Click **Mess Settings** in the sidebar (or visit `/settings`).
2. Switch between facilities using the facility switcher bar.
3. Change capacity from `850` to `900`, update location label to `"North Campus - Tower A"`, and click **Save Settings**.
4. If you have more than 1 mess, the **Delete Dining Hall** button is active with a two-step confirmation. If only 1 facility remains, the delete button is safely disabled with an explanatory tooltip.
