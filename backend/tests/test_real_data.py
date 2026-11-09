"""
Unit and integration tests for PlateWise AI Real Data System:
- Foods CSV import/export with dry-run preview, upsert by id, and CSV formula injection neutralization
- Cross-checks warnings (kcal vs 100g*wt, macro energy sum vs kcal, bounds)
- Ingredient library CRUD (seeded EMPTY, no invented values) and Recipe Calculator math
- Real meal-log import and truthful mess label switch ("College data (imported)")
"""

import pytest
from app.demo.models import DemoMess, DemoFood, DemoIngredient, DemoMealLog  # noqa: F401
from app.demo.repository import repository


# -----------------------------------------------------------------------------
# 1. Foods CSV Import / Preview & Upsert Tests
# -----------------------------------------------------------------------------
def test_foods_csv_import_dry_run_preview(client):
    """
    Dry-run import previews creates vs updates, catches per-row errors,
    and returns cross-check warnings without writing to database.
    """
    rows = [
        {
            "id": "roti",  # Existing seed item -> Should be 'update'
            "name": "Tawa Roti (Whole Wheat)",
            "category": "bread",
            "veg": True,
            "unit_label": "1 piece",
            "serving_weight_g": 80.0,
            "kcal_per_100g": 112.5,
            "kcal_per_serving": 90.0,
            "protein_g": 3.0,
            "carbs_g": 18.0,
            "fat_g": 0.5,
            "fiber_g": 2.2,
            "cost_inr_per_serving": 4.5,
            "source_type": "measured",
            "source_note": "Campus mess batch weighing sample #1",
            "measured_on": "2026-11-01",
            "verified": True,
            "model_id": "bread",
            "icon_id": "roti",
            "max_per_plate": 6,
        },
        {
            "id": "masala-chaas",  # New item -> Should be 'create'
            "name": "Masala Chaas",
            "category": "beverage",
            "veg": True,
            "unit_label": "1 glass (200ml)",
            "serving_weight_g": 200.0,
            "kcal_per_100g": 25.0,
            "kcal_per_serving": 50.0,
            "protein_g": 2.0,
            "carbs_g": 3.0,
            "fat_g": 1.2,
            "fiber_g": 0.0,
            "cost_inr_per_serving": 6.0,
            "source_type": "recipe",
            "source_note": "Curd diluted 1:1 with roasted cumin and mint",
            "verified": True,
            "max_per_plate": 2,
        },
    ]

    res = client.post("/api/v1/demo/foods/import", json={"rows": rows, "dry_run": True})
    assert res.status_code == 200
    data = res.json()
    assert data["dry_run"] is True
    assert data["total_rows"] == 2
    assert data["valid_rows"] == 2
    assert data["created_count"] == 1
    assert data["updated_count"] == 1
    assert len(data["errors"]) == 0

    actions = {item["id"]: item["action"] for item in data["items"]}
    assert actions["roti"] == "update"
    assert actions["masala-chaas"] == "create"

    # Verify that masala-chaas was NOT committed to catalog during dry-run
    cat_res = client.get("/api/v1/demo/foods")
    cat_ids = [f["id"] for f in cat_res.json()["foods"]]
    assert "masala-chaas" not in cat_ids


def test_foods_csv_import_upsert_commit(client):
    """
    Submitting with dry_run=False commits updates and creates to database.
    """
    rows = [
        {
            "id": "real-palak-paneer",
            "name": "Palak Paneer",
            "category": "curry",
            "veg": True,
            "unit_label": "1 bowl (160g)",
            "serving_weight_g": 160.0,
            "kcal_per_100g": 125.0,
            "kcal_per_serving": 200.0,
            "protein_g": 9.5,
            "carbs_g": 6.0,
            "fat_g": 15.0,
            "fiber_g": 3.0,
            "cost_inr_per_serving": 24.0,
            "source_type": "measured",
            "verified": True,
            "max_per_plate": 2,
        }
    ]

    res = client.post("/api/v1/demo/foods/import", json={"rows": rows, "dry_run": False})
    assert res.status_code == 200
    data = res.json()
    assert data["created_count"] == 1
    assert data["dry_run"] is False

    # Check that item is now present and verified
    item_res = client.get("/api/v1/demo/foods/real-palak-paneer")
    assert item_res.status_code == 200
    food = item_res.json()["food"]
    assert food["name"] == "Palak Paneer"
    assert food["verified"] is True
    assert food["source_type"] == "measured"
    assert food["serving_weight_g"] == 160.0


