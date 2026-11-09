"""
PlateWise AI Demo API Router (/api/v1/demo).
Serves deterministic seeded synthetic cafeteria intelligence datasets,
explainable forecast simulations, backtest evaluations, and Plate Studio endpoints.
Backed by the repository layer with PostgreSQL persistence in demo_ tables.
Enabled only when DEMO_MODE=True; returns 404 when disabled.
"""

import io
import csv
from datetime import date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

try:
    from app.config import settings
    from app.database import get_db
    from app.demo.data import (
        MESSES,
        MESS_MAP,
        DEMO_DATASET,
        DEMO_DATASET_BY_MESS,
        DISHES,
    )
    from app.demo.model import engine
    from app.demo.store import store
    from app.demo.repository import repository
    from app.demo.models import DemoMealLog
    from app.demo.schemas import (
        CreateMessRequest,
        UpdateMessRequest,
        CreateFoodRequest,
        UpdateFoodRequest,
        SetMenuCellRequest,
        UpdateMealLogRequest,
        ForecastRequest,
        LogMealRequest,
        RsvpRequest,
        EvaluatePlateRequest,
        SavePlateRequest,
        ApprovePlanRequest,
        FoodImportRequest,
        FoodImportRow,
        CreateIngredientRequest,
        UpdateIngredientRequest,
        MealLogImportRequest,
    )
except ImportError:
    from backend.app.config import settings
    from backend.app.database import get_db
    from backend.app.demo.data import (
        MESSES,
        MESS_MAP,
        DEMO_DATASET,
        DEMO_DATASET_BY_MESS,
        DISHES,
    )
    from backend.app.demo.model import engine
    from backend.app.demo.store import store
    from backend.app.demo.repository import repository
    from backend.app.demo.models import DemoMealLog
    from backend.app.demo.schemas import (
        CreateMessRequest,
        UpdateMessRequest,
        CreateFoodRequest,
        UpdateFoodRequest,
        SetMenuCellRequest,
        UpdateMealLogRequest,
        ForecastRequest,
        LogMealRequest,
        RsvpRequest,
        EvaluatePlateRequest,
        SavePlateRequest,
        ApprovePlanRequest,
        FoodImportRequest,
        FoodImportRow,
        CreateIngredientRequest,
        UpdateIngredientRequest,
        MealLogImportRequest,
    )


def verify_demo_mode(request: Request):
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo mode is disabled in this environment.",
        )
    if settings.ENVIRONMENT == "production" and request.method not in ("GET", "HEAD", "OPTIONS"):
        if not request.url.path.endswith("/reset"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Demo mode is read-only in production. Please log in to an authorized account for operations.",
            )


router = APIRouter(
    prefix="/api/v1/demo",
    tags=["Demo API"],
    dependencies=[Depends(verify_demo_mode)],
)


# --------------------------------------------------------------------------
# 1. Messes List & Management (CRUD)
# --------------------------------------------------------------------------
@router.get("/messes")
def get_messes(db: Session = Depends(get_db)):
    """Returns list of monitored college mess halls from persistent demo tables."""
    messes = [m.to_dict() for m in repository.get_messes(db)]
    has_imported = any(m.get("has_imported_logs") for m in messes)
    return {
        "messes": messes,
        "total_messes": len(messes),
        "data_source": "college_imported" if has_imported else "synthetic_demo",
        "data_label": "College data (imported)" if has_imported else "Demo data (synthetic)",
    }


@router.get("/messes/{mess_id}")
def get_mess_by_id(mess_id: str, db: Session = Depends(get_db)):
    """Returns details of a specific dining hall."""
    mess = repository.get_mess(db, mess_id)
    if not mess:
        raise HTTPException(status_code=404, detail=f"Mess '{mess_id}' not found.")
    m_dict = mess.to_dict()
    return {
        "status": "success",
        "mess": m_dict,
        "data_source": m_dict.get("data_source", "synthetic_demo"),
        "data_label": m_dict.get("data_label", "Demo data (synthetic)"),
    }


@router.post("/messes", status_code=status.HTTP_201_CREATED)
def create_mess(req: CreateMessRequest, db: Session = Depends(get_db)):
    """Creates a new mess hall entity with persistent storage."""
    new_mess = repository.create_mess(db, req.model_dump())
    store.add_mess(req.model_dump())
    return {
        "status": "success",
        "mess": new_mess.to_dict(),
        "message": f"Mess '{new_mess.name}' created successfully.",
    }


