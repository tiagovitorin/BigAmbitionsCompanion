'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Radio, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  Activity, 
  Monitor, 
  CheckCircle2, 
  Lock, 
  Download, 
  ArrowRight,
  Database,
  RefreshCw,
  Server,
  FileCode2,
  ExternalLink,
  Terminal,
  KeyRound,
  Hash
} from 'lucide-react';

export default function LiveArchitecturePage() {
  return (
    <div className="w-full max-w-5xl space-y-12 pb-16">
      {/* Header */}
      <div className="space-y-4 pb-6 border-b border-[var(--border-base)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--emerald-bg)] text-[var(--emerald-accent)] border border-[var(--emerald-border)] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Live HQ Bridge Security &amp; Data Pipeline</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">
          How Live Game Synchronization Works
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-3xl leading-relaxed">
          The Live HQ bridge establishes a local, zero-cloud connection between your active Big Ambitions session and this web companion. Here is a complete, transparent breakdown of the protocol, safety guarantees, and synchronized payloads.
        </p>

        {/* Quick Trust Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
              <Radio className="w-4 h-4 text-[var(--emerald-accent)]" />
              <span>100% Offline Loopback</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Broadcasts strictly to <code className="font-mono text-[var(--text-main)]">127.0.0.1:8765</code>. No game metrics or company names leave your machine.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
              <Lock className="w-4 h-4 text-[var(--sky-accent)]" />
              <span>Read-Only Safety</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Only samples properties from the active <code className="font-mono text-[var(--text-main)]">SaveGameManager</code>. The embedded server only serves HTTP GET endpoints (zero write operations exist).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
              <Cpu className="w-4 h-4 text-[var(--amber-accent)]" />
              <span>&lt;0.1% CPU Overhead</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Non-blocking asynchronous serialization every 500ms ensures zero in-game stutter or frame drops.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: The Local Communication Loop (Diagram) */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Radio className="w-5 h-5 text-[var(--emerald-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">1. Localhost Loopback Architecture</h2>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-6">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Unlike web tools that require uploading save files to a third-party server, Big Ambitions Companion utilizes a lightweight in-process micro-server embedded inside the game client via the Steam Workshop native mod or standalone MelonLoader plugin.
          </p>

          {/* Flow Diagram */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-[var(--emerald-bg)] text-[var(--emerald-accent)] border border-[var(--emerald-border)] font-mono font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-[10px] font-mono text-[var(--text-subtle)] uppercase">Process Memory</span>
              </div>
              <h3 className="text-sm font-bold text-[var(--text-main)]">BigAmbitions.exe</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Unity runtime manages active empire state: bank accounts, employee shifts, retail stock, and customer counters.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-[var(--bg-base)] border-2 border-[var(--emerald-accent)] shadow-xs space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-[var(--emerald-bg)] text-[var(--emerald-accent)] border border-[var(--emerald-border)] font-mono font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-[10px] font-mono text-[var(--emerald-accent)] font-bold uppercase">Micro HTTP Server</span>
              </div>
              <h3 className="text-sm font-bold text-[var(--text-main)]">AmbitionProSync.dll</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Every 500ms, the mod serializes in-memory game state into a JSON payload on <code className="font-mono text-[var(--text-main)]">http://127.0.0.1:8765/</code>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-[var(--sky-bg)] text-[var(--sky-accent)] border border-[var(--sky-border)] font-mono font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-[10px] font-mono text-[var(--text-subtle)] uppercase">Local Web Deck</span>
              </div>
              <h3 className="text-sm font-bold text-[var(--text-main)]">Browser Client</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                The webapp queries the local port via loopback and renders live 24h shift matrices, P&amp;L charts, and inventory alerts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Exact Synchronized Data Payloads */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-[var(--sky-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">2. What Data Is Actually Synchronized?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payload 1 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[var(--emerald-accent)]">
              <div className="w-2 h-2 rounded-full bg-[var(--emerald-accent)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">Treasury, Banking &amp; Taxation</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Total liquid cash, bank balance, active bank loans, interest rates, tax deductible expenses, and weekly historical revenue/expense figures.
            </p>
            <div className="font-mono text-[10px] text-[var(--text-subtle)] bg-[var(--bg-base)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
              playerCash, bankBalance, totalLoans, weeklyRevenueHistory, unpaidTaxes
            </div>
          </div>

          {/* Payload 2 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[var(--amber-accent)]">
              <div className="w-2 h-2 rounded-full bg-[var(--amber-accent)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">Workforce &amp; 7x24 Shift Matrix</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Every employee across all businesses: hourly wage, customer service skill, cleaner skill, security skill, assigned shift hours, and workplace satisfaction.
            </p>
            <div className="font-mono text-[10px] text-[var(--text-subtle)] bg-[var(--bg-base)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
              employees[], employeeWeeklyHours, shiftRole, satisfaction, wageHourly
            </div>
          </div>

          {/* Payload 3 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[var(--sky-accent)]">
              <div className="w-2 h-2 rounded-full bg-[var(--sky-accent)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">Warehouses &amp; Supply Chain</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Warehouse storage box counts, daily consumption drain rates, active delivery routes, vehicle fleet status, and days of stock remaining before stockout.
            </p>
            <div className="font-mono text-[10px] text-[var(--text-subtle)] bg-[var(--bg-base)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
              warehouses[], stockBoxCount, dailyDepletionRate, deliveryRoutes[], fleet[]
            </div>
          </div>

          {/* Payload 4 */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-[var(--indigo-accent)]">
              <div className="w-2 h-2 rounded-full bg-[var(--indigo-accent)]" />
              <h3 className="text-sm font-bold text-[var(--text-main)]">Business Operations &amp; Real Estate</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Store customer counters, hourly traffic profiles, product retail prices, interior customer satisfaction ratings, and owned residential/commercial parcels.
            </p>
            <div className="font-mono text-[10px] text-[var(--text-subtle)] bg-[var(--bg-base)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
              businesses[], customerCapacity, retailPrices[], customerSatisfactionPct
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Safety & Game Integrity Commitments */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[var(--emerald-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">3. Safety &amp; Non-Destructive Design</h2>
        </div>

        <div className="p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>Strictly GET-Only HTTP Server</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">
                The embedded server only implements HTTP <code className="font-mono text-[var(--text-main)]">GET</code> and <code className="font-mono text-[var(--text-main)]">OPTIONS</code> handlers. There are no POST, PUT, DELETE, or file-write endpoints anywhere in the mod codebase.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>Zero Save Game Modification</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">
                The mod never writes to disk. If you uninstall the mod or close the browser, your game save remains 100% vanilla and unmodified.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>CORS &amp; Origin Restrictions</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">
                Cross-origin responses are filtered and restricted to the companion web application origin, preventing unauthorized external websites from reading your local port.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>Open-Source Mod Assembly</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">
                The complete C# source code is publicly inspectable on GitHub in{' '}
                <a
                  href="https://github.com/tiagovitorin/BigAmbitionsCompanion/tree/main/mod/AmbitionProSync"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--emerald-accent)] hover:underline font-mono inline-flex items-center gap-0.5 font-semibold"
                >
                  <span>mod/AmbitionProSync</span>
                  <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />
                </a>.
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <h4 className="font-bold text-[var(--text-main)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--emerald-accent)] shrink-0" />
                <span>Official Steam Workshop Distribution</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pl-6">
                Available on the{' '}
                <a
                  href="https://steamcommunity.com/sharedfiles/filedetails/?id=3793615072"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--emerald-accent)] hover:underline font-semibold inline-flex items-center gap-0.5"
                >
                  <span>Big Ambitions Steam Workshop (Item #3793615072)</span>
                  <ExternalLink className="w-3 h-3 inline ml-0.5 opacity-70" />
                </a>
                . Subscribing via Steam allows Big Ambitions to download and manage the mod assembly natively with zero manual file extraction.
              </p>
            </div>
          </div>

          {/* Verify It Yourself Terminal Callout */}
          <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
                <Terminal className="w-4 h-4 text-[var(--sky-accent)]" />
                <span>Verify It Yourself (Local Loopback Proof)</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-subtle)]">Command Prompt / PowerShell</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Run this command in terminal while the game is running to verify that port <code className="font-mono text-[var(--text-main)]">8765</code> is bound exclusively to local loopback (<code className="font-mono text-[var(--text-main)]">127.0.0.1</code> and <code className="font-mono text-[var(--text-main)]">[::1]</code>) and never exposed to the public network:
            </p>
            <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs space-y-1 select-all">
              <div className="text-[var(--text-muted)] select-none">C:\&gt; netstat -an | findstr 8765</div>
              <div className="text-[var(--emerald-accent)]">  TCP    127.0.0.1:8765         0.0.0.0:0              LISTENING</div>
              <div className="text-[var(--emerald-accent)]">  TCP    [::1]:8765             [::]:0                 LISTENING</div>
            </div>
            <p className="text-[10px] text-[var(--text-subtle)]">
              The foreign address <code className="font-mono">0.0.0.0:0</code> indicates listening state, while the local address <code className="font-mono">127.0.0.1</code> and <code className="font-mono">[::1]</code> confirms the port only accepts connections originating from your local machine.
            </p>
          </div>

          {/* Release Version & Binary Hash Verification Strip */}
          <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
              <div className="flex items-center gap-2 font-bold text-[var(--text-main)]">
                <Hash className="w-3.5 h-3.5 text-[var(--emerald-accent)]" />
                <span>Release Binary Integrity &amp; Version Hash</span>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--emerald-bg)] text-[var(--emerald-accent)] border border-[var(--emerald-border)] font-bold">
                v2.2.0 Release Build
              </span>
            </div>
            <div className="space-y-1.5 pt-1 text-[11px] text-[var(--text-muted)] font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-[var(--text-subtle)] font-sans">Steam Native Mod (BigAmbitionsCompanionMod.dll):</span>
                <span className="text-[10px] text-[var(--text-main)] bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-subtle)] select-all truncate max-w-full sm:max-w-md">
                  E761F2FB478411A7AEF49DA6921962224ECF3A861942EA34D6D372A5711F7DC6
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-[var(--text-subtle)] font-sans">MelonLoader Standalone (AmbitionProSync.dll):</span>
                <span className="text-[10px] text-[var(--text-main)] bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border-subtle)] select-all truncate max-w-full sm:max-w-md">
                  56C115036B2001C6EAC5CB24C1FF5FD60F34967190FAE008D18FB354F8295D3E
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[var(--text-muted)]">Ready to synchronize your Big Ambitions session?</span>
            <Link
              href="/live-sync"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--emerald-accent)] hover:opacity-90 text-white font-bold transition-all shadow-xs"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Launch Live HQ Bridge</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
