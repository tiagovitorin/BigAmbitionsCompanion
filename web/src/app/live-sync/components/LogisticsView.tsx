'use client';

import { AlertTriangle } from 'lucide-react';
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
import WarehouseInventoryPanel from './WarehouseInventoryPanel';
import SupplyChainFlowMap from './SupplyChainFlowMap';
import PurchaseOrderRadar from './PurchaseOrderRadar';
import LogisticsFleetPanel from './LogisticsFleetPanel';

interface LogisticsViewProps {
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

export default function LogisticsView({
  vehicles,
  boats,
  logisticsPlans,
  warehouses,
  businesses,
  deliveryContracts,
  importPartnerships,
  playerCash,
  gameDay
}: LogisticsViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* WIP NOTICE BANNER (this view is still under active development) */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-xs">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
            {t('liveHq.logisticsWipLabel', 'Work in Progress')}
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {t('liveHq.logisticsWipBody', 'This area is still under active development. You may see inaccurate data, missing values, or bugs while it is being improved.')}
          </p>
        </div>
      </div>

      {/* 1. CASH & PURCHASE ORDER RADAR (highest priority: cash sustainability) */}
      <PurchaseOrderRadar
        deliveryContracts={deliveryContracts}
        importPartnerships={importPartnerships}
        playerCash={playerCash}
        gameDay={gameDay}
      />

      {/* 2. WAREHOUSE INVENTORY & DEPLETION RUNWAYS */}
      <WarehouseInventoryPanel warehouses={warehouses} />

      {/* 3. SUPPLY CHAIN FLOW (Importers -> Warehouses -> Stores <- Wholesalers) */}
      <SupplyChainFlowMap
        warehouses={warehouses}
        businesses={businesses}
        deliveryContracts={deliveryContracts}
        importPartnerships={importPartnerships}
        logisticsPlans={logisticsPlans}
        gameDay={gameDay}
      />

      {/* 4. FLEET & LOGISTICS AUTOMATION */}
      <LogisticsFleetPanel vehicles={vehicles} boats={boats} logisticsPlans={logisticsPlans} />
    </div>
  );
}
