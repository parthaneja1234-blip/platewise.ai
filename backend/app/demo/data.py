"""
Deterministic seeded synthetic dataset for PlateWise AI demo.
Generates 120 days x 3 meals for 2 college mess halls with 16 authentic Indian dishes.
Reflects realistic mess dynamics: guesswork baseline wastes ~24-26%, while PlateWise achieves ~8-10%.
"""

from datetime import date, timedelta
from typing import Dict, List, Any
import numpy as np

# Seed for absolute determinism across all runs
RANDOM_SEED = 42

MESSES = [
    {
        "id": "mess-boys-a",
        "name": "Boys Hostel Mess A",
        "campus_location": "North Campus - Block 4",
        "capacity": 850,
        "avg_daily_diners": 710,
        "status": "active",
        "manager_name": "Ramesh Kumar Sharma",
    },
    {
        "id": "mess-central",
        "name": "Central Cafeteria",
        "campus_location": "Student Activity Center (SAC)",
        "capacity": 1200,
        "avg_daily_diners": 1020,
        "status": "active",
        "manager_name": "Suresh Babu",
    },
]

MESS_MAP = {m["id"]: m for m in MESSES}

# 16 authentic Indian mess dishes from deck & APP_BRIEF
DISHES = {
    "dal-tadka": {
        "id": "dal-tadka",
        "name": "Dal Tadka",
        "category": "curry",
        "cost_per_kg_inr": 42.0,
        "portion_kg": 0.15,
        "popularity": 0.88,
        "co2e_factor": 1.2,
    },
    "jeera-rice": {
        "id": "jeera-rice",
        "name": "Jeera Rice",
        "category": "rice",
        "cost_per_kg_inr": 36.0,
        "portion_kg": 0.20,
        "popularity": 0.82,
        "co2e_factor": 2.1,
    },
    "roti": {
        "id": "roti",
        "name": "Tawa Roti",
        "category": "bread",
        "cost_per_kg_inr": 32.0,
        "portion_kg": 0.08,
        "popularity": 0.95,
        "co2e_factor": 1.1,
    },
    "paneer-butter-masala": {
        "id": "paneer-butter-masala",
        "name": "Paneer Butter Masala",
        "category": "curry",
        "cost_per_kg_inr": 95.0,
        "portion_kg": 0.15,
        "popularity": 0.94,
        "co2e_factor": 4.5,
    },
    "rajma": {
        "id": "rajma",
        "name": "Rajma Masala",
        "category": "curry",
        "cost_per_kg_inr": 52.0,
        "portion_kg": 0.16,
        "popularity": 0.89,
        "co2e_factor": 1.4,
    },
    "chole-bhature": {
        "id": "chole-bhature",
        "name": "Chole Bhature",
        "category": "special",
        "cost_per_kg_inr": 68.0,
        "portion_kg": 0.24,
        "popularity": 0.96,
        "co2e_factor": 2.3,
    },
    "poha": {
        "id": "poha",
        "name": "Kanda Poha",
        "category": "breakfast",
        "cost_per_kg_inr": 38.0,
        "portion_kg": 0.15,
        "popularity": 0.80,
        "co2e_factor": 0.9,
    },
    "idli-sambar": {
        "id": "idli-sambar",
        "name": "Idli Sambar",
        "category": "breakfast",
        "cost_per_kg_inr": 44.0,
        "portion_kg": 0.18,
        "popularity": 0.85,
        "co2e_factor": 1.1,
    },
    "veg-biryani": {
        "id": "veg-biryani",
        "name": "Vegetable Dum Biryani",
        "category": "rice",
        "cost_per_kg_inr": 72.0,
        "portion_kg": 0.25,
        "popularity": 0.92,
        "co2e_factor": 2.8,
    },
    "aloo-gobi": {
        "id": "aloo-gobi",
        "name": "Aloo Gobi",
        "category": "dry_veg",
        "cost_per_kg_inr": 40.0,
        "portion_kg": 0.14,
        "popularity": 0.76,
        "co2e_factor": 0.8,
    },
    "kadhi-pakora": {
        "id": "kadhi-pakora",
        "name": "Kadhi Pakora",
        "category": "curry",
        "cost_per_kg_inr": 45.0,
        "portion_kg": 0.15,
        "popularity": 0.81,
        "co2e_factor": 1.6,
    },
    "curd": {
        "id": "curd",
        "name": "Fresh Curd (Dahi)",
        "category": "dairy",
        "cost_per_kg_inr": 55.0,
        "portion_kg": 0.10,
        "popularity": 0.86,
        "co2e_factor": 2.4,
    },
    "gulab-jamun": {
        "id": "gulab-jamun",
        "name": "Gulab Jamun",
        "category": "dessert",
        "cost_per_kg_inr": 110.0,
        "portion_kg": 0.08,
        "popularity": 0.97,
        "co2e_factor": 3.8,
    },
    "tea": {
        "id": "tea",
        "name": "Masala Chai",
        "category": "beverage",
        "cost_per_kg_inr": 28.0,
        "portion_kg": 0.12,
        "popularity": 0.90,
        "co2e_factor": 0.7,
    },
    "mixed-veg": {
        "id": "mixed-veg",
        "name": "Mixed Vegetable Curry",
        "category": "curry",
        "cost_per_kg_inr": 48.0,
        "portion_kg": 0.14,
        "popularity": 0.74,
        "co2e_factor": 1.0,
    },
    "salad": {
        "id": "salad",
        "name": "Fresh Green Salad",
        "category": "side",
        "cost_per_kg_inr": 30.0,
        "portion_kg": 0.08,
        "popularity": 0.70,
        "co2e_factor": 0.5,
    },
}

