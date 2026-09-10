// Human-friendly item category classifier. Maps the game's raw ItemType enum
// flags (which can combine multiple values, e.g. "ActivityItem, WorkoutMachine")
// into clean, player-facing categories for display.

const CATEGORY_RULES: Array<{ category: string; flags: string[] }> = [
  { category: 'Retail Product', flags: ['RetailProduct'] },
  { category: 'Service', flags: ['ServiceProduct'] },
  { category: 'Factory Machine', flags: ['FactoryMachine'] },
  { category: 'Workstation', flags: ['EmployeeWorkstation', 'PointOfSale'] },
  { category: 'Storage', flags: ['StorageShelf'] },
  { category: 'Security', flags: ['Security'] },
  { category: 'Lighting', flags: ['LightSource'] },
  { category: 'Audio', flags: ['RadioSource'] },
  { category: 'Exercise Equipment', flags: ['WorkoutMachine'] },
  { category: 'Display Shelf', flags: ['ShowcaseShelf'] },
  { category: 'Seasonal', flags: ['Seasonal'] },
  { category: 'Seating', flags: ['Seat'] },
  { category: 'Table / Desk', flags: ['Table', 'Desk'] },
  { category: 'Equipment', flags: ['BusinessRequirement', 'SpecialBusiness'] },
  { category: 'Furniture', flags: ['Decoration', 'FlatDecoration', 'AttachableWorkSurface', 'ActivityItem', 'JobDemand'] },
];

export function getItemCategory(type: string): string {
  if (!type || type === '0') return 'Utility';
  const flags = type.split(',').map((f) => f.trim());
  for (const rule of CATEGORY_RULES) {
    if (rule.flags.some((f) => flags.includes(f))) {
      return rule.category;
    }
  }
  return 'Equipment';
}
