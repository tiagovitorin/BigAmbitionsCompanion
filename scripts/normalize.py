#!/usr/bin/env python3
"""
Big Ambitions Data Normalization Pipeline
Author: Antigravity Team
Phase 5: Reads /data/raw/*.json, resolves localizations, cross-references all entities,
computes economic metrics, exports to /data/normalized/*.json, and builds /data/bigambitions.sqlite.
"""

import json
import math
import os
import re
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
NORM_DIR = BASE_DIR / "data" / "normalized"
SQLITE_FILE = BASE_DIR / "data" / "bigambitions.sqlite"

NORM_DIR.mkdir(parents=True, exist_ok=True)


def load_raw_json(filename):
    path = RAW_DIR / filename
    if not path.exists():
        print(f"Warning: {filename} does not exist in {RAW_DIR}")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_localization_dict():
    raw_loc = load_raw_json("localization_en.json")
    if isinstance(raw_loc, dict):
        return {k.lower(): v for k, v in raw_loc.items()}
    return {}


LOC_DICT = build_localization_dict()


def localize(key, default=None):
    if not key:
        return default or ""
    k_lower = key.lower().strip()
    if k_lower in LOC_DICT:
        return LOC_DICT[k_lower]
    # Try stripping prefix like 'ba:itemname_' or 'ba:businesstype_' or 'ba:neighborhood_'
    clean_k = re.sub(r"^ba:[a-z_]+_", "", k_lower)
    if clean_k in LOC_DICT:
        return LOC_DICT[clean_k]
    # Fallback to Title Case from ID
    if default is not None:
        return default
    words = re.sub(r"^ba:[a-z_]+_", "", key).replace("_", " ").title()
    return words


def clean_id(raw_id):
    if not raw_id:
        return ""
    return re.sub(r"^ba:[a-z_]+_", "", raw_id.lower().strip())


print("Starting normalization pass...")

# Load all raw datasets
raw_items = load_raw_json("items.json")
raw_businesses = load_raw_json("business_types.json")
raw_recipes = load_raw_json("factory_recipes.json")
raw_workstations = load_raw_json("factory_workstations.json")
raw_buildings = load_raw_json("buildings.json")
raw_sizes = load_raw_json("building_sizes.json")
raw_btypes = load_raw_json("building_types.json")
raw_neighborhoods = load_raw_json("neighborhoods.json")
raw_skills = load_raw_json("skills.json")
raw_diplomas = load_raw_json("diplomas.json")
raw_vehicles = load_raw_json("vehicles.json")
raw_happiness = load_raw_json("happiness_modifiers.json")
raw_job_demands = load_raw_json("job_demands.json")

# Build Quick Lookup Tables
item_lookup = {item["itemName"]: item for item in raw_items if "itemName" in item}
biz_lookup = {b["businessTypeName"]: b for b in raw_businesses if "businessTypeName" in b}
neighborhood_lookup = {n["neighbourhood"]: n for n in raw_neighborhoods if "neighbourhood" in n}

# -------------------------------------------------------------
# 1. NORMALIZE NEIGHBORHOODS
# -------------------------------------------------------------
norm_neighborhoods = []
for n in raw_neighborhoods:
    nid = n.get("neighbourhood", "")
    c_id = clean_id(nid)
    name = localize(nid, c_id.replace("_", " ").title())
    norm_neighborhoods.append({
        "id": c_id,
        "raw_id": nid,
        "name": name,
        "demographics": {
            "working_class_pct": n.get("workingClassPercentage", 0),
            "middle_class_pct": n.get("middleClassPercentage", 0),
            "upper_class_pct": n.get("upperClassPercentage", 0),
        },
        "economic_factors": {
            "real_estate_multiplier": n.get("realEstateMultiplier", 1.0),
            "parking_price": n.get("parkingPrice", 0.0),
            "customer_demands_weight": n.get("customerDemandsWeight", 0.0),
            "vehicle_traffic_density_pct": n.get("vehicleTrafficDensityPercentage", 100),
            "base_building_price_sqm": n.get("baseBuildingPricePerSqm", 20554.0),
            "rent_multiplier_sqm": n.get("rentMultiplierPerSqmPrice", 0.00056),
            "marketing_strength": n.get("marketingStrength", 1.0),
            "shutdown_daily_income_threshold": n.get("maxDailyIncomeToShutDownBusiness", 500.0)
        }
    })

