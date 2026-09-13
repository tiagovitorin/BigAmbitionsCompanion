// Factory line plan.
//
// A factory is a set of assembly machines, each set to one recipe. A machine runs its
// recipe around the clock, so a line's output is machines x the recipe's rated hourly
// output x 24, and what it eats is machines x each ingredient's hourly draw x 24. The
// recipes and their rates come from the game's own compendium (recipes.json).

import rawRecipes from '@/data/recipes.json';
import { LiveFactoryMachine, LiveScheduleDay } from '@/context/LiveSyncContext';
import { getWholesaleUnitPrice } from './products';

// Anything that can host factory workstations: a factory business or a warehouse
// the player has set production lines up in.
export interface FactorySource {
  id: string;
  name: string;
  machines?: LiveFactoryMachine[];
  scheduleWeek?: LiveScheduleDay[];
}

interface RecipeIngredientDef {
  rawItemName: string;
  itemName: string;
  amountPerHour: number;
}

interface RecipeDef {
  id: string;
  name: string;
  outputName: string;
  ratePerHour: number;
  ingredients: RecipeIngredientDef[];
}

const RECIPES = new Map<string, RecipeDef>();
(rawRecipes as any[]).forEach(recipe => {
  const rate = recipe.output?.max_skilled_amount || recipe.output?.base_amount || 0;
  RECIPES.set(recipe.id, {
    id: recipe.id,
    name: recipe.name,
    outputName: recipe.output?.name || recipe.name,
    ratePerHour: rate,
    ingredients: (recipe.ingredients || []).map((ing: any) => ({
      rawItemName: ing.raw_id,
      itemName: ing.name,
      amountPerHour: ing.amount || 0
    }))
  });
});

export interface FactoryLine {
  key: string;
  workstationType: string;
  selectedRecipeId: string;
  recipeName: string | null;
  outputName: string | null;
  machines: number;
  ratePerHour: number | null;
  makesPerDay: number | null;
  staffedHoursWeek: number;
  fullHoursWeek: number; // machines x 168 hours in a week
}

export interface FactoryIngredient {
  rawItemName: string;
  itemName: string;
  perDay: number;
  perWeek: number;
  lines: string[];
  unitPrice: number | null; // game wholesale price per unit
  costPerDay: number | null;
  costPerWeek: number | null;
}

export interface FactoryPlan {
  businessId: string;
  name: string;
  machineCount: number;
  lines: FactoryLine[];
  ingredients: FactoryIngredient[];
  staffedShare: number; // staffed machine-hours / full machine-hours
  feedCostPerDay: number | null; // sum of priced ingredients' daily cost
  feedCostPerWeek: number | null;
  unpricedIngredients: number; // ingredients the game gives no wholesale price
}

const HOURS_PER_WEEK = 168;

export function buildFactoryPlan(source: FactorySource): FactoryPlan | null {
  // Real saves list companion assembly/production machine instances next to each
  // workstation; those carry no workstation type or recipe, so keep only configured
  // workstations as production lines.
  const machines = (source.machines || []).filter(machine => machine.workstationType && machine.selectedRecipeId);
  if (machines.length === 0) return null;

  // Hours each machine is actually staffed, from the schedule's station posts.
  const staffedByMachine = new Map<string, number>();
  for (const day of source.scheduleWeek || []) {
    for (const shift of day.shifts || []) {
      if (shift.shiftType === 0) continue; // a cleaning duty, not a machine post
      if (!shift.itemInstanceId) continue;
      const hours = Math.max(0, (shift.endHour ?? 0) - (shift.startHour ?? 0));
      staffedByMachine.set(shift.itemInstanceId, (staffedByMachine.get(shift.itemInstanceId) || 0) + hours);
    }
  }

  // Group machines into lines by the recipe they run.
  const groups = new Map<string, { workstationType: string; selectedRecipeId: string; machineIds: string[] }>();
  for (const machine of machines) {
    const key = `${machine.workstationType}|${machine.selectedRecipeId}`;
    const group = groups.get(key) || { workstationType: machine.workstationType, selectedRecipeId: machine.selectedRecipeId, machineIds: [] };
    group.machineIds.push(machine.id);
    groups.set(key, group);
  }

  const lines: FactoryLine[] = [];
  const ingredientMap = new Map<string, FactoryIngredient>();

  for (const [key, group] of groups) {
    const recipe = RECIPES.get(group.selectedRecipeId);
    const count = group.machineIds.length;
    const rate = recipe ? recipe.ratePerHour : null;
    const makesPerDay = rate != null ? count * rate * 24 : null;
    const staffedHoursWeek = group.machineIds.reduce((sum, id) => sum + (staffedByMachine.get(id) || 0), 0);

    lines.push({
      key,
      workstationType: group.workstationType,
      selectedRecipeId: group.selectedRecipeId,
      recipeName: recipe ? recipe.name : null,
      outputName: recipe ? recipe.outputName : null,
      machines: count,
      ratePerHour: rate,
      makesPerDay,
      staffedHoursWeek,
      fullHoursWeek: count * HOURS_PER_WEEK
    });

    if (recipe) {
      for (const ingredient of recipe.ingredients) {
        const row = ingredientMap.get(ingredient.rawItemName) || {
          rawItemName: ingredient.rawItemName,
          itemName: ingredient.itemName,
          perDay: 0,
          perWeek: 0,
          lines: [],
          unitPrice: getWholesaleUnitPrice(ingredient.rawItemName),
          costPerDay: null,
          costPerWeek: null
        };
        row.perDay += count * ingredient.amountPerHour * 24;
        row.perWeek = row.perDay * 7;
        if (!row.lines.includes(recipe.name)) row.lines.push(recipe.name);
        ingredientMap.set(ingredient.rawItemName, row);
      }
    }
  }

  lines.sort((a, b) => b.machines - a.machines);
  const ingredients = [...ingredientMap.values()].sort((a, b) => b.perDay - a.perDay);

  // Cost the full-run draw at the game's wholesale price. Ingredients the game does
  // not price are counted but left out of the total rather than guessed at.
  let feedCostPerDay: number | null = null;
  let feedCostPerWeek: number | null = null;
  let unpricedIngredients = 0;
  for (const ingredient of ingredients) {
    if (ingredient.unitPrice == null) {
      unpricedIngredients++;
      continue;
    }
    ingredient.costPerDay = ingredient.perDay * ingredient.unitPrice;
    ingredient.costPerWeek = ingredient.costPerDay * 7;
    feedCostPerDay = (feedCostPerDay ?? 0) + ingredient.costPerDay;
    feedCostPerWeek = (feedCostPerWeek ?? 0) + ingredient.costPerWeek;
  }

  const totalFull = lines.reduce((sum, line) => sum + line.fullHoursWeek, 0);
  const totalStaffed = lines.reduce((sum, line) => sum + line.staffedHoursWeek, 0);

  return {
    businessId: source.id,
    name: source.name,
    machineCount: machines.length,
    lines,
    ingredients,
    staffedShare: totalFull > 0 ? totalStaffed / totalFull : 0,
    feedCostPerDay,
    feedCostPerWeek,
    unpricedIngredients
  };
}
