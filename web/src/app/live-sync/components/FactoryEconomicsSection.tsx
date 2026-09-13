'use client';

import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { recipeById } from '@/lib/productionModel';
import { ProductionSectionProps, money, money2, pct } from '@/lib/productionUi';
import { resolveItemImage } from '@/lib/logistics';
import { ItemIcon } from './SupplyChainDetailAtoms';
import FloatingTooltip from './FloatingTooltip';

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

const EMERALD = '#10b981';
const ROSE = '#f43f5e';
const AMBER = '#f59e0b';
const SLATE = '#94a3b8';

const WIDTH = 640;
const HEIGHT = 200;
const PAD_X = 18;
const PAD_TOP = 26;
const PAD_BOTTOM = 22;

interface UnitLine {
  key: string;
  name: string;
  rawId: string | null;
  price: number;
  unitCost: number;
  feedPerUnit: number;
  laborPerUnit: number;
  rentPerUnit: number;
  marginPerUnit: number;
  marginShare: number | null;
  dailyOutput: number;
}

const signed = (value: number) => (value < 0 ? `-${money(-value)}` : money(value));

// Economics & Yield: the site's daily value cascade (a waterfall from gross retail
// value through each cost to net contribution) paired with a per-line unit anatomy
// where every product's fully burdened unit cost is broken into its real parts.
export default function FactoryEconomicsSection({ model }: ProductionSectionProps) {
  const { t } = useTranslation();

  const gross = model.grossValuePerDay;
  const feed = model.feedCostPerDay;
  const labor = model.laborCostPerDay;
  const rent = model.rentPerDay;
  const net = model.contributionPerDay;
  const marginShare = gross > 0 ? net / gross : null;

  const steps = [
    { key: 'gross', short: t('liveHq.factoryEconGross', 'Gross'), display: money(gross), start: 0, end: gross, color: EMERALD },
    { key: 'ingredients', short: t('liveHq.factoryEconIngredients', 'Ingredients'), display: `-${money(feed)}`, start: gross, end: gross - feed, color: ROSE },
    { key: 'labor', short: t('liveHq.factoryEconLabor', 'Labor'), display: `-${money(labor)}`, start: gross - feed, end: gross - feed - labor, color: AMBER },
    { key: 'rent', short: t('liveHq.factoryEconRent', 'Rent'), display: `-${money(rent)}`, start: gross - feed - labor, end: gross - feed - labor - rent, color: SLATE },
    { key: 'net', short: t('liveHq.factoryEconNet', 'Net'), display: signed(net), start: 0, end: net, color: net >= 0 ? EMERALD : ROSE }
  ];

  const unitLines = useMemo<UnitLine[]>(() => model.lines
    .filter(line => line.fullyBurdenedUnitCost != null && line.dailyOutput > 0)
    .map(line => {
      const recipe = recipeById(line.recipeId);
      const price = recipe?.marketPrice ?? 0;
      const unitCost = line.fullyBurdenedUnitCost as number;
      const feedPerUnit = line.ingredients.reduce((sum, ingredient) => sum + ingredient.costPerDay, 0) / line.dailyOutput;
      const laborPerUnit = line.laborCostPerDay / line.dailyOutput;
      const rentPerUnit = Math.max(0, unitCost - feedPerUnit - laborPerUnit);
      const marginPerUnit = price - unitCost;
      return {
        key: line.key,
        name: line.outputName || t('liveHq.factoryUnknownRecipe', 'Unrecognised recipe'),
        rawId: line.outputRawId,
        price,
        unitCost,
        feedPerUnit,
        laborPerUnit,
        rentPerUnit,
        marginPerUnit,
        marginShare: price > 0 ? marginPerUnit / price : null,
        dailyOutput: line.dailyOutput
      };
    })
    .sort((a, b) => b.dailyOutput - a.dailyOutput), [model, t]);

  const scaleMax = Math.max(1, ...unitLines.map(line => Math.max(line.price, line.unitCost)));

  const values = steps.flatMap(step => [step.start, step.end]);
  const dataMax = Math.max(...values, 0);
  const dataMin = Math.min(...values, 0);
  const span = (dataMax - dataMin) || 1;
  const domainMax = dataMax + span * 0.2;
  const domainMin = dataMin < 0 ? dataMin - span * 0.1 : 0;
  const chartTop = PAD_TOP;
  const chartBottom = HEIGHT - PAD_BOTTOM;
  const valueToY = (value: number) => chartTop + ((domainMax - value) / (domainMax - domainMin)) * (chartBottom - chartTop);
  const slotWidth = (WIDTH - PAD_X * 2) / steps.length;
  const barWidth = Math.min(46, slotWidth * 0.42);
  const centerX = (index: number) => PAD_X + slotWidth * (index + 0.5);

  const hasData = gross !== 0 || net !== 0 || feed !== 0 || labor !== 0 || rent !== 0;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)] flex items-center gap-2">
            {net >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
            {t('liveHq.factoryValueFlow', 'Daily value flow')}
          </div>
          {marginShare != null && (
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${net >= 0 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/15 text-rose-500'}`}>
              {t('liveHq.factoryMarginBadge', '{pct} margin').replace('{pct}', pct(marginShare))}
            </span>
          )}
        </div>

        {hasData ? (
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-[220px] mt-2" preserveAspectRatio="xMidYMid meet" role="img" aria-label={t('liveHq.factoryValueFlow', 'Daily value flow')}>
            <line x1={PAD_X} y1={valueToY(0)} x2={WIDTH - PAD_X} y2={valueToY(0)} stroke="var(--border-subtle)" strokeDasharray="4 4" />
            {steps.slice(0, -1).map((step, index) => (
              <line
                key={`link-${step.key}`}
                x1={centerX(index) + barWidth / 2}
                y1={valueToY(step.end)}
                x2={centerX(index + 1) - barWidth / 2}
                y2={valueToY(step.end)}
                stroke="var(--border-strong)"
                strokeDasharray="3 3"
              />
            ))}
            {steps.map((step, index) => {
              const top = valueToY(Math.max(step.start, step.end));
              const height = Math.max(2, Math.abs(valueToY(step.start) - valueToY(step.end)));
              const isNet = step.key === 'net';
              return (
                <g key={step.key}>
                  <rect x={centerX(index) - barWidth / 2} y={top} width={barWidth} height={height} rx={4} fill={step.color} opacity={isNet ? 1 : 0.88} />
                  <text x={centerX(index)} y={top - 6} textAnchor="middle" fontSize={10} fontWeight={isNet ? 700 : 600} style={{ fill: 'var(--text-main)' }}>
                    {step.display}
                  </text>
                  <text x={centerX(index)} y={HEIGHT - 6} textAnchor="middle" fontSize={9} style={{ fill: 'var(--text-subtle)' }}>
                    {step.short}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <p className="py-6 text-center text-xs text-[var(--text-subtle)]">{t('liveHq.factoryEconNoData', 'No production value recorded for this site yet.')}</p>
        )}

        <p className="text-[10px] text-[var(--text-subtle)] pt-1 border-t border-[var(--border-subtle)]">
          {t('liveHq.factoryPnlNote', 'Gross retail value uses market prices; real revenue depends on store sales and demand.')}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--border-base)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">{t('liveHq.factoryUnitAnatomy', 'Unit anatomy: cost vs price')}</div>
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[var(--text-subtle)]">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ROSE }} /> {t('liveHq.factoryEconIngredients', 'Ingredients')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: AMBER }} /> {t('liveHq.factoryEconLabor', 'Labor')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SLATE }} /> {t('liveHq.factoryEconRent', 'Rent')}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: EMERALD }} /> {t('liveHq.factoryEconMargin', 'Margin')}</span>
            <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-[var(--text-main)]" /> {t('liveHq.factoryMarketPrice', 'Market price')}</span>
          </div>
        </div>

        {unitLines.length === 0 ? (
          <p className="px-4 py-3 text-xs text-[var(--text-subtle)]">{t('liveHq.factoryNoUnitLines', 'No lines produce enough to break down a unit cost.')}</p>
        ) : (
          <div className="divide-y divide-[var(--border-subtle)] max-h-[520px] overflow-y-auto">
            {unitLines.map(line => {
              const feedPct = (line.feedPerUnit / scaleMax) * 100;
              const laborPct = (line.laborPerUnit / scaleMax) * 100;
              const rentPct = (line.rentPerUnit / scaleMax) * 100;
              const pricePct = (line.price / scaleMax) * 100;
              const marginPct = Math.max(0, line.marginPerUnit) / scaleMax * 100;
              const lossPct = Math.max(0, -line.marginPerUnit) / scaleMax * 100;
              return (
                <div key={line.key} className="px-4 py-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <ItemIcon src={line.rawId ? resolveItemImage(line.rawId) : null} size={24} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-xs font-semibold text-[var(--text-main)]">{line.name}</div>
                      <div className="text-[9px] font-mono text-[var(--text-subtle)]">{Math.round(line.dailyOutput).toLocaleString()} u/day</div>
                    </div>
                    <div className="text-right leading-tight shrink-0">
                      <div className="font-mono text-[11px] text-[var(--text-main)]">
                        {money2(line.unitCost)}<span className="text-[8px] text-[var(--text-subtle)] ml-0.5">/u</span>
                      </div>
                      <div className={`font-mono text-[10px] font-bold ${line.marginPerUnit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {line.marginPerUnit >= 0 ? '+' : ''}{money2(line.marginPerUnit)}
                        {line.marginShare != null && <span className="text-[var(--text-subtle)] font-normal"> · {pct(line.marginShare)}</span>}
                      </div>
                    </div>
                  </div>

                  <FloatingTooltip
                    className="block relative h-4 cursor-pointer"
                    content={
                      <div className="min-w-[190px] space-y-1">
                        <div className="font-semibold">{line.name}</div>
                        <TipRows rows={[
                          { label: t('liveHq.factoryEconIngredients', 'Ingredients'), value: money2(line.feedPerUnit), tone: 'text-rose-400' },
                          { label: t('liveHq.factoryEconLabor', 'Labor'), value: money2(line.laborPerUnit), tone: 'text-amber-400' },
                          { label: t('liveHq.factoryEconRent', 'Rent'), value: money2(line.rentPerUnit), tone: 'text-slate-300' },
                          { label: t('liveHq.factoryUnitCostTitle', 'Fully burdened unit cost'), value: money2(line.unitCost), tone: 'text-white' },
                          { label: t('liveHq.factoryMarketPrice', 'Market price'), value: money2(line.price), tone: 'text-emerald-400' },
                          { label: line.marginPerUnit >= 0 ? t('liveHq.factoryEconMargin', 'Margin') : t('liveHq.factoryEconLoss', 'Loss'), value: money2(Math.abs(line.marginPerUnit)), tone: line.marginPerUnit >= 0 ? 'text-emerald-400' : 'text-rose-400' }
                        ]} />
                      </div>
                    }
                  >
                    <div className="absolute inset-0 rounded-full bg-[var(--bg-base)] border border-[var(--border-subtle)] overflow-hidden flex">
                      <span className="h-full transition-[width] duration-500" style={{ width: `${feedPct}%`, backgroundColor: ROSE }} />
                      <span className="h-full transition-[width] duration-500" style={{ width: `${laborPct}%`, backgroundColor: AMBER }} />
                      <span className="h-full transition-[width] duration-500" style={{ width: `${rentPct}%`, backgroundColor: SLATE }} />
                      {line.marginPerUnit > 0 && (
                        <span className="h-full transition-[width] duration-500 opacity-70" style={{ width: `${marginPct}%`, backgroundColor: EMERALD }} />
                      )}
                      {line.marginPerUnit < 0 && (
                        <span className="absolute inset-y-0 opacity-50" style={{ left: `${Math.min(100, pricePct)}%`, width: `${lossPct}%`, backgroundColor: ROSE }} />
                      )}
                    </div>
                    <span className="absolute -top-0.5 -bottom-0.5 w-0.5 rounded bg-[var(--text-main)]" style={{ left: `${Math.min(100, pricePct)}%` }} />
                  </FloatingTooltip>

                  <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-subtle)]">
                    <span>{t('liveHq.factoryEconCostLabel', 'cost')} {money2(line.unitCost)}</span>
                    <span className={line.price < line.unitCost ? 'text-rose-500' : ''}>
                      {t('liveHq.factoryEconPriceLabel', 'price')} {money2(line.price)}
                      {line.price < line.unitCost && ` · ${t('liveHq.factoryEconOverPrice', 'over price')}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-4 py-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-subtle)]">
          {t('liveHq.factoryUnitCostNote', 'Fully burdened unit cost = ingredients + labor + the line\'s share of rent, per unit produced. The marker is the market price each unit sells at.')}
        </div>
      </div>
    </div>
  );
}
