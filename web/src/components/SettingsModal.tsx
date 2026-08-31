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

  // Local state for typed input fields so user can freely edit
  const [syncRateInput, setSyncRateInput] = useState<string>(
    (liveHq.pollingRateMs / 1000).toString()
  );
  const [satisfactionInput, setSatisfactionInput] = useState<string>(
    liveHq.priceSatisfactionFloorPct.toString()
  );

  if (!isOpen) return null;

  const handleSavedNotify = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const handleSyncRateBlur = () => {
    const parsed = parseFloat(syncRateInput);
    // Bounds: 0.5s (500ms) minimum, 10.0s (10000ms) maximum
    const clamped = isNaN(parsed) ? 1.5 : Math.max(0.5, Math.min(10.0, Math.round(parsed * 10) / 10));
    setSyncRateInput(clamped.toString());
    updateLiveHqSettings({ pollingRateMs: Math.round(clamped * 1000) });
    handleSavedNotify();
  };

  const handleSatisfactionBlur = () => {
    const parsed = parseInt(satisfactionInput, 10);
    // Bounds: 10% minimum, 100% maximum
    const clamped = isNaN(parsed) ? 80 : Math.max(10, Math.min(100, parsed));
    setSatisfactionInput(clamped.toString());
    updateLiveHqSettings({ priceSatisfactionFloorPct: clamped });
    handleSavedNotify();
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

            {/* Bridge Host & Port */}
            <div className="space-y-1">
              <label className="font-semibold text-[var(--text-main)]">WebSocket Bridge Address</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={liveHq.serverHost}
                    onChange={(e) => {
                      updateLiveHqSettings({ serverHost: e.target.value });
                      handleSavedNotify();
                    }}
                    placeholder="127.0.0.1"
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-main)] focus:outline-none"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={liveHq.serverPort}
                    onChange={(e) => {
                      updateLiveHqSettings({ serverPort: Number(e.target.value) });
                      handleSavedNotify();
                    }}
                    placeholder="8765"
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-main)] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sync Frequency Typed Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">Telemetry Sync Interval</label>
                <span className="text-[11px] text-[var(--text-subtle)]">Min 0.5s to Max 10.0s</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="10.0"
                  value={syncRateInput}
                  onChange={(e) => setSyncRateInput(e.target.value)}
                  onBlur={handleSyncRateBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSyncRateBlur();
                  }}
                  className="w-28 bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-main)] focus:outline-none"
                />
                <span className="text-xs text-[var(--text-muted)] font-medium">seconds per polling cycle</span>
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

            {/* Price Satisfaction Floor Typed Input */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">Pricing Satisfaction Alert Floor</label>
                <span className="text-[11px] text-[var(--text-subtle)]">Min 10% to Max 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={satisfactionInput}
                  onChange={(e) => setSatisfactionInput(e.target.value)}
                  onBlur={handleSatisfactionBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSatisfactionBlur();
                  }}
                  className="w-28 bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl px-3 py-2 text-xs font-mono text-[var(--text-main)] focus:outline-none"
                />
                <span className="text-xs text-[var(--text-muted)] font-medium">% customer satisfaction threshold</span>
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
              setSyncRateInput('1.5');
              setSatisfactionInput('80');
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
