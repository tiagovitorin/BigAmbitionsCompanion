/**
 * Big Ambitions Logistics & Supply Chain Solver
 */

export interface VehicleCapacity {
  name: string;
  type: 'HandTruck' | 'Van' | 'Truck';
  boxCapacity: number;
  palletCapacity: number;
  speedMultiplier: number;
}

export const STANDARD_FLEET: Record<string, VehicleCapacity> = {
  handTruck: {
    name: 'Hand Truck',
    type: 'HandTruck',
    boxCapacity: 4,
    palletCapacity: 0.5,
    speedMultiplier: 0.5
  },
  deliveryVan: {
    name: 'Delivery Van',
    type: 'Van',
    boxCapacity: 16,
    palletCapacity: 2,
    speedMultiplier: 1.0
  },
  freightTruck: {
    name: 'Freight Truck',
    type: 'Truck',
    boxCapacity: 80,
    palletCapacity: 10,
    speedMultiplier: 0.85
  }
};

export interface DeliveryRouteInput {
  vehicleType: 'HandTruck' | 'Van' | 'Truck';
  boxesToDeliver: number;
  tripDurationMinutes?: number; // default 30 mins
  driverHourlyWage?: number; // default $20.00/hr
}

export interface DeliveryRouteResult {
  vehicleType: string;
  totalBoxes: number;
  totalPallets: number;
  tripsRequired: number;
  totalDeliveryHours: number;
  totalDriverLaborCost: number;
  costPerBoxDelivered: number;
}

/**
 * Calculates delivery route requirements and transport labor costs.
 */
export function calculateDeliveryRoute(input: DeliveryRouteInput): DeliveryRouteResult {
  const {
    vehicleType,
    boxesToDeliver,
    tripDurationMinutes = 30,
    driverHourlyWage = 20.0
  } = input;

  const vehicle = Object.values(STANDARD_FLEET).find(v => v.type === vehicleType) || STANDARD_FLEET.deliveryVan;
  const tripsRequired = Math.ceil(boxesToDeliver / vehicle.boxCapacity);
  const totalMinutes = tripsRequired * tripDurationMinutes;
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const totalLaborCost = Math.round(totalHours * driverHourlyWage * 100) / 100;
  const costPerBox = boxesToDeliver > 0 ? Math.round((totalLaborCost / boxesToDeliver) * 100) / 100 : 0;

  return {
    vehicleType: vehicle.name,
    totalBoxes: boxesToDeliver,
    totalPallets: Math.round((boxesToDeliver / 8) * 10) / 10,
    tripsRequired,
    totalDeliveryHours: totalHours,
    totalDriverLaborCost: totalLaborCost,
    costPerBoxDelivered: costPerBox
  };
}
