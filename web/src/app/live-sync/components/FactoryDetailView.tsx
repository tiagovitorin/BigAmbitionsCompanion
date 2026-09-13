'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Factory,
  Warehouse,
  ArrowLeft,
  LayoutDashboard,
  Network,
  Workflow,
  Package,
  Store,
  Users,
  DollarSign
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import LiveSection from './LiveSection';
import { ProductionContext, buildProduction, buildChainModel } from '@/lib/productionModel';
import { FactorySite } from '@/lib/production';
import FactoryOverviewSection from './FactoryOverviewSection';
import FactoryFlowDiagram from './FactoryFlowDiagram';
import FactoryLinesSection from './FactoryLinesSection';
import FactoryFeedSection from './FactoryFeedSection';
import FactoryOutputSection from './FactoryOutputSection';
import FactoryStorageSection from './FactoryStorageSection';
import FactoryWorkforceSection from './FactoryWorkforceSection';
import FactoryEconomicsSection from './FactoryEconomicsSection';
import FactoryRosterSection from './FactoryRosterSection';

export default function FactoryDetailView({ site, ctx }: { site: FactorySite; ctx: ProductionContext }) {
  const { t } = useTranslation();
  const { models, demand } = useMemo(() => buildProduction(ctx), [ctx]);
  const model = models.find(entry => entry.site.id === site.id);

  if (!model) return null;

  const chains = buildChainModel(models);
  const sectionProps = { model, demand, ctx, chains };
  const SiteIcon = site.kind === 'warehouse' ? Warehouse : Factory;

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/live-sync?view=production"
          className="flex items-center gap-1.5 font-semibold text-[var(--text-muted)] hover:text-emerald-500 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('liveHq.factoryAll', 'All Factories')}
        </Link>
        <span className="text-[var(--text-subtle)]">/</span>
        <span className="flex items-center gap-1.5 font-semibold text-[var(--text-main)] min-w-0">
          <SiteIcon className={`w-3.5 h-3.5 shrink-0 ${site.kind === 'warehouse' ? 'text-sky-500' : 'text-amber-500'}`} />
          <span className="truncate">{site.name}</span>
        </span>
      </div>

      <LiveSection id="factory-overview" title={t('liveHq.factoryOverview', 'Overview')} icon={LayoutDashboard}>
        <FactoryOverviewSection {...sectionProps} />
      </LiveSection>

      <LiveSection id="factory-flow" title={t('liveHq.factoryFlow', 'Assembly Flow')} icon={Network}>
        <FactoryFlowDiagram {...sectionProps} />
      </LiveSection>

      <LiveSection id="factory-lines" title={t('liveHq.factoryLines', 'Production Lines')} icon={Workflow}>
        <FactoryLinesSection {...sectionProps} />
      </LiveSection>

      <LiveSection id="factory-feed" title={t('liveHq.factoryFeed', 'Feed & Ingredients')} icon={Package}>
        <FactoryFeedSection {...sectionProps} />
      </LiveSection>

      <LiveSection id="factory-output" title={t('liveHq.factoryOutput', 'Output & Demand')} icon={Store}>
        <FactoryOutputSection {...sectionProps} />
      </LiveSection>

      <LiveSection id="factory-storage" title={t('liveHq.factoryStorage', 'Storage & Logistics')} icon={Warehouse}>
        <FactoryStorageSection {...sectionProps} />
      </LiveSection>

      <LiveSection id="factory-workforce" title={t('liveHq.factoryWorkforce', 'Workforce')} icon={Users}>
        <FactoryWorkforceSection {...sectionProps} />
      </LiveSection>

      <LiveSection id="factory-economics" title={t('liveHq.factoryEconomics', 'Economics & Yield')} icon={DollarSign}>
        <FactoryEconomicsSection {...sectionProps} />
      </LiveSection>

      <LiveSection id="factory-roster" title={t('liveHq.factoryRoster', 'Assigned workers')} icon={Users}>
        <FactoryRosterSection {...sectionProps} />
      </LiveSection>
    </div>
  );
}
