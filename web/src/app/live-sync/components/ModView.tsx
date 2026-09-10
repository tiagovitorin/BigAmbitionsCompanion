'use client';

import { Activity, Download, ExternalLink, Bug } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

export default function ModView({ onReportIssue }: { onReportIssue: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl space-y-5 p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
      <div>
        <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>{t('liveHq.modTitle', 'Big Ambitions Companion (Live HQ Mod)')}</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
          {t('liveHq.modSubtitlePrefix')}<code className="font-mono bg-[var(--bg-base)] px-1 py-0.5 rounded">http://127.0.0.1:8765/</code>{t('liveHq.modSubtitleSuffix')}
        </p>
      </div>

      {/* Dual Download Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-[var(--bg-base)] border-2 border-emerald-500/40 flex flex-col justify-between space-y-3 relative group">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[var(--text-main)]">{t('liveHq.steamWorkshop', 'Steam Workshop')}</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold">
              {t('liveHq.recommendedUpper', 'RECOMMENDED')}
            </span>
          </div>

          <a
            href="https://steamcommunity.com/sharedfiles/filedetails/?id=3793615072"
            target="_blank"
            rel="noreferrer"
            className="relative overflow-hidden w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs shadow-xs group/btn"
          >
            <div className="absolute -right-3 -bottom-5 w-24 h-24 opacity-[0.16] group-hover/btn:opacity-[0.26] group-hover/btn:scale-110 transition-all pointer-events-none text-white">
              <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 14.819C1.94 20.06 6.728 24 12.427 24 19.07 24 24 18.627 24 11.979 24 5.331 18.622 0 11.979 0zM7.54 18.216c-.767-.317-1.132-1.2-.815-1.967.317-.768 1.202-1.133 1.968-.816.767.317 1.133 1.2.816 1.968-.318.767-1.202 1.132-1.969.815zm8.4-9.306c0-1.674 1.362-3.036 3.036-3.036 1.674 0 3.036 1.362 3.036 3.036 0 1.675-1.362 3.037-3.036 3.037-1.674 0-3.036-1.362-3.036-3.037z"/>
              </svg>
            </div>

            <Download className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10 font-bold tracking-wide">{t('liveHq.subscribeSteam', 'Subscribe on Steam')}</span>
            <ExternalLink className="w-3 h-3 opacity-70 ml-0.5 relative z-10" />
          </a>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col justify-between space-y-3 group">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[var(--text-main)]">{t('liveHq.standaloneMelonLoader', 'Standalone (MelonLoader)')}</span>
          </div>

          <a
            href="https://github.com/tiagovitorin/BigAmbitionsCompanion/releases/tag/v2.2.1"
            target="_blank"
            rel="noreferrer"
            className="relative overflow-hidden w-full py-3 px-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs group/btn"
          >
            <div className="absolute -right-3 -bottom-5 w-24 h-24 opacity-[0.09] dark:opacity-[0.14] group-hover/btn:opacity-[0.20] group-hover/btn:scale-110 transition-all pointer-events-none text-current">
              <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
            </div>

            <Download className="w-3.5 h-3.5 text-[var(--text-muted)] relative z-10" />
            <span className="relative z-10 font-bold tracking-wide">{t('liveHq.downloadOnGithub', 'Download on GitHub')}</span>
            <ExternalLink className="w-3 h-3 opacity-60 ml-0.5 relative z-10" />
          </a>
        </div>
      </div>

      {/* Bug / Issue Reporting Callout */}
      <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
            <Bug className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('liveHq.bugCalloutTitle', 'Encountered a bug, crash, or sync error?')}</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            {t('liveHq.bugCalloutDesc', 'Submit an in-app report with your telemetry logs and save file.')}
          </p>
        </div>
        <button
          onClick={onReportIssue}
          className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30 transition-colors shrink-0 cursor-pointer"
        >
          {t('liveHq.reportAnIssue', 'Report an Issue')}
        </button>
      </div>
    </div>
  );
}
