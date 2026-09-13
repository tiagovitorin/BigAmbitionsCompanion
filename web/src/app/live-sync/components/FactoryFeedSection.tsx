'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Minus, Plus, TriangleAlert } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { nextInboundByIngredient } from '@/lib/productionModel';
import { ProductionSectionProps, money, money2, hoursLabel } from '@/lib/productionUi';
import { resolveItemImage } from '@/lib/logistics';
import { ItemIcon } from './SupplyChainDetailAtoms';
import FloatingTooltip from './FloatingTooltip';
import FilterDropdown from './FilterDropdown';

const ROSE = '#f43f5e';
const AMBER = '#f59e0b';
const EMERALD = '#10b981';
const SLATE = '#94a3b8';
const SKY = '#0ea5e9';
const INDIGO = '#6366f1';
const SCALE_HOURS = 48;

const toneHex = (hours: number | null) => (hours == null ? SLATE : hours < 12 ? ROSE : hours < SCALE_HOURS ? AMBER : EMERALD);

type FeedFilter = 'all' | 'short' | 'tight' | 'healthy';
type FeedSort = 'runway' | 'draw' | 'cost' | 'name' | 'buy';
type HoverPart = { id: string; part: string } | null;

function TipRows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="space-y-0.5">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4">
          <span className="text-slate-300">{row.label}</span>
          <span className="font-mono text-white">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function FactoryFeedSection({ model, ctx }: ProductionSectionProps) {
  const { t } = useTranslation();
  const inbound = nextInboundByIngredient(model.site, ctx);
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [sortBy, setSortBy] = useState<FeedSort>('runway');
  const [bufferDays, setBufferDays] = useState(3);
  const [hoverPart, setHoverPart] = useState<HoverPart>(null);

  const targetHours = bufferDays * 24;

  const rows = useMemo(() => {
    const list = model.ingredients.filter(ingredient => {
      const hours = ingredient.starvationHours;
      if (filter === 'short') return hours != null && hours < 12;
      if (filter === 'tight') return hours != null && hours < SCALE_HOURS;
      if (filter === 'healthy') return hours == null || hours >= SCALE_HOURS;
      return true;
    });
    const entries = list.map(ingredient => {
      const shipment = inbound.get(ingredient.rawId);
      const hasShipment = Boolean(shipment);
      const leadDays = hasShipment ? Math.max(0, shipment!.nextDay - ctx.gameDay) : 0;
      const leadHours = leadDays * 24;
      const hours = ingredient.starvationHours;
      const gap = hasShipment && hours != null && leadHours > hours;
      const orderUnits = ingredient.perDay > 0 ? Math.max(0, Math.round(ingredient.perDay * (leadDays + bufferDays) - ingredient.onHand)) : 0;
      return { ingredient, shipment, hasShipment, leadDays, leadHours, hours, gap, orderUnits };
    });
    return entries.sort((a, b) => {
      if (sortBy === 'draw') return b.ingredient.perDay - a.ingredient.perDay;
      if (sortBy === 'cost') return b.ingredient.costPerDay - a.ingredient.costPerDay;
      if (sortBy === 'name') return a.ingredient.name.localeCompare(b.ingredient.name);
      if (sortBy === 'buy') return b.orderUnits - a.orderUnits;
      return (a.hours ?? Infinity) - (b.hours ?? Infinity);
    });
  }, [model, filter, sortBy, inbound, bufferDays, ctx.gameDay]);

  if (model.ingredients.length === 0) {
    return <p className="text-xs text-[var(--text-subtle)]">{t('liveHq.factoryNoIngredients', 'No ingredients detected for the active lines.')}</p>;
  }

  const filters: { key: FeedFilter; label: string }[] = [
    { key: 'all', label: t('liveHq.factoryFeedFilterAll', 'All') },
    { key: 'short', label: t('liveHq.factoryFeedFilterShort', 'Critical <12h') },
    { key: 'tight', label: t('liveHq.factoryFeedFilterTight', 'Under 48h') },
    { key: 'healthy', label: t('liveHq.factoryFeedFilterHealthy', 'Healthy') }
  ];

  const totalBuyCost = rows.reduce((sum, row) => sum + row.orderUnits * row.ingredient.unitWholesale, 0);

  return (
    <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--bg-base)] border-b border-[var(--border-base)]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">{t('liveHq.factoryFeedTitle', 'Ingredient buffers')}</span>
          <span className="text-[11px] font-mono text-[var(--text-muted)]">
            {model.ingredients.length} {t('liveHq.factoryFeedItems', 'items')} · {money(model.feedCostPerDay)} {t('liveHq.factoryKpiFeedPerDaySuffix', '/ day')}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs">
            {filters.map(option => (
              <button
                key={option.key}
                type="button"
                onClick={() => setFilter(option.key)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${filter === option.key ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <FilterDropdown
            icon={ArrowUpDown}
            value={sortBy}
            onChange={value => setSortBy(value as FeedSort)}
            options={[
              { value: 'runway', label: t('liveHq.factoryFeedSortRunway', 'Sort: Runway') },
              { value: 'buy', label: t('liveHq.factoryFeedSortBuy', 'Sort: Buy units') },
              { value: 'draw', label: t('liveHq.factoryFeedSortDraw', 'Sort: Draw / day') },
              { value: 'cost', label: t('liveHq.factoryFeedSortCost', 'Sort: Cost / day') },
              { value: 'name', label: t('liveHq.factoryFeedSortName', 'Sort: Name') }
            ]}
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wide text-[var(--text-subtle)]">{t('liveHq.factoryReorderBuffer', 'Buffer')}</span>
            <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5">
              <button type="button" onClick={() => setBufferDays(d => Math.max(0, d - 1))} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"><Minus className="w-3.5 h-3.5" /></button>
              <span className="w-10 text-center text-xs font-mono font-bold text-[var(--text-main)]">{t('liveHq.factoryReorderDays', '{n}d').replace('{n}', String(bufferDays))}</span>
              <button type="button" onClick={() => setBufferDays(d => Math.min(14, d + 1))} className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 px-4 py-1.5 border-b border-[var(--border-subtle)] text-[9px] uppercase font-bold tracking-wider text-[var(--text-subtle)]">
        <span className="col-span-4">{t('liveHq.product', 'Product')}</span>
        <span className="col-span-5">{t('liveHq.factoryFeedTimeline', 'Timeline')}</span>
        <span className="col-span-1 text-right">{t('liveHq.factoryRunway', 'Runway')}</span>
        <span className="col-span-2 text-right">{t('liveHq.factoryFeedBuy', 'Recommended buy')}</span>
      </div>

      <div className="divide-y divide-[var(--border-subtle)]">
        {rows.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-[var(--text-subtle)]">{t('liveHq.factoryFeedNoMatch', 'No ingredients match this filter.')}</div>
        ) : rows.map(({ ingredient, shipment, hasShipment, leadDays, leadHours, hours, gap, orderUnits }) => {
          const tone = toneHex(hours);
          const span = Math.max(hours ?? 0, targetHours, hasShipment ? leadHours : 0, 24) * 1.12;
          const fillPct = hours == null ? 0 : Math.min(100, (hours / span) * 100);
          const targetPct = targetHours > 0 ? Math.min(96, (targetHours / span) * 100) : 0;
          const leadPct = hasShipment ? Math.min(98, (leadHours / span) * 100) : 0;
          const belowTarget = targetHours > 0 && (hours == null || hours < targetHours);
          const maxDays = Math.max(1, Math.ceil(span / 24));
          const gapHours = Math.max(0, leadHours - (hours ?? 0));

          const active = hoverPart?.id === ingredient.rawId ? hoverPart.part : null;
          const dimmed = (part: string) => (active != null && active !== part ? 0.25 : 1);
          const enter = (part: string) => () => setHoverPart({ id: ingredient.rawId, part });

          const productTip = (
            <div className="space-y-0.5 max-w-[230px]">
              <div className="font-semibold">{ingredient.name}</div>
              <TipRows rows={[
                { label: t('liveHq.factoryOnHand', 'On hand'), value: `${Math.round(ingredient.onHand).toLocaleString()} u` },
                { label: t('liveHq.factoryDrawDay', 'Draw / day'), value: Math.round(ingredient.perDay).toLocaleString() },
                { label: t('liveHq.factoryUnitCost', 'Unit cost'), value: money2(ingredient.unitWholesale) }
              ]} />
            </div>
          );
          const runwayTip = (
            <div className="space-y-0.5 max-w-[220px]">
              <div className="font-semibold text-emerald-300">{t('liveHq.factoryFeedPartRunway', 'Stock cover')}</div>
              <div className="text-[11px] text-slate-300">{t('liveHq.factoryFeedPartRunwayDesc', 'How long the on-hand stock lasts at the current draw.')}</div>
              <TipRows rows={[{ label: t('liveHq.factoryRunway', 'Runway'), value: hours == null ? '-' : `${hoursLabel(hours)} (${(hours / 24).toFixed(1)}d)` }]} />
            </div>
          );
          const emptyTip = (
            <div className="space-y-0.5 max-w-[220px]">
              <div className="font-semibold text-slate-200">{t('liveHq.factoryFeedPartEmpty', 'Uncovered time')}</div>
              <div className="text-[11px] text-slate-300">{t('liveHq.factoryFeedPartEmptyDesc', 'No stock after this point; the line idles until the next delivery arrives.')}</div>
            </div>
          );
          const gapTip = (
            <div className="space-y-0.5 max-w-[230px]">
              <div className="font-semibold text-rose-300">{t('liveHq.factoryFeedPartGap', 'Supply gap')}</div>
              <div className="text-[11px] text-slate-300">{t('liveHq.factoryFeedPartGapDesc', 'The line runs dry about {h}h before the delivery lands.').replace('{h}', String(Math.round(gapHours)))}</div>
            </div>
          );
          const targetTip = (
            <div className="space-y-0.5 max-w-[220px]">
              <div className="font-semibold text-indigo-300">{t('liveHq.factoryFeedPartTarget', 'Buffer target')}</div>
              <div className="text-[11px] text-slate-300">{t('liveHq.factoryFeedPartTargetDesc', 'The coverage you asked to keep. Bars ending left of this are below target.')}</div>
              <TipRows rows={[{ label: t('liveHq.factoryReorderBuffer', 'Buffer'), value: `${bufferDays}d` }]} />
            </div>
          );
          const deliveryTip = (
            <div className="space-y-0.5 max-w-[230px]">
              <div className="font-semibold text-sky-300">{t('liveHq.factoryFeedPartDelivery', 'Next delivery')}</div>
              <TipRows rows={[
                { label: t('liveHq.factoryReorderArrives', 'Arrives in'), value: `${leadDays}d (${leadHours}h)` },
                ...(shipment ? [{ label: t('liveHq.factoryAmount', 'Amount'), value: money(shipment.amount) }] : [])
              ]} />
            </div>
          );
          const buyTip = (
            <div className="space-y-0.5 max-w-[240px]">
              <div className="font-semibold">{t('liveHq.factoryFeedBuy', 'Recommended buy')}</div>
              <div className="text-[11px] text-slate-300">
                {t('liveHq.factoryFeedBuyFormula', 'Cover {days}d of draw ({lead}d lead + {buffer}d buffer) minus on-hand.').replace('{days}', String(leadDays + bufferDays)).replace('{lead}', String(leadDays)).replace('{buffer}', String(bufferDays))}
              </div>
              <TipRows rows={[
                { label: t('liveHq.factoryFeedBuy', 'Buy'), value: orderUnits > 0 ? `${orderUnits.toLocaleString()} u` : t('liveHq.factoryReorderCovered', 'Covered') },
                { label: t('liveHq.factoryFeedBuyTotal', 'Cost'), value: money(orderUnits * ingredient.unitWholesale) }
              ]} />
            </div>
          );

          return (
            <div key={ingredient.rawId} className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors">
              <FloatingTooltip className="col-span-4 flex items-center gap-3 min-w-0" content={productTip}>
                <ItemIcon src={resolveItemImage(ingredient.rawId)} size={36} />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-[var(--text-main)]">{ingredient.name}</div>
                  <div className="truncate text-[10px] text-[var(--text-subtle)]">
                    {Math.round(ingredient.onHand).toLocaleString()} {t('liveHq.factoryUnitsShort', 'u')} · {Math.round(ingredient.perDay).toLocaleString()}/{t('liveHq.factoryDayShort', 'day')}
                  </div>
                </div>
              </FloatingTooltip>

              <div className="col-span-5 min-w-0">
                <div className={`relative h-3.5 rounded-full bg-[var(--bg-base)] overflow-hidden ${belowTarget ? 'ring-1 ring-rose-500/30' : ''}`}>
                  {Array.from({ length: maxDays - 1 }, (_, i) => i + 1).filter(day => maxDays <= 14 || day % 2 === 0).map(day => (
                    <span key={day} className="absolute inset-y-0 w-px bg-[var(--border-base)]" style={{ left: `${Math.min(99, (day * 24 / span) * 100)}%` }} />
                  ))}

                  {/* Covered runway */}
                  {fillPct > 0 && (
                    <div className="absolute inset-y-0 left-0" style={{ width: `${fillPct}%` }}>
                      <FloatingTooltip className="block h-full w-full" onEnter={enter('runway')} onLeave={() => setHoverPart(null)} content={runwayTip}>
                        <span className="block h-full w-full rounded-l-full transition-opacity" style={{ backgroundColor: tone, opacity: dimmed('runway') }} />
                      </FloatingTooltip>
                    </div>
                  )}

                  {/* Uncovered time */}
                  <div className="absolute inset-y-0" style={{ left: `${fillPct}%`, right: 0 }}>
                    <FloatingTooltip className="block h-full w-full" onEnter={enter('empty')} onLeave={() => setHoverPart(null)} content={emptyTip}>
                      <span className="block h-full w-full transition-opacity" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(244,63,94,0.22) 0 4px, transparent 4px 8px)', opacity: active === 'empty' ? 1 : active != null ? 0.25 : 0.7 }} />
                    </FloatingTooltip>
                  </div>

                  {/* Supply gap */}
                  {gap && (
                    <div className="absolute inset-y-0" style={{ left: `${fillPct}%`, width: `${Math.max(0, leadPct - fillPct)}%` }}>
                      <FloatingTooltip className="block h-full w-full" onEnter={enter('gap')} onLeave={() => setHoverPart(null)} content={gapTip}>
                        <span className="block h-full w-full transition-opacity" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(244,63,94,0.55) 0 4px, transparent 4px 8px)', opacity: dimmed('gap') }} />
                      </FloatingTooltip>
                    </div>
                  )}

                  {/* Buffer target marker */}
                  {targetHours > 0 && (
                    <div className="absolute -inset-y-1 -translate-x-1/2" style={{ left: `${targetPct}%` }}>
                      <FloatingTooltip className="block h-full" onEnter={enter('target')} onLeave={() => setHoverPart(null)} content={targetTip}>
                        <span className="block h-full w-2 rounded-full transition-opacity" style={{ backgroundColor: INDIGO, opacity: active === 'target' ? 1 : dimmed('target') }} />
                      </FloatingTooltip>
                    </div>
                  )}

                  {/* Next delivery marker */}
                  {hasShipment && (
                    <div className="absolute -inset-y-1 -translate-x-1/2" style={{ left: `${leadPct}%` }}>
                      <FloatingTooltip className="block h-full" onEnter={enter('delivery')} onLeave={() => setHoverPart(null)} content={deliveryTip}>
                        <span className="block h-full w-2 rounded-full transition-opacity" style={{ backgroundColor: SKY, opacity: active === 'delivery' ? 1 : dimmed('delivery') }} />
                      </FloatingTooltip>
                    </div>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between gap-2 text-[9px] font-mono">
                  <span style={{ color: tone }}>{t('liveHq.factoryRunwayLower', 'runway')} {hoursLabel(hours)}</span>
                  {gap
                    ? <span className="inline-flex items-center gap-1 font-bold text-rose-500"><TriangleAlert className="w-2.5 h-2.5" />{t('liveHq.factoryReorderUrgent', 'Delivery after stockout')}</span>
                    : hasShipment
                      ? <span className="text-sky-500">{t('liveHq.factoryReorderArrivesShort', 'delivery')} {leadHours}h</span>
                      : <span className="text-[var(--text-subtle)]">{t('liveHq.factoryReorderNoInbound', 'No scheduled inbound')}</span>}
                  {targetHours > 0 && <span className="text-indigo-400">{t('liveHq.factoryReorderBuffer', 'Buffer')} {bufferDays}d</span>}
                </div>
              </div>

              <FloatingTooltip className="col-span-1 text-right block" content={
                <div className="space-y-0.5 max-w-[210px]">
                  <div className="font-semibold">{t('liveHq.factoryRunway', 'Runway')}</div>
                  <TipRows rows={[
                    { label: t('liveHq.factoryOnHand', 'On hand'), value: `${Math.round(ingredient.onHand).toLocaleString()} u` },
                    { label: t('liveHq.factoryDrawDay', 'Draw / day'), value: Math.round(ingredient.perDay).toLocaleString() },
                    { label: t('liveHq.factoryRunway', 'Runway'), value: hours == null ? '-' : `${hoursLabel(hours)} (${(hours / 24).toFixed(1)}d)` }
                  ]} />
                </div>
              }>
                <span className="font-mono text-xs font-bold" style={{ color: tone }}>{hoursLabel(hours)}</span>
              </FloatingTooltip>

              <FloatingTooltip className="col-span-2 text-right block" content={buyTip}>
                {orderUnits > 0 ? (
                  <>
                    <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">{orderUnits.toLocaleString()}</div>
                    <div className="font-mono text-[10px] text-[var(--text-subtle)]">{money(orderUnits * ingredient.unitWholesale)}</div>
                  </>
                ) : (
                  <span className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.factoryReorderCovered', 'Covered')}</span>
                )}
              </FloatingTooltip>
            </div>
          );
        })}
      </div>

      {totalBuyCost > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border-base)] bg-[var(--bg-base)] text-[11px]">
          <span className="uppercase font-bold tracking-wider text-[var(--text-subtle)]">{t('liveHq.factoryFeedBuyTotal', 'Total recommended buy')}</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{money(totalBuyCost)}</span>
        </div>
      )}
    </div>
  );
}
