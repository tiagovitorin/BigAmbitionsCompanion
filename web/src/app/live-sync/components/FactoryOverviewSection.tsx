'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Cpu, Users, TrendingUp, Boxes, Wheat, TriangleAlert, CircleCheck, CircleHelp, Wrench } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { ProductionSectionProps, money, pct, starvationTone, hoursLabel } from '@/lib/productionUi';
import { resolveItemImage } from '@/lib/logistics';
import RingGauge from './RingGauge';
import FloatingTooltip from './FloatingTooltip';
import { ItemIcon } from './SupplyChainDetailAtoms';

const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const ROSE = '#f43f5e';
const SLATE = '#94a3b8';
const INDIGO = '#6366f1';

function TipRows({ rows }: { rows: { label: string; value: string; tone?: string }[] }) {
  return (
    <div className="space-y-0.5">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4">
          <span className="text-slate-300">{row.label}</span>
          <span className={`font-mono ${row.tone ?? 'text-white'}`}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  icon: LucideIcon;
  value: string;
  valueClass: string;
  sub: string;
  accent: string;
  visual: ReactNode;
}

function KpiCard({ label, icon: Icon, value, valueClass, sub, accent, visual }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden p-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
      <div className={`absolute inset-x-0 top-0 h-0.5 ${accent}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] uppercase font-bold tracking-wide text-[var(--text-subtle)]">{label}</div>
          <div className={`text-xl font-bold font-mono mt-0.5 truncate ${valueClass}`}>{value}</div>
        </div>
        <div className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] grid place-items-center shrink-0">
          <Icon className="w-4 h-4 text-[var(--text-muted)]" />
        </div>
      </div>
      <div className="mt-0.5 text-[11px] text-[var(--text-muted)] truncate">{sub}</div>
      <div className="mt-2.5">{visual}</div>
    </div>
  );
}

type AlertSeverity = 'critical' | 'warning';

interface OverviewAlert {
  key: string;
  severity: AlertSeverity;
  icon: LucideIcon;
  rawId?: string | null;
  title: string;
  detail?: string;
  value?: string;
}

const ALERT_STYLES: Record<AlertSeverity, { row: string; tile: string; title: string; badge: string }> = {
  critical: {
    row: 'border-rose-500/30 bg-rose-500/5',
    tile: 'bg-rose-500/15 text-rose-500',
    title: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
  },
  warning: {
    row: 'border-amber-500/30 bg-amber-500/5',
    tile: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    title: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  }
};

// The Overview's five headline metrics, each an at-a-glance visual rather than a
// bare number: workstation rack, staffing gauge, revenue split, output mix, feed runway.
export default function FactoryOverviewSection({ model }: ProductionSectionProps) {
  const { t } = useTranslation();

  const staffedHours = model.lines.reduce((sum, line) => sum + line.staffedHoursPerWeek, 0);
  const fullHours = model.lines.reduce((sum, line) => sum + line.fullHoursPerWeek, 0);
  const understaffedLines = model.lines.filter(line => line.staffedShare < 0.999);
  const staffedColor = model.staffedShare >= 0.999 ? EMERALD : model.staffedShare >= 0.5 ? AMBER : ROSE;

  const gross = model.grossValuePerDay;
  const feed = model.feedCostPerDay;
  const labor = model.laborCostPerDay;
  const rent = model.rentPerDay;
  const net = model.contributionPerDay;
  const margin = gross > 0 ? net / gross : null;
  const spendBase = Math.max(gross, feed + labor + rent, 1);

  const productNames = new Map<string, string>();
  model.lines.forEach(line => { if (line.outputRawId && line.outputName) productNames.set(line.outputRawId, line.outputName); });
  const products = Object.entries(model.dailyOutputByProduct)
    .map(([rawId, units]) => ({ rawId, units, name: productNames.get(rawId) || rawId }))
    .filter(product => product.units > 0)
    .sort((a, b) => b.units - a.units);
  const totalUnits = products.reduce((sum, product) => sum + product.units, 0);
  const topProducts = products.slice(0, 3);
  const maxProductUnits = topProducts[0]?.units || 1;

  const criticalIngredients = model.ingredients.filter(ingredient => ingredient.starvationHours != null).slice(0, 3);

  const alerts: OverviewAlert[] = [];
  model.ingredients
    .filter(ing => ing.starvationHours != null && ing.starvationHours < 48)
    .slice(0, 4)
    .forEach(ing => {
      const hours = ing.starvationHours as number;
      alerts.push({
        key: `feed-${ing.rawId}`,
        severity: hours < 12 ? 'critical' : 'warning',
        icon: Wheat,
        rawId: ing.rawId,
        title: ing.name,
        detail: t('liveHq.factoryAlertFeedDetail', 'About {hours} of stock left').replace('{hours}', hoursLabel(hours)),
        value: hoursLabel(hours)
      });
    });
  model.lines
    .filter(line => line.staffedShare < 0.999)
    .forEach(line => alerts.push({
      key: `staff-${line.key}`,
      severity: 'warning',
      icon: Users,
      rawId: line.outputRawId,
      title: line.outputName || t('liveHq.factoryLine', 'Line'),
      detail: t('liveHq.factoryAlertUnderstaffedDetail', '{pct}% of machine-hours staffed').replace('{pct}', String(Math.round(line.staffedShare * 100))),
      value: `${Math.round(line.staffedShare * 100)}%`
    }));
  model.lines
    .filter(line => line.warnings.includes('unknown-recipe'))
    .forEach(line => alerts.push({
      key: `recipe-${line.key}`,
      severity: 'critical',
      icon: CircleHelp,
      rawId: line.outputRawId,
      title: t('liveHq.factoryAlertUnknownRecipeShort', '{n} station(s) run an unrecognised recipe').replace('{n}', String(line.machineCount))
    }));
  model.lines
    .filter(line => line.incompleteMachines > 0)
    .forEach(line => alerts.push({
      key: `incomplete-${line.key}`,
      severity: 'critical',
      icon: Wrench,
      rawId: line.outputRawId,
      title: t('liveHq.factoryAlertIncompleteTitle', '{n} incomplete station(s)').replace('{n}', String(line.incompleteMachines)),
      detail: t('liveHq.factoryAlertIncompleteDetail', 'Missing machines, workers still paid'),
      value: String(line.incompleteMachines)
    }));
  if (model.storage && model.storage.gridlockHours != null && model.storage.gridlockHours < 12) {
    const gridlock = model.storage.gridlockHours;
    alerts.push({
      key: 'storage-gridlock',
      severity: gridlock < 6 ? 'critical' : 'warning',
      icon: Boxes,
      title: t('liveHq.factoryAlertGridlockTitle', 'Storage fills in ~{h}h').replace('{h}', gridlock.toFixed(1)),
      detail: t('liveHq.factoryAlertGridlockDetail', 'At the current output rate'),
      value: `${gridlock.toFixed(1)}h`
    });
  }
  alerts.sort((a, b) => (a.severity === 'critical' ? 0 : 1) - (b.severity === 'critical' ? 0 : 1));
  const criticalCount = alerts.filter(alert => alert.severity === 'critical').length;

  const signedMoney = (value: number) => (value < 0 ? `-${money(-value)}` : money(value));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <KpiCard
          label={t('liveHq.factoryKpiFleet', 'Workstation fleet')}
          icon={Cpu}
          value={String(model.machineCount)}
          valueClass="text-[var(--text-main)]"
          sub={`${model.lineCount} ${t('liveHq.factoryListLines', 'Lines')} · ${pct(model.staffedShare)} ${t('liveHq.factoryKpiStaffed', 'staffed')}`}
          accent="bg-emerald-500"
          visual={
            <FloatingTooltip
              className="block cursor-pointer"
              content={
                <div className="space-y-1">
                  <div className="font-semibold">{t('liveHq.factoryKpiFleet', 'Workstation fleet')}</div>
                  <TipRows rows={[
                    { label: t('liveHq.factoryLineMachines', 'Machines'), value: String(model.machineCount) },
                    { label: t('liveHq.factoryListLines', 'Lines'), value: String(model.lineCount) },
                    { label: t('liveHq.factoryKpiStaffed', 'Staffed'), value: pct(model.staffedShare), tone: model.staffedShare >= 0.999 ? 'text-emerald-400' : 'text-amber-400' }
                  ]} />
                </div>
              }
            >
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {model.lines.map(line => {
                  const color = line.staffedShare >= 0.999 ? 'bg-emerald-500' : line.staffedShare >= 0.5 ? 'bg-amber-500' : 'bg-rose-500';
                  const shown = Math.min(line.machineCount, 10);
                  return (
                    <span key={line.key} className="flex items-center gap-[2px]">
                      {Array.from({ length: shown }).map((_, index) => (
                        <span key={index} className={`w-1.5 h-1.5 rounded-[2px] ${color}`} />
                      ))}
                      {line.machineCount > shown && <span className="text-[9px] text-[var(--text-subtle)]">+{line.machineCount - shown}</span>}
                    </span>
                  );
                })}
                {model.lineCount === 0 && <span className="text-[10px] text-[var(--text-subtle)]">-</span>}
              </span>
            </FloatingTooltip>
          }
        />

        <KpiCard
          label={t('liveHq.factoryLineStaffed', 'Staffed')}
          icon={Users}
          value={pct(model.staffedShare)}
          valueClass={model.staffedShare >= 0.999 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
          sub={understaffedLines.length > 0
            ? t('liveHq.factoryKpiUnderstaffed', '{n} line(s) understaffed').replace('{n}', String(understaffedLines.length))
            : t('liveHq.factoryKpiAllStaffed', 'Every line fully staffed')}
          accent={model.staffedShare >= 0.999 ? 'bg-emerald-500' : 'bg-amber-500'}
          visual={
            <div className="flex items-center gap-3">
              <RingGauge value={model.staffedShare} color={staffedColor} size={54} stroke={4} label={`${Math.round(model.staffedShare * 100)}%`} />
              <div className="min-w-0 text-[10px] font-mono text-[var(--text-subtle)] leading-tight">
                <div className="text-[var(--text-muted)]">{Math.round(staffedHours).toLocaleString()} / {fullHours.toLocaleString()}h</div>
                <div>{t('liveHq.factoryKpiMachineHours', 'machine-hrs / wk')}</div>
              </div>
            </div>
          }
        />

        <KpiCard
          label={t('liveHq.factoryKpiNetDay', 'Net contribution / day')}
          icon={TrendingUp}
          value={signedMoney(net)}
          valueClass={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}
          sub={`${t('liveHq.factoryEconGross', 'Gross')} ${money(gross)}${margin != null ? ` · ${pct(margin)} ${t('liveHq.factoryKpiMargin', 'margin')}` : ''}`}
          accent={net >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}
          visual={
            <FloatingTooltip
              className="block cursor-pointer"
              content={
                <div className="space-y-1">
                  <div className="font-semibold">{t('liveHq.factoryValueFlow', 'Daily value flow')}</div>
                  <TipRows rows={[
                    { label: t('liveHq.factoryEconGross', 'Gross'), value: money(gross), tone: 'text-white' },
                    { label: t('liveHq.factoryEconIngredients', 'Ingredients'), value: `-${money(feed)}`, tone: 'text-rose-400' },
                    { label: t('liveHq.factoryEconLabor', 'Labor'), value: `-${money(labor)}`, tone: 'text-amber-400' },
                    { label: t('liveHq.factoryEconRent', 'Rent'), value: `-${money(rent)}`, tone: 'text-slate-300' },
                    { label: t('liveHq.factoryEconNet', 'Net'), value: signedMoney(net), tone: net >= 0 ? 'text-emerald-400' : 'text-rose-400' }
                  ]} />
                </div>
              }
            >
              <span className="flex h-2 rounded-full overflow-hidden bg-[var(--bg-base)]">
                <span className="h-full" style={{ width: `${(feed / spendBase) * 100}%`, backgroundColor: ROSE }} />
                <span className="h-full" style={{ width: `${(labor / spendBase) * 100}%`, backgroundColor: AMBER }} />
                <span className="h-full" style={{ width: `${(rent / spendBase) * 100}%`, backgroundColor: SLATE }} />
                <span className="h-full" style={{ width: `${(Math.max(0, net) / spendBase) * 100}%`, backgroundColor: EMERALD }} />
              </span>
            </FloatingTooltip>
          }
        />

        <KpiCard
          label={t('liveHq.factoryKpiOutput', 'Daily output')}
          icon={Boxes}
          value={Math.round(totalUnits).toLocaleString()}
          valueClass="text-[var(--text-main)]"
          sub={products.length > 0
            ? `${products.length} ${t('liveHq.factoryKpiProducts', 'products')}${model.grossPerSqm != null ? ` · ${money(model.grossPerSqm)}/m²` : ''}`
            : t('liveHq.factoryKpiNoOutput', 'No output yet')}
          accent="bg-indigo-500"
          visual={
            topProducts.length === 0 ? (
              <span className="text-[10px] text-[var(--text-subtle)]">-</span>
            ) : (
              <div className="space-y-1">
                {topProducts.map(product => (
                  <FloatingTooltip
                    key={product.rawId}
                    className="flex items-center gap-2 cursor-pointer"
                    content={
                      <TipRows rows={[
                        { label: product.name, value: `${Math.round(product.units).toLocaleString()} u/day` },
                        { label: t('liveHq.factoryKpiShare', 'Share of output'), value: pct(totalUnits > 0 ? product.units / totalUnits : 0), tone: 'text-indigo-300' }
                      ]} />
                    }
                  >
                    <span className="w-14 truncate text-[10px] text-[var(--text-muted)] text-left">{product.name}</span>
                    <span className="flex-1 h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
                      <span className="block h-full rounded-full" style={{ width: `${(product.units / maxProductUnits) * 100}%`, backgroundColor: INDIGO }} />
                    </span>
                    <span className="w-10 text-right font-mono text-[9px] text-[var(--text-subtle)]">{Math.round(product.units).toLocaleString()}</span>
                  </FloatingTooltip>
                ))}
              </div>
            )
          }
        />

        <KpiCard
          label={t('liveHq.factoryFeedPerDay', 'Feed / day')}
          icon={Wheat}
          value={money(feed)}
          valueClass="text-rose-500"
          sub={`${model.ingredients.length} ${t('liveHq.factoryKpiIngredients', 'ingredients')}`}
          accent="bg-rose-500"
          visual={
            criticalIngredients.length === 0 ? (
              <span className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.factoryKpiNoFeed', 'No ingredient draw')}</span>
            ) : (
              <FloatingTooltip
                className="space-y-1 cursor-pointer block"
                content={
                  <div className="space-y-1">
                    <div className="font-semibold">{t('liveHq.factoryKpiRunway', 'Runway (stock / draw)')}</div>
                    <TipRows rows={criticalIngredients.map(ing => ({
                      label: ing.name,
                      value: hoursLabel(ing.starvationHours),
                      tone: ing.starvationHours != null && ing.starvationHours < 12 ? 'text-rose-400' : ing.starvationHours != null && ing.starvationHours < 48 ? 'text-amber-400' : 'text-emerald-400'
                    }))} />
                  </div>
                }
              >
                {criticalIngredients.map(ingredient => {
                  const hours = ingredient.starvationHours ?? 0;
                  const ratio = Math.min(1, hours / 48);
                  const color = hours < 12 ? 'bg-rose-500' : hours < 48 ? 'bg-amber-500' : 'bg-emerald-500';
                  return (
                    <span key={ingredient.rawId} className="flex items-center gap-2">
                      <span className="w-14 truncate text-[10px] text-[var(--text-muted)] text-left">{ingredient.name}</span>
                      <span className="flex-1 h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
                        <span className={`block h-full rounded-full ${color}`} style={{ width: `${Math.max(3, ratio * 100)}%` }} />
                      </span>
                      <span className={`w-10 text-right font-mono text-[9px] ${starvationTone(ingredient.starvationHours)}`}>{hoursLabel(ingredient.starvationHours)}</span>
                    </span>
                  );
                })}
              </FloatingTooltip>
            )
          }
        />
      </div>

      <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <TriangleAlert className={`w-4 h-4 ${alerts.length === 0 ? 'text-emerald-500' : criticalCount > 0 ? 'text-rose-500' : 'text-amber-500'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">{t('liveHq.factoryAlerts', 'Operational alerts')}</span>
          </div>
          {alerts.length > 0 && (
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${criticalCount > 0 ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5">
            <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0 bg-emerald-500/15 text-emerald-500">
              <CircleCheck className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{t('liveHq.factoryAlertsNone', 'No feed, staffing or recipe problems detected.')}</span>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {alerts.slice(0, 6).map(alert => {
              const style = ALERT_STYLES[alert.severity];
              const Icon = alert.icon;
              return (
                <li key={alert.key} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${style.row}`}>
                  {alert.rawId ? (
                    <ItemIcon src={resolveItemImage(alert.rawId)} size={26} />
                  ) : (
                    <span className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 ${style.tile}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-xs font-semibold ${style.title}`}>{alert.title}</div>
                    {alert.detail && <div className="truncate text-[10px] text-[var(--text-muted)]">{alert.detail}</div>}
                  </div>
                  {alert.value && (
                    <span className={`shrink-0 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${style.badge}`}>{alert.value}</span>
                  )}
                </li>
              );
            })}
            {alerts.length > 6 && (
              <li className="text-[10px] font-medium text-[var(--text-subtle)] pl-1">
                {t('liveHq.factoryAlertsMore', '+{n} more').replace('{n}', String(alerts.length - 6))}
              </li>
            )}
          </ul>
        )}

        <p className="text-[10px] text-[var(--text-subtle)] pt-1 border-t border-[var(--border-subtle)]">
          {t('liveHq.factoryGrossNote', 'Gross value is retail market value minus wholesale inputs, before labor, rent and store margin.')}
        </p>
      </div>
    </div>
  );
}
