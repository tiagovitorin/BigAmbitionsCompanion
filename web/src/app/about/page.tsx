'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Database, 
  Layers, 
  Binary, 
  ShieldCheck, 
  FolderTree,
  Cpu,
  ArrowRight,
  Radio,
  Monitor,
  Activity,
  Users,
  TrendingUp,
  Factory,
  BadgePercent
} from 'lucide-react';

const STATS = [
  { n: '690', label: 'Items & Products', colorClass: 'text-[var(--emerald-accent)]' },
  { n: '44',  label: 'Business Types',   colorClass: 'text-[var(--amber-accent)]' },
  { n: '885', label: 'Real Estate Parcels', colorClass: 'text-[var(--sky-accent)]' },
  { n: '62',  label: 'Factory Recipes',  colorClass: 'text-[var(--indigo-accent)]' },
];

export default function AboutPage() {
  return (
    <div className="w-full max-w-5xl space-y-12 pb-16">
      {/* Header */}
      <div className="space-y-4 pb-6 border-b border-[var(--border-base)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--sky-bg)] text-[var(--sky-accent)] border border-[var(--sky-border)] text-xs font-semibold">
          <Database className="w-3.5 h-3.5" />
          <span>Technical Architecture &amp; Methodology</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">
          How the Data Was Extracted
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-3xl leading-relaxed">
          Big Ambitions Companion does not rely on crowdsourced estimates, guesswork, or third-party wikis. Every pricing formula, customer preference curve, item dimension, and building coordinate is parsed directly from the official Unity game client binaries.
        </p>

        {/* Dataset Quick-Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
          {STATS.map((s) => (
            <div key={s.label} className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
              <div className={`text-2xl sm:text-3xl font-bold font-mono ${s.colorClass}`}>
                {s.n}
              </div>
              <div className="text-xs text-[var(--text-subtle)] mt-1 font-medium">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4-Step Extraction Pipeline (Vertical Timeline with Styled Connecting Spine) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-[var(--emerald-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">1. The 4-Stage Extraction Pipeline</h2>
        </div>

        <div className="relative space-y-6 before:absolute before:left-4 sm:before:left-5 before:top-5 before:bottom-5 before:w-0.5 before:bg-[var(--border-base)]">
          {/* Stage 1 */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Step Node Icon + Number Badge */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--emerald-bg)] border-2 border-[var(--emerald-accent)] flex flex-col items-center justify-center text-[var(--emerald-accent)] shadow-xs shrink-0 z-10 mt-1 sm:mt-0.5">
              <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1 p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Assembly Disassembly &amp; Reverse Engineering
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-subtle)] border border-[var(--border-subtle)]">
                  IL2CPP / C# Reflection
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Big Ambitions runs on Unity Engine using C# assemblies (<code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-main)] border border-[var(--border-subtle)]">Assembly-CSharp.dll</code> and <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-main)] border border-[var(--border-subtle)]">BigAmbitions.Core.dll</code>). Using ILSpy and runtime reflection, the core business engine, employee scheduling rules, and customer simulation logic were extracted to inspect exact algorithmic calculations rather than approximations.
              </p>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Step Node Icon + Number Badge */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--sky-bg)] border-2 border-[var(--sky-accent)] flex flex-col items-center justify-center text-[var(--sky-accent)] shadow-xs shrink-0 z-10 mt-1 sm:mt-0.5">
              <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1 p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  ScriptableObject Binary Deserialization
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-subtle)] border border-[var(--border-subtle)]">
                  AssetStudio / Schema Parser
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                All items, building footprints, and supplier catalogs are stored as Unity <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-main)] border border-[var(--border-subtle)]">ScriptableObject</code> binary records. These were parsed into structured, type-safe JSON schemas covering all 690 items, 44 business types, 885 real estate parcels, and 62 factory recipes.
              </p>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Step Node Icon + Number Badge */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--amber-bg)] border-2 border-[var(--amber-accent)] flex flex-col items-center justify-center text-[var(--amber-accent)] shadow-xs shrink-0 z-10 mt-1 sm:mt-0.5">
              <Binary className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1 p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Economic Modeling &amp; District Benchmarks
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-subtle)] border border-[var(--border-subtle)]">
                  Mathematical Validation
                </span>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                Customer price tolerance in Big Ambitions is driven by district demographics and purchasing power distributions. The Companion models these thresholds using baseline wholesale costs, district purchasing power exponents, and experimentally verified price ceiling margins.
              </p>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Step Node Icon + Number Badge */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--indigo-bg)] border-2 border-[var(--indigo-accent)] flex flex-col items-center justify-center text-[var(--indigo-accent)] shadow-xs shrink-0 z-10 mt-1 sm:mt-0.5">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex-1 p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-[var(--text-main)]">
                  Real-Time Telemetry Bridge
                </h3>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-subtle)] border border-[var(--border-subtle)]">
                  Localhost Loopback (Port 8765)
                </span>
              </div>
              
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                The Live HQ mod embeds a lightweight HTTP server on <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-main)] border border-[var(--border-subtle)]">127.0.0.1:8765</code>. Every half-second, it reads the active in-memory <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-main)] border border-[var(--border-subtle)]">SaveGameManager.Current</code> state and streams your financials, shift schedules, and warehouses locally with zero cloud transmission.
              </p>

              {/* 3-Node Visual Telemetry Architecture Diagram */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider mb-2.5">
                  Localhost Loopback Dataflow (Zero External Requests)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                  <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                      <Activity className="w-3.5 h-3.5 text-[var(--emerald-accent)]" />
                      <span>Unity Process</span>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-subtle)]">BigAmbitions.exe</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--indigo-border)] text-center space-y-1 relative">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--indigo-accent)]">
                      <Radio className="w-3.5 h-3.5" />
                      <span>HQ Mod Micro-Server</span>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--indigo-accent)] font-semibold">127.0.0.1:8765</div>
                  </div>

                  <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--text-main)]">
                      <Monitor className="w-3.5 h-3.5 text-[var(--sky-accent)]" />
                      <span>Browser Client</span>
                    </div>
                    <div className="text-[10px] font-mono text-[var(--text-subtle)]">localhost:3000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown: Database Contents & Verification */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <FolderTree className="w-5 h-5 text-[var(--sky-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">2. Verified Datasets &amp; Quantities</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-base)] bg-[var(--bg-base)] text-[var(--text-muted)] font-mono">
                <th className="py-3 px-4">Dataset</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4">Source Unity Class / Namespace</th>
                <th className="py-3 px-4">Key Extracted Attributes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-main)]">
              <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--emerald-accent)]" />
                  <span>Items &amp; Goods</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold">690</td>
                <td className="py-3 px-4 font-mono text-[var(--text-muted)] text-[11px]">ItemData, ItemConfig</td>
                <td className="py-3 px-4 text-[var(--text-muted)]">Wholesale cost, base price, storage volume (m³), category, sales volume rank</td>
              </tr>
              <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--amber-accent)]" />
                  <span>Business Types</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold">44</td>
                <td className="py-3 px-4 font-mono text-[var(--text-muted)] text-[11px]">BusinessTypeData, HourlyTrafficProfile</td>
                <td className="py-3 px-4 text-[var(--text-muted)]">24-hour customer traffic curves, required equipment, opening window presets, inventory demands</td>
              </tr>
              <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--sky-accent)]" />
                  <span>Real Estate Parcels</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold">885</td>
                <td className="py-3 px-4 font-mono text-[var(--text-muted)] text-[11px]">BuildingData, NeighborhoodEconomics</td>
                <td className="py-3 px-4 text-[var(--text-muted)]">Building codes, district multipliers, rent per day, purchase price, square meters, customer capacity</td>
              </tr>
              <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--indigo-accent)]" />
                  <span>Factory Recipes</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold">62</td>
                <td className="py-3 px-4 font-mono text-[var(--text-muted)] text-[11px]">FactoryRecipeData, ProductionMachine</td>
                <td className="py-3 px-4 text-[var(--text-muted)]">BOM ingredients, machine requirements, production batch times, worker skill multipliers</td>
              </tr>
              <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="py-3 px-4 font-bold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--sky-accent)]" />
                  <span>Vehicle Fleet</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold">20</td>
                <td className="py-3 px-4 font-mono text-[var(--text-muted)] text-[11px]">VehicleConfig, DealershipData</td>
                <td className="py-3 px-4 text-[var(--text-muted)]">Cargo capacity (boxes), top speed, dealership locations, fuel economy, MSRP</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Core Simulation Engine & Verified Game Mechanics */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Binary className="w-5 h-5 text-[var(--amber-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">3. Core Simulation Engine &amp; Verified Formulas</h2>
        </div>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          The planning calculators throughout the companion implement mathematical models calibrated against game metrics and binary data records. Below are the equations driving each domain:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Formula 1: Dynamic Pricing & Satisfaction */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[var(--amber-accent)]">
                <BadgePercent className="w-4 h-4" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">1. Pricing &amp; Satisfaction</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Calculates maximum profitable retail ceiling before customer elasticity causes refusal to purchase.
              </p>
              
              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] font-mono text-[11px] leading-relaxed space-y-1.5 overflow-x-auto">
                <div className="text-[var(--text-subtle)]">// Optimal Price Cap</div>
                <div>
                  <span className="text-[var(--sky-accent)]">OptimalPrice</span>{' '}
                  <span className="text-[var(--text-muted)]">=</span>{' '}
                  <span className="text-[var(--emerald-accent)]">Base</span>{' '}
                  <span className="text-[var(--amber-accent)]">×</span> (1.0 + (
                  <span className="text-[var(--amber-accent)]">DistrictIndex</span>{' '}
                  <span className="text-[var(--amber-accent)]">×</span>{' '}
                  <span className="text-[var(--indigo-accent)]">Monopoly</span>))
                </div>
                <div className="text-[var(--text-subtle)] pt-1">// Satisfaction Score</div>
                <div>
                  <span className="text-[var(--emerald-accent)]">Satisfaction</span>{' '}
                  <span className="text-[var(--text-muted)]">=</span>{' '}
                  <span className="text-[var(--indigo-accent)]">Clamp</span>(100 - (ΔPrice / Optimal{' '}
                  <span className="text-[var(--amber-accent)]">×</span> Sensitivity), 0, 100)
                </div>
              </div>
            </div>

            <Link 
              href="/pricing" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sky-accent)] hover:underline pt-1"
            >
              <span>Explore Dynamic Pricing Tool</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Formula 2: Foot Traffic, Marketing & Customer Throughput */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[var(--sky-accent)]">
                <TrendingUp className="w-4 h-4" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">2. Foot Traffic &amp; Demand</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Determines hourly customer footfall based on street traffic index, marketing campaigns, and building capacity.
              </p>
              
              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] font-mono text-[11px] leading-relaxed space-y-1.5 overflow-x-auto">
                <div className="text-[var(--text-subtle)]">// Hourly Inflow Demand</div>
                <div>
                  <span className="text-[var(--sky-accent)]">HourlyDemand</span>{' '}
                  <span className="text-[var(--text-muted)]">=</span>{' '}
                  <span className="text-[var(--emerald-accent)]">StreetTraffic(h)</span>{' '}
                  <span className="text-[var(--amber-accent)]">×</span>{' '}
                  <span className="text-[var(--sky-accent)]">MarketingMultiplier</span>
                </div>
                <div className="text-[var(--text-subtle)] pt-1">// Customer Conversion Cap</div>
                <div>
                  <span className="text-[var(--emerald-accent)]">ServedCustomers</span>{' '}
                  <span className="text-[var(--text-muted)]">=</span>{' '}
                  <span className="text-[var(--indigo-accent)]">Min</span>(Demand, CheckoutSpeed{' '}
                  <span className="text-[var(--amber-accent)]">×</span> CustomerCapacity)
                </div>
              </div>
            </div>

            <Link 
              href="/marketing" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sky-accent)] hover:underline pt-1"
            >
              <span>Explore Marketing Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Formula 3: Factory Production & Labor Multipliers */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-[var(--indigo-accent)]">
                <Factory className="w-4 h-4" />
                <h3 className="text-sm font-bold text-[var(--text-main)]">3. Factory Batch Yield</h3>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Calculates production cycle duration, component consumption rates, and worker skill batch scaling.
              </p>
              
              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] font-mono text-[11px] leading-relaxed space-y-1.5 overflow-x-auto">
                <div className="text-[var(--text-subtle)]">// Skilled Batch Cycle Time</div>
                <div>
                  <span className="text-[var(--sky-accent)]">CycleDuration</span>{' '}
                  <span className="text-[var(--text-muted)]">=</span>{' '}
                  <span className="text-[var(--emerald-accent)]">BaseTime</span>{' '}
                  <span className="text-[var(--text-muted)]">/</span> (1.0 + (
                  <span className="text-[var(--amber-accent)]">WorkerSkill%</span>{' '}
                  <span className="text-[var(--amber-accent)]">×</span> 0.5))
                </div>
                <div className="text-[var(--text-subtle)] pt-1">// Gross Profit Margin</div>
                <div>
                  <span className="text-[var(--emerald-accent)]">ProfitPerBatch</span>{' '}
                  <span className="text-[var(--text-muted)]">=</span> (BatchOutput{' '}
                  <span className="text-[var(--amber-accent)]">×</span> UnitRetail) - RawMaterialCost
                </div>
              </div>
            </div>

            <Link 
              href="/factories" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--sky-accent)] hover:underline pt-1"
            >
              <span>Explore Factory Optimizer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Privacy & Zero-Cloud Promise */}
      <div className="p-6 rounded-2xl bg-[var(--emerald-bg)] border border-[var(--emerald-border)] space-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[var(--emerald-accent)]" />
          <h3 className="text-base font-bold text-[var(--text-main)]">Privacy &amp; Local Architecture</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] leading-relaxed">
          Big Ambitions Companion is an offline-first tool. Telemetry synchronization happens entirely on your local machine via HTTP loopback (<code className="font-mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--emerald-border)]">127.0.0.1:8765</code>). No save files, company names, or gameplay metrics are sent to any remote server or external database.
        </p>
      </div>
    </div>
  );
}
