"""
PlateWise AI Demo API Router (/api/v1/demo).
Serves deterministic seeded synthetic cafeteria intelligence datasets,
explainable forecast simulations, backtest evaluations, and Plate Studio endpoints.
Enabled only when DEMO_MODE=True; returns 404 when disabled.
"""

from datetime import date
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status

try:
    from app.config import settings
    from app.demo.data import (
        MESSES,
        MESS_MAP,
        DEMO_DATASET,
        DEMO_DATASET_BY_MESS,
        DISHES,
    )
    from app.demo.model import engine
    from app.demo.store import store
    from app.demo.schemas import (
        ForecastRequest,
        LogMealRequest,
        RsvpRequest,
        EvaluatePlateRequest,
        SavePlateRequest,
        ApprovePlanRequest,
    )
except ImportError:
    from backend.app.config import settings
    from backend.app.demo.data import (
        MESSES,
        MESS_MAP,
        DEMO_DATASET,
        DEMO_DATASET_BY_MESS,
        DISHES,
    )
    from backend.app.demo.model import engine
    from backend.app.demo.store import store
    from backend.app.demo.schemas import (
        ForecastRequest,
        LogMealRequest,
        RsvpRequest,
        EvaluatePlateRequest,
        SavePlateRequest,
        ApprovePlanRequest,
    )


def verify_demo_mode():
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo mode is disabled in this environment.",
        )


router = APIRouter(
    prefix="/api/v1/demo",
    tags=["Demo API"],
    dependencies=[Depends(verify_demo_mode)],
)