# -------------------------------------------------------------
# 2. CROSS-REFERENCE PRODUCTS & RECIPES WITH ITEMS
# -------------------------------------------------------------
item_sold_in = {}  # item_raw_id -> list of { business_id, business_name, impact, is_primary }
for b in raw_businesses:
    bid = b.get("businessTypeName", "")
    b_cid = clean_id(bid)
    b_name = localize(bid, b_cid.title())
    for p in b.get("products", []):
        p_raw = p.get("itemName")
        if p_raw:
            if p_raw not in item_sold_in:
                item_sold_in[p_raw] = []
            item_sold_in[p_raw].append({
                "business_id": b_cid,
                "business_name": b_name,
                "impact": p.get("impact", 1.0),
                "is_primary": p.get("isPrimary", True)
            })

item_produced_by = {}  # item_raw_id -> list of recipe summary
item_used_in_recipes = {}  # item_raw_id -> list of recipe summary
for r in raw_recipes:
    out_item = r.get("output", {}).get("item")
    r_id = r.get("id")
    if out_item:
        if out_item not in item_produced_by:
            item_produced_by[out_item] = []
        item_produced_by[out_item].append({
            "recipe_id": r_id,
            "base_amount": r.get("output", {}).get("baseAmount", 0),
            "max_skilled_amount": r.get("output", {}).get("maxSkilledAmount", 0),
            "machines": [clean_id(m) for m in r.get("productionMachines", [])]
        })
    for ing in r.get("ingredients", []):
        ing_item = ing.get("item")
        if ing_item:
            if ing_item not in item_used_in_recipes:
                item_used_in_recipes[ing_item] = []
            item_used_in_recipes[ing_item].append({
                "recipe_id": r_id,
                "amount_required": ing.get("amount", 0),
                "for_product": clean_id(out_item)
            })

# -------------------------------------------------------------
# 3. NORMALIZE ITEMS
# -------------------------------------------------------------
norm_items = []
for item in raw_items:
    raw_id = item.get("itemName", "")
    c_id = clean_id(raw_id)
    name = localize(raw_id, c_id.replace("_", " ").title())
    wholesale = float(item.get("wholesalePrice", 0.0))
    market_price = float(item.get("defaultMarketPrice", 0.0))
    margin_pct = round(((market_price - wholesale) / market_price * 100), 2) if market_price > 0 else 0.0

    norm_items.append({
        "id": c_id,
        "raw_id": raw_id,
        "name": name,
        "type": item.get("type", "Unknown"),
        "financials": {
            "wholesale_price": wholesale,
            "default_market_price": market_price,
            "profit_margin_pct": margin_pct,
            "max_wholesale_order_amount": item.get("maxWholesaleOrderAmount", 5000),
            "max_order_amount_per_importer": item.get("maxOrderAmountPerImporter", 5000),
            "optimal_providers": item.get("optimalProviders", 7)
        },
        "retail_properties": {
            "product_sales_ratio": item.get("productSalesRatio", 0.0),
            "box_size": item.get("boxSize", 1),
            "can_put_in_shopping_basket": item.get("canPutInShoppingBasket", False),
            "is_demanded_product": item.get("isADemandedProduct", False),
            "is_special_rival_only": item.get("isSpecialRivalOnly", False),
            "default_shelf_item": clean_id(item.get("defaultShelfItemName", "")),
            "showcase_items": [clean_id(x) for x in item.get("showcaseItems", []) if x]
        },
        "furniture_properties": {
            "is_furniture": item.get("isFurniture", False),
            "grid_size": item.get("gridSize", 0.5),
            "degrees_per_rotation": item.get("degreesPerRotation", 45.0),
            "quality": item.get("quality", 0),
            "added_customers_per_hour": item.get("addedCustomersPerHour", 0),
            "cargo_capacity_boxes": item.get("cargoCapacity", 0),
            "cargo_capacity_multiplier": item.get("cargoCapacityMultiplier", 0.0),
            "wall_mounted": item.get("wallMounted", False),
            "snap_to_ceiling": item.get("snapToCeiling", False),
            "can_be_grabbed": item.get("canBeGrabbed", True),
            "requirements": item.get("furnitureRequirements", [])
        },
        "consumable_properties": {
            "is_consumable": item.get("isConsumable", False),
            "saturation": item.get("saturation", 0),
            "energy": item.get("energy", 0),
            "requires_weighing": item.get("requiresWeighing", False)
        },
        "workstation_properties": {
            "assignable": item.get("assignable", False),
            "has_waiting_line": item.get("hasWaitingLine", False),
            "can_player_do_order": item.get("canPlayerDoOrder", False),
            "suitable_skills": [clean_id(s) for s in item.get("suitableSkills", [])]
        },
        "seasonal": {
            "is_special_gift": item.get("isSpecialGift", False),
            "season": item.get("season", "None"),
            "is_seasonal_for_sale": item.get("isSeasonalForSale", False),
            "items_by_season": item.get("itemsBySeason", [])
        },
        "cross_references": {
            "sold_in_businesses": item_sold_in.get(raw_id, []),
            "produced_by_recipes": item_produced_by.get(raw_id, []),
            "used_as_ingredient_in": item_used_in_recipes.get(raw_id, [])
        }
    })