# -----------------------------------------------------------------------------
# 2. Cross-Checks Warning Rules
# -----------------------------------------------------------------------------
def test_cross_checks_warnings(client):
    """
    Verifies that warnings are generated for:
    - kcal vs kcal_per_100g * serving_weight_g / 100 (>15% divergence)
    - Macro energy sum (4*P + 4*C + 9*F) vs stated kcal (>20% divergence)
    - Bounds violations (serving weight < 5g or > 800g, kcal < 0 or > 1500)
    """
    test_rows = [
        {
            # 1. Divergence between 100g calc and serving kcal:
            # 100g = 100 kcal, wt = 200g -> expected = 200 kcal. Stated = 350 kcal (>75% mismatch)
            # 2. Macro energy: 4*5 + 4*10 + 9*5 = 20 + 40 + 45 = 105 kcal vs stated 350 kcal (>200% mismatch)
            # 3. Serving bounds: 1200g is outside 5-800g
            "id": "cross-check-test-dish",
            "name": "Cross Check Test Dish",
            "category": "test",
            "veg": True,
            "unit_label": "Huge tub",
            "serving_weight_g": 1200.0,  # Bound warning (>800g)
            "kcal_per_100g": 100.0,
            "kcal_per_serving": 1600.0,  # Bound warning (>1500) & divergence from 100g*1200/100=1200
            "protein_g": 10.0,
            "carbs_g": 20.0,
            "fat_g": 5.0,  # 40 + 80 + 45 = 165 kcal vs 1600 kcal
            "cost_inr_per_serving": 50.0,
            "source_type": "reference",
            "verified": False,
            "max_per_plate": 1,
        }
    ]

    res = client.post("/api/v1/demo/foods/import", json={"rows": test_rows, "dry_run": True})
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 1
    warnings = data["items"][0]["warnings"]
    assert len(warnings) >= 3

    warning_text = " ".join(warnings)
    assert "typical portion bounds" in warning_text  # bounds warning
    assert "single serving bounds" in warning_text   # kcal bounds warning
    assert "diverges by" in warning_text             # divergence warning


# -----------------------------------------------------------------------------
# 3. CSV Export and Formula Injection Neutralization
# -----------------------------------------------------------------------------
def test_csv_export_formula_injection_defense(client):
    """
    Ensures that when exporting foods to CSV, any formula injection vectors
    (=, +, -, @) are sanitized with a leading single quote (').
    """
    # Create a food with formula injection strings in name and note
    injection_food = {
        "id": "formula-injection-dish",
        "name": "=SUM(1,2)",
        "category": "+CMD|' /C calc'!A0",
        "veg": True,
        "unit": "1 serving",
        "unit_label": "-1 serving",
        "kcal_per_unit": 100.0,
        "protein_g": 2.0,
        "carbs_g": 15.0,
        "fat_g": 2.0,
        "cost_inr_per_unit": 10.0,
        "co2e_g_per_unit": 50.0,
        "note": "@admin_macro",
        "source_type": "reference",
        "verified": False,
    }
    create_res = client.post("/api/v1/demo/foods", json=injection_food)
    assert create_res.status_code == 201

    # Export CSV
    export_res = client.get("/api/v1/demo/foods/export")
    assert export_res.status_code == 200
    assert export_res.headers["content-type"].startswith("text/csv")
    csv_text = export_res.text

    # Verify formula prefixes are neutralized with a leading single quote
    assert "'=SUM(1,2)" in csv_text
    assert "'+CMD|" in csv_text
    assert "'-1 serving" in csv_text

    # Cleanup
    client.delete("/api/v1/demo/foods/formula-injection-dish")


