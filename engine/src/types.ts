/**
 * Big Ambitions Engine Types
 */

export interface ItemFinancials {
  wholesale_price: number;
  default_market_price: number;
  profit_margin_pct: number;
  max_wholesale_order_amount: number;
  max_order_amount_per_importer: number;
  optimal_providers: number;
}

export interface ItemRetailProperties {
  product_sales_ratio: number;
  box_size: number;
  can_put_in_shopping_basket: boolean;
  is_demanded_product: boolean;
  is_special_rival_only: boolean;
  default_shelf_item: string;
  showcase_items: string[];
}

export interface ItemFurnitureProperties {
  is_furniture: boolean;
  grid_size: number;
  degrees_per_rotation: number;
  quality: number;
  added_customers_per_hour: number;
  cargo_capacity_boxes: number;
  cargo_capacity_multiplier: number;
  wall_mounted: boolean;
  snap_to_ceiling: boolean;
  can_be_grabbed: boolean;
}

export interface NormalizedItem {
  id: string;
  raw_id: string;
  name: string;
  type: string;
  financials: ItemFinancials;
  retail_properties: ItemRetailProperties;
  furniture_properties: ItemFurnitureProperties;
  cross_references: {
    sold_in_businesses: Array<{
      business_id: string;
      business_name: string;
      impact: number;
      is_primary: boolean;
    }>;
    produced_by_recipes: Array<{
      recipe_id: string;
      base_amount: number;
      max_skilled_amount: number;
      machines: string[];
    }>;
    used_as_ingredient_in: Array<{
      recipe_id: string;
      amount_required: number;
      for_product: string;
    }>;
  };
}

export interface BusinessProduct {
  id: string;
  name: string;
  impact: number;
  is_primary: boolean;
  wholesale_price: number;
  default_market_price: number;
  profit_margin_pct: number;
}

export interface BusinessOperatingSchedule {
  hourly_multipliers: number[]; // 24 floats
  peak_hours: number[];
  recommended_opening_window: string;
  day_multipliers: Record<string, number>;
}

export interface NormalizedBusiness {
  id: string;
  raw_id: string;
  name: string;
  suitable_building_type: string;
  customer_type: string;
  spawn_customers: boolean;
  course_required: string;
  operating_schedule: BusinessOperatingSchedule;
  products: BusinessProduct[];
  requirements: Array<Record<string, any>>;
  employee_primary_skills: string[];
}

export interface RecipeIngredient {
  id: string;
  raw_id: string;
  name: string;
  amount: number;
  unit_wholesale_price: number;
  total_ingredient_cost: number;
}

export interface RecipeEconomics {
  total_ingredient_cost: number;
  cost_per_unit_base: number;
  cost_per_unit_skilled: number;
  gross_profit_per_batch_base: number;
  gross_profit_per_batch_skilled: number;
}

export interface NormalizedRecipe {
  id: string;
  name: string;
  output: {
    id: string;
    raw_id: string;
    name: string;
    base_amount: number;
    max_skilled_amount: number;
    unit_market_price: number;
  };
  ingredients: RecipeIngredient[];
  economics: RecipeEconomics;
  production_machines: string[];
}

export interface NormalizedNeighborhood {
  id: string;
  raw_id: string;
  name: string;
  demographics: {
    working_class_pct: number;
    middle_class_pct: number;
    upper_class_pct: number;
  };
  economic_factors: {
    real_estate_multiplier: number;
    parking_price: number;
    customer_demands_weight: number;
    vehicle_traffic_density_pct: number;
    base_building_price_sqm: number;
    rent_multiplier_sqm: number;
    marketing_strength: number;
    shutdown_daily_income_threshold: number;
  };
}

export interface NormalizedBuilding {
  id: string;
  address: string;
  street_number: number;
  street_name: string;
  neighborhood_id: string;
  neighborhood_name: string;
  building_type: string;
  building_size: string;
  square_meters: number;
  price_index: number;
  traffic_index: number;
  estimated_purchase_price: number;
  estimated_daily_rent: number;
}
