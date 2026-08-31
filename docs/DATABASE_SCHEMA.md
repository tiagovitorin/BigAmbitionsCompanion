# Database Schema & Storage Architecture

## 1. Relational Schema (SQLite / PostgreSQL)

### `items`
- `id` (TEXT PRIMARY KEY): Unique item name key (e.g. `itemname_apple`, `itemname_wine`)
- `name` (TEXT): Localized display name
- `type` (INTEGER / TEXT): Item category flags (Retail, Furniture, Consumable, Accessory, Producer)
- `wholesale_price` (REAL)
- `default_market_price` (REAL)
- `product_sales_ratio` (REAL)
- `box_size` (INTEGER)
- `cargo_capacity` (INTEGER)
- `cargo_capacity_multiplier` (REAL)
- `quality` (INTEGER)
- `is_furniture` (BOOLEAN)
- `grid_size` (REAL)
- `added_customers_per_hour` (INTEGER)
- `raw_json` (TEXT): Full raw object payload for forward-compatibility

### `business_types`
- `id` (TEXT PRIMARY KEY): Unique business type identifier (e.g. `ba:businesstype_supermarket`)
- `name` (TEXT): Display name
- `suitable_building_type` (TEXT)
- `spawn_customers` (BOOLEAN)
- `has_entrance_fee` (BOOLEAN)
- `course_required` (TEXT)
- `max_amount_per_product` (REAL)
- `raw_json` (TEXT)

### `business_products`
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `business_type_id` (TEXT REFERENCES `business_types(id)`)
- `item_id` (TEXT REFERENCES `items(id)`)
- `impact` (REAL): Sales impact factor ($\ge 1.0$ for primary, $< 1.0$ for secondary)
- `is_primary` (BOOLEAN)

### `factory_recipes`
- `id` (TEXT PRIMARY KEY): Recipe GUID
- `output_item_id` (TEXT REFERENCES `items(id)`)
- `base_output_amount` (INTEGER)
- `max_skilled_output_amount` (INTEGER)
- `workstation_type` (TEXT)

### `recipe_ingredients`
- `recipe_id` (TEXT REFERENCES `factory_recipes(id)`)
- `item_id` (TEXT REFERENCES `items(id)`)
- `amount` (INTEGER)
- PRIMARY KEY (`recipe_id`, `item_id`)

### `buildings`
- `id` (TEXT PRIMARY KEY)
- `address` (TEXT)
- `neighborhood_id` (TEXT)
- `building_size_sqm` (REAL)
- `rent_per_hour` (REAL)
- `sale_price` (REAL)
- `building_type` (TEXT)
