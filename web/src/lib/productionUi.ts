import { SiteModel, DemandRow, ProductionContext, ChainLink } from '@/lib/productionModel';

export interface ProductionSectionProps {
  model: SiteModel;
  demand: Record<string, DemandRow>;
  ctx: ProductionContext;
  chains: ChainLink[];
}

export const money = (value: number) => `$${Math.round(value).toLocaleString()}`;
export const money2 = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const pct = (value: number) => `${Math.round(value * 100)}%`;

export const hoursLabel = (value: number | null) => (value == null ? '-' : `${value.toFixed(1)}h`);

export function workstationLabel(workstationType: string): string {
  return (workstationType || '')
    .replace(/^ba:factoryworkstationtype_/i, '')
    .replace(/workstation$/i, '')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, character => character.toUpperCase());
}

export function starvationTone(value: number | null): string {
  if (value == null) return 'text-[var(--text-subtle)]';
  if (value < 12) return 'text-rose-500';
  if (value < 48) return 'text-amber-500';
  return 'text-emerald-500';
}

export function staffedTone(value: number): string {
  if (value >= 0.999) return 'bg-emerald-500';
  if (value >= 0.5) return 'bg-amber-500';
  return 'bg-rose-500';
}