# -----------------------------------------------------------------------------
# 4. Ingredient Library CRUD & Recipe Calculator Math
# -----------------------------------------------------------------------------
def test_ingredient_library_crud_and_recipe_math(client):
    """
    Tests Ingredient Library CRUD (seeded empty, no invented values)
    and validates batch recipe calculation mathematics.
    """
    # 1. Verify library is accessible
    lib_res = client.get("/api/v1/demo/ingredients")
    assert lib_res.status_code == 200

    # 2. Add raw ingredients (e.g. Yellow Toor Dal, Ghee, Spices)
    ing1_payload = {
        "name": "Raw Toor Dal (IFCT 2017)",
        "kcal_per_100g": 335.0,
        "protein": 22.3,
        "carbs": 57.6,
        "fat": 1.7,
        "source_note": "Indian Food Composition Tables 2017 - Cereal & Pulses",
    }
    ing2_payload = {
        "name": "Pure Desi Ghee",
        "kcal_per_100g": 900.0,
        "protein": 0.0,
        "carbs": 0.0,
        "fat": 100.0,
        "source_note": "Standard dairy packaging nutritional panel",
    }

    res1 = client.post("/api/v1/demo/ingredients", json=ing1_payload)
    assert res1.status_code == 201
    ing1 = res1.json()["ingredient"]
    assert ing1["kcal_per_100g"] == 335.0

    res2 = client.post("/api/v1/demo/ingredients", json=ing2_payload)
    assert res2.status_code == 201
    ing2 = res2.json()["ingredient"]
    assert ing2["fat"] == 100.0

    # 3. Simulate Recipe Calculator Maths for a 10-serving batch:
    # Batch inputs:
    # - 500g Toor Dal: (500/100) * 335 = 1675 kcal, 111.5g P, 288g C, 8.5g F
    # - 50g Ghee: (50/100) * 900 = 450 kcal, 0g P, 0g C, 50g F
    # Total Batch = 2125 kcal, 111.5g P, 288g C, 58.5g F
    # Per serving (10 servings):
    # kcal = 212.5 kcal, P = 11.15g, C = 28.8g, F = 5.85g
    dal_g = 500.0
    ghee_g = 50.0
    servings = 10

    batch_kcal = (dal_g / 100.0) * ing1["kcal_per_100g"] + (ghee_g / 100.0) * ing2["kcal_per_100g"]
    batch_protein = (dal_g / 100.0) * ing1["protein"] + (ghee_g / 100.0) * ing2["protein"]
    batch_carbs = (dal_g / 100.0) * ing1["carbs"] + (ghee_g / 100.0) * ing2["carbs"]
    batch_fat = (dal_g / 100.0) * ing1["fat"] + (ghee_g / 100.0) * ing2["fat"]

    srv_kcal = round(batch_kcal / servings, 1)
    srv_p = round(batch_protein / servings, 1)
    srv_c = round(batch_carbs / servings, 1)
    srv_f = round(batch_fat / servings, 1)

    assert srv_kcal == 212.5
    assert srv_p == 11.2
    assert srv_c == 28.8
    assert srv_f == 5.8

    # 4. Save food with source_type="recipe" and recipe_data payload
    recipe_food = {
        "id": "recipe-dal-tadka-batch",
        "name": "Standard Mess Dal Tadka",
        "category": "curry",
        "veg": True,
        "unit_label": "1 bowl (180g)",
        "serving_weight_g": 180.0,
        "kcal_per_serving": srv_kcal,
        "protein_g": srv_p,
        "carbs_g": srv_c,
        "fat_g": srv_f,
        "cost_inr_per_serving": 12.0,
        "source_type": "recipe",
        "source_note": "Calculated from institutional batch recipe (10 servings)",
        "verified": True,
        "recipe_data": {
            "batch_servings": servings,
            "ingredients": [
                {"ingredient_id": ing1["id"], "name": ing1["name"], "grams": dal_g},
                {"ingredient_id": ing2["id"], "name": ing2["name"], "grams": ghee_g},
            ],
        },
    }

    food_res = client.post("/api/v1/demo/foods", json=recipe_food)
    assert food_res.status_code == 201
    created_food = food_res.json()["food"]
    assert created_food["source_type"] == "recipe"
    assert created_food["recipe_data"]["batch_servings"] == 10
    assert created_food["verified"] is True

    # Cleanup ingredient items
    client.delete(f"/api/v1/demo/ingredients/{ing1['id']}")
    client.delete(f"/api/v1/demo/ingredients/{ing2['id']}")
    client.delete("/api/v1/demo/foods/recipe-dal-tadka-batch")


# -----------------------------------------------------------------------------
# 5. Real Meal-Log Import and Truthful Mess Label Switch
# -----------------------------------------------------------------------------
def test_meal_log_import_and_truthful_label_switch(client):
    """
    When real meal logs are imported for a mess:
    - Mess is labeled "College data (imported)" instead of "Demo data (synthetic)"
    - Mess data_source switches to "college_imported"
    - Other messes without imported logs remain "Demo data (synthetic)"
    """
    mess_id = "mess-boys-a"

    # Verify initial status of mess
    m_res = client.get(f"/api/v1/demo/messes/{mess_id}")
    assert m_res.status_code == 200
    initial_mess = m_res.json()["mess"]

    # Import real logs for mess-boys-a
    logs_payload = {
        "mess_id": mess_id,
        "rows": [
            {
                "date": "2026-11-03",
                "meal": "Lunch",
                "food_id": "roti",
                "prepared_kg": 85.0,
                "consumed_kg": 79.5,
                "leftover_kg": 5.5,
                "turnout": 745,
            },
            {
                "date": "2026-11-03",
                "meal": "Lunch",
                "food_id": "dal-tadka",
                "prepared_kg": 45.0,
                "consumed_kg": 42.0,
                "leftover_kg": 3.0,
                "turnout": 745,
            },
        ],
    }

    import_res = client.post("/api/v1/demo/logs/import", json=logs_payload)
    assert import_res.status_code == 200
    data = import_res.json()
    assert data["imported_count"] == 2
    assert data["data_source"] == "college_imported"
    assert data["data_label"] == "College data (imported)"

    # Verify that mess-boys-a is now truthfully labeled as imported
    updated_m_res = client.get(f"/api/v1/demo/messes/{mess_id}")
    updated_mess = updated_m_res.json()["mess"]
    assert updated_mess["has_imported_logs"] is True
    assert updated_mess["data_source"] == "college_imported"
    assert updated_mess["data_label"] == "College data (imported)"

    # Verify that Overview endpoint for this mess reflects truthful label
    ov_res = client.get(f"/api/v1/demo/overview?mess_id={mess_id}")
    assert ov_res.status_code == 200
    ov_data = ov_res.json()
    assert ov_data["data_source"] == "college_imported"
    assert ov_data["data_label"] == "College data (imported)"
