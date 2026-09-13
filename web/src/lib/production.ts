import { LiveBusinessData, LiveWarehouseData, LiveFactoryMachine } from '@/context/LiveSyncContext';
import { FactorySource } from './factory';

// A place the player runs production: either a factory business or a warehouse with
// workstations installed in it.
export interface FactorySite extends FactorySource {
  address: string;
  kind: 'factory' | 'warehouse';
}

// A configured production line is a workstation that has both a type and a recipe; the
// companion assembly/production machines the game lists next to it are ignored.
export function hasFactoryLines(machines?: LiveFactoryMachine[]): boolean {
  return Boolean(machines?.some(machine => machine.workstationType && machine.selectedRecipeId));
}

export function isFactoryBusiness(business: LiveBusinessData): boolean {
  return (business.rawType || '').toLowerCase().includes('factory');
}

export function collectFactorySites(
  businesses: LiveBusinessData[],
  warehouses: LiveWarehouseData[]
): FactorySite[] {
  const sites: FactorySite[] = [];

  for (const business of businesses) {
    if (!isFactoryBusiness(business) || !hasFactoryLines(business.machines)) continue;
    sites.push({
      id: business.id,
      name: business.name,
      address: business.address,
      kind: 'factory',
      machines: business.machines,
      scheduleWeek: business.scheduleWeek
    });
  }

  for (const warehouse of warehouses) {
    if (!hasFactoryLines(warehouse.machines)) continue;
    sites.push({
      id: warehouse.id,
      name: warehouse.name || warehouse.address,
      address: warehouse.address,
      kind: 'warehouse',
      machines: warehouse.machines,
      scheduleWeek: warehouse.scheduleWeek
    });
  }

  return sites;
}
