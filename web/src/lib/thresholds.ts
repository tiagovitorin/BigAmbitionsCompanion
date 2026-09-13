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

// --- Supply chain verdict tolerance ---
// Consumption is measured from play, not declared, so two figures this close are
// the same figure. Below the first band a gap is rounding noise ("covered"); below
// the second it is worth knowing but not worth acting on today ("tight"); beyond it
// the provision cannot cover its cycle ("short"). The absolute floor keeps tiny
// lines from being judged on fractions of a unit.
export const SUPPLY_COVERED_TOLERANCE = 0.01;
export const SUPPLY_TIGHT_TOLERANCE = 0.05;
export const SUPPLY_COVERED_FLOOR_UNITS = 5;

// --- Weekly rhythm (day-of-week) profiling ---
// A growing company makes later weekdays look strong purely because they happened
// later, so each day is divided by a centred 7-day mean before weekdays are compared.
// A profile is only reported when it clears these gates: enough days observed, every
// weekday seen at least RHYTHM_MIN_WEEKS times, no level shift larger than
// RHYTHM_MAX_STEP between neighbouring baselines, and a best-vs-worst weekday gap
// that beats the standard error of the weekday means by RHYTHM_SIGNAL_NOISE_FACTOR.
export const RHYTHM_MIN_DAYS = 10;
export const RHYTHM_MIN_WEEKS = 2;
export const RHYTHM_MAX_STEP = 1.6;
export const RHYTHM_SIGNAL_NOISE_FACTOR = 2.0;

// --- Alert materiality & condensation ---
// A finding carrying a dollar figure must clear this share of the seven-day average
// daily profit (with an absolute floor) to be read out as a line; below it, it is
// counted at the foot of the feed instead. Findings of the same cause at one site
// collapse into a single line once there are this many.
export const ALERT_MATERIALITY_SHARE = 0.005;
export const ALERT_MATERIALITY_FLOOR = 500;
export const ALERT_CONDENSE_AT = 3;

// --- Hourly capacity grid ---
// An hour at or above this share of effective capacity is at the ceiling (the door is
// turning people away). A run of this many hours where staffed counter capacity is
// more than this multiple of the customers, with at least this many staff on, is idle
// capacity. A weekday's hourly average is only trusted once it rests on this many
// weeks of order history.
export const CAPACITY_AT_CEILING_SHARE = 0.95;
export const CAPACITY_IDLE_RATIO = 2.0;
export const CAPACITY_IDLE_RUN_HOURS = 3;
export const CAPACITY_IDLE_MIN_STAFF = 2;
export const CAPACITY_MIN_WEEKS = 2;

// --- Depot draw & ordering ---
// Goods held beyond this many days of measured draw, and at least this many units,
// are treated as idle stock (cash parked on pallets rather than flowing).
export const DEPOT_IDLE_DAYS = 28;
export const DEPOT_IDLE_UNITS = 500;

// --- Market demand grid ---
// A product's neighbourhood demand (0-100) at or above this is treated as strong.
export const STRONG_DEMAND_LEVEL = 60;

// App-defined: a strongly-demanded product at or below this many providers is treated as
// genuine whitespace (few rivals), not a saturated market. Not a game figure.
export const SPARSE_RIVALS_LEVEL = 1;

// App-defined: an import price index at or below this (game base is 1.0) marks a cheap
// import. The game applies it to the wholesale price (ItemHelper.GetImportPrice).
export const CHEAP_IMPORT_INDEX = 0.85;

// Mirrors the game value ProductMarketSettings.daysItTakesForAnItemNotToBeOnSaleToTriggerHypeEvents:
// a neighbourhood product unsold for this many game days is primed for a hype event.
export const HYPE_PRIMED_DAYS = 21;

// --- Hype exposure ---
// Trading days needed before a wave to call the shop's own pre-wave trading a baseline.
export const HYPE_BASELINE_DAYS = 3;

// Mirrors TaxHelper.DaysToPayOnFirstWarning (20): the IRS issues the bill on the
// year-end day (Day % daysPerYear == 0) and gives this many game days to pay before
// the first late-payment warning.
export const TAX_GRACE_DAYS = 20;