# -------------------------------------------------------------
# 4. NORMALIZE BUSINESS TYPES
# -------------------------------------------------------------
norm_businesses = []
for b in raw_businesses:
    raw_id = b.get("businessTypeName", "")
    c_id = clean_id(raw_id)
    name = localize(raw_id, c_id.replace("_", " ").title())

    hourly_multipliers = [0.0] * 24
    for hf in b.get("hourlyFactorMultipliers", []):
        sh = hf.get("startingHour", 0)
        eh = hf.get("endingHour", 24)
        mult = hf.get("multiplier", 0.0)
        for hour in range(sh, min(eh, 24)):
            hourly_multipliers[hour] = mult

    peak_hours = [h for h, m in enumerate(hourly_multipliers) if m >= 0.7]
    active_hours = [h for h, m in enumerate(hourly_multipliers) if m >= 0.2]
    best_window = f"{active_hours[0]:02d}:00 - {(active_hours[-1] + 1):02d}:00" if active_hours else "24/7"

    products_list = []
    for p in b.get("products", []):
        p_raw = p.get("itemName", "")
        p_cid = clean_id(p_raw)
        p_item = item_lookup.get(p_raw, {})
        products_list.append({
            "id": p_cid,
            "name": localize(p_raw, p_cid.title()),
            "impact": p.get("impact", 1.0),
            "is_primary": p.get("is_primary", True),
            "wholesale_price": p_item.get("wholesalePrice", 0.0),
            "default_market_price": p_item.get("defaultMarketPrice", 0.0),
            "profit_margin_pct": round(((p_item.get("defaultMarketPrice", 0.0) - p_item.get("wholesalePrice", 0.0)) / p_item.get("defaultMarketPrice", 1.0) * 100), 2) if p_item.get("defaultMarketPrice", 0.0) > 0 else 0.0
        })

    norm_businesses.append({
        "id": c_id,
        "raw_id": raw_id,
        "name": name,
        "suitable_building_type": clean_id(b.get("suitableBuildingType", "")),
        "customer_type": b.get("customerType", "None"),
        "spawn_customers": b.get("spawnCustomers", True),
        "course_required": b.get("courseRequired", "Undefined"),
        "entrance_fees": {
            "has_entrance_fee": b.get("hasEntranceFee", False),
            "default_entrance_fee": b.get("defaultEntranceFee", ""),
            "has_weekend_only_entrance_fee": b.get("hasWeekendOnlyEntranceFee", False),
            "weekend_only_entrance_fee": b.get("weekendOnlyEntranceFee", "")
        },
        "operating_schedule": {
            "hourly_multipliers": hourly_multipliers,
            "peak_hours": peak_hours,
            "recommended_opening_window": best_window,
            "day_multipliers": {df.get("dayOfWeek"): df.get("multiplier") for df in b.get("dayFactorMultipliers", [])}
        },
        "products": products_list,
        "requirements": b.get("requirements", []),
        "customer_demand_sets": b.get("customerDemandSets", []),
        "employee_primary_skills": [clean_id(s) for s in b.get("employeePrimarySkills", [])]
    })

