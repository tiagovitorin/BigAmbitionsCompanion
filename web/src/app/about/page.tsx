'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import {
  Database,
  Layers,
  Cpu,
  Binary,
  Box,
  FolderTree,
  Calculator,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

const STATS = [
  { n: '690', key: 'items' },
  { n: '44', key: 'businesses' },
  { n: '885', key: 'buildings' },
  { n: '62', key: 'recipes' },
  { n: '20', key: 'vehicles' }
];

const PROV = [
  { icon: Cpu, titleKey: 'about.prov1Title', title: 'Read the game', descKey: 'about.prov1Desc', desc: 'Big Ambitions ships managed C# assemblies. We read the real data classes and logic from them, so prices, schedules and formulas are the game\'s own.', tag: 'Managed C# assemblies' },
  { icon: Binary, titleKey: 'about.prov2Title', title: 'Normalize it', descKey: 'about.prov2Desc', desc: 'A Python pipeline resolves localization, cross-references every entity and computes the economic metrics, then writes JSON and a SQLite build.', tag: 'scripts/normalize.py' },
  { icon: Box, titleKey: 'about.prov3Title', title: 'Bundle it', descKey: 'about.prov3Desc', desc: 'The normalized JSON ships as static data with the site, loading instantly with no runtime fetch. The optional mod layers your own save on top.', tag: 'web/src/data' }
];

const DATASETS = [
  { n: '690', name: 'Items & goods', dot: 'bg-[var(--emerald-accent)]', includes: 'Wholesale cost, market price, storage volume, category, sales rank' },
  { n: '44', name: 'Business types', dot: 'bg-[var(--amber-accent)]', includes: 'Hourly customer traffic, equipment needs, opening hours, stock demands' },
  { n: '885', name: 'Buildings & parcels', dot: 'bg-[var(--sky-accent)]', includes: 'Address, footprint, district, daily rent, price, capacity, parking' },
  { n: '62', name: 'Factory recipes', dot: 'bg-[var(--indigo-accent)]', includes: 'Ingredients, machines, batch output, skill scaling' },
  { n: '20', name: 'Vehicles', dot: 'bg-[var(--sky-accent)]', includes: 'Cargo capacity, speed, price, dealerships, licence needs' },
  { n: '8', name: 'Neighbourhoods', dot: 'bg-[var(--emerald-accent)]', includes: 'Social-class mix, price index, real-estate multiplier' }
];

