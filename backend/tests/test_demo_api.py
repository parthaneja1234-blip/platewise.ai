"""
Unit & Integration Test Suite for PlateWise AI Demo API (/api/v1/demo).
Tests:
- Determinism of synthetic dataset
- Forecast model backtest beating both baselines honestly
- Pydantic bounds and strict input validation
- In-memory caps on logs and custom plates
- Live student RSVP loop modifying turnout
- Plate Studio nutritional evaluation, neutral hints, and disclaimer
- DEMO_MODE toggle enforcing HTTP 404 when disabled
- Label 'data_source': 'synthetic_demo' on responses
"""

import pytest
from app.config import settings
from app.demo.data import generate_dataset, DEMO_DATASET
from app.demo.model import engine
from app.demo.store import store


def test_demo_dataset_determinism():
    """Verify that synthetic dataset generation is 100% deterministic and seeded."""
    run1 = generate_dataset()
    run2 = generate_dataset()
    assert len(run1) == 720
    assert len(run2) == 720

    for i in range(0, 720, 35):
        assert run1[i]["id"] == run2[i]["id"]
        assert run1[i]["actual_turnout"] == run2[i]["actual_turnout"]
        assert run1[i]["total_prepared_guesswork_kg"] == run2[i]["total_prepared_guesswork_kg"]
        assert run1[i]["total_prepared_platewise_kg"] == run2[i]["total_prepared_platewise_kg"]
        assert run1[i]["data_source"] == "synthetic_demo"


def test_forecast_model_beats_baselines():
    """Verify that PlateWise AI forecast model beats both guesswork baselines on held-out test data."""
    backtest = engine.backtest_cache
    assert backtest is not None

    pw_mape = backtest["baselines"]["platewise"]["mape"]
    cap_mape = backtest["baselines"]["cook_for_capacity"]["mape"]
    last_week_mape = backtest["baselines"]["same_weekday_last_week"]["mape"]

    # PlateWise must beat both baselines
    assert pw_mape < cap_mape, f"PlateWise MAPE ({pw_mape}) must be lower than capacity ({cap_mape})"
    assert pw_mape < last_week_mape, f"PlateWise MAPE ({pw_mape}) must be lower than last week ({last_week_mape})"

    # PlateWise error reduction must be positive
    assert backtest["error_reduction_vs_capacity_pct"] > 40.0
    assert backtest["error_reduction_vs_last_week_pct"] > 30.0


def test_get_messes_endpoint(client):
    """GET /api/v1/demo/messes returns active cafeterias with synthetic demo tag."""
    res = client.get("/api/v1/demo/messes")
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "synthetic_demo"
    assert len(data["messes"]) >= 2
    mess_ids = [m["id"] for m in data["messes"]]
    assert "mess-boys-a" in mess_ids
    assert "mess-central" in mess_ids


