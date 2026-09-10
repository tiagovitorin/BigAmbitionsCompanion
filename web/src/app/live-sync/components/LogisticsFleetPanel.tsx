'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Ship,
  Package,
  Boxes,
  Wrench,
  MapPin,
  Fuel,
  Gauge,
  Route,
  ArrowUpRight,
  ChevronDown
} from 'lucide-react';
import { LiveVehicleData, LiveBoatData, LiveLogisticsPlanData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { resolveVehicleImage, resolveItemImage } from '@/lib/logistics';

interface LogisticsFleetPanelProps {
  vehicles: LiveVehicleData[];
  boats: LiveBoatData[];
  logisticsPlans: LiveLogisticsPlanData[];
}

function vehicleLabel(raw: string, tGame: (k: string | null | undefined, f?: string) => string): string {
  if (!raw) return 'Vehicle';
  const cleaned = raw.replace('ba:vehicletype_', '').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return tGame(raw, cleaned) || cleaned;
}

function VehicleCard({
  v,
  t,
  tGame
}: {
  v: LiveVehicleData;
  t: (k: string, f?: string) => string;
  tGame: (k: string | null | undefined, f?: string) => string;
}) {
  const image = resolveVehicleImage(v.vehicleType);
  const isWarehouse = v.isWarehouseAssigned === true;
  const damage = v.damage || 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2.5 text-xs">
      <div className="flex items-center gap-2.5">
        {image ? (
          <div className="w-12 h-12 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] p-1 shrink-0 flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={vehicleLabel(v.vehicleType, tGame)} className="w-full h-full object-contain" loading="lazy" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center justify-center text-[var(--text-subtle)] shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[var(--text-main)] truncate">{vehicleLabel(v.vehicleType, tGame)}</span>
            {isWarehouse ? (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center gap-1 shrink-0">
                <Route className="w-3 h-3" />
                {t('liveHq.automatedRoute', 'Automated Route')}
              </span>
            ) : (
              <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 ${damage >= 80 ? 'bg-rose-500/15 text-rose-600' : damage > 0 ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
                {damage >= 80 ? t('liveHq.criticalDamage', 'Critical') : damage > 0 ? t('liveHq.damaged', 'Damaged') : t('liveHq.good', 'Good')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[var(--text-subtle)] mt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {v.parkingState}
              {v.parkingNeighbourhood ? ` - ${v.parkingNeighbourhood}` : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-1.5 text-[var(--text-subtle)]">
          <Fuel className="w-3.5 h-3.5 shrink-0" />
          <span>{t('liveHq.fuelLevel', 'Fuel')}: <strong className="font-mono text-[var(--text-main)]">{isWarehouse || !(v.maxFuel || 0) ? t('liveHq.na', 'N/A') : `${Math.round(v.fuel || 0)}%`}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-subtle)]">
          <Gauge className="w-3.5 h-3.5 shrink-0" />
          <span>{t('liveHq.condition', 'Condition')}: <strong className="font-mono text-[var(--text-main)]">{Math.max(0, 100 - damage)}%</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--text-subtle)]">
          <Wrench className="w-3.5 h-3.5 shrink-0" />
          <span>{t('liveHq.repairCost', 'Repair')}: <strong className="font-mono text-[var(--text-main)]">${(v.repairCost || 0).toLocaleString()}</strong></span>
        </div>
      </div>

      {(v.unpaidParkingAmount || 0) > 0 && (
        <div className="text-[11px] text-rose-500 font-semibold">
          {t('liveHq.parkingTickets', 'Parking Tickets')}: {v.parkingTickets || 0} (${(v.unpaidParkingAmount || 0).toLocaleString()})
        </div>
      )}

      <div className="pt-2 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-[10px] uppercase font-bold text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
        >
          <span>{t('liveHq.cargo', 'Cargo')}{(v.cargo || []).length > 0 ? ` (${v.cargo.length})` : ''}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
        {expanded && (
          <div className="mt-1.5">
            {(v.cargo || []).length === 0 ? (
              <div className="text-[11px] text-[var(--text-subtle)]">{t('liveHq.noCargo', 'Empty')}</div>
            ) : (
              <div className="space-y-1">
                {v.cargo.map((c, i) => {
                  const icon = resolveItemImage(c.rawItemName);
                  return (
                    <div key={`${v.id}-cargo-${i}`} className="flex items-center justify-between text-[11px] gap-2">
                      <span className="flex items-center gap-1.5 text-[var(--text-muted)] truncate">
                        {icon ? (
                          <span className="w-4 h-4 shrink-0 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={icon} alt="" className="w-full h-full object-contain" />
                          </span>
                        ) : (
                          <Package className="w-3.5 h-3.5 shrink-0 text-[var(--text-subtle)]" />
                        )}
                        {tGame(c.rawItemName, c.itemName)}
                      </span>
                      <span className="font-mono text-[var(--text-main)] shrink-0">{c.amount}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LogisticsFleetPanel({ vehicles, boats, logisticsPlans }: LogisticsFleetPanelProps) {
  const { t, tGame } = useTranslation();

  const fleetValue = vehicles.reduce((acc, v) => acc + (v.sellingPrice || 0), 0);
  const cargoInTransit = vehicles.reduce((acc, v) => acc + (v.cargo || []).reduce((s, c) => s + (c.amount || 0), 0), 0);
  const unpaidParking = vehicles.reduce((acc, v) => acc + (v.unpaidParkingAmount || 0), 0);
  const vehiclesNeedingRepair = vehicles.filter(v => (v.repairCost || 0) > 0 || (v.damage || 0) > 0).length;

  const warehouseVehicles = vehicles.filter(v => v.isWarehouseAssigned === true);
  const personalVehicles = vehicles.filter(v => v.isWarehouseAssigned !== true);

  return (
    <div className="space-y-4">
      {/* FLEET KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.fleetSize', 'Fleet Size')}</span>
            <Truck className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text-main)]">
            {vehicles.length} <span className="text-xs font-normal text-[var(--text-subtle)]">{t('liveHq.vehiclesWord', 'Vehicles')}</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.boatsWord', 'Boats')}</span>
            <strong className="font-mono text-[var(--text-main)]">{boats.length}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.fleetValue', 'Fleet Value')}</span>
            <Ship className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ${fleetValue.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.needsRepair', 'Needs Repair')}</span>
            <strong className={`font-mono ${vehiclesNeedingRepair > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {vehiclesNeedingRepair}
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.cargoInTransit', 'Cargo In Transit')}</span>
            <Package className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text-main)]">
            {cargoInTransit.toLocaleString()} <span className="text-xs font-normal text-[var(--text-subtle)]">{t('liveHq.unitsWord', 'Units')}</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.loadedVehicles', 'Loaded Vehicles')}</span>
            <strong className="font-mono text-[var(--text-main)]">{vehicles.filter(v => (v.cargo || []).length > 0).length}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.logisticsPlans', 'Logistics Plans')}</span>
            <Boxes className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text-main)]">
            {logisticsPlans.length} <span className="text-xs font-normal text-[var(--text-subtle)]">{t('liveHq.activeWord', 'Active')}</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.unpaidParking', 'Unpaid Parking')}</span>
            <strong className={`font-mono ${unpaidParking > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              ${unpaidParking.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* VEHICLE FLEET */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-500" />
            <span>{t('liveHq.vehicles', 'Vehicle Fleet')}</span>
          </h3>
          <Link
            href="/vehicles"
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <span>{t('liveHq.wikiReference', 'Wiki Reference')}</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-subtle)]">{t('liveHq.noVehicles', 'No vehicles owned')}</div>
        ) : (
          <div className="space-y-4">
            {warehouseVehicles.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
                  <Route className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t('liveHq.logisticsFleet', 'Logistics Fleet')}</span>
                  <span className="font-mono text-[var(--text-subtle)]">({warehouseVehicles.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {warehouseVehicles.map(v => <VehicleCard key={v.id} v={v} t={t} tGame={tGame} />)}
                </div>
              </div>
            )}

            {personalVehicles.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t('liveHq.personalVehicles', 'Personal Vehicles')}</span>
                  <span className="font-mono text-[var(--text-subtle)]">({personalVehicles.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {personalVehicles.map(v => <VehicleCard key={v.id} v={v} t={t} tGame={tGame} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOATS */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Ship className="w-4 h-4 text-sky-500" />
          <span>{t('liveHq.boats', 'Boats')}</span>
        </h3>
        {boats.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-subtle)]">{t('liveHq.noBoats', 'No boats owned')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {boats.map(b => (
              <div key={b.id} className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[var(--text-main)]">{tGame(b.type, b.type)}</div>
                  <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">{b.color}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.maintenance', 'Next Maintenance')}</div>
                  <div className="font-mono font-bold text-[var(--text-main)]">{t('liveHq.dayWord', 'Day')} {b.nextMaintenanceDay}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