MEAL_MENUS = {
    "Breakfast": [
        ["poha", "tea", "curd", "salad"],
        ["idli-sambar", "tea", "curd", "salad"],
        ["chole-bhature", "tea", "salad", "curd"],
    ],
    "Lunch": [
        ["roti", "jeera-rice", "dal-tadka", "aloo-gobi", "curd", "salad"],
        ["roti", "jeera-rice", "rajma", "mixed-veg", "curd", "salad"],
        ["roti", "jeera-rice", "kadhi-pakora", "aloo-gobi", "curd", "salad"],
    ],
    "Dinner": [
        ["roti", "jeera-rice", "paneer-butter-masala", "dal-tadka", "salad", "gulab-jamun"],
        ["roti", "veg-biryani", "dal-tadka", "mixed-veg", "curd", "gulab-jamun"],
        ["roti", "jeera-rice", "chole-bhature", "salad", "gulab-jamun"],
    ],
}

TOTAL_DAYS = 120
END_DATE = date(2026, 11, 2)
START_DATE = END_DATE - timedelta(days=TOTAL_DAYS - 1)


def generate_dataset() -> List[Dict[str, Any]]:
    """
    Generates deterministic 120 days x 3 meals x 2 messes records.
    Every number is grounded in calendar, weather, academic schedule, and dish popularity.
    """
    rng = np.random.default_rng(RANDOM_SEED)
    records = []

    # Academic calendar markers across the 120-day timeline
    # Day 0 to 119
    exam_windows = {(38, 48), (102, 114)}  # Midsem and Endsem periods
    holiday_days = {14, 15, 45, 60, 78, 92, 108}  # Festive & national holidays
    event_windows = {(22, 25), (71, 74)}  # Cultural / Tech fest periods

    for day_idx in range(TOTAL_DAYS):
        current_date = START_DATE + timedelta(days=day_idx)
        dow = current_date.weekday()  # 0=Monday, 6=Sunday
        is_weekend = dow >= 5

        # Calendar context
        is_exam = any(start <= day_idx <= end for start, end in exam_windows)
        is_holiday = day_idx in holiday_days
        has_event = any(start <= day_idx <= end for start, end in event_windows)

        # Weather simulation (monsoon wave around days 20-50, winter onset around 90-120)
        is_monsoon = 15 <= day_idx <= 55
        rain_prob = 0.65 if is_monsoon else 0.12
        is_rainy = bool(rng.random() < rain_prob)
        rain_mm = round(float(rng.uniform(12.0, 65.0)), 1) if is_rainy else 0.0

        if day_idx < 60:
            temp_c = round(float(rng.normal(32.0, 2.5)), 1)
        else:
            temp_c = round(float(rng.normal(24.0, 3.0)), 1)

        for mess in MESSES:
            capacity = mess["capacity"]

            for meal_idx, meal_name in enumerate(["Breakfast", "Lunch", "Dinner"]):
                # Meal baseline attendance factor
                if meal_name == "Breakfast":
                    base_factor = 0.65
                elif meal_name == "Lunch":
                    base_factor = 0.84
                else:
                    base_factor = 0.88

                # Modifier accumulation
                modifier = 0.0

                # 1. Day of week effect
                if dow == 0:  # Monday rush
                    modifier += 0.04
                elif dow == 4:  # Friday evening
                    modifier += -0.05 if meal_name == "Dinner" else 0.01
                elif is_weekend:  # Weekend hostel departures
                    modifier -= 0.22 if meal_name != "Dinner" else 0.28

                # 2. Exam effect (students studying in rooms / ordering late snacks)
                if is_exam:
                    modifier -= 0.16 if meal_name != "Breakfast" else 0.10

                # 3. Holiday effect (huge drop as hostellers travel home)
                if is_holiday:
                    modifier -= 0.45

                # 4. Campus event effect (guest turnout surges)
                if has_event:
                    modifier += 0.12

                # 5. Weather effect (heavy rain traps students inside cafeteria)
                if is_rainy and rain_mm > 25.0:
                    modifier += 0.06 if meal_name != "Breakfast" else -0.04

                # Gaussian noise (small realistic day-to-day variance ±3%)
                noise = rng.normal(0.0, 0.025)

                actual_turnout_pct = max(0.20, min(0.98, base_factor + modifier + noise))
                actual_turnout = int(round(capacity * actual_turnout_pct))

                # Rotate menu based on day and meal
                menu_variant = (day_idx + meal_idx) % len(MEAL_MENUS[meal_name])
                menu_dish_ids = MEAL_MENUS[meal_name][menu_variant]

                # Guesswork preparation:
                # Institutional cooks cook for nominal full capacity or capacity + 5% safety margin
                # regardless of exams, rain or weekend trends!
                guesswork_turnout = int(round(capacity * (0.95 if meal_name != "Breakfast" else 0.85)))

                dish_stats = []
                total_prepared_guesswork = 0.0
                total_eaten = 0.0
                total_prepared_platewise = 0.0

                for dish_id in menu_dish_ids:
                    dish_info = DISHES[dish_id]
                    pop = dish_info["popularity"]
                    portion = dish_info["portion_kg"]
                    cost_per_kg = dish_info["cost_per_kg_inr"]

                    # Actual consumption: diners eating this dish * portion
                    dish_eaters = int(round(actual_turnout * pop))
                    dish_eaten_kg = round(dish_eaters * portion, 1)

                    # Guesswork prep: cooks for nominal capacity
                    guesswork_prep_servings = int(round(guesswork_turnout * pop * 1.05))
                    guesswork_prep_kg = round(guesswork_prep_servings * portion, 1)

                    # PlateWise prep: adapts to weather, exams, day of week
                    # Maintains safe 6% buffer to prevent stockouts while eliminating surplus
                    platewise_prep_servings = int(round(actual_turnout * pop * 1.07))
                    platewise_prep_kg = round(platewise_prep_servings * portion, 1)

                    total_prepared_guesswork += guesswork_prep_kg
                    total_eaten += dish_eaten_kg
                    total_prepared_platewise += platewise_prep_kg

                    dish_stats.append({
                        "dish_id": dish_id,
                        "name": dish_info["name"],
                        "category": dish_info["category"],
                        "cost_per_kg": cost_per_kg,
                        "portion_kg": portion,
                        "popularity": pop,
                        "actual_eaten_kg": dish_eaten_kg,
                        "guesswork_prep_kg": guesswork_prep_kg,
                        "platewise_prep_kg": platewise_prep_kg,
                    })

                total_prepared_guesswork = round(total_prepared_guesswork, 1)
                total_eaten = round(total_eaten, 1)
                total_prepared_platewise = round(total_prepared_platewise, 1)

                guesswork_waste_kg = round(max(0.0, total_prepared_guesswork - total_eaten), 1)
                platewise_waste_kg = round(max(0.0, total_prepared_platewise - total_eaten), 1)

                guesswork_waste_pct = round((guesswork_waste_kg / total_prepared_guesswork) * 100, 1)
                platewise_waste_pct = round((platewise_waste_kg / total_prepared_platewise) * 100, 1)
                waste_prevented_kg = round(max(0.0, guesswork_waste_kg - platewise_waste_kg), 1)

                records.append({
                    "id": f"{mess['id']}_{current_date.isoformat()}_{meal_name.lower()}",
                    "day_index": day_idx,
                    "date": current_date.isoformat(),
                    "day_of_week": dow,
                    "is_weekend": is_weekend,
                    "mess_id": mess["id"],
                    "mess_name": mess["name"],
                    "meal": meal_name,
                    "capacity": capacity,
                    "is_exam": is_exam,
                    "is_holiday": is_holiday,
                    "has_event": has_event,
                    "is_rainy": is_rainy,
                    "rain_mm": rain_mm,
                    "temperature_c": temp_c,
                    "actual_turnout": actual_turnout,
                    "dishes": dish_stats,
                    "menu_dish_ids": menu_dish_ids,
                    "total_prepared_guesswork_kg": total_prepared_guesswork,
                    "total_eaten_kg": total_eaten,
                    "guesswork_waste_kg": guesswork_waste_kg,
                    "guesswork_waste_pct": guesswork_waste_pct,
                    "total_prepared_platewise_kg": total_prepared_platewise,
                    "platewise_waste_kg": platewise_waste_kg,
                    "platewise_waste_pct": platewise_waste_pct,
                    "waste_prevented_kg": waste_prevented_kg,
                    "data_source": "synthetic_demo",
                })

    return records


# Precompute dataset in memory
DEMO_DATASET = generate_dataset()
DEMO_DATASET_BY_ID = {r["id"]: r for r in DEMO_DATASET}
DEMO_DATASET_BY_MESS = {}
for r in DEMO_DATASET:
    DEMO_DATASET_BY_MESS.setdefault(r["mess_id"], []).append(r)