# -------------------------------------------------------------
# 5. NORMALIZE FACTORY RECIPES
# -------------------------------------------------------------
norm_recipes = []
for r in raw_recipes:
    r_id = r.get("id", "")
    out_obj = r.get("output", {})
    out_raw = out_obj.get("item", "")
    out_cid = clean_id(out_raw)
    out_name = localize(out_raw, out_cid.title())

    base_amount = out_obj.get("baseAmount", 0)
    max_skilled_amount = out_obj.get("maxSkilledAmount", base_amount)

    out_item_data = item_lookup.get(out_raw, {})
    mkt_price = float(out_item_data.get("defaultMarketPrice", 0.0))

    ingredients_list = []
    total_ingredient_cost = 0.0
    for ing in r.get("ingredients", []):
        ing_raw = ing.get("item", "")
        ing_cid = clean_id(ing_raw)
        ing_name = localize(ing_raw, ing_cid.title())
        ing_amt = ing.get("amount", 0)
        ing_item_data = item_lookup.get(ing_raw, {})
        ing_wholesale = float(ing_item_data.get("wholesalePrice", 0.0))
        ing_cost = ing_amt * ing_wholesale
        total_ingredient_cost += ing_cost
        ingredients_list.append({
            "id": ing_cid,
            "raw_id": ing_raw,
            "name": ing_name,
            "amount": ing_amt,
            "unit_wholesale_price": ing_wholesale,
            "total_ingredient_cost": ing_cost
        })

    base_revenue = base_amount * mkt_price
    skilled_revenue = max_skilled_amount * mkt_price

    norm_recipes.append({
        "id": r_id,
        "name": f"{out_name} Recipe",
        "output": {
            "id": out_cid,
            "raw_id": out_raw,
            "name": out_name,
            "base_amount": base_amount,
            "max_skilled_amount": max_skilled_amount,
            "unit_market_price": mkt_price
        },
        "ingredients": ingredients_list,
        "economics": {
            "total_ingredient_cost": total_ingredient_cost,
            "cost_per_unit_base": round(total_ingredient_cost / base_amount, 2) if base_amount > 0 else 0.0,
            "cost_per_unit_skilled": round(total_ingredient_cost / max_skilled_amount, 2) if max_skilled_amount > 0 else 0.0,
            "gross_profit_per_batch_base": round(base_revenue - total_ingredient_cost, 2),
            "gross_profit_per_batch_skilled": round(skilled_revenue - total_ingredient_cost, 2)
        },
        "production_machines": [clean_id(m) for m in r.get("productionMachines", [])]
    })

