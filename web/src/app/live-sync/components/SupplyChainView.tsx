'use client';

import { Network, Warehouse, Truck } from 'lucide-react';
import {
  LiveVehicleData,
  LiveBoatData,
  LiveLogisticsPlanData,
  LiveWarehouseData,
  LiveBusinessData,
  LiveDeliveryContractData,
  LiveImportPartnershipData
} from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import LiveSection from './LiveSection';
import SupplyChainFlowMap from './SupplyChainFlowMap';
import PurchaseOrderRadar from './PurchaseOrderRadar';
import WarehouseInventoryPanel from './WarehouseInventoryPanel';
import DepotDrawPanel from './DepotDrawPanel';
import LogisticsFleetPanel from './LogisticsFleetPanel';

interface SupplyChainViewProps {
  vehicles: LiveVehicleData[];
  boats: LiveBoatData[];
  logisticsPlans: LiveLogisticsPlanData[];
  warehouses: LiveWarehouseData[];
  businesses: LiveBusinessData[];
  deliveryContracts: LiveDeliveryContractData[];
  importPartnerships: LiveImportPartnershipData[];
  playerCash: number;
  gameDay: number;
}

export default function SupplyChainView({
  vehicles,
  boats,
  logisticsPlans,
  warehouses,
  businesses,
  deliveryContracts,
  importPartnerships,
  playerCash,
  gameDay
}: SupplyChainViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-10">
      {/* NETWORK: how goods flow and what is arriving */}
      <LiveSection id="supply-network" title={t('liveHq.supplyNetwork', 'Network')} icon={Network}>
        <SupplyChainFlowMap
          warehouses={warehouses}
          businesses={businesses}
          deliveryContracts={deliveryContracts}
          importPartnerships={importPartnerships}
          logisticsPlans={logisticsPlans}
          gameDay={gameDay}
        />
        <PurchaseOrderRadar
          deliveryContracts={deliveryContracts}
          importPartnerships={importPartnerships}
          warehouses={warehouses}
          businesses={businesses}
          playerCash={playerCash}
          gameDay={gameDay}
        />
      </LiveSection>

      {/* WAREHOUSES: stock and ordering at each depot */}
      <LiveSection id="supply-warehouses" title={t('liveHq.supplyWarehouses', 'Warehouses')} icon={Warehouse}>
        <WarehouseInventoryPanel warehouses={warehouses} />
        <DepotDrawPanel warehouses={warehouses} importPartnerships={importPartnerships} gameDay={gameDay} />
      </LiveSection>

      {/* FLEET: vehicles, boats and driver plans */}
      <LiveSection id="supply-fleet" title={t('liveHq.supplyFleet', 'Fleet')} icon={Truck}>
        <LogisticsFleetPanel vehicles={vehicles} boats={boats} logisticsPlans={logisticsPlans} />
      </LiveSection>
    </div>
  );
}
