# PlateWise AI — Fieldwork & Real Data Collection Protocol

This guide outlines the standard operating procedures for cafeteria managers, student volunteers, and audit teams to collect, verify, and import authentic dining data into **PlateWise AI**, replacing synthetic estimates with campus-measured ground truth.

---

## 1. Fieldwork Overview

PlateWise AI operates on a **truth-in-labelling** model:
- **Demo Data (Synthetic)**: Calibrated baselines generated from academic literature and typical collegiate menus.
- **College Data (Imported)**: Ground truth derived directly from physical kitchen scale measurements, institutional batch recipes, and turnstile turnouts.

---

## 2. Step-by-Step Fieldwork Protocol

### Step 1: Serving Weight Sampling (`serving_weight_g`)
1. **Equipment**: Use a calibrated commercial digital kitchen scale (minimum 5 kg capacity, ±1 g precision).
2. **Tare Procedure**: Place empty institutional serving ware (stainless steel katori, thali, or plate) on the scale and press **Tare / Zero**.
3. **Sampling Count**: For each dish, weigh **10 consecutive portions** served by mess staff during regular service hours to account for operator ladle variance.
4. **Average & Record**: Compute the arithmetic mean weight in grams:
   $$\text{serving\_weight\_g} = \frac{1}{10} \sum_{i=1}^{10} w_i$$
5. Note the measurement date (`measured_on`, format `YYYY-MM-DD`).

### Step 2: Batch Recipes & Ingredient Analysis (`source_type = recipe`)
When lab testing is unavailable, standard institutional recipes provide accurate nutritional profiles:
1. **Raw Ingredient Weighing**: Record total raw ingredients used for a cooked batch (e.g., 20 kg raw toor dal, 1.5 kg desi ghee, 0.4 kg mustard seeds).
2. **Batch Portion Count**: Record total portions yielded by the batch.
3. **Ingredient Library**: Reference verified values from the **ICMR - National Institute of Nutrition (NIN) Indian Food Composition Tables (IFCT 2017)** or USDA FoodData Central.
4. **Recipe Calculator**: Input raw ingredient quantities and batch servings into the PlateWise Recipe Calculator drawer. It calculates per-serving calories, protein, carbs, fat, and fiber, saving the recipe specification JSON with `source_type=recipe`.

### Step 3: Serving Cost Accounting (`cost_inr_per_serving`)
1. Retrieve institutional bulk procurement invoices from the mess contractor or university purchasing division (e.g., ₹95/kg dal, ₹32/kg rice, ₹55/liter oil).
2. Calculate total raw commodity batch cost and divide by batch portions:
   $$\text{cost\_inr\_per\_serving} = \frac{\text{Total Batch Ingredient Procurement Cost (INR)}}{\text{Total Batch Servings}}$$

### Step 4: Real Meal-Log Shift Recording (`logs/import`)
For every meal shift (Breakfast, Lunch, Dinner):
1. **Prep Weight (`prepared_kg`)**: Weigh all cooked staging gastro-norm trays before service opens minus tray tare.
2. **Leftover Weight (`leftover_kg`)**: Weigh all unserved food remaining in service counters and hot-holding units at the end of service.
3. **Consumed Weight (`consumed_kg`)**:
   $$\text{consumed\_kg} = \text{prepared\_kg} - \text{leftover\_kg}$$
4. **Turnout (`turnout`)**: Record total student diners from RFID turnstile counts, biometric scans, or token logs.
   > **Privacy Guarantee**: Only aggregate batch quantities and headcount integers are recorded. Never log individual student meal selections or personal identifiers.

---

## 3. CSV Import & Cross-Check Validation

PlateWise enforces three automated validation gates before writing records:

1. **Serving vs 100g Consistency**:
   Flags warnings if stated $\text{kcal\_per\_serving}$ diverges by **>15%** from:
   $$\frac{\text{kcal\_per\_100g} \times \text{serving\_weight\_g}}{100}$$
2. **Macro Energy Consistency**:
   Flags warnings if stated calories diverge by **>20%** from the Atwater macro sum:
   $$4 \times \text{protein\_g} + 4 \times \text{carbs\_g} + 9 \times \text{fat\_g}$$
3. **Biological Bounds**:
   Flags portions outside typical single-serving bounds (serving weight 5–800 g; calories 0–1500 kcal).

---

## 4. Truthful Mess Labelling

When real kitchen logs are imported for a dining hall:
- The mess badge automatically updates from **Demo data (synthetic)** to **College data (imported)** across Overview, Plan, and Menu views.
- The forecast engine incorporates recent observed leftover shifts into daily batch recommendations.