# -------------------------------------------------------------
# 6. NORMALIZE BUILDINGS / REAL ESTATE
# -------------------------------------------------------------
norm_buildings = []
for b in raw_buildings:
    street_num = b.get("streetNumber", 0)
    street_raw = b.get("streetName", "")
    street_clean = clean_id(street_raw)
    street_name = localize(street_raw, street_clean.replace("_", " ").title())
    address_str = f"{street_num} {street_name}"

    n_raw = b.get("neighbourhood", "")
    n_clean = clean_id(n_raw)
    n_name = localize(n_raw, n_clean.title())
    n_data = neighborhood_lookup.get(n_raw, {})

    re_mult = float(n_data.get("realEstateMultiplier", 1.0))
    base_sqm_price = float(n_data.get("baseBuildingPricePerSqm", 20554.0))
    rent_mult = float(n_data.get("rentMultiplierPerSqmPrice", 0.00056))

    sqm = b.get("squareMeters", 0)
    price_idx = float(b.get("priceIndex", 1.0))

    est_purchase_price = round(sqm * base_sqm_price * re_mult * price_idx, 2)
    est_daily_rent = round(est_purchase_price * rent_mult, 2)

    norm_buildings.append({
        "id": f"{street_num}-{street_clean}",
        "address": address_str,
        "street_number": street_num,
        "street_name": street_name,
        "neighborhood_id": n_clean,
        "neighborhood_name": n_name,
        "building_type": clean_id(b.get("buildingType", "")),
        "building_size": b.get("buildingSize", ""),
        "square_meters": sqm,
        "price_index": price_idx,
        "traffic_index": b.get("trafficIndex", 0),
        "estimated_purchase_price": est_purchase_price,
        "estimated_daily_rent": est_daily_rent,
        "special_service": b.get("specialService")
    })

# -------------------------------------------------------------
# 7. EXPORT NORMALIZED JSON FILES
# -------------------------------------------------------------
def save_norm_json(filename, data):
    path = NORM_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Exported {filename} ({len(data) if isinstance(data, list) else 1} records)")

save_norm_json("items.json", norm_items)
save_norm_json("businesses.json", norm_businesses)
save_norm_json("recipes.json", norm_recipes)
save_norm_json("workstations.json", raw_workstations)
save_norm_json("buildings.json", norm_buildings)
save_norm_json("neighborhoods.json", norm_neighborhoods)
save_norm_json("skills.json", raw_skills)
save_norm_json("diplomas.json", raw_diplomas)
save_norm_json("vehicles.json", raw_vehicles)
save_norm_json("happiness_modifiers.json", raw_happiness)
save_norm_json("job_demands.json", raw_job_demands)

# -------------------------------------------------------------
# 8. BUILD SQLITE DATABASE
# -------------------------------------------------------------
print(f"Building SQLite database at {SQLITE_FILE}...")
if SQLITE_FILE.exists():
    SQLITE_FILE.unlink()

conn = sqlite3.connect(SQLITE_FILE)
cur = conn.cursor()

# Items Table
cur.execute("""
CREATE TABLE items (
    id TEXT PRIMARY KEY,
    raw_id TEXT,
    name TEXT,
    type TEXT,
    wholesale_price REAL,
    default_market_price REAL,
    profit_margin_pct REAL,
    product_sales_ratio REAL,
    box_size INTEGER,
    can_put_in_basket BOOLEAN,
    is_furniture BOOLEAN,
    quality INTEGER,
    added_customers_per_hour INTEGER,
    cargo_capacity_boxes INTEGER,
    is_consumable BOOLEAN,
    saturation INTEGER,
    energy INTEGER,
    requires_weighing BOOLEAN,
    assignable BOOLEAN,
    optimal_providers INTEGER,
    json_data TEXT
)
""")

for item in norm_items:
    cur.execute("""
    INSERT INTO items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        item["id"],
        item["raw_id"],
        item["name"],
        item["type"],
        item["financials"]["wholesale_price"],
        item["financials"]["default_market_price"],
        item["financials"]["profit_margin_pct"],
        item["retail_properties"]["product_sales_ratio"],
        item["retail_properties"]["box_size"],
        item["retail_properties"]["can_put_in_shopping_basket"],
        item["furniture_properties"]["is_furniture"],
        item["furniture_properties"]["quality"],
        item["furniture_properties"]["added_customers_per_hour"],
        item["furniture_properties"]["cargo_capacity_boxes"],
        item["consumable_properties"]["is_consumable"],
        item["consumable_properties"]["saturation"],
        item["consumable_properties"]["energy"],
        item["consumable_properties"]["requires_weighing"],
        item["workstation_properties"]["assignable"],
        item["financials"]["optimal_providers"],
        json.dumps(item)
    ))

# Businesses Table
cur.execute("""
CREATE TABLE businesses (
    id TEXT PRIMARY KEY,
    raw_id TEXT,
    name TEXT,
    suitable_building_type TEXT,
    customer_type TEXT,
    course_required TEXT,
    recommended_opening_window TEXT,
    has_entrance_fee BOOLEAN,
    json_data TEXT
)
""")

for b in norm_businesses:
    cur.execute("""
    INSERT INTO businesses VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        b["id"],
        b["raw_id"],
        b["name"],
        b["suitable_building_type"],
        b["customer_type"],
        b["course_required"],
        b["operating_schedule"]["recommended_opening_window"],
        b["entrance_fees"]["has_entrance_fee"],
        json.dumps(b)
    ))

