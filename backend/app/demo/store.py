"""
In-memory store for PlateWise AI demo.
Manages:
- Meal logs (capped at 500 entries)
- Student RSVPs (capped at 1000 entries; feeds live turnout)
- Foods catalogue & plate evaluation engine
- Saved & popular plates (capped at 500 entries)
"""

import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

FOODS_JSON_PATH = Path(__file__).parent / "foods.json"


class DemoStore:
    def __init__(self):
        self.max_logs = 500
        self.max_rsvps = 1000
        self.max_plates = 500

        self.logs: List[Dict[str, Any]] = []
        self.rsvps: Dict[str, Dict[str, Any]] = {}
        self.saved_plates: List[Dict[str, Any]] = []
        self.approved_plans: set = set()
        self.foods: List[Dict[str, Any]] = []
        self.food_map: Dict[str, Dict[str, Any]] = {}

        self._load_foods()
        self._seed_popular_plates()

    def _load_foods(self):
        with open(FOODS_JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.foods = data.get("foods", [])
            self.food_map = {item["id"]: item for item in self.foods}

    def _seed_popular_plates(self):
        self.saved_plates.clear()
        popular_seeds = [
            {
                "id": "plate-classic-thali",
                "name": "Classic North Indian Thali",
                "mess_id": "mess-boys-a",
                "meal": "Lunch",
                "is_popular_seed": True,
                "items": [
                    {"food_id": "roti", "count": 3},
                    {"food_id": "jeera-rice", "count": 1},
                    {"food_id": "dal-tadka", "count": 1},
                    {"food_id": "paneer-butter-masala", "count": 1},
                    {"food_id": "curd", "count": 1},
                    {"food_id": "green-salad", "count": 1},
                ],
            },
            {
                "id": "plate-south-indian-combo",
                "name": "South Indian Morning Combo",
                "mess_id": "mess-central",
                "meal": "Breakfast",
                "is_popular_seed": True,
                "items": [
                    {"food_id": "idli", "count": 2},
                    {"food_id": "sambar", "count": 1},
                    {"food_id": "masala-chai", "count": 1},
                    {"food_id": "banana", "count": 1},
                ],
            },
            {
                "id": "plate-high-protein",
                "name": "High-Protein Mess Plate",
                "mess_id": "mess-boys-a",
                "meal": "Dinner",
                "is_popular_seed": True,
                "items": [
                    {"food_id": "egg-curry", "count": 1},
                    {"food_id": "dal-tadka", "count": 1},
                    {"food_id": "roti", "count": 2},
                    {"food_id": "curd", "count": 1},
                    {"food_id": "green-salad", "count": 1},
                ],
            },
            {
                "id": "plate-light-lunch",
                "name": "Light Academic Lunch",
                "mess_id": "mess-central",
                "meal": "Lunch",
                "is_popular_seed": True,
                "items": [
                    {"food_id": "poha", "count": 1},
                    {"food_id": "curd", "count": 1},
                    {"food_id": "apple", "count": 1},
                    {"food_id": "masala-chai", "count": 1},
                ],
            },
        ]

        for p in popular_seeds:
            evaluation = self.evaluate_plate(p["items"])
            self.saved_plates.append({
                **p,
                "created_at": datetime.now(timezone.utc).isoformat(),
                **evaluation,
            })

    def add_log(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """Appends a meal log, capping at 500 entries."""
        record = {
            "id": f"log-{len(self.logs) + 1}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **entry,
        }
        self.logs.append(record)
        if len(self.logs) > self.max_logs:
            self.logs = self.logs[-self.max_logs:]
        return record

    def get_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return list(reversed(self.logs[-limit:]))

    def record_rsvp(self, student_id: str, mess_id: str, date_str: str, meal: str, status: str) -> Dict[str, Any]:
        """
        Records or updates student RSVP.
        status: "eating" | "skipping"
        """
        key = f"{student_id}_{mess_id}_{date_str}_{meal.lower()}"
        record = {
            "student_id": student_id,
            "mess_id": mess_id,
            "date": date_str,
            "meal": meal,
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.rsvps[key] = record

        # Cap memory
        if len(self.rsvps) > self.max_rsvps:
            oldest_keys = list(self.rsvps.keys())[:len(self.rsvps) - self.max_rsvps]
            for k in oldest_keys:
                del self.rsvps[k]

        net_delta = self.get_net_rsvp_delta(mess_id, date_str, meal)
        return {
            "status": "success",
            "rsvp": record,
            "net_turnout_delta": net_delta,
            "data_source": "synthetic_demo",
        }

    def get_net_rsvp_delta(self, mess_id: str, date_str: str, meal: str) -> int:
        """
        Calculates the live delta to turnout from student RSVPs.
        Eating = +1, Skipping = -1.
        """
        target_meal = meal.lower()
        delta = 0
        for r in self.rsvps.values():
            if r["mess_id"] == mess_id and r["date"] == date_str and r["meal"].lower() == target_meal:
                if r["status"] == "eating":
                    delta += 1
                elif r["status"] == "skipping":
                    delta -= 1
        return delta

    def evaluate_plate(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluates a composite plate:
        - Sums calories, macros, cost, co2e
        - Computes neutral descriptor: Light / Moderate / Hearty
        - Generates neutral data-driven nutrition & climate hints
        """
        total_kcal = 0.0
        total_protein = 0.0
        total_carbs = 0.0
        total_fat = 0.0
        total_cost_inr = 0.0
        total_co2e_g = 0.0

        item_breakdowns = []
        veg_plate = True

        for it in items:
            food_id = it.get("food_id")
            count = int(it.get("count", 1))
            food = self.food_map.get(food_id)
            if not food:
                continue

            if not food.get("veg", True):
                veg_plate = False

            item_kcal = food["kcal_per_unit"] * count
            item_protein = food.get("protein_g", 0.0) * count
            item_carbs = food.get("carbs_g", 0.0) * count
            item_fat = food.get("fat_g", 0.0) * count
            item_cost = food.get("cost_inr_per_unit", 0.0) * count
            item_co2e = food.get("co2e_g_per_unit", 0.0) * count

            total_kcal += item_kcal
            total_protein += item_protein
            total_carbs += item_carbs
            total_fat += item_fat
            total_cost_inr += item_cost
            total_co2e_g += item_co2e

            item_breakdowns.append({
                "food_id": food["id"],
                "name": food["name"],
                "category": food["category"],
                "unit": food["unit"],
                "count": count,
                "model_id": food.get("model_id"),
                "icon_id": food.get("icon_id"),
                "kcal": item_kcal,
                "protein_g": round(item_protein, 1),
                "carbs_g": round(item_carbs, 1),
                "fat_g": round(item_fat, 1),
                "cost_inr": round(item_cost, 1),
                "co2e_g": round(item_co2e, 1),
            })

        # Neutral descriptor based on standard caloric benchmarks
        if total_kcal < 450:
            descriptor = "Light"
        elif total_kcal <= 850:
            descriptor = "Moderate"
        else:
            descriptor = "Hearty"

        # Data-driven neutral hints (zero judgmental wording)
        hints = []
        if total_protein >= 25.0:
            hints.append("High protein combination supporting active physical & sports recovery.")
        elif total_protein >= 15.0:
            hints.append("Balanced protein composition meeting typical collegiate study session demands.")

        if total_co2e_g <= 250.0:
            hints.append("Climate-efficient plate selection with low supply-chain emissions.")
        elif total_co2e_g >= 600.0:
            hints.append("Dairy/animal protein forward combination with higher supply-chain resource intensity.")

        if total_carbs >= 90.0:
            hints.append("Sustained carbohydrate profile suited for endurance study schedules.")

        primary_hint = hints[0] if hints else "Balanced collegiate meal selection."

        return {
            "total_kcal": int(round(total_kcal)),
            "protein_g": round(total_protein, 1),
            "carbs_g": round(total_carbs, 1),
            "fat_g": round(total_fat, 1),
            "cost_inr": round(total_cost_inr, 1),
            "co2e_g": round(total_co2e_g, 1),
            "descriptor": descriptor,
            "hint": primary_hint,
            "is_veg": veg_plate,
            "disclaimer": "General information, not medical or dietary advice.",
            "item_count": len(item_breakdowns),
            "items": item_breakdowns,
        }

    def save_plate(self, name: str, items: List[Dict[str, Any]], mess_id: Optional[str] = None, meal: Optional[str] = None) -> Dict[str, Any]:
        """Saves a custom plate, capping at 500 plates."""
        eval_result = self.evaluate_plate(items)
        plate_record = {
            "id": f"plate-{len(self.saved_plates) + 1}",
            "name": name,
            "mess_id": mess_id or "mess-boys-a",
            "meal": meal or "Lunch",
            "is_popular_seed": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            **eval_result,
        }
        self.saved_plates.append(plate_record)
        if len(self.saved_plates) > self.max_plates:
            # retain popular seeds and purge oldest user plates
            non_seeds = [p for p in self.saved_plates if not p.get("is_popular_seed")]
            if len(non_seeds) > (self.max_plates - 4):
                to_remove = non_seeds[0]
                self.saved_plates.remove(to_remove)
        return plate_record

    def get_popular_plates(self) -> List[Dict[str, Any]]:
        return self.saved_plates[:10]

    def approve_plan(self, mess_id: str, date_str: str, meal: str) -> bool:
        key = f"{mess_id}:{date_str}:{meal.lower()}"
        self.approved_plans.add(key)
        return True

    def is_plan_approved(self, mess_id: str, date_str: str, meal: str) -> bool:
        key = f"{mess_id}:{date_str}:{meal.lower()}"
        return key in self.approved_plans

    def reset(self):
        """Resets all in-memory demo stores."""
        self.logs.clear()
        self.rsvps.clear()
        self.approved_plans.clear()
        self._seed_popular_plates()


store = DemoStore()
