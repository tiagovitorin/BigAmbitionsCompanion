'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { zoom, zoomIdentity } from 'd3-zoom';
import type { ZoomBehavior, ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { ZoomIn, ZoomOut, Maximize2, MoveVertical, MoveHorizontal, Package, Factory, PackageCheck, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { ProductionSectionProps, workstationLabel, hoursLabel } from '@/lib/productionUi';
import { LineModel, SiteModel } from '@/lib/productionModel';
import { resolveItemImage } from '@/lib/logistics';

const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const ROSE = '#f43f5e';
const SLATE = '#94a3b8';

const PAD = 28;
const ING_W = 214;
const ING_H = 44;
const LINE_W = 258;
const LINE_H = 66;
const OUT_W = 224;
const OUT_H = 44;
const ROW_STEP = 82;
const COL_STEP = 40;
const ING_ROW_GAP = 200;
const OUT_ROW_GAP = 120;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const staffTone = (value: number) => (value >= 0.999 ? EMERALD : value >= 0.5 ? AMBER : ROSE);
const starvationTone = (value: number | null) => (value == null ? SLATE : value < 12 ? ROSE : value < 48 ? AMBER : EMERALD);

function curveH(x1: number, y1: number, x2: number, y2: number) {
  const dx = Math.max(50, (x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}
function curveV(x1: number, y1: number, x2: number, y2: number) {
  const dy = Math.max(50, (y2 - y1) * 0.5);
  return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
}

function ratedDuration(line: LineModel) {
  const ratedPerHour = Math.max(1, line.outputPerMachineHour * line.machineCount);
  return clamp(30 / ratedPerHour, 0.9, 3.2);
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function flowSignature(model: SiteModel): string {
  const lines = model.lines.map(line =>
    `${line.key}:${line.machineCount}:${Math.round(line.staffedShare * 20)}:${Math.round(line.dailyOutput)}:` +
    `${line.ingredients.map(ing => `${ing.rawId}@${Math.round(ing.perDay / 10)}`).join(',')}:${line.warnings.join(',')}`
  ).join('|');
  const ingredients = model.ingredients.map(ing => `${ing.rawId}@${Math.round((ing.starvationHours ?? 999) / 2)}`).join(',');
  return `${lines}##${ingredients}##${Math.round(model.grossValuePerDay / 1000)}`;
}

type Orientation = 'horizontal' | 'vertical';

interface Tip {
  x: number;
  y: number;
  title: string;
  rows: { label: string; value: string }[];
}

function FactoryFlowDiagramBase({ model, demand }: ProductionSectionProps) {
  const { t } = useTranslation();
  const reducedMotion = usePrefersReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomLayerRef = useRef<SVGGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const focusedRef = useRef(false);
  const [focused, setFocused] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [tip, setTip] = useState<Tip | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const layout = useMemo(() => {
    const lines = model.lines;
    const ingredients = model.ingredients;

    const outputMap = new Map<string, { rawId: string; name: string; perDay: number }>();
    lines.forEach(line => {
      if (!line.outputRawId || !line.outputName) return;
      const existing = outputMap.get(line.outputRawId);
      if (existing) existing.perDay += line.dailyOutput;
      else outputMap.set(line.outputRawId, { rawId: line.outputRawId, name: line.outputName, perDay: line.dailyOutput });
    });
    const outputs = Array.from(outputMap.values());

    const vertical = orientation === 'vertical';
    const spread = (index: number, count: number, size: number, total: number) =>
      count <= 1 ? (total - size) / 2 : PAD + ((total - PAD * 2 - size) * index) / (count - 1);
    const rowWidth = (count: number, size: number) => PAD * 2 + Math.max(0, count - 1) * (size + COL_STEP) + size;

    let width = 0;
    let height = 0;
    let ingPos: { x: number; y: number }[] = [];
    let linePos: { x: number; y: number }[] = [];
    let outPos: { x: number; y: number }[] = [];

    if (!vertical) {
      const rows = Math.max(ingredients.length, lines.length, outputs.length, 1);
      height = PAD * 2 + (rows - 1) * ROW_STEP + Math.max(ING_H, LINE_H, OUT_H);
      width = 1180;
      const colX = (x: number) => x;
      ingPos = ingredients.map((_, index) => ({ x: colX(24), y: spread(index, ingredients.length, ING_H, height) }));
      linePos = lines.map((_, index) => ({ x: colX(470), y: spread(index, lines.length, LINE_H, height) }));
      outPos = outputs.map((_, index) => ({ x: colX(928), y: spread(index, outputs.length, OUT_H, height) }));
    } else {
      width = Math.max(rowWidth(ingredients.length, ING_W), rowWidth(lines.length, LINE_W), rowWidth(outputs.length, OUT_W), 720);
      const ingY = PAD;
      const lineY = ingY + ING_H + ING_ROW_GAP;
      const outY = lineY + LINE_H + OUT_ROW_GAP;
      height = outY + OUT_H + PAD;
      ingPos = ingredients.map((_, index) => ({ x: spread(index, ingredients.length, ING_W, width), y: ingY }));
      linePos = lines.map((_, index) => ({ x: spread(index, lines.length, LINE_W, width), y: lineY }));
      outPos = outputs.map((_, index) => ({ x: spread(index, outputs.length, OUT_W, width), y: outY }));
    }

    const ingIndex = new Map(ingredients.map((ing, index) => [ing.rawId, index]));
    const outIndex = new Map(outputs.map((output, index) => [output.rawId, index]));

    const edges: { id: string; d: string; color: string; duration: number; tip: Tip['rows']; title: string }[] = [];

    lines.forEach((line, lineIndex) => {
      const lp = linePos[lineIndex];
      const duration = ratedDuration(line);
      const health = line.warnings.length > 0 ? ROSE : EMERALD;

      line.ingredients.forEach(ingredient => {
        const index = ingIndex.get(ingredient.rawId);
        if (index == null) return;
        const siteIngredient = ingredients[index];
        const ip = ingPos[index];
        const d = vertical
          ? curveV(ip.x + ING_W / 2, ip.y + ING_H, lp.x + LINE_W / 2, lp.y)
          : curveH(ip.x + ING_W, ip.y + ING_H / 2, lp.x, lp.y + LINE_H / 2);
        edges.push({
          id: `in-${line.key}-${ingredient.rawId}`,
          d,
          color: starvationTone(siteIngredient.starvationHours),
          duration,
          title: `${siteIngredient.name}  ->  ${line.outputName || ''}`,
          tip: [
            { label: t('liveHq.factoryDrawDay', 'Draw / day'), value: Math.round(ingredient.perDay).toLocaleString() },
            { label: t('liveHq.factoryRunway', 'Runway'), value: hoursLabel(siteIngredient.starvationHours) },
            { label: t('liveHq.factoryOnHand', 'On hand'), value: Math.round(siteIngredient.onHand).toLocaleString() }
          ]
        });
      });

      const outputIndex = line.outputRawId ? outIndex.get(line.outputRawId) : undefined;
      if (outputIndex != null) {
        const op = outPos[outputIndex];
        const d = vertical
          ? curveV(lp.x + LINE_W / 2, lp.y + LINE_H, op.x + OUT_W / 2, op.y)
          : curveH(lp.x + LINE_W, lp.y + LINE_H / 2, op.x, op.y + OUT_H / 2);
        edges.push({
          id: `out-${line.key}`,
          d,
          color: health,
          duration,
          title: line.outputName || '',
          tip: [
            { label: t('liveHq.factoryMakesPerDay', 'Makes / day'), value: Math.round(line.dailyOutput).toLocaleString() },
            { label: t('liveHq.factoryLineStaffed', 'Staffed'), value: `${Math.round(line.staffedShare * 100)}%` }
          ]
        });
      }
    });

    return { lines, ingredients, outputs, width, height, ingPos, linePos, outPos, edges };
  }, [model, t, orientation]);

  useEffect(() => {
    const svgEl = svgRef.current;
    const layer = zoomLayerRef.current;
    if (!svgEl || !layer) return;
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 4])
      // Wheel zoom only once the user has clicked into the flow, so the page scrolls
      // normally everywhere else. Dragging to pan stays available.
      .filter((event: any) => {
        if (event.type === 'wheel') return focusedRef.current;
        return !event.button;
      })
      .on('zoom', (event: { transform: ZoomTransform }) => {
        select(layer).attr('transform', event.transform.toString());
      });
    zoomBehaviorRef.current = behavior;
    select(svgEl).call(behavior).on('dblclick.zoom', null);

    const w = svgEl.clientWidth || 900;
    const h = svgEl.clientHeight || 520;
    const scale = clamp(Math.min(w / (layout.width + PAD * 2), h / (layout.height + PAD * 2)), 0.35, 1.4);
    const tx = (w - scale * (layout.width + PAD * 2)) / 2 + PAD * scale;
    const ty = (h - scale * (layout.height + PAD * 2)) / 2 + PAD * scale;
    behavior.transform(select(svgEl) as any, zoomIdentity.translate(tx, ty).scale(scale));

    return () => { select(svgEl).on('.zoom', null); };
  }, [layout.width, layout.height, orientation]);

  const zoomBy = (factor: number) => {
    const svgEl = svgRef.current;
    if (svgEl && zoomBehaviorRef.current) zoomBehaviorRef.current.scaleBy(select(svgEl) as any, factor);
  };
  const resetView = () => {
    const svgEl = svgRef.current;
    if (!svgEl || !zoomBehaviorRef.current) return;
    const w = svgEl.clientWidth || 900;
    const h = svgEl.clientHeight || 520;
    const scale = clamp(Math.min(w / (layout.width + PAD * 2), h / (layout.height + PAD * 2)), 0.35, 1.4);
    const tx = (w - scale * (layout.width + PAD * 2)) / 2 + PAD * scale;
    const ty = (h - scale * (layout.height + PAD * 2)) / 2 + PAD * scale;
    zoomBehaviorRef.current.transform(select(svgEl) as any, zoomIdentity.translate(tx, ty).scale(scale));
  };

  const showTip = (event: ReactMouseEvent, title: string, rows: Tip['rows']) => {
    const rect = containerRef.current?.getBoundingClientRect();
    setTip({ x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0), title, rows });
  };

  return (
    <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--border-base)] bg-[var(--bg-base)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)]">
            <Package className="w-3.5 h-3.5 text-emerald-500" />{t('liveHq.factoryInbound', 'Inbound')}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--border-base)] bg-[var(--bg-base)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)]">
            <Factory className="w-3.5 h-3.5 text-emerald-500" />{t('liveHq.factoryCells', 'Production cells')}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--border-base)] bg-[var(--bg-base)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--text-main)]">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />{t('liveHq.factoryOutbound', 'Output')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-3 text-[9px] font-semibold">
            <span className="flex items-center gap-1 text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500" />{t('liveHq.factoryFlowHealthy', 'Healthy')}</span>
            <span className="flex items-center gap-1 text-amber-500"><span className="w-2 h-2 rounded-full bg-amber-500" />{t('liveHq.factoryFlowThrottled', 'Throttled')}</span>
            <span className="flex items-center gap-1 text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500" />{t('liveHq.factoryFlowStarved', 'Starved')}</span>
          </span>
          <div className="flex items-center gap-0.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] p-0.5">
            <button
              type="button"
              onClick={() => setOrientation(current => (current === 'horizontal' ? 'vertical' : 'horizontal'))}
              title={orientation === 'horizontal' ? t('liveHq.factoryLayoutVertical', 'Vertical layout') : t('liveHq.factoryLayoutHorizontal', 'Horizontal layout')}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              {orientation === 'horizontal' ? <MoveVertical className="w-3.5 h-3.5" /> : <MoveHorizontal className="w-3.5 h-3.5" />}
            </button>
            <button type="button" onClick={() => zoomBy(1.3)} title={t('liveHq.factoryZoomIn', 'Zoom in')} className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"><ZoomIn className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={() => zoomBy(1 / 1.3)} title={t('liveHq.factoryZoomOut', 'Zoom out')} className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"><ZoomOut className="w-3.5 h-3.5" /></button>
            <button type="button" onClick={resetView} title={t('liveHq.factoryZoomReset', 'Reset view')} className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"><Maximize2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        onPointerDown={() => containerRef.current?.focus()}
        onFocus={() => { focusedRef.current = true; setFocused(true); }}
        onBlur={() => { focusedRef.current = false; setFocused(false); }}
        className={`relative h-[520px] overflow-hidden rounded-xl border bg-[var(--bg-base)] outline-none cursor-grab active:cursor-grabbing transition-colors ${focused ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-[var(--border-subtle)]'}`}
      >
        <svg ref={svgRef} className="w-full h-full block select-none" style={{ touchAction: 'none' }}>
          <g ref={zoomLayerRef}>
            <g transform={`translate(${PAD},${PAD})`}>
              {layout.edges.map(edge => {
                const dim = hover != null && hover !== edge.id;
                const active = hover === edge.id;
                return (
                  <g key={edge.id} onMouseEnter={(event) => { setHover(edge.id); showTip(event, edge.title, edge.tip); }} onMouseMove={(event) => showTip(event, edge.title, edge.tip)} onMouseLeave={() => { setHover(null); setTip(null); }}>
                    <path d={edge.d} fill="none" stroke="var(--border-base)" strokeWidth={active ? 3 : 1.5} opacity={dim ? 0.12 : 0.7} />
                    <path d={edge.d} fill="none" stroke={edge.color} strokeWidth={active ? 2.5 : 1.5} strokeDasharray="5 7" strokeLinecap="round" opacity={dim ? 0.12 : 0.8} style={reducedMotion ? undefined : { animation: 'baFlow 1.1s linear infinite' }} />
                    <path d={edge.d} fill="none" stroke="transparent" strokeWidth={16} pointerEvents="stroke" className="cursor-pointer" />
                  </g>
                );
              })}

              {layout.ingredients.map((ingredient, index) => {
                const p = layout.ingPos[index];
                const tone = starvationTone(ingredient.starvationHours);
                const rows: Tip['rows'] = [
                  { label: t('liveHq.factoryOnHand', 'On hand'), value: Math.round(ingredient.onHand).toLocaleString() },
                  { label: t('liveHq.factoryDrawDay', 'Draw / day'), value: Math.round(ingredient.perDay).toLocaleString() },
                  { label: t('liveHq.factoryRunway', 'Runway'), value: hoursLabel(ingredient.starvationHours) },
                  { label: t('liveHq.factoryUnitCost', 'Unit cost'), value: `$${ingredient.unitWholesale.toFixed(2)}` }
                ];
                return (
                  <g key={ingredient.rawId} transform={`translate(${p.x},${p.y})`} onMouseEnter={(event) => showTip(event, ingredient.name, rows)} onMouseMove={(event) => showTip(event, ingredient.name, rows)} onMouseLeave={() => setTip(null)} className="cursor-default">
                    <rect x={0} y={0} width={ING_W} height={ING_H} rx={10} fill="var(--bg-surface)" stroke={tone} strokeWidth={1.3} />
                    {resolveItemImage(ingredient.rawId) && <image href={resolveItemImage(ingredient.rawId) as string} x={8} y={13} width={18} height={18} />}
                    <text x={32} y={19} fontSize={11} fill="var(--text-main)">{truncate(ingredient.name, 18)}</text>
                    <text x={32} y={34} fontSize={9} fontFamily="ui-monospace, monospace" fill={tone}>{Math.round(ingredient.perDay).toLocaleString()}/day · {hoursLabel(ingredient.starvationHours)}</text>
                  </g>
                );
              })}

              {layout.lines.map((line, index) => {
                const p = layout.linePos[index];
                const color = line.warnings.includes('incomplete-station') || line.warnings.includes('unknown-recipe') ? ROSE : line.staffedShare < 0.999 ? AMBER : EMERALD;
                const r = 14;
                const c = 2 * Math.PI * r;
                const rows: Tip['rows'] = [
                  { label: t('liveHq.factoryLineMachines', 'Machines'), value: String(line.machineCount) },
                  { label: t('liveHq.factoryLineStaffed', 'Staffed'), value: `${Math.round(line.staffedShare * 100)}%` },
                  { label: t('liveHq.factoryMakesPerDay', 'Makes / day'), value: Math.round(line.dailyOutput).toLocaleString() },
                  { label: t('liveHq.factoryUnitCost', 'Unit cost'), value: line.fullyBurdenedUnitCost != null ? `$${line.fullyBurdenedUnitCost.toFixed(2)}` : '-' }
                ];
                const title = line.outputName || t('liveHq.factoryUnknownRecipe', 'Unrecognised recipe');
                return (
                  <g key={line.key} transform={`translate(${p.x},${p.y})`} onMouseEnter={(event) => showTip(event, title, rows)} onMouseMove={(event) => showTip(event, title, rows)} onMouseLeave={() => setTip(null)} className="cursor-default">
                    <rect x={0} y={0} width={LINE_W} height={LINE_H} rx={12} fill="var(--bg-surface)" stroke={color} strokeWidth={1.6} />
                    <g transform={`translate(${LINE_W - 30},${LINE_H / 2})`}>
                      <circle cx={0} cy={0} r={r} fill="none" stroke="var(--bg-base)" strokeWidth={3} />
                      <circle cx={0} cy={0} r={r} fill="none" stroke={staffTone(line.staffedShare)} strokeWidth={3} strokeDasharray={`${c * clamp(line.staffedShare, 0, 1)} ${c}`} strokeLinecap="round" transform="rotate(-90)" />
                      <text x={0} y={0} fontSize={9} textAnchor="middle" dominantBaseline="central" fontFamily="ui-monospace, monospace" fill="var(--text-main)">{Math.round(line.staffedShare * 100)}</text>
                    </g>
                    <text x={14} y={25} fontSize={12} fontWeight={700} fill="var(--text-main)">{truncate(title, 22)}</text>
                    <text x={14} y={42} fontSize={9} fill="var(--text-subtle)">{truncate(workstationLabel(line.workstationType), 24)}</text>
                    <text x={14} y={56} fontSize={9} fontFamily="ui-monospace, monospace" fill="var(--text-subtle)">{'x'}{line.machineCount}</text>
                  </g>
                );
              })}

              {layout.outputs.map((output, index) => {
                const p = layout.outPos[index];
                const row = demand[output.rawId];
                const rows: Tip['rows'] = [
                  { label: t('liveHq.factoryMakesPerDay', 'Makes / day'), value: Math.round(output.perDay).toLocaleString() },
                  { label: t('liveHq.factoryRetailExportDrain', 'Retail + export / day'), value: row ? Math.round(row.disposition).toLocaleString() : '-' },
                  { label: t('liveHq.factoryRunway', 'Runway'), value: row?.runwayDays != null ? `${Math.round(row.runwayDays)}d` : '-' }
                ];
                return (
                  <g key={output.rawId} transform={`translate(${p.x},${p.y})`} onMouseEnter={(event) => showTip(event, output.name, rows)} onMouseMove={(event) => showTip(event, output.name, rows)} onMouseLeave={() => setTip(null)} className="cursor-default">
                    <rect x={0} y={0} width={OUT_W} height={OUT_H} rx={10} fill="var(--bg-surface)" stroke="var(--border-base)" />
                    {resolveItemImage(output.rawId) && <image href={resolveItemImage(output.rawId) as string} x={8} y={13} width={18} height={18} />}
                    <text x={32} y={19} fontSize={11} fill="var(--text-main)">{truncate(output.name, 18)}</text>
                    <text x={32} y={34} fontSize={9} fontFamily="ui-monospace, monospace" fill={EMERALD}>{Math.round(output.perDay).toLocaleString()}/day</text>
                  </g>
                );
              })}
            </g>
          </g>
          <style>{`@keyframes baFlow { to { stroke-dashoffset: -12; } }`}</style>
        </svg>

        {tip && (
          <div className="pointer-events-none absolute z-20 max-w-[260px] rounded-xl border border-slate-700/80 bg-slate-950/95 px-3 py-2 text-xs text-white shadow-2xl backdrop-blur" style={{ left: tip.x + 14, top: tip.y + 14 }}>
            <div className="mb-1 font-semibold">{tip.title}</div>
            {tip.rows.map((row, i) => (
              <div key={`${row.label}-${i}`} className="flex items-center justify-between gap-4">
                <span className="text-slate-300">{row.label}</span>
                <span className="font-mono text-white">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {reducedMotion && (
        <p className="text-[10px] text-[var(--text-subtle)] mt-3 pt-2 border-t border-[var(--border-subtle)] text-center">
          {t('liveHq.factoryFlowReduced', 'Flow animation disabled by your reduced-motion setting.')}
        </p>
      )}
    </div>
  );
}

export default memo(
  FactoryFlowDiagramBase,
  (prev, next) => flowSignature(prev.model) === flowSignature(next.model)
);