# Recipes Table
cur.execute("""
CREATE TABLE recipes (
    id TEXT PRIMARY KEY,
    name TEXT,
    output_item_id TEXT,
    output_item_name TEXT,
    base_amount INTEGER,
    max_skilled_amount INTEGER,
    total_ingredient_cost REAL,
    gross_profit_base REAL,
    gross_profit_skilled REAL,
    json_data TEXT
)
""")

for r in norm_recipes:
    cur.execute("""
    INSERT INTO recipes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        r["id"],
        r["name"],
        r["output"]["id"],
        r["output"]["name"],
        r["output"]["base_amount"],
        r["output"]["max_skilled_amount"],
        r["economics"]["total_ingredient_cost"],
        r["economics"]["gross_profit_per_batch_base"],
        r["economics"]["gross_profit_per_batch_skilled"],
        json.dumps(r)
    ))

# Buildings Table
cur.execute("""
CREATE TABLE buildings (
    id TEXT PRIMARY KEY,
    address TEXT,
    street_number INTEGER,
    street_name TEXT,
    neighborhood_id TEXT,
    neighborhood_name TEXT,
    building_type TEXT,
    building_size TEXT,
    square_meters INTEGER,
    price_index REAL,
    traffic_index INTEGER,
    estimated_purchase_price REAL,
    estimated_daily_rent REAL,
    json_data TEXT
)
""")

for b in norm_buildings:
    cur.execute("""
    INSERT INTO buildings VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        b["id"],
        b["address"],
        b["street_number"],
        b["street_name"],
        b["neighborhood_id"],
        b["neighborhood_name"],
        b["building_type"],
        b["building_size"],
        b["square_meters"],
        b["price_index"],
        b["traffic_index"],
        b["estimated_purchase_price"],
        b["estimated_daily_rent"],
        json.dumps(b)
    ))

# Neighborhoods Table
cur.execute("""
CREATE TABLE neighborhoods (
    id TEXT PRIMARY KEY,
    raw_id TEXT,
    name TEXT,
    working_class_pct INTEGER,
    middle_class_pct INTEGER,
    upper_class_pct INTEGER,
    real_estate_multiplier REAL,
    parking_price REAL,
    marketing_strength REAL,
    json_data TEXT
)
""")

for n in norm_neighborhoods:
    cur.execute("""
    INSERT INTO neighborhoods VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        n["id"],
        n["raw_id"],
        n["name"],
        n["demographics"]["working_class_pct"],
        n["demographics"]["middle_class_pct"],
        n["demographics"]["upper_class_pct"],
        n["economic_factors"]["real_estate_multiplier"],
        n["economic_factors"]["parking_price"],
        n["economic_factors"]["marketing_strength"],
        json.dumps(n)
    ))

# Create Indexes
cur.execute("CREATE INDEX idx_items_type ON items(type)")
cur.execute("CREATE INDEX idx_items_margin ON items(profit_margin_pct DESC)")
cur.execute("CREATE INDEX idx_buildings_neighborhood ON buildings(neighborhood_id)")
cur.execute("CREATE INDEX idx_buildings_type ON buildings(building_type)")
cur.execute("CREATE INDEX idx_buildings_rent ON buildings(estimated_daily_rent ASC)")
cur.execute("CREATE INDEX idx_recipes_output ON recipes(output_item_id)")

conn.commit()
conn.close()

print("Phase 5 Normalization & SQLite database generated successfully!")
