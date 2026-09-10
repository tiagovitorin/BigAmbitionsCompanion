'use client';

import { Wifi, RotateCw, Sparkles, AlertCircle, Bug, Download, ExternalLink } from 'lucide-react';
import { LiveDiagnosticLog } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

interface OfflineGatewayProps {
  handshakeActive: boolean;
  onCancelHandshake: () => void;
  diagnosticLogs: LiveDiagnosticLog[];
  isCityLoaded: boolean;
  lastLatencyMs: number | null;
  isLinkAllowed: boolean;
  permissionError: string | null;
  onEnableDemo: () => void;
  onReportIssue: () => void;
  onCheckConnection: () => void;
}

export default function OfflineGateway({
  handshakeActive,
  onCancelHandshake,
  diagnosticLogs,
  isCityLoaded,
  lastLatencyMs,
  isLinkAllowed,
  permissionError,
  onEnableDemo,
  onReportIssue,
  onCheckConnection
}: OfflineGatewayProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto py-2 space-y-4">
      {handshakeActive ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-[var(--border-base)] pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Wifi className={`w-4 h-4 ${!isCityLoaded ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-mono">
                  {t('liveHq.bridgeDiagnostics')}
                </h2>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                  {t('liveHq.targetEndpoint')} <code className="font-mono text-[var(--text-main)]">http://127.0.0.1:8765/</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastLatencyMs !== null && (
                <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-base)] px-2 py-0.5 rounded-md border border-[var(--border-base)]">
                  {lastLatencyMs}ms
                </span>
              )}
              <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                isCityLoaded
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse'
              }`}>
                {isCityLoaded ? t('liveHq.statusOnline') : t('liveHq.statusProbing')}
              </span>
            </div>
          </div>

          <div className="font-mono text-xs bg-[var(--bg-base)] p-3.5 rounded-2xl border border-[var(--border-base)] max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin">
            {diagnosticLogs.map((log) => {
              const tagColor =
                log.tag === 'HTTP' ? 'text-sky-500' :
                log.tag === 'MOD' ? 'text-purple-500' :
                log.tag === 'SAVE' ? 'text-emerald-500' :
                log.tag === 'DATA' ? 'text-indigo-500' :
                log.tag === 'NET' ? 'text-rose-500' : 'text-slate-400';

              const levelColor =
                log.level === 'error' ? 'text-rose-500 font-bold' :
                log.level === 'warn' ? 'text-amber-500' :
                log.level === 'success' ? 'text-emerald-500 font-medium' : 'text-[var(--text-muted)]';

              return (
                <div key={log.id} className="flex items-start gap-2 text-[11px] leading-tight">
                  <span className="text-[var(--text-subtle)] shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={`font-bold shrink-0 ${tagColor}`}>[{log.tag}]</span>
                  <span className={`${levelColor} break-all flex-1`}>{log.message}</span>
                </div>
              );
            })}

            {!isCityLoaded && (
              <div className="text-[11px] text-emerald-500/80 animate-pulse pt-1 flex items-center gap-2">
                <RotateCw className="w-3 h-3 animate-spin text-emerald-500" />
                <span>{t('liveHq.listeningForState')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
            <span className="truncate">
              {isCityLoaded ? `✓ ${t('liveHq.allOperational')}` : t('liveHq.waitingForGameSession')}
            </span>
            <button
              onClick={onCancelHandshake}
              className="text-[10px] text-[var(--text-subtle)] hover:text-[var(--text-main)] underline shrink-0 cursor-pointer ml-2"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[var(--bg-surface)] to-amber-500/5 border border-amber-500/30 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[var(--text-main)]">{t('liveHq.wantToTest')}</h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {t('liveHq.demoExploreDesc')}
                </p>
              </div>
            </div>
            <button
              onClick={onEnableDemo}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('liveHq.previewDemo')}</span>
            </button>
          </div>

          {!isLinkAllowed && permissionError && (
            <div className="p-4 rounded-2xl bg-rose-500/8 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">{t('liveHq.browserPermissionRequired')}</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {t('liveHq.chromeBlockedBefore')} <code className="font-mono text-rose-500 text-[10px]">http://127.0.0.1:8765</code>{t('liveHq.chromeBlockedAfter')}
              </p>
              <div className="text-[11px] font-semibold text-[var(--text-main)]">{t('liveHq.allowInChrome')}</div>
              <ol className="text-[11px] text-[var(--text-muted)] space-y-1 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-rose-500 shrink-0">1.</span>
                  <span>{t('liveHq.clickThe')} <strong>{t('liveHq.tuneSlidersIcon')}</strong> {t('liveHq.chromeErrStep1After')}</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="font-bold text-rose-500 shrink-0">2.</span>
                  <span>{t('liveHq.toggleWord')} <strong>&ldquo;{t('liveHq.appsOnDevice')}&rdquo;</strong> {t('liveHq.toggleToOn')} <strong>{t('liveHq.onWord')}</strong>{t('liveHq.toggleThenClick')} <strong>{t('liveHq.checkConnectionWord')}</strong> {t('liveHq.stepAgain')}</span>
                </li>
              </ol>
              <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.stillTrouble')}</span>
                <button
                  onClick={onReportIssue}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Bug className="w-3 h-3" />
                  <span>{t('liveHq.reportConnectionIssue')}</span>
                </button>
              </div>
            </div>
          )}

          {!permissionError && diagnosticLogs.some(l => l.tag === 'SAVE' && l.message.includes('No active save')) && (
            <div className="p-4 rounded-2xl bg-sky-500/8 border border-sky-500/30 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-500 flex items-center justify-center shrink-0 mt-0.5">
                <Wifi className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-bold text-sky-600 dark:text-sky-400">{t('liveHq.modConnectedLoadSave')}</div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t('liveHq.modConnectedDesc')}
                </p>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-5">
            <div className="flex items-center gap-4 pb-4 border-b border-[var(--border-base)]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                <Wifi className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--text-main)]">{t('liveHq.connectGameTitle')}</h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('liveHq.connectGameDesc')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[10px] flex items-center justify-center">1</span>
                  <span className="text-xs font-bold text-[var(--text-main)]">{t('liveHq.chooseModInstall')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--bg-base)] border-2 border-emerald-500/40 hover:border-emerald-500 transition-colors flex flex-col justify-between space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-main)]">{t('liveHq.steamWorkshop')}</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                      {t('liveHq.recommendedBadge')}
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

                <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-[var(--border-strong)] transition-colors flex flex-col justify-between space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-main)]">{t('liveHq.standaloneMelonLoader')}</span>
                  </div>

                  <a
                    href="/downloads/AmbitionProSync-Mod.zip"
                    download="AmbitionProSync-Mod.zip"
                    className="relative overflow-hidden w-full py-3 px-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs group/btn"
                  >
                    <div className="absolute -right-3 -bottom-5 w-24 h-24 opacity-[0.09] dark:opacity-[0.14] group-hover/btn:opacity-[0.20] group-hover/btn:scale-110 transition-all pointer-events-none text-current">
                      <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                    </div>

                    <Download className="w-3.5 h-3.5 text-[var(--text-muted)] relative z-10" />
                    <span className="relative z-10 font-bold tracking-wide">{t('liveHq.downloadMelonLoader', 'Download MelonLoader Zip')}</span>
                    <ExternalLink className="w-3 h-3 opacity-60 ml-0.5 relative z-10" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-mono font-bold text-[10px] flex items-center justify-center">2</span>
                <span className="text-xs font-bold text-[var(--text-main)]">{t('liveHq.launchAndConnect')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px]">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span>{t('liveHq.broadcastEndpoint')} <code className="font-mono text-[var(--text-main)]">http://127.0.0.1:8765/</code></span>
                </div>
                <button
                  onClick={onCheckConnection}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${handshakeActive ? 'animate-spin' : ''}`} />
                  <span>{t('liveHq.checkConnection')}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs space-y-3">
              <div className="font-bold flex items-center justify-between text-[var(--text-main)] text-xs">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{t('liveHq.browserPermissionTitle')}</span>
                </div>
                <span className="text-[10px] text-[var(--text-subtle)] font-normal">{t('liveHq.browsersList')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="font-bold text-[var(--text-main)] flex items-center gap-1">
                    <span>{t('liveHq.chromeBraveEdge')}</span>
                  </div>
                  <ol className="text-[11px] text-[var(--text-muted)] leading-relaxed space-y-1 pl-0.5">
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[var(--text-main)] shrink-0">1.</span>
                      <span>{t('liveHq.clickThe')} <strong>{t('liveHq.tuneSlidersIcon')}</strong> {t('liveHq.chromeStep1After')}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[var(--text-main)] shrink-0">2.</span>
                      <span>{t('liveHq.toggleWord')} <strong>&ldquo;{t('liveHq.appsOnDevice')}&rdquo;</strong> {t('liveHq.toggleToOn')} <strong>{t('liveHq.onWord')}</strong>{t('liveHq.stepEndPeriod')}</span>
                    </li>
                  </ol>
                </div>

                <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                  <div className="font-bold text-[var(--text-main)] flex items-center gap-1">
                    <span>{t('liveHq.mozillaFirefox')}</span>
                  </div>
                  <ol className="text-[11px] text-[var(--text-muted)] leading-relaxed space-y-1 pl-0.5">
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[var(--text-main)] shrink-0">1.</span>
                      <span>{t('liveHq.clickThe')} <strong>{t('liveHq.shieldPadlockIcon')}</strong> {t('liveHq.firefoxStep1After')}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-[var(--text-main)] shrink-0">2.</span>
                      <span>{t('liveHq.turnWord')} <strong>&ldquo;{t('liveHq.enhancedTrackingProtection')}&rdquo;</strong> <strong>{t('liveHq.offWord')}</strong> {t('liveHq.firefoxStep2After')}</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
