// Customer amenities.
//
// Each business type asks its customers to find a few things in the store (music,
// employee uniforms, a toilet, and so on). The game records which of those a store
// currently meets in BuildingRegistration.cachedFulfilledCustomerDemands, which the
// mod emits as customerDemands. The required set and its weights come from the game
// data (businesses.json customer_demand_sets). When the field is absent we say so
// rather than guessing.

import rawBusinesses from '@/data/businesses.json';
import { LiveBusinessData } from '@/context/LiveSyncContext';

export interface AmenityRequirement {
  raw: string; // ba:customerdemand_...
  name: string;
  weight: number;
}

export interface AmenityStatus extends AmenityRequirement {
  fulfilled: boolean;
}

export interface AmenityReport {
  items: AmenityStatus[];
  missing: AmenityStatus[];
  requiredCount: number;
  fulfilledCount: number;
}

const DEMAND_NAMES: Record<string, string> = {
  'ba:customerdemand_employeeuniforms': 'Employee Uniforms',
  'ba:customerdemand_interiordesign': 'Interior Design',
  'ba:customerdemand_music': 'Music',
  'ba:customerdemand_seating': 'Seating',
  'ba:customerdemand_sink': 'Sink',
  'ba:customerdemand_toilet': 'Toilet',
  'ba:customerdemand_toiletprivacy': 'Toilet Privacy',
  'ba:customerdemand_workoutvariety': 'Workout Variety'
};

function demandName(raw: string): string {
  if (DEMAND_NAMES[raw]) return DEMAND_NAMES[raw];
  return (raw || '')
    .replace(/^ba:customerdemand_/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function cleanTypeKey(value?: string): string {
  return (value || '').replace('ba:businesstype_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

const REQUIREMENTS_BY_TYPE = new Map<string, AmenityRequirement[]>();
(rawBusinesses as any[]).forEach(business => {
  const sets = business.customer_demand_sets;
  if (!Array.isArray(sets) || sets.length === 0) return;
  const items: AmenityRequirement[] = sets.map((set: any) => ({
    raw: set.type,
    name: demandName(set.type),
    weight: set.weight ?? 1
  }));
  [business.raw_id, business.id, business.name]
    .filter(Boolean)
    .forEach(key => REQUIREMENTS_BY_TYPE.set(cleanTypeKey(key), items));
});

export function requiredAmenities(business: LiveBusinessData): AmenityRequirement[] {
  return REQUIREMENTS_BY_TYPE.get(cleanTypeKey(business.rawType))
    || REQUIREMENTS_BY_TYPE.get(cleanTypeKey(business.type))
    || [];
}

export function buildAmenityReport(business: LiveBusinessData): AmenityReport | null {
  const required = requiredAmenities(business);
  if (required.length === 0) return null;
  if (!Array.isArray(business.customerDemands)) return null;

  const fulfilled = new Set(business.customerDemands);
  const items: AmenityStatus[] = required.map(requirement => ({
    ...requirement,
    fulfilled: fulfilled.has(requirement.raw)
  }));
  const missing = items.filter(item => !item.fulfilled);
  return {
    items,
    missing,
    requiredCount: items.length,
    fulfilledCount: items.length - missing.length
  };
}