@router.put("/messes/{mess_id}")
def update_mess(mess_id: str, req: UpdateMessRequest, db: Session = Depends(get_db)):
    """Updates an existing dining hall configuration."""
    updated = repository.update_mess(db, mess_id, req.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Mess '{mess_id}' not found.")
    return {
        "status": "success",
        "mess": updated.to_dict(),
        "message": f"Mess '{updated.name}' updated successfully.",
    }


@router.delete("/messes/{mess_id}")
def delete_mess(mess_id: str, db: Session = Depends(get_db)):
    """Deletes a dining hall entity."""
    try:
        ok = repository.delete_mess(db, mess_id)
        if not ok:
            raise HTTPException(status_code=404, detail=f"Mess '{mess_id}' not found.")
        return {"status": "success", "message": f"Mess '{mess_id}' deleted successfully."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# --------------------------------------------------------------------------
# 2. Operations Overview & Historical KPIs
# --------------------------------------------------------------------------
@router.get("/overview")
def get_overview(mess_id: Optional[str] = Query("mess-boys-a"), db: Session = Depends(get_db)):
    """Returns high-level KPI cards and 30-day historical trend comparing guesswork vs PlateWise."""
    records = DEMO_DATASET_BY_MESS.get(mess_id, DEMO_DATASET)

    total_prep_gw = sum(r["total_prepared_guesswork_kg"] for r in records)
    total_waste_gw = sum(r["guesswork_waste_kg"] for r in records)

    total_prep_pw = sum(r["total_prepared_platewise_kg"] for r in records)
    total_waste_pw = sum(r["platewise_waste_kg"] for r in records)
    total_waste_prevented = sum(r["waste_prevented_kg"] for r in records)

    cost_per_kg = settings.DEFAULT_COST_PER_KG_INR
    co2e_factor = settings.DEFAULT_EMISSION_FACTOR_CO2E

    inr_saved = round(total_waste_prevented * cost_per_kg, 0)
    co2e_avoided_kg = round(total_waste_prevented * co2e_factor, 1)

    gw_waste_pct = round((total_waste_gw / total_prep_gw) * 100, 1) if total_prep_gw > 0 else 25.0
    pw_waste_pct = round((total_waste_pw / total_prep_pw) * 100, 1) if total_prep_pw > 0 else 8.5

    # 30-day trend chart records (last 30 days = 90 meal records)
    recent_records = records[-90:]
    chart_series = []
    for r in recent_records[::3]:  # sample one point per day
        chart_series.append({
            "date": r["date"],
            "guesswork_waste_kg": r["guesswork_waste_kg"],
            "platewise_waste_kg": r["platewise_waste_kg"],
            "waste_prevented_kg": r["waste_prevented_kg"],
            "actual_turnout": r["actual_turnout"],
            "is_exam": r["is_exam"],
            "is_holiday": r["is_holiday"],
            "is_rainy": r["is_rainy"],
        })

    # Top wasted dishes under guesswork
    dish_waste_tallies = {}
    for r in records:
        for d in r["dishes"]:
            did = d["dish_id"]
            d_waste = max(0.0, d["guesswork_prep_kg"] - d["actual_eaten_kg"])
            dish_waste_tallies[did] = dish_waste_tallies.get(did, 0.0) + d_waste

    top_wasted = []
    for did, w_kg in sorted(dish_waste_tallies.items(), key=lambda x: x[1], reverse=True)[:5]:
        d_info = DISHES.get(did, {})
        d_name = d_info.get("name", did.title())
        d_category = d_info.get("category", "curry")
        waste_kg = round(w_kg, 1)
        cost_inr = round(w_kg * d_info.get("cost_per_kg_inr", 40.0), 0)
        top_wasted.append({
            "dish_id": did,
            "dish_name": d_name,
            "name": d_name,
            "category": d_category,
            "total_waste_kg": waste_kg,
            "guesswork_waste_kg": waste_kg,
            "estimated_loss_inr": cost_inr,
            "cost_wasted_inr": cost_inr,
            "co2e_factor": d_info.get("co2e_factor", 1.5),
        })

    active_alerts = [
        {
            "id": "alert-exam-rain",
            "severity": "warning",
            "title": "Exam Period + Monsoon Rain",
            "message": "Tomorrow: Midsem exams and forecasted precipitation. Batch plan auto-adjusted by ~16%.",
            "metric_delta": "-16% turnout expected",
            "action": "-16% turnout expected",
        },
        {
            "id": "alert-surplus-pickup",
            "severity": "info",
            "title": "Surplus Redistribution Ready",
            "message": "Robin Hood Army volunteer chapter standby confirmed for 14:15 pickup.",
            "metric_delta": "38 portions staged",
            "action": "38 portions staged",
        },
    ]

    mess = repository.get_mess(db, mess_id)
    is_imported = bool(mess.has_imported_logs) if mess else False
    foods = repository.get_foods(db)
    unverified_count = sum(1 for f in foods if not f.verified)

    return {
        "mess_id": mess_id,
        "kpis": {
            "kg_waste_prevented": round(total_waste_prevented, 1),
            "inr_saved": inr_saved,
            "co2e_avoided_kg": co2e_avoided_kg,
            "forecast_accuracy_pct": 91.9,
            "guesswork_waste_pct": gw_waste_pct,
            "platewise_waste_pct": pw_waste_pct,
            "reduction_factor_pct": round(((gw_waste_pct - pw_waste_pct) / gw_waste_pct) * 100, 1) if gw_waste_pct > 0 else 0.0,
            "sparklines": {
                "kg_saved": [round(r["waste_prevented_kg"], 1) for r in recent_records[-14::3]],
                "inr_saved": [round(r["waste_prevented_kg"] * cost_per_kg, 0) for r in recent_records[-14::3]],
                "co2e_avoided": [round(r["waste_prevented_kg"] * co2e_factor, 1) for r in recent_records[-14::3]],
                "accuracy": [89.2, 91.0, 90.5, 92.4, 93.1, 91.8, 92.5],
            },
        },
        "totals": {
            "total_prepared_guesswork_kg": round(total_prep_gw, 1),
            "total_prepared_platewise_kg": round(total_prep_pw, 1),
            "total_eaten_kg": round(sum(r.get("actual_eaten_kg", 0.0) for r in records), 1),
            "total_waste_guesswork_kg": round(total_waste_gw, 1),
            "total_waste_platewise_kg": round(total_waste_pw, 1),
        },
        "trends_30d": chart_series,
        "top_wasted_dishes": top_wasted,
        "active_alerts": active_alerts,
        "data_source": "college_imported" if is_imported else "synthetic_demo",
        "data_label": "College data (imported)" if is_imported else "Demo data (synthetic)",
        "unverified_items_count": unverified_count,
    }


# --------------------------------------------------------------------------
# 3. Today's Plan & Cook Sheet
# --------------------------------------------------------------------------
@router.get("/plan")
def get_plan(
    mess_id: Optional[str] = Query("mess-boys-a"),
    date: Optional[str] = Query(None),
    meal: Optional[str] = Query("Lunch"),
    db: Session = Depends(get_db),
):
    """Returns batch cook sheet with per-dish portions, driver contributions, and surplus timer."""
    target_date = date or "2026-11-02"
    target_meal = meal or "Lunch"

    mess = repository.get_mess(db, mess_id)
    capacity = mess.capacity if mess else 850
    mess_name = mess.name if mess else "Boys Hostel Mess A"

    dow = 0  # Monday
    is_exam = False
    rain_mm = 18.0

    rsvp_delta = repository.get_net_rsvp_delta(db, mess_id, target_date, target_meal)
    log_shift = repository.get_recent_log_shift(db, mess_id, target_meal)

    # Get weekly cyclical menu for this mess
    menu_records = repository.get_weekly_menus(db, mess_id)
    matched_menu = next((m for m in menu_records if m.day_of_week == dow and m.meal.lower() == target_meal.lower()), None)
    menu_dishes = matched_menu.dish_ids if matched_menu else ["roti", "jeera-rice", "dal-tadka", "paneer-butter-masala", "curd", "salad"]

    forecast = engine.predict(
        capacity=capacity,
        meal=target_meal,
        day_of_week=dow,
        is_exam=is_exam,
        is_holiday=False,
        has_event=False,
        rain_mm=rain_mm,
        temperature_c=29.0,
        menu_dish_ids=menu_dishes,
        rsvp_delta=rsvp_delta,
        log_shift=log_shift,
    )

    dish_recs = forecast.get("dish_recommendations", [])
    total_cost = sum(d["cost_per_kg_inr"] * d["recommended_kg"] for d in dish_recs)
    total_co2e = sum(1.5 * d["recommended_kg"] for d in dish_recs)
    dish_id_set = {d.get("dish_id") for d in dish_recs}
    foods = repository.get_foods(db)
    unverified_count = sum(1 for f in foods if f.id in dish_id_set and not f.verified)

    return {
        "mess_id": mess_id,
        "mess_name": mess_name,
        "date": target_date,
        "meal": target_meal,
        "is_approved": store.is_plan_approved(mess_id, target_date, target_meal),
        "total_capacity": capacity,
        "predicted_turnout": forecast["predicted_turnout"],
        "expected_turnout_range": forecast["turnout_range"],
        "confidence_interval": forecast["turnout_range"],
        "total_recommended_kg": forecast["total_recommended_kg"],
        "total_servings": forecast.get("total_recommended_servings", forecast.get("total_servings", 0)),
        "total_recommended_servings": forecast.get("total_recommended_servings", 0),
        "cost_estimate_inr": round(total_cost, 2),
        "co2e_estimate_kg": round(total_co2e, 2),
        "drivers": forecast["drivers"],
        "turnout_drivers": forecast["drivers"],
        "dishes": dish_recs,
        "live_student_rsvp_count": rsvp_delta,
        "kitchen_readiness_pct": 94,
        "surplus_risk": {
            "level": "Low",
            "risk_score": 18,
            "shelf_life_hours": 3.5,
            "expiry_countdown_seconds": 12600,
            "hot_holding_temp_c": 68,
            "redistribution_partner": "Robin Hood Army (Campus Chapter)",
            "redistribution_partners": [
                {
                    "name": "Robin Hood Army (Campus Chapter)",
                    "contact": "+91 98765 43210",
                    "eta_minutes": 25,
                },
                {
                    "name": "Feeding India (Zomato Giving)",
                    "contact": "+91 91234 56789",
                    "eta_minutes": 40,
                },
            ],
            "safety_note": "Keep hot holding above 65°C. Safe redistribution window closes 15:30.",
        },
        "data_source": "college_imported" if (mess and mess.has_imported_logs) else "synthetic_demo",
        "data_label": "College data (imported)" if (mess and mess.has_imported_logs) else "Demo data (synthetic)",
        "unverified_items_count": unverified_count,
    }


@router.post("/plan/approve")
def approve_plan(req: ApprovePlanRequest):
    """Marks daily meal production plan as approved by Kitchen Manager."""
    store.approve_plan(req.mess_id, req.date, req.meal)
    return {
        "status": "success",
        "mess_id": req.mess_id,
        "date": req.date,
        "meal": req.meal,
        "is_approved": True,
        "message": f"Kitchen plan for {req.meal} ({req.date}) has been approved.",
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 4. Forecast Lab Simulation Endpoint
# --------------------------------------------------------------------------
@router.post("/forecast")
def post_forecast(req: ForecastRequest, db: Session = Depends(get_db)):
    """Runs explainable what-if forecast incorporating live student RSVPs and recent meal logs."""
    mess = repository.get_mess(db, req.mess_id)
    capacity = mess.capacity if mess else 850

    log_shift = repository.get_recent_log_shift(db, req.mess_id, req.meal)
    rsvp_delta = repository.get_net_rsvp_delta(db, req.mess_id, "2026-11-02", req.meal)

    result = engine.predict(
        capacity=capacity,
        meal=req.meal,
        day_of_week=req.day_of_week,
        is_exam=req.is_exam,
        is_holiday=req.is_holiday,
        has_event=req.has_event,
        rain_mm=req.rain_mm,
        temperature_c=req.temperature_c,
        menu_dish_ids=req.menu,
        rsvp_delta=rsvp_delta,
        log_shift=log_shift,
    )
    if req.expected_turnout is not None:
        result["predicted_turnout"] = req.expected_turnout

    return {
        **result,
        "mess_id": req.mess_id,
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 5. Backtest Metrics
# --------------------------------------------------------------------------
@router.get("/backtest")
def get_backtest():
    """Returns honest held-out validation metrics."""
    return {
        **engine.backtest_cache,
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 6. Simulate Day (Rush Hour Simulation)
# --------------------------------------------------------------------------
@router.get("/simulate-day")
def get_simulate_day():
    """Returns dynamic time-series breakdown for 12:00-14:00 rush hour split view."""
    time_ticks = [
        "12:00", "12:10", "12:20", "12:30", "12:40", "12:50",
        "13:00", "13:10", "13:20", "13:30", "13:40", "13:50", "14:00"
    ]
    interval_arrivals = [25, 45, 65, 95, 115, 110, 90, 75, 55, 35, 20, 10, 5]
    total_turnout = sum(interval_arrivals)
    portion_factor = 0.10067

    cumulative_eaten = 0.0
    timeline = []
    guesswork_initial_kg = 100.0
    platewise_initial_kg = 82.0

    gw_remaining = guesswork_initial_kg
    pw_remaining = platewise_initial_kg

    for t, arr in zip(time_ticks, interval_arrivals):
        eaten_this_tick = round(arr * portion_factor, 1)
        cumulative_eaten += eaten_this_tick
        gw_remaining = round(max(0.0, gw_remaining - eaten_this_tick), 1)
        pw_remaining = round(max(0.0, pw_remaining - eaten_this_tick), 1)

        timeline.append({
            "time": t,
            "arrivals": arr,
            "cumulative_eaten_kg": round(cumulative_eaten, 1),
            "guesswork_remaining_kg": gw_remaining,
            "platewise_remaining_kg": pw_remaining,
        })

    return {
        "service_name": "Lunch Service Rush Simulation",
        "service_window": "12:00 - 14:00",
        "total_diners": total_turnout,
        "guesswork_prepared_kg": guesswork_initial_kg,
        "platewise_prepared_kg": platewise_initial_kg,
        "actual_consumed_kg": round(cumulative_eaten, 1),
        "guesswork_leftover_kg": gw_remaining,
        "platewise_leftover_kg": pw_remaining,
        "timeline": timeline,
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 7. Impact & Environmental Ledger
# --------------------------------------------------------------------------
@router.get("/impact")
def get_impact():
    """Returns carbon and cost savings ledger with IPCC/FAO environmental assumptions."""
    records = DEMO_DATASET
    total_waste_prevented_kg = round(sum(r["waste_prevented_kg"] for r in records), 1)

    cost_per_kg = settings.DEFAULT_COST_PER_KG_INR
    emission_factor = settings.DEFAULT_EMISSION_FACTOR_CO2E

    inr_saved = round(total_waste_prevented_kg * cost_per_kg, 0)
    co2e_saved_kg = round(total_waste_prevented_kg * emission_factor, 1)
    co2e_saved_tonnes = round(co2e_saved_kg / 1000.0, 2)

    trees_equivalent = int(round(co2e_saved_kg / 21.7))
    car_km_avoided = int(round(co2e_saved_kg / 0.192))
    household_days_powered = int(round(co2e_saved_kg / 4.2))
    meals_redistributed = int(round(total_waste_prevented_kg / 0.35))

    return {
        "kg_food_saved": total_waste_prevented_kg,
        "inr_saved": inr_saved,
        "co2e_avoided_kg": co2e_saved_kg,
        "co2e_avoided_tonnes": co2e_saved_tonnes,
        "equivalents": {
            "trees_planted_equivalent": trees_equivalent,
            "car_km_avoided": car_km_avoided,
            "household_days_powered": household_days_powered,
            "meals_redistributed_potential": meals_redistributed,
        },
        "assumptions": {
            "default_cost_per_kg_inr": cost_per_kg,
            "default_emission_factor_co2e": emission_factor,
            "source": "IPCC Climate Change & Land Special Report; FAO Food Wastage Footprint v2",
            "notes": "Cost reflects raw bulk institutional procurement. Emission factor includes upstream agriculture, cold chain, and avoided methane landfill emissions.",
        },
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 8. Foods Catalogue CRUD (Single Unified Catalog)
# --------------------------------------------------------------------------
@router.get("/foods")
def get_foods(db: Session = Depends(get_db)):
    """Returns the unified institutional food catalogue from persistent storage."""
    foods = [f.to_dict() for f in repository.get_foods(db)]
    return {
        "foods": foods,
        "count": len(foods),
        "comment": "kcal values are approximate per standard serving; verify against IFCT 2017, USDA FoodData Central or packaging before the demo.",
        "data_source": "synthetic_demo",
    }


@router.get("/foods/export")
def export_foods_csv(db: Session = Depends(get_db)):
    """
    Exports unified food catalogue as RFC 4180 CSV with formula injection neutralization.
    Cells starting with =, +, -, @ are safely prepended with a single quote.
    """
    foods = repository.get_foods(db)

    columns = [
        "id", "name", "category", "veg", "unit_label", "serving_weight_g",
        "kcal_per_100g", "kcal_per_serving", "protein_g", "carbs_g", "fat_g", "fiber_g",
        "cost_inr_per_serving", "source_type", "source_note", "measured_on",
        "verified", "model_id", "icon_id", "max_per_plate"
    ]

    output = io.StringIO()
    writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
    writer.writerow(columns)

    def sanitize_cell(val: Any) -> Any:
        if val is None:
            return ""
        s = str(val)
        if s and s[0] in ("=", "+", "-", "@"):
            return f"'{s}"
        return s

    for f in foods:
        d = f.to_dict()
        row = [
            sanitize_cell(d.get("id")),
            sanitize_cell(d.get("name")),
            sanitize_cell(d.get("category")),
            sanitize_cell(d.get("veg")),
            sanitize_cell(d.get("unit_label") or "1 serving"),
            sanitize_cell(d.get("serving_weight_g")),
            sanitize_cell(d.get("kcal_per_100g") if d.get("kcal_per_100g") is not None else ""),
            sanitize_cell(d.get("kcal_per_serving")),
            sanitize_cell(d.get("protein_g")),
            sanitize_cell(d.get("carbs_g")),
            sanitize_cell(d.get("fat_g")),
            sanitize_cell(d.get("fiber_g")),
            sanitize_cell(d.get("cost_inr_per_serving")),
            sanitize_cell(d.get("source_type") or "reference"),
            sanitize_cell(d.get("source_note") or ""),
            sanitize_cell(d.get("measured_on") or ""),
            sanitize_cell(d.get("verified")),
            sanitize_cell(d.get("model_id") or ""),
            sanitize_cell(d.get("icon_id") or ""),
            sanitize_cell(d.get("max_per_plate") or 3),
        ]
        writer.writerow(row)

    csv_bytes = output.getvalue().encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": 'attachment; filename="platewise_foods.csv"',
            "Content-Type": "text/csv; charset=utf-8",
        },
    )


@router.post("/foods/import")
def import_foods(req: FoodImportRequest, db: Session = Depends(get_db)):
    """
    Imports or previews food catalog CSV rows with dry-run support.
    Strict Pydantic bounds, 500 rows limit, cross-checks warnings, upsert by ID.
    """
    if len(req.rows) > 500:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch exceeds 500 rows maximum limit.",
        )

    validated_rows: List[Dict[str, Any]] = []
    errors: List[Dict[str, Any]] = []

    for idx, row in enumerate(req.rows):
        try:
            clean_row = dict(row)
            if isinstance(clean_row.get("veg"), str):
                clean_row["veg"] = clean_row["veg"].strip().lower() in ("true", "1", "yes", "t", "y")
            if isinstance(clean_row.get("verified"), str):
                clean_row["verified"] = clean_row["verified"].strip().lower() in ("true", "1", "yes", "t", "y")
            if "serving_weight_g" in clean_row and clean_row["serving_weight_g"] != "":
                clean_row["serving_weight_g"] = float(clean_row["serving_weight_g"])
            if "kcal_per_serving" in clean_row and clean_row["kcal_per_serving"] != "":
                clean_row["kcal_per_serving"] = float(clean_row["kcal_per_serving"])
            if "kcal_per_100g" in clean_row and clean_row["kcal_per_100g"] != "":
                clean_row["kcal_per_100g"] = float(clean_row["kcal_per_100g"])
            elif clean_row.get("kcal_per_100g") == "":
                clean_row["kcal_per_100g"] = None

            validated = FoodImportRow(**clean_row)
            validated_rows.append(validated.model_dump())
        except Exception as e:
            errors.append({
                "row_index": idx + 1,
                "id": row.get("id"),
                "name": row.get("name"),
                "error": str(e),
            })

    if errors and not req.dry_run:
        return {
            "status": "error",
            "message": f"Validation failed for {len(errors)} rows. Please fix errors before committing.",
            "total_rows": len(req.rows),
            "valid_rows": len(validated_rows),
            "errors": errors,
            "dry_run": req.dry_run,
        }

    res = repository.import_foods_csv(db, validated_rows, dry_run=req.dry_run)
    res["errors"].extend(errors)
    res["status"] = "success" if (req.dry_run or not errors) else "partial"
    return res


@router.get("/foods/{food_id}")
def get_food_by_id(food_id: str, db: Session = Depends(get_db)):
    """Returns specific food item details."""
    food = repository.get_food(db, food_id)
    if not food:
        raise HTTPException(status_code=404, detail=f"Food item '{food_id}' not found.")
    return {"status": "success", "food": food.to_dict(), "data_source": "synthetic_demo"}


@router.post("/foods", status_code=status.HTTP_201_CREATED)
def create_food(req: CreateFoodRequest, db: Session = Depends(get_db)):
    """Creates a new food item in the unified catalog."""
    food = repository.create_food(db, req.model_dump())
    return {
        "status": "success",
        "food": food.to_dict(),
        "message": f"Food item '{food.name}' added to catalog.",
        "data_source": "synthetic_demo",
    }


@router.put("/foods/{food_id}")
def update_food(food_id: str, req: UpdateFoodRequest, db: Session = Depends(get_db)):
    """Updates food nutrition, macros, cost, model, or icon."""
    updated = repository.update_food(db, food_id, req.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Food item '{food_id}' not found.")
    return {
        "status": "success",
        "food": updated.to_dict(),
        "message": f"Food item '{updated.name}' updated successfully.",
        "data_source": "synthetic_demo",
    }


@router.delete("/foods/{food_id}")
def delete_food(food_id: str, db: Session = Depends(get_db)):
    """Deletes a food item from the catalog."""
    ok = repository.delete_food(db, food_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Food item '{food_id}' not found.")
    return {"status": "success", "message": f"Food item '{food_id}' deleted.", "data_source": "synthetic_demo"}


# --------------------------------------------------------------------------
# 8b. Ingredient Library (Seeded EMPTY)
# --------------------------------------------------------------------------
@router.get("/ingredients")
def get_ingredients(db: Session = Depends(get_db)):
    """Returns all ingredients in the library (seeded EMPTY)."""
    items = [i.to_dict() for i in repository.get_ingredients(db)]
    return {
        "ingredients": items,
        "count": len(items),
        "note": "Ingredient library is seeded EMPTY to guarantee zero invented values.",
        "data_source": "user_library",
    }


@router.post("/ingredients", status_code=status.HTTP_201_CREATED)
def create_ingredient(req: CreateIngredientRequest, db: Session = Depends(get_db)):
    """Creates a verified raw culinary ingredient."""
    ing = repository.create_ingredient(db, req.model_dump())
    return {
        "status": "success",
        "ingredient": ing.to_dict(),
        "message": f"Ingredient '{ing.name}' added to library.",
    }


@router.put("/ingredients/{ingredient_id}")
def update_ingredient(ingredient_id: str, req: UpdateIngredientRequest, db: Session = Depends(get_db)):
    """Updates raw ingredient nutritional specs."""
    updated = repository.update_ingredient(db, ingredient_id, req.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Ingredient '{ingredient_id}' not found.")
    return {
        "status": "success",
        "ingredient": updated.to_dict(),
        "message": f"Ingredient '{updated.name}' updated.",
    }


@router.delete("/ingredients/{ingredient_id}")
def delete_ingredient(ingredient_id: str, db: Session = Depends(get_db)):
    """Deletes an ingredient from the library."""
    ok = repository.delete_ingredient(db, ingredient_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Ingredient '{ingredient_id}' not found.")
    return {"status": "success", "message": f"Ingredient '{ingredient_id}' deleted."}


# --------------------------------------------------------------------------
# 9. Weekly Cyclical Menus per Mess
# --------------------------------------------------------------------------
@router.get("/menus")
@router.get("/menu")
def get_weekly_menus(mess_id: str = Query("mess-boys-a"), db: Session = Depends(get_db)):
    """Returns 7-day x 3-meal cyclical menu grid for the specified mess hall."""
    menus = [m.to_dict() for m in repository.get_weekly_menus(db, mess_id)]
    return {
        "mess_id": mess_id,
        "menus": menus,
        "count": len(menus),
        "data_source": "synthetic_demo",
    }


@router.post("/menus/cell")
@router.post("/menu/cell")
def set_menu_cell(req: SetMenuCellRequest, db: Session = Depends(get_db)):
    """Assigns food items to a specific weekday and meal slot for a mess."""
    updated = repository.set_menu_cell(
        db,
        mess_id=req.mess_id,
        day_of_week=req.day_of_week,
        meal=req.meal,
        dish_ids=req.dish_ids,
    )
    return {
        "status": "success",
        "menu": updated.to_dict(),
        "message": f"Menu slot {req.meal} (Day {req.day_of_week}) updated.",
        "data_source": "synthetic_demo",
    }


@router.post("/menus/optimize")
@router.post("/menu/optimize")
def optimize_menu(mess_id: str = Query("mess-boys-a")):
    """AI Menu Optimizer: recommends high-waste dish swaps with projected savings."""
    suggestions = [
        {
            "day_of_week": 3,
            "meal": "Lunch",
            "original_dish": "paneer-butter-masala",
            "recommended_swap": "dal-tadka",
            "reason": "Paneer shows 28% leftover on Thursdays due to sports travel schedules.",
            "projected_waste_reduction_kg": 4.5,
            "projected_cost_saved_inr": 340.0,
        },
        {
            "day_of_week": 4,
            "meal": "Dinner",
            "original_dish": "chole-bhature",
            "recommended_swap": "roti",
            "reason": "Heavy fried prep exceeds Friday evening weekend departure headcounts.",
            "projected_waste_reduction_kg": 6.2,
            "projected_cost_saved_inr": 480.0,
        },
    ]
    total_reduction = round(sum(s["projected_waste_reduction_kg"] for s in suggestions), 1)
    total_saved = round(sum(s["projected_cost_saved_inr"] for s in suggestions), 1)

    return {
        "status": "success",
        "mess_id": mess_id,
        "suggestions": suggestions,
        "suggestions_applied": len(suggestions),
        "total_projected_waste_cut_kg": total_reduction,
        "total_projected_inr_saved": total_saved,
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 10. Meal Log Recording & Persistence (Capped 500)
# --------------------------------------------------------------------------
@router.post("/log")
@router.post("/logs")
def post_log(req: LogMealRequest, db: Session = Depends(get_db)):
    """Records kitchen service leftover log entry into persistent store (capped at 500)."""
    record = repository.add_meal_log(db, req.model_dump())
    store.add_log(req.model_dump())
    total_logs = db.query(DemoMealLog).count()
    rec_dict = record.to_dict()
    return {
        "status": "success",
        "log": rec_dict,
        "logged_record": rec_dict,
        "total_active_logs": total_logs,
        "data_source": "synthetic_demo",
    }


@router.get("/logs")
@router.get("/log")
def get_logs(
    mess_id: Optional[str] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db),
):
    """Returns recent kitchen service leftover records with pagination."""
    db_logs = [l.to_dict() for l in repository.get_meal_logs(db, mess_id=mess_id, limit=limit)]
    combined = list(db_logs)
    if len(combined) < limit:
        # Pad with recent records from synthetic dataset
        for r in reversed(DEMO_DATASET[-6:]):
            if len(combined) >= limit:
                break
            for d in r.get("dishes", []):
                prep = d.get("platewise_prep_kg", d.get("guesswork_prep_kg", 25.0))
                eaten = d.get("actual_eaten_kg", prep * 0.9)
                leftover = round(max(0.0, prep - eaten), 1)
                combined.append({
                    "id": f"seed-{r['date']}-{r['meal']}-{d['dish_id']}",
                    "mess_id": r.get("mess_id", "mess-boys-a"),
                    "date": r["date"],
                    "meal": r["meal"],
                    "dish_id": d["dish_id"],
                    "prepared_kg": round(prep, 1),
                    "consumed_kg": round(eaten, 1),
                    "leftover_kg": leftover,
                    "turnout": r.get("actual_turnout", 720),
                    "is_synthetic_seed": True,
                })
                if len(combined) >= limit:
                    break
    return {
        "logs": combined,
        "total_active_logs": len(db_logs),
        "data_source": "synthetic_demo",
    }


@router.put("/logs/{log_id}")
def update_log(log_id: str, req: UpdateMealLogRequest, db: Session = Depends(get_db)):
    """Edits an existing weighed leftover meal log entry."""
    updated = repository.update_meal_log(db, log_id, req.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Meal log '{log_id}' not found.")
    return {
        "status": "success",
        "log": updated.to_dict(),
        "message": "Meal log updated successfully.",
        "data_source": "synthetic_demo",
    }


@router.delete("/logs/{log_id}")
def delete_log(log_id: str, db: Session = Depends(get_db)):
    """Deletes a meal log entry."""
    ok = repository.delete_meal_log(db, log_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Meal log '{log_id}' not found.")
    return {"status": "success", "message": f"Meal log '{log_id}' deleted.", "data_source": "synthetic_demo"}


@router.post("/logs/import")
def import_meal_logs(req: MealLogImportRequest, db: Session = Depends(get_db)):
    """
    Imports real kitchen weigh scale records:
    date, meal, food_id, prepared_kg, consumed_kg, leftover_kg, turnout.
    Switches mess labelling to 'College data (imported)' and retrains forecast shift.
    """
    rows = [r.model_dump() for r in req.rows]
    res = repository.import_meal_logs_csv(db, mess_id=req.mess_id, rows=rows)
    return {
        "status": "success",
        **res,
    }


# --------------------------------------------------------------------------
# 11. Student RSVP (Capped 1000; Feeds Live Turnout)
# --------------------------------------------------------------------------
@router.post("/rsvp")
def post_rsvp(req: RsvpRequest, db: Session = Depends(get_db)):
    """Records student Eating/Skipping signal and updates turnout impact."""
    saved_rsvp = repository.record_rsvp(
        db,
        student_id=req.student_id,
        mess_id=req.mess_id,
        date_str=req.date,
        meal=req.meal,
        status=req.status,
    )
    store.record_rsvp(req.student_id, req.mess_id, req.date, req.meal, req.status)
    net_delta = repository.get_net_rsvp_delta(db, req.mess_id, req.date, req.meal)
    return {
        "status": "success",
        "rsvp": saved_rsvp.to_dict(),
        "net_turnout_delta": net_delta,
        "data_source": "synthetic_demo",
    }


@router.get("/rsvp/delta")
def get_rsvp_delta(
    mess_id: str = Query("mess-boys-a"),
    date: str = Query(...),
    meal: str = Query("Lunch"),
    db: Session = Depends(get_db),
):
    """Returns real-time net headcount shift from student responses."""
    delta = repository.get_net_rsvp_delta(db, mess_id, date, meal)
    return {
        "mess_id": mess_id,
        "date": date,
        "meal": meal,
        "net_delta": delta,
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 12. Plate Studio: Evaluate, Save, Popular (Capped 500)
# --------------------------------------------------------------------------
@router.post("/plates/evaluate")
def evaluate_plate(req: EvaluatePlateRequest, db: Session = Depends(get_db)):
    """Evaluates composite plate composition with live nutritional totals and descriptor."""
    food_map = repository.get_food_map(db)
    raw_items = [item.model_dump() for item in req.items]
    result = repository.evaluate_plate(food_map, raw_items)
    return {**result, "data_source": "synthetic_demo"}


@router.post("/plates")
def save_plate(req: SavePlateRequest, db: Session = Depends(get_db)):
    """Saves a custom plate and registers pre-order signal (capped at 500)."""
    raw_items = [item.model_dump() for item in req.items]
    saved = repository.save_plate(
        db,
        name=req.name,
        items=raw_items,
        mess_id=req.mess_id or "mess-boys-a",
        meal=req.meal or "Lunch",
    )
    store.save_plate(req.name, raw_items, req.mess_id, req.meal)
    return {
        "status": "success",
        "plate": saved.to_dict(),
        "data_source": "synthetic_demo",
    }


@router.get("/plates/popular")
def get_popular_plates(mess_id: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """Returns popular and pre-seeded plate combinations with complete evaluations."""
    popular = [p.to_dict() for p in repository.get_popular_plates(db, mess_id)]
    return {
        "popular_plates": popular,
        "count": len(popular),
        "data_source": "synthetic_demo",
    }


@router.delete("/plates/{plate_id}")
def delete_plate(plate_id: str, db: Session = Depends(get_db)):
    """Deletes a custom plate."""
    ok = repository.delete_plate(db, plate_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Plate '{plate_id}' not found.")
    return {"status": "success", "message": f"Plate '{plate_id}' deleted.", "data_source": "synthetic_demo"}


# --------------------------------------------------------------------------
# 13. Demo Reset
# --------------------------------------------------------------------------
@router.post("/reset")
def post_reset(db: Session = Depends(get_db)):
    """Resets user-created logs, RSVPs, and custom plates to clean initial state."""
    repository.reset_all(db)
    store.reset()
    return {
        "status": "success",
        "message": "Demo state successfully reset to initial seeded values.",
        "data_source": "synthetic_demo",
    }
