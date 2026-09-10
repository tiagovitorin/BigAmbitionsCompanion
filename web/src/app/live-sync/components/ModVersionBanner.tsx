'use client';

import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';
import { EXPECTED_MOD_VERSION } from '@/context/LiveSyncContext';

export default function ModVersionBanner({ modVersion }: { modVersion: string }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 font-bold text-sm">
          ⚠️
        </div>
        <div>
          <div className="font-bold text-amber-600 dark:text-amber-400">
            {t('liveHq.modVersionMismatch', 'Mod Version Mismatch Detected (Running v{current} → Web expects v{expected})').replace('{current}', modVersion).replace('{expected}', EXPECTED_MOD_VERSION)}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {t('liveHq.modVersionMismatchDescPrefix')}<code className="font-mono text-amber-600 dark:text-amber-400 font-semibold">AmbitionProSync.dll</code>{t('liveHq.modVersionMismatchDescSuffix')}
          </div>
        </div>
      </div>
      <Link
        href="/live-sync?view=mod"
        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold shrink-0 transition-colors"
      >
        {t('liveHq.downloadDll', 'Download v{version} DLL').replace('{version}', EXPECTED_MOD_VERSION)}
      </Link>
    </div>
  );
}