# --------------------------------------------------------------------------
# 1. Messes List
# --------------------------------------------------------------------------
@router.get("/messes")
def get_messes():
    """Returns list of monitored college mess halls."""
    return {
        "messes": MESSES,
        "total_messes": len(MESSES),
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 2. Operations Overview & Historical KPIs
# --------------------------------------------------------------------------
@router.get("/overview")
def get_overview(mess_id: Optional[str] = Query("mess-boys-a")):
    """Returns high-level KPI cards and 30-day historical trend comparing guesswork vs PlateWise."""
    records = DEMO_DATASET_BY_MESS.get(mess_id, DEMO_DATASET)

    total_prep_gw = sum(r["total_prepared_guesswork_kg"] for r in records)
    total_eaten = sum(r["total_eaten_kg"] for r in records)
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
    for r in recent_records[::3]:  # sample one point per day (Lunch or daily sum)
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
        top_wasted.append({
            "dish_id": did,
            "name": d_info.get("name", did),
            "category": d_info.get("category", "main"),
            "guesswork_waste_kg": round(w_kg, 1),
            "cost_wasted_inr": round(w_kg * d_info.get("cost_per_kg_inr", 40.0), 0),
        })

    return {
        "mess_id": mess_id,
        "kpis": {
            "kg_waste_prevented": round(total_waste_prevented, 1),
            "inr_saved": inr_saved,
            "co2e_avoided_kg": co2e_avoided_kg,
            "forecast_accuracy_pct": 92.4,
            "guesswork_waste_pct": gw_waste_pct,
            "platewise_waste_pct": pw_waste_pct,
            "reduction_factor_pct": round(((gw_waste_pct - pw_waste_pct) / gw_waste_pct) * 100, 1),
            "sparklines": {
                "kg_saved": [round(r["waste_prevented_kg"], 1) for r in recent_records[-7:]],
                "inr_saved": [round(r["waste_prevented_kg"] * cost_per_kg, 0) for r in recent_records[-7:]],
                "co2e_avoided": [round(r["waste_prevented_kg"] * co2e_factor, 1) for r in recent_records[-7:]],
                "accuracy": [91.8, 92.4, 91.9, 93.1, 92.0, 92.8, 92.4],
            },
        },
        "totals": {
            "total_prepared_guesswork_kg": round(total_prep_gw, 1),
            "total_prepared_platewise_kg": round(total_prep_pw, 1),
            "total_eaten_kg": round(total_eaten, 1),
            "total_waste_guesswork_kg": round(total_waste_gw, 1),
            "total_waste_platewise_kg": round(total_waste_pw, 1),
        },
        "trends_30d": chart_series,
        "top_wasted_dishes": top_wasted,
        "active_alerts": [
            {
                "id": "alert-exam-rain",
                "severity": "warning",
                "title": "Exam Period + Monsoon Forecast",
                "message": "Tomorrow: Midsem exams and forecasted rain; expect ~16% lower dine-in headcount.",
                "action": "Plan auto-adjusted",
            },
            {
                "id": "alert-surplus-safety",
                "severity": "info",
                "title": "Surplus Redistribution Ready",
                "message": "Robin Hood Army campus volunteer team active for post-service recovery.",
                "action": "View partners",
            },
        ],
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 3. Today's Plan & Cook Sheet
# --------------------------------------------------------------------------
@router.get("/plan")
def get_plan(
    mess_id: Optional[str] = Query("mess-boys-a"),
    date_str: Optional[str] = Query(None, alias="date"),
    meal: Optional[str] = Query("Lunch"),
):
    """Returns kitchen cook sheet, dish-level servings & kg recommendations, turnout gauge, and surplus risk."""
    target_date = date_str or date(2026, 11, 2).isoformat()
    target_meal = meal or "Lunch"

    mess = MESS_MAP.get(mess_id, MESSES[0])
    capacity = mess["capacity"]

    # Check for live student RSVPs
    rsvp_delta = store.get_net_rsvp_delta(mess["id"], target_date, target_meal)

    # Derive day of week from date string
    try:
        dt = date.fromisoformat(target_date)
        dow = dt.weekday()
    except Exception:
        dow = 0

    prediction = engine.predict(
        capacity=capacity,
        meal=target_meal,
        day_of_week=dow,
        is_exam=False,
        is_holiday=False,
        has_event=False,
        rain_mm=18.0 if dow == 0 else 0.0,
        temperature_c=29.0,
        menu_dish_ids=["roti", "jeera-rice", "paneer-butter-masala", "dal-tadka", "curd", "salad"]
        if target_meal != "Breakfast"
        else ["poha", "idli-sambar", "tea", "curd"],
        rsvp_delta=rsvp_delta,
    )

    # Food safety timer & redistribution suggestions
    surplus_score = 18  # Low surplus risk under PlateWise
    surplus_level = "Low" if surplus_score < 30 else ("Moderate" if surplus_score < 60 else "High")

    return {
        "mess_id": mess["id"],
        "mess_name": mess["name"],
        "date": target_date,
        "meal": target_meal,
        "expected_turnout_range": prediction["turnout_range"],
        "turnout_drivers": prediction["drivers"],
        "dishes": prediction["dish_recommendations"],
        "total_recommended_kg": prediction["total_recommended_kg"],
        "total_recommended_servings": prediction["total_recommended_servings"],
        "surplus_risk": {
            "level": surplus_level,
            "risk_score": surplus_score,
            "shelf_life_hours": 3.5,
            "hot_holding_temp_c": 65.0,
            "redistribution_partners": [
                {
                    "name": "Robin Hood Army - Campus Chapter",
                    "contact": "volunteer.rha@campus.org",
                    "eta_minutes": 25,
                },
                {
                    "name": "Hostel Night Canteen Redistribution Stall",
                    "contact": "nightcanteen@campus.edu",
                    "eta_minutes": 10,
                },
            ],
        },
        "live_student_rsvp_count": rsvp_delta,
        "is_approved": store.is_plan_approved(mess["id"], target_date, target_meal),
        "kitchen_readiness_pct": 100,
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 3b. Approve Kitchen Production Plan
# --------------------------------------------------------------------------
@router.post("/plan/approve")
def approve_plan(req: ApprovePlanRequest):
    """Marks the daily meal preparation plan as officially approved for kitchen production."""
    store.approve_plan(req.mess_id, req.date, req.meal)
    return {
        "status": "success",
        "mess_id": req.mess_id,
        "date": req.date,
        "meal": req.meal,
        "is_approved": True,
        "message": f"{req.meal} kitchen production plan approved for service.",
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 4. Multi-Variable Forecast Simulation (What-If)
# --------------------------------------------------------------------------
@router.post("/forecast")
def post_forecast(req: ForecastRequest):
    """What-if forecast simulation with strict Pydantic bounds."""
    mess = MESS_MAP.get(req.mess_id, MESSES[0])
    capacity = req.expected_turnout or mess["capacity"]

    prediction = engine.predict(
        capacity=capacity,
        meal=req.meal,
        day_of_week=req.day_of_week,
        is_exam=req.is_exam,
        is_holiday=req.is_holiday,
        has_event=req.has_event,
        rain_mm=req.rain_mm,
        temperature_c=req.temperature_c,
        menu_dish_ids=req.menu,
    )

    return {
        "mess_id": req.mess_id,
        "parameters": req.model_dump(),
        **prediction,
    }


# --------------------------------------------------------------------------
# 5. Backtest Accuracy Evaluation
# --------------------------------------------------------------------------
@router.get("/backtest")
def get_backtest():
    """Evaluates PlateWise on 28-day held-out test period against Cook-for-Capacity and Same-Weekday-Prior-Week baselines."""
    return engine.backtest_cache


# --------------------------------------------------------------------------
# 6. Simulate Day Service Timeline
# --------------------------------------------------------------------------
@router.get("/simulate-day")
def get_simulate_day():
    """Generates minute-by-minute arrival timeline (12:00 to 14:00) comparing Guesswork (100/75/25) vs PlateWise."""
    time_ticks = [
        "12:00", "12:10", "12:20", "12:30", "12:40", "12:50",
        "13:00", "13:10", "13:20", "13:30", "13:40", "13:50", "14:00"
    ]
    # Arrival distribution bell-curve peaking around 12:40 - 13:10
    interval_arrivals = [25, 45, 65, 95, 115, 110, 90, 75, 55, 35, 20, 10, 5]

    total_turnout = sum(interval_arrivals)  # 745 diners
    portion_factor = 0.10067  # ~75 kg eaten total

    cumulative_eaten = 0.0
    timeline = []

    # Deck illustrative baseline: 100 kg prepared for Guesswork
    guesswork_initial_kg = 100.0
    # PlateWise cooks for ~82 kg prepared (75 kg eaten + safe buffer)
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
        "guesswork_leftover_kg": gw_remaining,  # ~25 kg
        "platewise_leftover_kg": pw_remaining,  # ~7 kg
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

    # Friendly equivalents
    trees_equivalent = int(round(co2e_saved_kg / 21.7))  # 1 mature tree absorbs ~21.7 kg CO2/year
    car_km_avoided = int(round(co2e_saved_kg / 0.192))    # avg petrol car emits ~192g CO2/km
    household_days_powered = int(round(co2e_saved_kg / 4.2))  # typical Indian household electricity ~4.2 kg CO2/day
    meals_redistributed = int(round(total_waste_prevented_kg / 0.35))  # ~350g per full meal

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
# 8. Meal Log Recording (In-Memory, Capped 500)
# --------------------------------------------------------------------------
@router.post("/log")
def post_log(req: LogMealRequest):
    """Records real-time kitchen service leftover log entry into in-memory store."""
    record = store.add_log(req.model_dump())
    return {
        "status": "success",
        "logged_record": record,
        "total_active_logs": len(store.logs),
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 9. Student RSVP (In-Memory, Capped 1000; Feeds Live Turnout)
# --------------------------------------------------------------------------
@router.post("/rsvp")
def post_rsvp(req: RsvpRequest):
    """Records student Eating/Skipping signal and returns updated turnout impact."""
    return store.record_rsvp(
        student_id=req.student_id,
        mess_id=req.mess_id,
        date_str=req.date,
        meal=req.meal,
        status=req.status,
    )


# --------------------------------------------------------------------------
# 10. Demo Reset
# --------------------------------------------------------------------------
@router.post("/reset")
def post_reset():
    """Resets all in-memory logs, RSVPs, and custom plates to clean initial state."""
    store.reset()
    return {
        "status": "success",
        "message": "Demo state successfully reset to initial seeded values.",
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 11. Foods Catalogue (from foods.json)
# --------------------------------------------------------------------------
@router.get("/foods")
def get_foods():
    """Returns the 22 common mess foods catalogue from backend/app/demo/foods.json."""
    return {
        "foods": store.foods,
        "count": len(store.foods),
        "comment": "kcal values are approximate per standard serving; verify against IFCT 2017, USDA FoodData Central or packaging before the demo.",
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 12. Plate Studio: Evaluate Plate
# --------------------------------------------------------------------------
@router.post("/plates/evaluate")
def evaluate_plate(req: EvaluatePlateRequest):
    """
    Evaluates composite plate composition with live nutritional and carbon footprint totals.
    Neutral wording, Light/Moderate/Hearty descriptor, and legal disclaimer.
    """
    raw_items = [item.model_dump() for item in req.items]
    result = store.evaluate_plate(raw_items)
    return {
        **result,
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 13. Plate Studio: Save Plate (Pre-Order Signal)
# --------------------------------------------------------------------------
@router.post("/plates")
def save_plate(req: SavePlateRequest):
    """Saves a custom plate (in-memory, capped at 500) and registers pre-order signal."""
    raw_items = [item.model_dump() for item in req.items]
    saved = store.save_plate(
        name=req.name,
        items=raw_items,
        mess_id=req.mess_id,
        meal=req.meal,
    )
    return {
        "status": "success",
        "plate": saved,
        "data_source": "synthetic_demo",
    }


# --------------------------------------------------------------------------
# 14. Plate Studio: Popular Plates
# --------------------------------------------------------------------------
@router.get("/plates/popular")
def get_popular_plates():
    """Returns popular and pre-seeded plate combinations with complete evaluations."""
    popular = store.get_popular_plates()
    return {
        "popular_plates": popular,
        "count": len(popular),
        "data_source": "synthetic_demo",
    }
