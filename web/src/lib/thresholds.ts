// Advisory heuristic thresholds shared across the Live HQ UI.
//
// IMPORTANT: These are app-defined tuning knobs, NOT Big Ambitions game formulas.
// They classify schedule profitability and workforce health using the compendium's
// normalized traffic multipliers (hourly_multipliers * day_multipliers) and live telemetry.
// No synthetic revenue or profit figures are derived from these values.

// Schedule matrix: an open hour is flagged "unprofitable" when its normalized traffic
// multiplier falls below this floor.
export const UNPROFITABLE_HOUR_MULTIPLIER = 0.15;

// Schedule matrix / advisory: an hour is considered profitable to operate when its
// normalized traffic multiplier meets or exceeds this floor.
export const PROFITABLE_HOUR_MULTIPLIER = 0.20;

// Schedule matrix: a closed hour is flagged as a "recommended window" when its normalized
// traffic multiplier meets or exceeds this threshold.
export const RECOMMENDED_WINDOW_MULTIPLIER = 0.25;

// Schedule matrix: a staffed open hour is flagged "unprofitable" when its multiplier is
// below PROFITABLE_HOUR_MULTIPLIER AND the scheduled hourly wages exceed this cutoff.
export const MARGINAL_HOURLY_WAGE_CUTOFF = 50;

// Schedule matrix: a closed day is flagged as a "closed peak day" when its day multiplier
// meets or exceeds this threshold.
export const CLOSED_PEAK_DAY_MULTIPLIER = 0.85;

// Workforce: weekly hours at or above this value is treated as full-time (vs part-time).
export const FULL_TIME_WEEKLY_HOURS = 40;

// Workforce: weekly hours above this value is flagged as overworked / burnout risk.
export const BURNOUT_WEEKLY_HOURS = 50;

// Warehouse inventory: days of runway at or below this value flags a critical stockout risk.
export const WAREHOUSE_RUNWAY_CRITICAL_DAYS = 2;

// Warehouse inventory: days of runway at or below this value flags a "reorder soon" warning.
export const WAREHOUSE_RUNWAY_WARNING_DAYS = 5;
