"""
Repository layer for PlateWise AI Demo data.
Handles all CRUD operations, bounds validation, FIFO storage caps,
and data persistence for messes, foods, weekly menus, meal logs, plates, and RSVPs.
"""

import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

try:
    from app.demo.models import (
        DemoMess,
        DemoFood,
        DemoWeeklyMenu,
        DemoMealLog,
        DemoPlate,
        DemoRsvp,
        DemoIngredient,
    )
    from app.demo.seed import (
        seed_demo_data_if_empty,
        reset_demo_data,
        SEED_MESSES,
        RECONCILED_FOODS,
        WEEKDAY_MENU_TEMPLATES,
    )
except ImportError:
    from backend.app.demo.models import (
        DemoMess,
        DemoFood,
        DemoWeeklyMenu,
        DemoMealLog,
        DemoPlate,
        DemoRsvp,
        DemoIngredient,
    )
    from backend.app.demo.seed import (
        seed_demo_data_if_empty,
        reset_demo_data,
        SEED_MESSES,
        RECONCILED_FOODS,
        WEEKDAY_MENU_TEMPLATES,
    )


class DemoRepository:
    MAX_LOGS = 500
    MAX_RSVPS = 1000
    MAX_PLATES = 500

    # -------------------------------------------------------------------------
    # 1. Mess Halls CRUD
    # -------------------------------------------------------------------------
    def get_messes(self, db: Session) -> List[DemoMess]:
        seed_demo_data_if_empty(db)
        return db.query(DemoMess).all()

    def get_mess(self, db: Session, mess_id: str) -> Optional[DemoMess]:
        seed_demo_data_if_empty(db)
        return db.query(DemoMess).filter(DemoMess.id == mess_id).first()

    def create_mess(self, db: Session, data: Dict[str, Any]) -> DemoMess:
        seed_demo_data_if_empty(db)
        slug = re.sub(r"[^a-z0-9]+", "-", data["name"].lower()).strip("-")
        mess_id = f"mess-{slug}" if slug else "mess-custom"

        # Unique ID resolution
        existing = db.query(DemoMess).filter(DemoMess.id == mess_id).first()
        if existing:
            count = db.query(DemoMess).count()
            mess_id = f"{mess_id}-{count + 1}"

        loc = data.get("location") or data.get("campus_location") or "Campus Main Zone"
        meal_times = {
            "breakfast": data.get("breakfast_time", "07:30 - 09:30"),
            "lunch": data.get("lunch_time", "12:00 - 14:30"),
            "dinner": data.get("dinner_time", "19:30 - 21:30"),
        }
        capacity = int(data["capacity"])
        new_mess = DemoMess(
            id=mess_id,
            name=data["name"],
            capacity=capacity,
            location=loc,
            campus_location=loc,
            type=data.get("type", "hostel_mess"),
            avg_daily_diners=int(capacity * 0.82),
            current_turnout_pct=82,
            status="active",
            manager_name=data.get("manager_name", "Duty Manager"),
            meal_times=meal_times,
        )
        db.add(new_mess)

        # Also initialize default 7-day cyclical weekly menus for this mess
        for dow in range(7):
            for meal_name, templates in WEEKDAY_MENU_TEMPLATES.items():
                dish_list = templates[dow % len(templates)]
                menu_id = f"menu-{mess_id}-{dow}-{meal_name.lower()}"
                db.add(
                    DemoWeeklyMenu(
                        id=menu_id,
                        mess_id=mess_id,
                        day_of_week=dow,
                        meal=meal_name,
                        dish_ids=dish_list,
                        predicted_waste_kg=round(8.0 + (dow % 3) * 1.5, 1),
                        predicted_cost_inr=round(42.0 * len(dish_list), 1),
                    )
                )

        db.commit()
        db.refresh(new_mess)
        return new_mess

    def update_mess(self, db: Session, mess_id: str, data: Dict[str, Any]) -> Optional[DemoMess]:
        mess = db.query(DemoMess).filter(DemoMess.id == mess_id).first()
        if not mess:
            return None

        if "name" in data and data["name"]:
            mess.name = data["name"]
        if "capacity" in data and data["capacity"]:
            mess.capacity = int(data["capacity"])
            mess.avg_daily_diners = int(mess.capacity * 0.82)
        if "location" in data:
            mess.location = data["location"]
            mess.campus_location = data["location"]
        if "type" in data:
            mess.type = data["type"]
        if "status" in data:
            mess.status = data["status"]
        if "manager_name" in data:
            mess.manager_name = data["manager_name"]

        meal_times = dict(mess.meal_times or {})
        if "breakfast_time" in data:
            meal_times["breakfast"] = data["breakfast_time"]
        if "lunch_time" in data:
            meal_times["lunch"] = data["lunch_time"]
        if "dinner_time" in data:
            meal_times["dinner"] = data["dinner_time"]
        mess.meal_times = meal_times

        db.commit()
        db.refresh(mess)
        return mess

    def delete_mess(self, db: Session, mess_id: str) -> bool:
        mess = db.query(DemoMess).filter(DemoMess.id == mess_id).first()
        if not mess:
            return False
        # Do not allow deletion if it is the only mess left
        total = db.query(DemoMess).count()
        if total <= 1:
            raise ValueError("At least one dining hall must remain active in the system.")

        # Clean associated menus & logs
        db.query(DemoWeeklyMenu).filter(DemoWeeklyMenu.mess_id == mess_id).delete()
        db.query(DemoMealLog).filter(DemoMealLog.mess_id == mess_id).delete()
        db.delete(mess)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # 2. Foods Catalogue CRUD
    # -------------------------------------------------------------------------
    def get_foods(self, db: Session) -> List[DemoFood]:
        seed_demo_data_if_empty(db)
        return db.query(DemoFood).order_by(DemoFood.name).all()

    def get_food_map(self, db: Session) -> Dict[str, Dict[str, Any]]:
        foods = self.get_foods(db)
        return {f.id: f.to_dict() for f in foods}

    def get_food(self, db: Session, food_id: str) -> Optional[DemoFood]:
        seed_demo_data_if_empty(db)
        return db.query(DemoFood).filter(DemoFood.id == food_id).first()

    @staticmethod
    def run_food_cross_checks(row: Dict[str, Any]) -> List[str]:
        warnings: List[str] = []

        # 1. Bounds checks: serving 5-800 g, kcal 0-1500
        sw_raw = row.get("serving_weight_g")
        sw = None
        if sw_raw is not None:
            try:
                sw = float(sw_raw)
                if sw < 5.0 or sw > 800.0:
                    warnings.append(
                        f"Serving weight ({sw}g) outside expected typical portion bounds (5g - 800g)"
                    )
            except (ValueError, TypeError):
                pass

        kc_raw = row.get("kcal_per_serving")
        if kc_raw is None:
            kc_raw = row.get("kcal_per_unit")
        kc = None
        if kc_raw is not None:
            try:
                kc = float(kc_raw)
                if kc < 0.0 or kc > 1500.0:
                    warnings.append(
                        f"Calories per serving ({kc} kcal) outside expected single serving bounds (0 - 1500 kcal)"
                    )
            except (ValueError, TypeError):
                pass

        # 2. Cross-check: kcal_per_serving vs kcal_per_100g * serving_weight_g / 100 (> 15%)
        k100_raw = row.get("kcal_per_100g")
        if k100_raw is not None and sw is not None and kc is not None:
            try:
                k100 = float(k100_raw)
                if k100 > 0 and sw > 0 and kc > 0:
                    expected_kcal = (k100 * sw) / 100.0
                    divergence = abs(kc - expected_kcal) / max(expected_kcal, 1.0)
                    if divergence > 0.15:
                        warnings.append(
                            f"Serving kcal ({kc}) diverges by {round(divergence * 100)}% from calculated "
                            f"(kcal_per_100g [{k100}] × serving_weight_g [{sw}g] / 100 = {round(expected_kcal, 1)} kcal)"
                        )
            except (ValueError, TypeError):
                pass

        # 3. Cross-check: macro energy (4*protein + 4*carbs + 9*fat) vs kcal (> 20%)
        p_raw = row.get("protein_g") or row.get("protein") or 0.0
        c_raw = row.get("carbs_g") or row.get("carbs") or 0.0
        f_raw = row.get("fat_g") or row.get("fat") or 0.0
        if kc is not None:
            try:
                p = float(p_raw)
                c = float(c_raw)
                f = float(f_raw)
                macro_energy = (4.0 * p) + (4.0 * c) + (9.0 * f)
                if macro_energy > 0 and kc > 0:
                    diff_pct = abs(kc - macro_energy) / max(macro_energy, 1.0)
                    if diff_pct > 0.20:
                        warnings.append(
                            f"Stated kcal ({kc}) diverges by {round(diff_pct * 100)}% from macro energy sum "
                            f"(4×{p}P + 4×{c}C + 9×{f}F = {round(macro_energy, 1)} kcal)"
                        )
            except (ValueError, TypeError):
                pass

        return warnings

    def create_food(self, db: Session, data: Dict[str, Any]) -> DemoFood:
        seed_demo_data_if_empty(db)
        slug = re.sub(r"[^a-z0-9]+", "-", data["name"].lower()).strip("-")
        food_id = data.get("id") or slug or f"food-{datetime.now().microsecond}"

        existing = db.query(DemoFood).filter(DemoFood.id == food_id).first()
        if existing:
            food_id = f"{food_id}-{datetime.now().microsecond % 1000}"

        sw_g = float(data.get("serving_weight_g") or (float(data.get("serving_weight_kg", 0.15)) * 1000.0))
        kc_srv = float(data.get("kcal_per_serving") or data.get("kcal_per_unit", 150.0))
        cost_srv = float(data.get("cost_inr_per_serving") or data.get("cost_inr_per_unit", 10.0))
        unit_label = data.get("unit_label") or "1 serving"
        unit_str = data.get("unit") or f"1 serving ({int(sw_g)}g)"

        k100 = data.get("kcal_per_100g")
        if k100 is not None:
            try:
                k100 = float(k100)
            except (ValueError, TypeError):
                k100 = None

        food = DemoFood(
            id=food_id,
            name=data["name"],
            category=data.get("category", "curry"),
            veg=bool(data.get("veg", True)),
            unit=unit_str,
            unit_label=unit_label,
            serving_weight_g=sw_g,
            kcal_per_100g=k100,
            kcal_per_serving=kc_srv,
            kcal_per_unit=kc_srv,
            protein_g=float(data.get("protein_g", 0.0)),
            carbs_g=float(data.get("carbs_g", 0.0)),
            fat_g=float(data.get("fat_g", 0.0)),
            fiber_g=float(data.get("fiber_g", 0.0)),
            cost_inr_per_serving=cost_srv,
            cost_inr_per_unit=cost_srv,
            co2e_g_per_unit=float(data.get("co2e_g_per_unit", 100.0)),
            serving_weight_kg=round(sw_g / 1000.0, 3),
            popularity=float(data.get("popularity", 0.85)),
            max_per_plate=int(data.get("max_per_plate", 3)),
            model_id=data.get("model_id"),
            icon_id=data.get("icon_id"),
            source_type=data.get("source_type") or "reference",
            source_note=data.get("source_note"),
            measured_on=data.get("measured_on"),
            recipe_data=data.get("recipe_data"),
            note=data.get("note", "reference"),
            verified=bool(data.get("verified", False)),
        )
        db.add(food)
        db.commit()
        db.refresh(food)
        return food

    def update_food(self, db: Session, food_id: str, data: Dict[str, Any]) -> Optional[DemoFood]:
        food = db.query(DemoFood).filter(DemoFood.id == food_id).first()
        if not food:
            return None

        # Synchronize serving weight & kcal aliases if provided
        if "serving_weight_g" in data and data["serving_weight_g"] is not None:
            sw_g = float(data["serving_weight_g"])
            data["serving_weight_kg"] = round(sw_g / 1000.0, 3)
        if "kcal_per_serving" in data and data["kcal_per_serving"] is not None:
            data["kcal_per_unit"] = float(data["kcal_per_serving"])
        elif "kcal_per_unit" in data and data["kcal_per_unit"] is not None:
            data["kcal_per_serving"] = float(data["kcal_per_unit"])

        if "cost_inr_per_serving" in data and data["cost_inr_per_serving"] is not None:
            data["cost_inr_per_unit"] = float(data["cost_inr_per_serving"])
        elif "cost_inr_per_unit" in data and data["cost_inr_per_unit"] is not None:
            data["cost_inr_per_serving"] = float(data["cost_inr_per_unit"])

        for field in [
            "name",
            "category",
            "veg",
            "unit",
            "unit_label",
            "serving_weight_g",
            "kcal_per_100g",
            "kcal_per_serving",
            "kcal_per_unit",
            "protein_g",
            "carbs_g",
            "fat_g",
            "fiber_g",
            "cost_inr_per_serving",
            "cost_inr_per_unit",
            "co2e_g_per_unit",
            "serving_weight_kg",
            "popularity",
            "max_per_plate",
            "model_id",
            "icon_id",
            "source_type",
            "source_note",
            "measured_on",
            "recipe_data",
            "note",
            "verified",
        ]:
            if field in data and data[field] is not None:
                setattr(food, field, data[field])

        db.commit()
        db.refresh(food)
        return food

    def import_foods_csv(
        self, db: Session, rows: List[Dict[str, Any]], dry_run: bool = False
    ) -> Dict[str, Any]:
        """
        Validates and previews or upserts food catalogue CSV entries.
        Enforces 500 rows limit and runs cross-checks per row.
        """
        seed_demo_data_if_empty(db)
        if len(rows) > 500:
            raise ValueError("CSV exceeds the maximum limit of 500 rows per batch.")

        preview_items: List[Dict[str, Any]] = []
        errors: List[Dict[str, Any]] = []
        warnings_total = 0
        created_count = 0
        updated_count = 0

        # Pre-fetch existing food IDs
        existing_foods = {f.id: f for f in db.query(DemoFood).all()}

        for idx, row in enumerate(rows):
            row_id = str(row.get("id") or "").strip()
            name = str(row.get("name") or "").strip()
            if not row_id or not name:
                errors.append({
                    "row_index": idx + 1,
                    "field": "id/name",
                    "error": "Both 'id' and 'name' are required non-empty fields.",
                })
                continue

            # Run cross-checks
            row_warnings = self.run_food_cross_checks(row)
            warnings_total += len(row_warnings)

            action = "update" if row_id in existing_foods else "create"
            if action == "create":
                created_count += 1
            else:
                updated_count += 1

            item_preview = {
                "row_index": idx + 1,
                "id": row_id,
                "name": name,
                "action": action,
                "category": row.get("category", "curry"),
                "veg": bool(row.get("veg", True)),
                "serving_weight_g": row.get("serving_weight_g", 150.0),
                "kcal_per_serving": row.get("kcal_per_serving") or row.get("kcal_per_unit", 150.0),
                "source_type": row.get("source_type") or "reference",
                "verified": bool(row.get("verified", False)),
                "warnings": row_warnings,
            }
            preview_items.append(item_preview)

            if not dry_run:
                # Upsert into database
                sw_g = float(row.get("serving_weight_g") or 150.0)
                kc_srv = float(row.get("kcal_per_serving") or row.get("kcal_per_unit") or 150.0)
                cost_srv = float(row.get("cost_inr_per_serving") or row.get("cost_inr_per_unit") or 10.0)
                k100 = row.get("kcal_per_100g")
                if k100 is not None:
                    try:
                        k100 = float(k100)
                    except (ValueError, TypeError):
                        k100 = None

                food_payload = {
                    "id": row_id,
                    "name": name,
                    "category": str(row.get("category") or "curry"),
                    "veg": bool(row.get("veg", True)),
                    "unit_label": str(row.get("unit_label") or "1 serving"),
                    "unit": str(row.get("unit") or f"1 serving ({int(sw_g)}g)"),
                    "serving_weight_g": sw_g,
                    "kcal_per_100g": k100,
                    "kcal_per_serving": kc_srv,
                    "kcal_per_unit": kc_srv,
                    "protein_g": float(row.get("protein_g") or row.get("protein") or 0.0),
                    "carbs_g": float(row.get("carbs_g") or row.get("carbs") or 0.0),
                    "fat_g": float(row.get("fat_g") or row.get("fat") or 0.0),
                    "fiber_g": float(row.get("fiber_g") or 0.0),
                    "cost_inr_per_serving": cost_srv,
                    "cost_inr_per_unit": cost_srv,
                    "co2e_g_per_unit": float(row.get("co2e_g_per_unit") or 100.0),
                    "serving_weight_kg": round(sw_g / 1000.0, 3),
                    "popularity": float(row.get("popularity") or 0.85),
                    "max_per_plate": int(row.get("max_per_plate") or 3),
                    "model_id": row.get("model_id"),
                    "icon_id": row.get("icon_id"),
                    "source_type": str(row.get("source_type") or "reference"),
                    "source_note": row.get("source_note"),
                    "measured_on": row.get("measured_on"),
                    "recipe_data": row.get("recipe_data"),
                    "note": str(row.get("note") or "reference"),
                    "verified": bool(row.get("verified", False)),
                }

                if action == "create":
                    new_food = DemoFood(**food_payload)
                    db.add(new_food)
                    existing_foods[row_id] = new_food
                else:
                    target = existing_foods[row_id]
                    for k, v in food_payload.items():
                        if k != "id":
                            setattr(target, k, v)

        if not dry_run and len(errors) == 0:
            db.commit()

        return {
            "total_rows": len(rows),
            "valid_rows": len(preview_items),
            "created_count": created_count,
            "updated_count": updated_count,
            "errors": errors,
            "warnings_count": warnings_total,
            "dry_run": dry_run,
            "items": preview_items,
        }

    def delete_food(self, db: Session, food_id: str) -> bool:
        food = db.query(DemoFood).filter(DemoFood.id == food_id).first()
        if not food:
            return False
        db.delete(food)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # 2b. Ingredient Library CRUD (Seeded EMPTY)
    # -------------------------------------------------------------------------
    def get_ingredients(self, db: Session) -> List[DemoIngredient]:
        seed_demo_data_if_empty(db)
        return db.query(DemoIngredient).order_by(DemoIngredient.name).all()

    def get_ingredient(self, db: Session, ingredient_id: str) -> Optional[DemoIngredient]:
        seed_demo_data_if_empty(db)
        return db.query(DemoIngredient).filter(DemoIngredient.id == ingredient_id).first()

    def create_ingredient(self, db: Session, data: Dict[str, Any]) -> DemoIngredient:
        seed_demo_data_if_empty(db)
        slug = re.sub(r"[^a-z0-9]+", "-", data["name"].lower()).strip("-")
        ing_id = data.get("id") or slug or f"ing-{datetime.now().microsecond}"

        existing = db.query(DemoIngredient).filter(DemoIngredient.id == ing_id).first()
        if existing:
            ing_id = f"{ing_id}-{datetime.now().microsecond % 1000}"

        ingredient = DemoIngredient(
            id=ing_id,
            name=data["name"].strip(),
            kcal_per_100g=float(data["kcal_per_100g"]),
            protein=float(data.get("protein", 0.0)),
            carbs=float(data.get("carbs", 0.0)),
            fat=float(data.get("fat", 0.0)),
            source_note=data.get("source_note"),
        )
        db.add(ingredient)
        db.commit()
        db.refresh(ingredient)
        return ingredient

    def update_ingredient(
        self, db: Session, ingredient_id: str, data: Dict[str, Any]
    ) -> Optional[DemoIngredient]:
        ingredient = db.query(DemoIngredient).filter(DemoIngredient.id == ingredient_id).first()
        if not ingredient:
            return None

        for field in ["name", "kcal_per_100g", "protein", "carbs", "fat", "source_note"]:
            if field in data and data[field] is not None:
                setattr(ingredient, field, data[field])

        db.commit()
        db.refresh(ingredient)
        return ingredient

    def delete_ingredient(self, db: Session, ingredient_id: str) -> bool:
        ingredient = db.query(DemoIngredient).filter(DemoIngredient.id == ingredient_id).first()
        if not ingredient:
            return False
        db.delete(ingredient)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # 3. Weekly Cyclical Menus
    # -------------------------------------------------------------------------
    def get_weekly_menus(self, db: Session, mess_id: str) -> List[DemoWeeklyMenu]:
        seed_demo_data_if_empty(db)
        menus = (
            db.query(DemoWeeklyMenu)
            .filter(DemoWeeklyMenu.mess_id == mess_id)
            .order_by(DemoWeeklyMenu.day_of_week)
            .all()
        )
        return menus

    def set_menu_cell(
        self, db: Session, mess_id: str, day_of_week: int, meal: str, dish_ids: List[str]
    ) -> DemoWeeklyMenu:
        seed_demo_data_if_empty(db)
        menu_id = f"menu-{mess_id}-{day_of_week}-{meal.lower()}"
        menu = db.query(DemoWeeklyMenu).filter(DemoWeeklyMenu.id == menu_id).first()
        if not menu:
            menu = DemoWeeklyMenu(
                id=menu_id,
                mess_id=mess_id,
                day_of_week=day_of_week,
                meal=meal,
                dish_ids=dish_ids,
            )
            db.add(menu)
        else:
            menu.dish_ids = dish_ids

        # Compute estimated cost and waste
        foods = db.query(DemoFood).filter(DemoFood.id.in_(dish_ids)).all()
        total_cost = sum(f.cost_inr_per_unit for f in foods)
        menu.predicted_cost_inr = round(total_cost * 1.2, 1)
        menu.predicted_waste_kg = round(max(3.0, 18.0 - len(dish_ids) * 1.5), 1)

        db.commit()
        db.refresh(menu)
        return menu

    # -------------------------------------------------------------------------
    # 4. Meal Logs (capped at 500)
    # -------------------------------------------------------------------------
    def add_meal_log(self, db: Session, data: Dict[str, Any]) -> DemoMealLog:
        seed_demo_data_if_empty(db)

        # Enforce FIFO cap at 500 records
        total_count = db.query(DemoMealLog).count()
        if total_count >= self.MAX_LOGS:
            oldest = (
                db.query(DemoMealLog)
                .order_by(DemoMealLog.created_at.asc())
                .limit(total_count - self.MAX_LOGS + 1)
                .all()
            )
            for o in oldest:
                db.delete(o)

        log_id = f"log-{total_count + 1}"
        log = DemoMealLog(
            id=log_id,
            mess_id=data["mess_id"],
            date=data["date"],
            meal=data["meal"],
            dish_id=data["dish_id"],
            prepared_kg=float(data["prepared_kg"]),
            consumed_kg=float(data["consumed_kg"]),
            leftover_kg=float(data["leftover_kg"]),
            turnout=int(data["turnout"]),
            is_synthetic_seed=bool(data.get("is_synthetic_seed", False)),
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log

    def get_meal_logs(
        self, db: Session, mess_id: Optional[str] = None, limit: int = 50
    ) -> List[DemoMealLog]:
        seed_demo_data_if_empty(db)
        query = db.query(DemoMealLog)
        if mess_id:
            query = query.filter(DemoMealLog.mess_id == mess_id)
        return query.order_by(desc(DemoMealLog.created_at)).limit(limit).all()

    def update_meal_log(self, db: Session, log_id: str, data: Dict[str, Any]) -> Optional[DemoMealLog]:
        log = db.query(DemoMealLog).filter(DemoMealLog.id == log_id).first()
        if not log:
            return None
        for field in ["prepared_kg", "consumed_kg", "leftover_kg", "turnout", "dish_id"]:
            if field in data and data[field] is not None:
                setattr(log, field, data[field])
        db.commit()
        db.refresh(log)
        return log

    def delete_meal_log(self, db: Session, log_id: str) -> bool:
        log = db.query(DemoMealLog).filter(DemoMealLog.id == log_id).first()
        if not log:
            return False
        db.delete(log)
        db.commit()
        return True

    def import_meal_logs_csv(
        self, db: Session, mess_id: str, rows: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Imports real meal-log CSV records:
        date, meal, food_id, prepared_kg, consumed_kg, leftover_kg, turnout.
        Enforces FIFO limit, sets has_imported_logs=True on mess, and recalculates shifts.
        """
        seed_demo_data_if_empty(db)
        mess = db.query(DemoMess).filter(DemoMess.id == mess_id).first()
        if not mess:
            raise ValueError(f"Mess '{mess_id}' not found.")

        current_count = db.query(DemoMealLog).count()
        if current_count + len(rows) > self.MAX_LOGS:
            excess = (current_count + len(rows)) - self.MAX_LOGS
            oldest = db.query(DemoMealLog).order_by(DemoMealLog.created_at.asc()).limit(excess).all()
            for o in oldest:
                db.delete(o)

        imported_count = 0
        for r in rows:
            p_kg = float(r["prepared_kg"])
            c_kg = float(r["consumed_kg"])
            l_kg = float(r.get("leftover_kg") if r.get("leftover_kg") is not None else max(0.0, p_kg - c_kg))
            turnout = int(r["turnout"])
            dish_id = str(r.get("dish_id") or r.get("food_id"))

            log_id = f"real-{mess_id}-{r['date']}-{r['meal'].lower()}-{dish_id}"
            existing = db.query(DemoMealLog).filter(DemoMealLog.id == log_id).first()
            if existing:
                existing.prepared_kg = p_kg
                existing.consumed_kg = c_kg
                existing.leftover_kg = l_kg
                existing.turnout = turnout
                existing.is_synthetic_seed = False
            else:
                new_log = DemoMealLog(
                    id=log_id,
                    mess_id=mess_id,
                    date=r["date"],
                    meal=r["meal"],
                    dish_id=dish_id,
                    prepared_kg=p_kg,
                    consumed_kg=c_kg,
                    leftover_kg=l_kg,
                    turnout=turnout,
                    is_synthetic_seed=False,
                )
                db.add(new_log)
            imported_count += 1

        # Mark mess as having real imported data!
        mess.has_imported_logs = True
        db.commit()
        db.refresh(mess)

        return {
            "mess_id": mess_id,
            "imported_count": imported_count,
            "has_imported_logs": True,
            "data_source": "college_imported",
            "data_label": "College data (imported)",
            "message": f"Successfully imported {imported_count} verified kitchen records for {mess.name}.",
        }

    def get_recent_log_shift(self, db: Session, mess_id: str, meal: str) -> float:
        """Calculates adaptive forecast adjustment from recent meal logs."""
        logs = (
            db.query(DemoMealLog)
            .filter(DemoMealLog.mess_id == mess_id, DemoMealLog.meal == meal)
            .order_by(desc(DemoMealLog.created_at))
            .limit(10)
            .all()
        )
        if not logs:
            return 0.0
        avg_turnout = sum(l.turnout for l in logs) / len(logs)
        # Shift relative to mess average
        mess = self.get_mess(db, mess_id)
        nominal_turnout = mess.capacity * 0.82 if mess else 700.0
        return round((avg_turnout - nominal_turnout) * 0.25, 1)

    # -------------------------------------------------------------------------
    # 5. Plates & Nutritional Evaluation
    # -------------------------------------------------------------------------
    def evaluate_plate(self, food_map: Dict[str, Dict[str, Any]], items: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_kcal = 0.0
        total_protein = 0.0
        total_carbs = 0.0
        total_fat = 0.0
        total_cost_inr = 0.0
        total_co2e_g = 0.0
        is_veg = True
        breakdowns = []

        for it in items:
            fid = it.get("food_id")
            count = int(it.get("count", 1))
            food = food_map.get(fid)
            if not food and fid == "green-salad":
                food = food_map.get("salad")
            elif not food and fid == "salad":
                food = food_map.get("green-salad")

            if not food:
                continue

            if not food.get("veg", True):
                is_veg = False

            k = food["kcal_per_unit"] * count
            p = (food.get("protein_g") or 0.0) * count
            c = (food.get("carbs_g") or 0.0) * count
            f = (food.get("fat_g") or 0.0) * count
            cost = (food.get("cost_inr_per_unit") or 0.0) * count
            co2 = (food.get("co2e_g_per_unit") or 0.0) * count

            total_kcal += k
            total_protein += p
            total_carbs += c
            total_fat += f
            total_cost_inr += cost
            total_co2e_g += co2

            breakdowns.append({
                "food_id": food["id"],
                "name": food["name"],
                "category": food["category"],
                "unit": food["unit"],
                "count": count,
                "model_id": food.get("model_id"),
                "icon_id": food.get("icon_id"),
                "kcal": int(round(k)),
                "protein_g": round(p, 1),
                "carbs_g": round(c, 1),
                "fat_g": round(f, 1),
                "cost_inr": round(cost, 1),
                "co2e_g": round(co2, 1),
            })

        if total_kcal < 450:
            descriptor = "Light"
        elif total_kcal <= 850:
            descriptor = "Moderate"
        else:
            descriptor = "Hearty"

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
            "is_veg": is_veg,
            "disclaimer": "General information, not medical or dietary advice.",
            "item_count": len(breakdowns),
            "items": breakdowns,
        }

    def save_plate(
        self, db: Session, name: str, items: List[Dict[str, Any]], mess_id: str, meal: str
    ) -> DemoPlate:
        seed_demo_data_if_empty(db)
        food_map = self.get_food_map(db)
        eval_result = self.evaluate_plate(food_map, items)

        # Enforce FIFO cap on non-seed plates at 500
        user_plates = (
            db.query(DemoPlate)
            .filter(DemoPlate.is_popular_seed == False)
            .order_by(DemoPlate.created_at.asc())
            .all()
        )
        if len(user_plates) >= self.MAX_PLATES:
            to_del = user_plates[0]
            db.delete(to_del)

        plate_id = f"plate-{db.query(DemoPlate).count() + 1}"
        plate = DemoPlate(
            id=plate_id,
            name=name,
            mess_id=mess_id or "mess-boys-a",
            meal=meal or "Lunch",
            is_popular_seed=False,
            total_kcal=eval_result["total_kcal"],
            protein_g=eval_result["protein_g"],
            carbs_g=eval_result["carbs_g"],
            fat_g=eval_result["fat_g"],
            cost_inr=eval_result["cost_inr"],
            co2e_g=eval_result["co2e_g"],
            descriptor=eval_result["descriptor"],
            hint=eval_result["hint"],
            is_veg=eval_result["is_veg"],
            items=eval_result["items"],
        )
        db.add(plate)
        db.commit()
        db.refresh(plate)
        return plate

    def get_popular_plates(self, db: Session, mess_id: Optional[str] = None) -> List[DemoPlate]:
        seed_demo_data_if_empty(db)
        query = db.query(DemoPlate)
        if mess_id:
            query = query.filter(DemoPlate.mess_id == mess_id)
        return query.order_by(desc(DemoPlate.is_popular_seed), desc(DemoPlate.created_at)).limit(10).all()

    def delete_plate(self, db: Session, plate_id: str) -> bool:
        plate = db.query(DemoPlate).filter(DemoPlate.id == plate_id).first()
        if not plate:
            return False
        db.delete(plate)
        db.commit()
        return True

    # -------------------------------------------------------------------------
    # 6. Student RSVPs (capped at 1000)
    # -------------------------------------------------------------------------
    def record_rsvp(
        self, db: Session, student_id: str, mess_id: str, date_str: str, meal: str, status: str
    ) -> DemoRsvp:
        seed_demo_data_if_empty(db)
        key = f"{student_id}_{mess_id}_{date_str}_{meal.lower()}"
        rsvp = db.query(DemoRsvp).filter(DemoRsvp.id == key).first()

        if not rsvp:
            # Enforce 1000 row cap
            total_rsvps = db.query(DemoRsvp).count()
            if total_rsvps >= self.MAX_RSVPS:
                oldest = (
                    db.query(DemoRsvp)
                    .order_by(DemoRsvp.updated_at.asc())
                    .limit(total_rsvps - self.MAX_RSVPS + 1)
                    .all()
                )
                for o in oldest:
                    db.delete(o)

            rsvp = DemoRsvp(
                id=key,
                student_id=student_id,
                mess_id=mess_id,
                date=date_str,
                meal=meal,
                status=status,
            )
            db.add(rsvp)
        else:
            rsvp.status = status

        db.commit()
        db.refresh(rsvp)
        return rsvp

    def get_net_rsvp_delta(self, db: Session, mess_id: str, date_str: str, meal: str) -> int:
        rsvps = (
            db.query(DemoRsvp)
            .filter(
                DemoRsvp.mess_id == mess_id,
                DemoRsvp.date == date_str,
                DemoRsvp.meal == meal,
            )
            .all()
        )
        eating = sum(1 for r in rsvps if r.status == "eating")
        skipping = sum(1 for r in rsvps if r.status == "skipping")
        return eating - skipping

    # -------------------------------------------------------------------------
    # 7. Reset System
    # -------------------------------------------------------------------------
    def reset_all(self, db: Session):
        reset_demo_data(db)


repository = DemoRepository()