const FORMULAS = [
  { id: 'pricing', titleKey: 'about.formulaPricing', title: 'Retail price', noteKey: 'about.formulaPricingNote', note: 'The neighbourhood social-class mix sets a price index, then a monopoly bonus is added.', link: '/pricing', linkKey: 'about.explorePricing', linkLabel: 'Open the pricing tool', code: 'priceIndex = (1.20*W + 1.40*M + 1.70*U) / (W + M + U)\noptimal    = basePrice * (priceIndex + monopolyBonus)   // +0.30 if you are the only seller\nceiling    = min(basePrice, lowestRival) * (priceIndex + demandBonus)' },
  { id: 'marketing', titleKey: 'about.formulaMarketing', title: 'Marketing reach', noteKey: 'about.formulaMarketingNote', note: 'How much of the building a campaign network covers, as a share of its square metres.', link: '/marketing', linkKey: 'about.exploreMarketing', linkLabel: 'Open the marketing planner', code: 'reach% = min(100, campaignSqm * reachMultiplier / buildingSqm * 100)' },
  { id: 'factory', titleKey: 'about.formulaFactory', title: 'Factory output', noteKey: 'about.formulaFactoryNote', note: 'Worker skill scales the batch, from half output to full output.', link: '/factories', linkKey: 'about.exploreFactory', linkLabel: 'Open the factory optimizer', code: 'unitsPerBatch = baseAmount * (0.5 + skill / 200)' }
];

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-5xl space-y-12 pb-16">
      {/* Header */}
      <div className="space-y-4 pb-6 border-b border-[var(--border-base)]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--sky-bg)] text-[var(--sky-accent)] border border-[var(--sky-border)] text-xs font-semibold">
          <Database className="w-3.5 h-3.5" />
          <span>{t('about.badge', 'Data Provenance')}</span>
        </div>
        <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">
          {t('about.title', 'Where the data comes from')}
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-3xl leading-relaxed">
          {t('about.subtitle', 'Nothing here is crowdsourced, estimated, or copied from a wiki. The compendium is read from the game\'s own files, and the live numbers come straight from your running save.')}
        </p>

        <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] flex flex-col sm:flex-row overflow-hidden">
          {STATS.map((s, i) => (
            <div key={s.key} className={`flex-1 p-4 ${i > 0 ? 'border-t sm:border-t-0 sm:border-l border-[var(--border-subtle)]' : ''}`}>
              <div className="text-2xl font-bold font-mono text-[var(--text-main)]">{s.n}</div>
              <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">{t(`about.stats.${s.key}`, s.key)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Provenance */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-[var(--emerald-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">{t('about.provenanceTitle', 'From the game to the app')}</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {t('about.provenanceIntro', 'Three steps turn the game\'s raw records into the typed data this site runs on.')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 rounded-3xl border border-[var(--border-base)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
            {PROV.map((p, i) => (
              <div key={p.titleKey} className={`p-6 space-y-3 ${i > 0 ? 'border-t md:border-t-0 md:border-l border-dashed border-[var(--border-base)]' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-center">
                    <p.icon className="w-4 h-4 text-[var(--emerald-accent)]" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--text-subtle)]">0{i + 1}</span>
                </div>
                <h3 className="text-sm font-bold text-[var(--text-main)]">{t(p.titleKey, p.title)}</h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t(p.descKey, p.desc)}</p>
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-subtle)]">{p.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Datasets */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <FolderTree className="w-5 h-5 text-[var(--sky-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">{t('about.datasetsTitle', 'What the compendium holds')}</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {t('about.datasetsIntro', 'Every dataset, how many records it carries, and what is in it.')}
          </p>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-base)] text-[var(--text-muted)] font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">{t('about.table.dataset', 'Dataset')}</th>
                  <th className="py-3 px-4 text-right">{t('about.table.records', 'Records')}</th>
                  <th className="py-3 px-4">{t('about.table.includes', 'What it includes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--text-main)]">
                {DATASETS.map(d => (
                  <tr key={d.name} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-3 px-4 font-bold">
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${d.dot}`} />
                        {d.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-right">{d.n}</td>
                    <td className="py-3 px-4 text-[var(--text-muted)]">{d.includes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Formulas */}
      <div className="space-y-6">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-[var(--amber-accent)]" />
          <h2 className="text-lg font-bold text-[var(--text-main)]">{t('about.formulasTitle', 'The maths behind the tools')}</h2>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            {t('about.formulasIntro', 'The calculators use the game\'s own equations, mirrored from the assemblies. Three examples:')}
          </p>

          <div className="rounded-3xl border border-[var(--border-base)] bg-[var(--bg-base)] overflow-hidden shadow-xs">
            {FORMULAS.map((f, i) => (
              <div key={f.id} className={`p-5 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 items-start ${i > 0 ? 'border-t border-[var(--border-base)]' : ''}`}>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-[var(--text-main)]">{t(f.titleKey, f.title)}</h3>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{t(f.noteKey, f.note)}</p>
                  <Link href={f.link} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--sky-accent)] hover:underline">
                    {t(f.linkKey, f.linkLabel)}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <pre className="font-mono text-[11px] leading-relaxed text-[var(--text-main)] bg-[var(--bg-surface)] rounded-xl border border-[var(--border-subtle)] p-3.5 overflow-x-auto m-0">{f.code}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust */}
      <div className="p-6 rounded-2xl bg-[var(--emerald-bg)] border border-[var(--emerald-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[var(--emerald-accent)] shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-[var(--text-main)]">{t('about.trustTitle', 'No crowdsourcing. No estimates. No cloud.')}</div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-0.5">{t('about.trustDesc', 'Figures are read from the game files or from your own save. Where the game records nothing, the app says so instead of guessing.')}</p>
          </div>
        </div>
        <Link href="/live-architecture" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--emerald-accent)] hover:underline shrink-0">
          {t('about.trustLink', 'How live sync works')}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
