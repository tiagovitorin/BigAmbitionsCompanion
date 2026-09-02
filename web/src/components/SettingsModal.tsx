'use client';

import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  Check, 
  Radio
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { liveHq, updateLiveHqSettings, resetSettings } = useSettings();
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!isOpen) return null;

  const handleSavedNotify = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  // Reusable custom switch component
  const CustomToggle = ({
    checked,
    onChange,
    ariaLabel,
  }: {
    checked: boolean;
    onChange: (next: boolean) => void;
    ariaLabel: string;
  }) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-base)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-[var(--text-main)]">Live HQ Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Section: Connection & Performance */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
              Connection &amp; Companion Display
            </div>

            {/* Locked Local Bridge Endpoint */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">Local Telemetry Endpoint</label>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Loopback (Locked)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] font-mono text-xs text-[var(--text-muted)] flex items-center justify-between">
                <span className="text-[var(--text-main)] font-semibold">http://127.0.0.1:8765/</span>
                <span className="text-[10px] text-[var(--text-subtle)] font-sans">Strict 127.0.0.1 Binding</span>
              </div>
            </div>

            {/* Sync Frequency 3-Mode Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">Telemetry Sync Mode</label>
                <span className="text-[11px] font-mono text-[var(--text-subtle)]">
                  {liveHq.pollingRateMs <= 600 ? '0.5s cycle' : liveHq.pollingRateMs <= 1800 ? '1.5s cycle' : '3.0s cycle'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Fast', desc: '0.5s • Real-time', rate: 500 },
                  { label: 'Normal', desc: '1.5s • Recommended', rate: 1500 },
                  { label: 'Slow', desc: '3.0s • Eco mode', rate: 3000 }
                ].map((mode) => {
                  const currentRate = liveHq.pollingRateMs || 1500;
                  const isSelected = mode.rate === 1500
                    ? (currentRate > 600 && currentRate < 2500)
                    : mode.rate === 500
                    ? currentRate <= 600
                    : currentRate >= 2500;

                  return (
                    <button
                      key={mode.label}
                      type="button"
                      onClick={() => {
                        updateLiveHqSettings({ pollingRateMs: mode.rate });
                        handleSavedNotify();
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-[var(--text-main)] shadow-xs'
                          : 'bg-[var(--bg-base)] border-[var(--border-base)] hover:border-[var(--border-strong)] text-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'}`}>
                          {mode.label}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        )}
                      </div>
                      <span className="text-[10px] text-[var(--text-subtle)] font-normal">
                        {mode.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Screen Keep Awake */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">Keep Screen Awake</div>
                <p className="text-[11px] text-[var(--text-subtle)]">Prevents monitor sleep when used on a second display.</p>
              </div>
              <CustomToggle
                checked={liveHq.keepScreenAwake}
                onChange={(val) => {
                  updateLiveHqSettings({ keepScreenAwake: val });
                  handleSavedNotify();
                }}
                ariaLabel="Keep Screen Awake"
              />
            </div>

            {/* Auto Pause On Inactive Tab */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">Pause When Tab Inactive</div>
                <p className="text-[11px] text-[var(--text-subtle)]">Saves CPU and network polling when minimized.</p>
              </div>
              <CustomToggle
                checked={liveHq.autoPauseOnTabInactive}
                onChange={(val) => {
                  updateLiveHqSettings({ autoPauseOnTabInactive: val });
                  handleSavedNotify();
                }}
                ariaLabel="Pause When Tab Inactive"
              />
            </div>
          </div>

          {/* Section: Operational Radar & Store Alerts */}
          <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
              Operational Radar &amp; Alerts
            </div>

            {/* Warehouse Low Stock Threshold */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">Low Stock Alert Threshold</label>
                <span className="font-mono font-bold text-[var(--text-main)]">&lt; {liveHq.lowStockThresholdPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={liveHq.lowStockThresholdPct}
                onChange={(e) => {
                  updateLiveHqSettings({ lowStockThresholdPct: Number(e.target.value) });
                  handleSavedNotify();
                }}
                className="w-full accent-indigo-600 h-1.5 bg-[var(--border-base)] rounded-lg cursor-pointer"
              />
            </div>

            {/* Empty Shelf Alerts */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">Empty Shelf Critical Warnings</div>
                <p className="text-[11px] text-[var(--text-subtle)]">Highlight 0-stock products in red on store radar.</p>
              </div>
              <CustomToggle
                checked={liveHq.showZeroStockWarnings}
                onChange={(val) => {
                  updateLiveHqSettings({ showZeroStockWarnings: val });
                  handleSavedNotify();
                }}
                ariaLabel="Empty Shelf Critical Warnings"
              />
            </div>

            {/* Unstaffed Shift Alerts */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">Unattended Open Store Alerts</div>
                <p className="text-[11px] text-[var(--text-subtle)]">Warn if a store is open with no cashiers scheduled.</p>
              </div>
              <CustomToggle
                checked={liveHq.unstaffedShiftAlerts}
                onChange={(val) => {
                  updateLiveHqSettings({ unstaffedShiftAlerts: val });
                  handleSavedNotify();
                }}
                ariaLabel="Unattended Open Store Alerts"
              />
            </div>

            {/* Price Satisfaction Floor Range Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">Pricing Satisfaction Alert Floor</label>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">&lt; {liveHq.priceSatisfactionFloorPct}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={liveHq.priceSatisfactionFloorPct}
                onChange={(e) => {
                  updateLiveHqSettings({ priceSatisfactionFloorPct: Number(e.target.value) });
                  handleSavedNotify();
                }}
                className="w-full accent-amber-500 h-1.5 bg-[var(--border-base)] rounded-lg cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-[var(--text-subtle)] font-mono">
                <span>10% (Permissive)</span>
                <span>80% (Default)</span>
                <span>100% (Strict)</span>
              </div>
            </div>

            {/* Low Employee Happiness */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">Worker Fatigue / Morale Risk Alerts</div>
                <p className="text-[11px] text-[var(--text-subtle)]">Warn when employee happiness drops below 50%.</p>
              </div>
              <CustomToggle
                checked={liveHq.lowEmployeeHappinessAlerts}
                onChange={(val) => {
                  updateLiveHqSettings({ lowEmployeeHappinessAlerts: val });
                  handleSavedNotify();
                }}
                ariaLabel="Worker Fatigue / Morale Risk Alerts"
              />
            </div>

            {/* Tax & Loan Risk Alerts */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">Overnight Liquidity &amp; Tax Warnings</div>
                <p className="text-[11px] text-[var(--text-subtle)]">Alert if midnight taxes exceed 50% of available cash.</p>
              </div>
              <CustomToggle
                checked={liveHq.taxLoanPaymentRiskAlerts}
                onChange={(val) => {
                  updateLiveHqSettings({ taxLoanPaymentRiskAlerts: val });
                  handleSavedNotify();
                }}
                ariaLabel="Overnight Liquidity & Tax Warnings"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-base)] bg-[var(--bg-base)] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              resetSettings();
              handleSavedNotify();
            }}
            className="flex items-center gap-1 text-[11px] text-[var(--text-subtle)] hover:text-rose-500 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2.5">
            {savedFeedback && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
