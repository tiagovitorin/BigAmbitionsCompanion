// Boat types are defined in game code, not asset data (Entities/BoatTypes.cs):
// Speedboat 3,200,000; Yacht 2,500,000; LuxuryYacht 90,000,000 (tax deductible).
// Art is baked from the in-game models (see /images/vehicles/<id>.png).
export interface Boat {
  id: string;
  name: string;
  price: number;
  taxDeductible: boolean;
  isLuxuryYacht: boolean;
}

export const BOATS: Boat[] = [
  { id: 'speedboat', name: 'Speedboat', price: 3200000, taxDeductible: false, isLuxuryYacht: false },
  { id: 'yacht', name: 'Yacht', price: 2500000, taxDeductible: false, isLuxuryYacht: false },
  { id: 'luxuryyacht', name: 'Luxury Yacht', price: 90000000, taxDeductible: true, isLuxuryYacht: true }
];