def test_create_mess_endpoint(client):
    """POST /api/v1/demo/messes creates a new mess hall with bounds validation."""
    payload = {
        "name": "Girls Hostel Mess B",
        "capacity": 750,
        "type": "hostel_mess",
        "location": "South Campus - Block 9",
        "breakfast_time": "07:30 - 09:30",
        "lunch_time": "12:00 - 14:30",
        "dinner_time": "19:30 - 21:30",
    }
    res = client.post("/api/v1/demo/messes", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "success"
    assert data["mess"]["name"] == "Girls Hostel Mess B"
    assert data["mess"]["capacity"] == 750
    assert data["mess"]["id"] == "mess-girls-hostel-mess-b"

    # Verify it now appears in GET /messes
    res_list = client.get("/api/v1/demo/messes")
    names = [m["name"] for m in res_list.json()["messes"]]
    assert "Girls Hostel Mess B" in names

    # Validation test: invalid capacity
    invalid_res = client.post("/api/v1/demo/messes", json={"name": "Bad", "capacity": 2})
    assert invalid_res.status_code == 422


def test_get_overview_endpoint(client):
    """GET /api/v1/demo/overview returns KPIs, waste percentage comparison, and 30d trends."""
    res = client.get("/api/v1/demo/overview?mess_id=mess-boys-a")
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "synthetic_demo"

    kpis = data["kpis"]
    assert kpis["kg_waste_prevented"] > 0
    assert kpis["inr_saved"] > 0
    assert kpis["co2e_avoided_kg"] > 0
    assert kpis["guesswork_waste_pct"] > 20.0
    assert kpis["platewise_waste_pct"] < 12.0
    assert len(data["trends_30d"]) > 0
    assert len(data["top_wasted_dishes"]) > 0
    assert len(data["active_alerts"]) > 0


def test_get_plan_endpoint(client):
    """GET /api/v1/demo/plan returns meal cook sheet with p10-p90 range and food-safety timer."""
    res = client.get("/api/v1/demo/plan?mess_id=mess-boys-a&meal=Lunch")
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "synthetic_demo"

    turnout_range = data["expected_turnout_range"]
    assert turnout_range["p10"] <= turnout_range["p50"] <= turnout_range["p90"]

    assert len(data["dishes"]) >= 4
    for d in data["dishes"]:
        assert d["recommended_servings"] > 0
        assert d["recommended_kg"] > 0

    assert data["total_recommended_kg"] > 0
    assert data["surplus_risk"]["shelf_life_hours"] == 3.5
    assert len(data["surplus_risk"]["redistribution_partners"]) >= 1


def test_post_forecast_success(client):
    """POST /api/v1/demo/forecast successfully evaluates what-if scenario with drivers."""
    payload = {
        "mess_id": "mess-boys-a",
        "day_of_week": 0,
        "meal": "Lunch",
        "is_exam": True,
        "is_holiday": False,
        "has_event": False,
        "rain_mm": 28.5,
        "temperature_c": 27.0,
        "menu": ["roti", "jeera-rice", "paneer-butter-masala", "dal-tadka", "curd"],
    }
    res = client.post("/api/v1/demo/forecast", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "synthetic_demo"

    assert data["predicted_turnout"] > 0
    assert data["turnout_range"]["p10"] <= data["predicted_turnout"] <= data["turnout_range"]["p90"]
    assert len(data["drivers"]) >= 2
    # Verify exam driver was captured
    exam_driver = next((d for d in data["drivers"] if "Exam" in d["name"]), None)
    assert exam_driver is not None
    assert exam_driver["direction"] == "negative"

    assert len(data["dish_recommendations"]) == 5
    assert data["total_recommended_kg"] > 0


def test_post_forecast_input_validation(client):
    """POST /api/v1/demo/forecast enforces strict Pydantic bounds."""
    # Invalid day of week (> 6)
    res = client.post("/api/v1/demo/forecast", json={"day_of_week": 7, "meal": "Lunch"})
    assert res.status_code == 422

    # Invalid rain (< 0)
    res = client.post("/api/v1/demo/forecast", json={"rain_mm": -5.0, "meal": "Lunch"})
    assert res.status_code == 422

    # Invalid rain (> 300)
    res = client.post("/api/v1/demo/forecast", json={"rain_mm": 350.0, "meal": "Lunch"})
    assert res.status_code == 422

    # Invalid temperature (> 55°C)
    res = client.post("/api/v1/demo/forecast", json={"temperature_c": 60.0, "meal": "Lunch"})
    assert res.status_code == 422

    # Invalid meal name
    res = client.post("/api/v1/demo/forecast", json={"meal": "MidnightSnack"})
    assert res.status_code == 422


def test_get_backtest_endpoint(client):
    """GET /api/v1/demo/backtest returns backtest metrics and sample prediction rows."""
    res = client.get("/api/v1/demo/backtest")
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "synthetic_demo"
    assert data["training_days"] == 92
    assert data["test_days"] == 28
    assert "platewise" in data["baselines"]
    assert "cook_for_capacity" in data["baselines"]
    assert len(data["sample_predictions"]) == 10


def test_simulate_day_service_timeline(client):
    """GET /api/v1/demo/simulate-day generates arrival timeline from 12:00 to 14:00."""
    res = client.get("/api/v1/demo/simulate-day")
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "synthetic_demo"

    timeline = data["timeline"]
    assert len(timeline) == 13
    assert timeline[0]["time"] == "12:00"
    assert timeline[-1]["time"] == "14:00"

    # Verify cumulative eaten monotonically increases
    cumulatives = [tick["cumulative_eaten_kg"] for tick in timeline]
    assert cumulatives == sorted(cumulatives)

    # Verify guesswork ends with ~25kg waste as in the deck
    assert data["guesswork_leftover_kg"] > 20.0
    assert data["platewise_leftover_kg"] < 10.0


def test_impact_ledger_and_assumptions(client):
    """GET /api/v1/demo/impact returns cost and CO2e totals with IPCC/FAO assumptions."""
    res = client.get("/api/v1/demo/impact")
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "synthetic_demo"

    assert data["kg_food_saved"] > 0
    assert data["inr_saved"] > 0
    assert data["co2e_avoided_kg"] > 0

    equivalents = data["equivalents"]
    assert equivalents["trees_planted_equivalent"] > 0
    assert equivalents["car_km_avoided"] > 0

    assumptions = data["assumptions"]
    assert assumptions["default_cost_per_kg_inr"] == settings.DEFAULT_COST_PER_KG_INR
    assert assumptions["default_emission_factor_co2e"] == settings.DEFAULT_EMISSION_FACTOR_CO2E
    assert "IPCC" in assumptions["source"]


def test_meal_log_and_memory_cap(client):
    """POST /api/v1/demo/log records kitchen logs and enforces 500 entry memory cap."""
    store.logs.clear()

    payload = {
        "mess_id": "mess-boys-a",
        "date": "2026-11-02",
        "meal": "Lunch",
        "dish_id": "roti",
        "prepared_kg": 45.0,
        "consumed_kg": 41.5,
        "leftover_kg": 3.5,
        "turnout": 680,
    }
    res = client.post("/api/v1/demo/log", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["data_source"] == "synthetic_demo"
    assert data["total_active_logs"] == 1

    # Fill beyond 500 to verify cap enforcement
    for i in range(510):
        store.add_log({**payload, "prepared_kg": float(i)})

    assert len(store.logs) == 500


def test_student_rsvp_feeds_turnout_signal(client):
    """POST /api/v1/demo/rsvp records student signals and adjusts expected turnout delta."""
    store.rsvps.clear()

    # Student 1 says Skipping
    res1 = client.post("/api/v1/demo/rsvp", json={
        "student_id": "std-101",
        "mess_id": "mess-boys-a",
        "date": "2026-11-02",
        "meal": "Lunch",
        "status": "skipping",
    })
    assert res1.status_code == 200
    assert res1.json()["net_turnout_delta"] == -1

    # Student 2 also says Skipping
    res2 = client.post("/api/v1/demo/rsvp", json={
        "student_id": "std-102",
        "mess_id": "mess-boys-a",
        "date": "2026-11-02",
        "meal": "Lunch",
        "status": "skipping",
    })
    assert res2.status_code == 200
    assert res2.json()["net_turnout_delta"] == -2

    # Check that plan reflects student RSVPs
    plan_res = client.get("/api/v1/demo/plan?mess_id=mess-boys-a&date=2026-11-02&meal=Lunch")
    assert plan_res.status_code == 200
    assert plan_res.json()["live_student_rsvp_count"] == -2


def test_get_foods_catalogue(client):
    """GET /api/v1/demo/foods returns the 22 mess foods with verified=False and comment."""
    res = client.get("/api/v1/demo/foods")
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "synthetic_demo"
    assert "kcal values are approximate" in data["comment"]
    assert len(data["foods"]) >= 22

    # Every item must have verified: False
    for f in data["foods"]:
        assert f["verified"] is False
        assert f["kcal_per_unit"] > 0
        assert f["cost_inr_per_unit"] > 0
        assert f["co2e_g_per_unit"] > 0
        assert f["unit"] != ""


def test_plate_studio_evaluate_plate(client):
    """POST /api/v1/demo/plates/evaluate calculates nutritional & carbon totals with disclaimer."""
    payload = {
        "items": [
            {"food_id": "roti", "count": 3},
            {"food_id": "dal-tadka", "count": 1},
            {"food_id": "curd", "count": 1},
            {"food_id": "green-salad", "count": 1},
        ]
    }
    res = client.post("/api/v1/demo/plates/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["data_source"] == "synthetic_demo"

    # 3*90 (roti) + 150 (dal) + 98 (curd) + 35 (salad) = 553 kcal
    assert data["total_kcal"] == 553
    assert data["protein_g"] > 15.0
    assert data["descriptor"] == "Moderate"
    assert data["disclaimer"] == "General information, not medical or dietary advice."
    assert "hint" in data
    assert data["is_veg"] is True
    assert data["item_count"] == 4


def test_plate_studio_evaluate_bounds_validation(client):
    """POST /api/v1/demo/plates/evaluate enforces item count and list size limits."""
    # Empty items -> 422
    res = client.post("/api/v1/demo/plates/evaluate", json={"items": []})
    assert res.status_code == 422

    # Count > 10 -> 422
    res = client.post("/api/v1/demo/plates/evaluate", json={"items": [{"food_id": "roti", "count": 11}]})
    assert res.status_code == 422

    # Count < 1 -> 422
    res = client.post("/api/v1/demo/plates/evaluate", json={"items": [{"food_id": "roti", "count": 0}]})
    assert res.status_code == 422

    # More than 12 distinct items -> 422
    thirteen_items = [{"food_id": f"item-{i}", "count": 1} for i in range(13)]
    res = client.post("/api/v1/demo/plates/evaluate", json={"items": thirteen_items})
    assert res.status_code == 422


def test_plate_studio_save_and_popular(client):
    """POST /api/v1/demo/plates saves plate and GET /api/v1/demo/plates/popular retrieves it."""
    payload = {
        "name": "Custom Exam Power Thali",
        "mess_id": "mess-boys-a",
        "meal": "Lunch",
        "items": [
            {"food_id": "roti", "count": 4},
            {"food_id": "paneer-butter-masala", "count": 1},
            {"food_id": "curd", "count": 1},
        ],
    }
    res = client.post("/api/v1/demo/plates", json=payload)
    assert res.status_code == 200
    saved = res.json()["plate"]
    assert saved["name"] == "Custom Exam Power Thali"
    assert saved["total_kcal"] > 600

    popular_res = client.get("/api/v1/demo/plates/popular")
    assert popular_res.status_code == 200
    popular = popular_res.json()["popular_plates"]
    assert len(popular) >= 4


def test_demo_reset_endpoint(client):
    """POST /api/v1/demo/reset clears logs and RSVPs back to seeded initial state."""
    # Add a log and an RSVP
    client.post("/api/v1/demo/log", json={
        "mess_id": "mess-boys-a",
        "date": "2026-11-02",
        "meal": "Lunch",
        "dish_id": "roti",
        "prepared_kg": 20.0,
        "consumed_kg": 18.0,
        "leftover_kg": 2.0,
        "turnout": 500,
    })
    client.post("/api/v1/demo/rsvp", json={
        "student_id": "std-reset-test",
        "mess_id": "mess-boys-a",
        "date": "2026-11-02",
        "meal": "Lunch",
        "status": "skipping",
    })

    assert len(store.logs) > 0
    assert len(store.rsvps) > 0

    reset_res = client.post("/api/v1/demo/reset")
    assert reset_res.status_code == 200
    assert len(store.logs) == 0
    assert len(store.rsvps) == 0


def test_approve_plan_endpoint(client):
    """POST /api/v1/demo/plan/approve marks plan as approved and persists in store."""
    payload = {
        "mess_id": "mess-boys-a",
        "date": "2026-11-02",
        "meal": "Lunch",
    }
    # Initial status check
    plan_res = client.get("/api/v1/demo/plan?mess_id=mess-boys-a&date=2026-11-02&meal=Lunch")
    assert plan_res.status_code == 200
    assert plan_res.json()["is_approved"] is False
    assert "sparklines" in client.get("/api/v1/demo/overview").json()["kpis"]
    dishes = plan_res.json()["dishes"]
    assert len(dishes) > 0
    assert "vs_last_week_servings" in dishes[0]
    assert "driver_chips" in dishes[0]

    # Approve
    res = client.post("/api/v1/demo/plan/approve", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["is_approved"] is True

    # Re-fetch plan
    plan_res2 = client.get("/api/v1/demo/plan?mess_id=mess-boys-a&date=2026-11-02&meal=Lunch")
    assert plan_res2.json()["is_approved"] is True


def test_get_logs_endpoint(client):
    """GET /api/v1/demo/logs returns list of service logs."""
    res = client.get("/api/v1/demo/logs?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "logs" in data
    assert len(data["logs"]) > 0
    first = data["logs"][0]
    assert "dish_id" in first
    assert "prepared_kg" in first
    assert "consumed_kg" in first
    assert "leftover_kg" in first



def test_demo_mode_disabled_returns_404(client):
    """When DEMO_MODE is False, all /api/v1/demo endpoints return HTTP 404 Not Found."""
    original_setting = settings.DEMO_MODE
    try:
        settings.DEMO_MODE = False

        res_messes = client.get("/api/v1/demo/messes")
        assert res_messes.status_code == 404

        res_overview = client.get("/api/v1/demo/overview")
        assert res_overview.status_code == 404

        res_plan = client.get("/api/v1/demo/plan")
        assert res_plan.status_code == 404

        res_foods = client.get("/api/v1/demo/foods")
        assert res_foods.status_code == 404

        res_forecast = client.post("/api/v1/demo/forecast", json={"day_of_week": 0, "meal": "Lunch"})
        assert res_forecast.status_code == 404
    finally:
        settings.DEMO_MODE = original_setting


def test_foods_crud_lifecycle(client):
    """Test full CRUD lifecycle for institutional foods catalog."""
    # 1. Create a new food
    payload = {
        "name": "Masala Dosa",
        "category": "breakfast",
        "veg": True,
        "unit": "1 piece (180g)",
        "kcal_per_unit": 220.0,
        "protein_g": 4.5,
        "carbs_g": 38.0,
        "fat_g": 6.5,
        "cost_inr_per_unit": 18.0,
        "co2e_g_per_unit": 90.0,
        "serving_weight_kg": 0.18,
        "popularity": 0.92,
        "max_per_plate": 2,
        "model_id": "bread",
        "icon_id": "dosa",
        "note": "Crisp fermented rice crepe with spiced potato filling (estimate, edit me)",
    }
    create_res = client.post("/api/v1/demo/foods", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()["food"]
    food_id = created["id"]
    assert "masala-dosa" in food_id
    assert created["kcal_per_unit"] == 220.0
    assert created["verified"] is False

    # 2. Verify in catalog
    catalog_res = client.get("/api/v1/demo/foods")
    ids = [f["id"] for f in catalog_res.json()["foods"]]
    assert food_id in ids

    # 3. Update the food (verified calorie count)
    update_res = client.put(f"/api/v1/demo/foods/{food_id}", json={
        "name": "Masala Dosa (Verified)",
        "kcal_per_unit": 235.0,
        "verified": True,
        "note": "Verified from institutional kitchen test batch",
    })
    assert update_res.status_code == 200
    updated = update_res.json()["food"]
    assert updated["name"] == "Masala Dosa (Verified)"
    assert updated["kcal_per_unit"] == 235.0
    assert updated["verified"] is True

    # 4. Delete the food
    del_res = client.delete(f"/api/v1/demo/foods/{food_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # Verify deleted
    catalog_after = client.get("/api/v1/demo/foods")
    ids_after = [f["id"] for f in catalog_after.json()["foods"]]
    assert food_id not in ids_after


def test_weekly_menu_management(client):
    """Test retrieving, editing 7x3 cyclical menu cells, and AI optimization."""
    # 1. Fetch weekly menu
    res = client.get("/api/v1/demo/menus?mess_id=mess-boys-a")
    assert res.status_code == 200
    data = res.json()
    assert len(data["menus"]) == 21  # 7 days * 3 meals

    # 2. Update a cell (Monday lunch)
    cell_payload = {
        "mess_id": "mess-boys-a",
        "day_of_week": 0,
        "meal": "Lunch",
        "dish_ids": ["roti", "jeera-rice", "paneer-butter-masala", "dal-tadka", "curd"],
    }
    cell_res = client.post("/api/v1/demo/menus/cell", json=cell_payload)
    assert cell_res.status_code == 200
    updated_cell = cell_res.json()["menu"]
    assert updated_cell["dish_ids"] == cell_payload["dish_ids"]
    assert updated_cell["predicted_waste_kg"] > 0
    assert updated_cell["predicted_cost_inr"] > 0

    # 3. AI Menu Optimizer
    opt_res = client.post("/api/v1/demo/menus/optimize", json={"mess_id": "mess-boys-a"})
    assert opt_res.status_code == 200
    opt_data = opt_res.json()
    assert opt_data["status"] == "success"
    assert opt_data["suggestions_applied"] > 0
    assert opt_data["total_projected_waste_cut_kg"] > 0


def test_meal_logs_crud(client):
    """Test creating, editing, and deleting service logs."""
    # Create log
    log_payload = {
        "mess_id": "mess-boys-a",
        "date": "2026-11-03",
        "meal": "Lunch",
        "dish_id": "dal-tadka",
        "prepared_kg": 50.0,
        "consumed_kg": 46.0,
        "leftover_kg": 4.0,
        "turnout": 710,
    }
    create_res = client.post("/api/v1/demo/log", json=log_payload)
    assert create_res.status_code == 200
    log = create_res.json()["log"]
    log_id = log["id"]

    # Update log
    update_res = client.put(f"/api/v1/demo/logs/{log_id}", json={
        "prepared_kg": 52.0,
        "consumed_kg": 48.0,
        "leftover_kg": 4.0,
        "turnout": 725,
    })
    assert update_res.status_code == 200
    updated_log = update_res.json()["log"]
    assert updated_log["prepared_kg"] == 52.0
    assert updated_log["turnout"] == 725

    # Delete log
    del_res = client.delete(f"/api/v1/demo/logs/{log_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"


def test_mess_update_and_delete_protection(client):
    """Test editing mess attributes and protection against deleting the final mess."""
    # Create temporary mess
    res_create = client.post("/api/v1/demo/messes", json={
        "name": "Temporary Wing Mess",
        "capacity": 400,
        "type": "hostel_mess",
        "location": "North Wing",
        "breakfast_time": "07:00 - 09:00",
        "lunch_time": "12:00 - 14:00",
        "dinner_time": "19:00 - 21:00",
    })
    assert res_create.status_code == 201
    mess = res_create.json()["mess"]
    mess_id = mess["id"]

    # Update mess
    res_update = client.put(f"/api/v1/demo/messes/{mess_id}", json={
        "name": "Renovated Wing Mess",
        "capacity": 450,
        "location": "North Wing - Level 1",
    })
    assert res_update.status_code == 200
    assert res_update.json()["mess"]["name"] == "Renovated Wing Mess"
    assert res_update.json()["mess"]["capacity"] == 450

    # Delete mess
    res_del = client.delete(f"/api/v1/demo/messes/{mess_id}")
    assert res_del.status_code == 200
    assert res_del.json()["status"] == "success"


def test_feedback_loop_from_logs_to_forecast(client):
    """Verify that kitchen meal logs adapt the forecast and introduce driver chips."""
    # Record multiple logs with turnout shifted higher than average
    for i in range(5):
        client.post("/api/v1/demo/log", json={
            "mess_id": "mess-boys-a",
            "date": f"2026-11-0{i+1}",
            "meal": "Lunch",
            "dish_id": "roti",
            "prepared_kg": 60.0,
            "consumed_kg": 58.0,
            "leftover_kg": 2.0,
            "turnout": 840,  # Elevated attendance
        })

    # Request plan
    plan_res = client.get("/api/v1/demo/plan?mess_id=mess-boys-a&meal=Lunch")
    assert plan_res.status_code == 200
    plan_data = plan_res.json()
    drivers = plan_data["drivers"]

    # Recent Meal Logs Feedback driver chip should be generated
    log_driver = next((d for d in drivers if "Recent Meal Logs" in d["name"]), None)
    assert log_driver is not None, "Recent Meal Logs Feedback driver must be present"
    assert log_driver["direction"] == "positive"

