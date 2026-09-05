'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Bug, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Paperclip, 
  FileText, 
  X, 
  ShieldCheck,
  ChevronDown,
  Info,
  Check,
  Radio,
  Cpu,
  HelpCircle,
  UploadCloud,
  FileCode,
  Image as ImageIcon,
  Activity,
  Sliders,
  ScrollText,
  Building2,
  Code2,
  FolderOpen,
  Copy,
  CheckCheck,
  User
} from 'lucide-react';
import { useLiveSync } from '@/context/LiveSyncContext';
import { useSettings } from '@/context/SettingsContext';
import {
  buildDiagnosticSnapshot,
  hasAvailableGameSnapshot,
  stripExifFromImage,
  DEFAULT_DIAGNOSTIC_TOGGLES,
  DiagnosticCategoryToggles,
} from '@/lib/buildDiagnosticSnapshot';

const CATEGORIES = [
  { id: 'Live Sync Connection Issue', label: "Can't Connect to Game / Mod", desc: 'Companion won\'t sync with the game, red indicator, or port issue' },
  { id: 'Incorrect In-Game Numbers / Telemetry', label: 'Wrong Numbers or Stats', desc: 'Cash, store revenue, inventory, or employees look incorrect' },
  { id: 'Mod Lag / Performance', label: 'Game Lag or Stuttering', desc: 'Game drops frames or stutters while the mod is running' },
  { id: 'Crash or Game Freezing', label: 'Game Crash or Freezing', desc: 'The game closed unexpectedly, froze, or showed an error' },
  { id: 'UI Bug or Visual Glitch', label: 'Website / App Display Issue', desc: 'Buttons, text, tables, or dark mode look broken or misaligned' },
  { id: 'Other / Suggestion', label: 'General Feedback or Idea', desc: 'A suggestion, feature request, or something else' }
];

const CATEGORY_LABELS: Record<keyof DiagnosticCategoryToggles, { title: string; description: string }> = {
  connectionStatus: {
    title: 'Game Connection Info',
    description: 'Connection status, latency speed, and mod version.',
  },
  gameSnapshot: {
    title: 'Game Overview',
    description: 'Current in-game day, cash, net worth, and number of businesses.',
  },
  appSettings: {
    title: 'App Settings',
    description: 'Your refresh interval and alert preferences.',
  },
  recentLogs: {
    title: 'Recent Technical Logs',
    description: 'The last few log messages to help diagnose crashes or errors.',
  },
};

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const { state, isLinkAllowed, permissionError, lastLatencyMs, diagnosticLogs, isCityLoaded } = useLiveSync();
  const { liveHq } = useSettings();

  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedReportId, setSubmittedReportId] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copiedSavePath, setCopiedSavePath] = useState(false);
  const [validationError, setValidationError] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Close custom dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close custom category dropdown on Escape key (prevent accidental modal dismiss)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && categoryDropdownOpen) {
        setCategoryDropdownOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, categoryDropdownOpen]);

  // Lock background page scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    // Also lock main scrollable container if present in DOM
    const mainElement = document.querySelector('main');
    const originalMainOverflow = mainElement ? mainElement.style.overflow : '';

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if (mainElement) {
      mainElement.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      if (mainElement) {
        mainElement.style.overflow = originalMainOverflow;
      }
    };
  }, [isOpen]);

  const snapshotAvailable = hasAvailableGameSnapshot(state.isConnected, state);

  // Per-category consent state
  const [toggles, setToggles] = useState<DiagnosticCategoryToggles>({
    ...DEFAULT_DIAGNOSTIC_TOGGLES,
    gameSnapshot: DEFAULT_DIAGNOSTIC_TOGGLES.gameSnapshot && snapshotAvailable,
  });

  const setToggle = (key: keyof DiagnosticCategoryToggles, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  };

  const diagnostics = useMemo(
    () =>
      buildDiagnosticSnapshot({
        state,
        isConnected: state.isConnected,
        isCityLoaded,
        permissionGranted: isLinkAllowed,
        permissionError,
        lastLatencyMs,
        diagnosticLogs,
        settings: liveHq,
        toggles: { ...toggles, gameSnapshot: toggles.gameSnapshot && snapshotAvailable },
      }),
    [state, isCityLoaded, isLinkAllowed, permissionError, lastLatencyMs, diagnosticLogs, liveHq, toggles, snapshotAvailable]
  );

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const MAX_SIZE = 15 * 1024 * 1024;
    const oversized = selected.find((f) => f.size > MAX_SIZE);
    if (oversized) {
      setErrorMsg(`"${oversized.name}" exceeds 15MB. Please choose a smaller file.`);
      return;
    }
    setErrorMsg('');

    const cleanedFiles = await Promise.all(selected.map(f => stripExifFromImage(f)));
    setFiles(prev => [...prev, ...cleanedFiles].slice(0, 3));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setValidationError(true);
      setErrorMsg('Please describe what happened before sending your report.');
      descriptionRef.current?.focus();
      return;
    }

    setValidationError(false);
    setStatus('submitting');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('category', category);
      if (contact.trim()) {
        formData.append('contact', contact.trim());
      }
      formData.append('description', description);
      if (stepsToReproduce.trim()) {
        formData.append('stepsToReproduce', stepsToReproduce.trim());
      }
      formData.append('diagnostics', JSON.stringify(diagnostics));

      files.forEach((file) => {
        formData.append('files', file);
      });

      const res = await fetch('/api/bug-report', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit bug report. Please try again.');
      }

      setSubmittedReportId(data.reportId || 'BA-REPORT');
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong while submitting.');
    }
  };

  const handleResetAndClose = () => {
    setStatus('idle');
    setContact('');
    setDescription('');
    setStepsToReproduce('');
    setFiles([]);
    setErrorMsg('');
    setValidationError(false);
    setCategoryDropdownOpen(false);
    onClose();
  };

  const selectedCategoryObj = CATEGORIES.find(c => c.id === category) || CATEGORIES[0];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div 
        className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 transition-colors"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[var(--border-base)] bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-xs">
              <Bug className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)] leading-none">Report a Problem</h2>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">Let us know what went wrong so we can fix it quickly</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {status === 'success' ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)]">Report Sent!</h3>
                <p className="text-xs font-mono text-[var(--text-subtle)] bg-[var(--bg-base)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-md inline-block">
                  Report ID: {submittedReportId}
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed pt-1">
                  Thank you! Your report has been delivered directly to the developers on Discord. We'll take a look at it as soon as possible.
                </p>
              </div>

              <div className="pt-3">
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Custom Stylized Category Dropdown */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="text-xs font-bold text-[var(--text-main)] block">What type of issue is this?</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all cursor-pointer bg-[var(--bg-base)] ${
                      categoryDropdownOpen 
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs' 
                        : 'border-[var(--border-base)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[var(--text-main)] text-xs flex items-center gap-2">
                        <span>{selectedCategoryObj.label}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-subtle)] line-clamp-1">{selectedCategoryObj.desc}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 shrink-0 ml-2 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Stylized Dropdown Popover */}
                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-xl overflow-hidden py-1.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                      {CATEGORIES.map((c) => {
                        const isSelected = c.id === category;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setCategory(c.id);
                              setCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3.5 py-2.5 flex items-start justify-between gap-3 text-xs transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-emerald-500/10 text-[var(--text-main)] font-semibold' 
                                : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-medium text-[var(--text-main)] text-xs flex items-center gap-1.5">
                                <span>{c.label}</span>
                              </div>
                              <p className="text-[10px] text-[var(--text-subtle)] leading-tight">{c.desc}</p>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact / Discord Username (Optional) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-sky-500" />
                    <span>Discord Username or Contact</span>
                  </label>
                  <span className="text-[10px] text-[var(--text-subtle)] font-mono">Optional</span>
                </div>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. @tiago or tiagovitorino (for follow-up or testing help)"
                  maxLength={64}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-main)] block flex items-center gap-1.5">
                    <span>What happened?</span>
                    {validationError && !description.trim() && (
                      <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 animate-pulse">
                        Field cannot be empty
                      </span>
                    )}
                  </label>
                  <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider font-mono">Required</span>
                </div>
                <textarea
                  ref={descriptionRef}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (validationError && e.target.value.trim()) {
                      setValidationError(false);
                      if (errorMsg.includes('Please describe what happened')) {
                        setErrorMsg('');
                      }
                    }
                  }}
                  rows={4}
                  placeholder="Tell us what went wrong in plain words. For example: 'When I clicked to check sync, nothing happened' or 'My store profit shows negative instead of positive'..."
                  className={`w-full p-3 rounded-xl border bg-[var(--bg-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none transition-all resize-y leading-relaxed ${
                    validationError && !description.trim()
                      ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/[0.03]'
                      : 'border-[var(--border-base)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              {/* Steps to Reproduce */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-main)] block">How can we recreate it?</label>
                  <span className="text-[10px] text-[var(--text-subtle)] font-mono">Optional</span>
                </div>
                <textarea
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  rows={2}
                  placeholder="e.g. 1. Opened store schedule  2. Clicked Monday 9:00  3. Page froze..."
                  className="w-full p-3 rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono text-[11px] resize-y leading-relaxed"
                />
              </div>

              {/* Diagnostic Checklist with stylized toggles */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-[var(--text-main)]">Helpful diagnostic data</span>
                  </div>
                  <span className="text-[10px] text-[var(--text-subtle)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md font-medium">Included safely</span>
                </div>
                <p className="text-[11px] text-[var(--text-subtle)] -mt-1 leading-snug">
                  This basic info helps us find the bug faster. You can toggle off anything you prefer not to send.
                </p>

                <div className="space-y-1 pt-1 border-t border-[var(--border-subtle)]">
                  {(Object.keys(CATEGORY_LABELS) as (keyof DiagnosticCategoryToggles)[])
                    .filter((key) => key !== 'gameSnapshot' || snapshotAvailable)
                    .map((key) => {
                      const isChecked = Boolean(toggles[key]);
                      return (
                        <div 
                          key={key} 
                          onClick={() => setToggle(key, !isChecked)}
                          className="flex items-start justify-between gap-3 p-2 rounded-xl hover:bg-[var(--bg-surface)] transition-colors cursor-pointer group"
                        >
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <span className="font-semibold text-[var(--text-main)] block text-[11px] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {CATEGORY_LABELS[key].title}
                            </span>
                            <span className="text-[10px] text-[var(--text-subtle)] block leading-tight">
                              {CATEGORY_LABELS[key].description}
                            </span>
                          </div>

                          {/* Custom Toggle Switch Button */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isChecked}
                            aria-label={CATEGORY_LABELS[key].title}
                            onClick={(e) => {
                              e.stopPropagation();
                              setToggle(key, !isChecked);
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none mt-0.5 ${
                              isChecked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isChecked ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* File Attachments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Attach Screenshots or Save Files</span>
                    <span className="text-[10px] text-[var(--text-subtle)] font-normal">(optional - up to 3 files)</span>
                  </label>
                  <span className="text-[10px] text-[var(--text-subtle)] font-mono bg-[var(--bg-base)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md">
                    {files.length}/3 files
                  </span>
                </div>

                <div className="space-y-2">
                  {files.length < 3 && (
                    <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-base)]/50 hover:bg-[var(--bg-surface-hover)] hover:border-emerald-500/50 text-xs font-medium text-[var(--text-main)] cursor-pointer transition-all">
                      <UploadCloud className="w-4 h-4 text-emerald-500" />
                      <span>Click to choose screenshot (.png, .jpg) or save file (.hsg)</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept=".hsg,.meta,.save,.json,.png,.jpg,.jpeg,.txt,.log"
                        className="hidden"
                      />
                    </label>
                  )}

                  {files.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {files.map((f, i) => {
                        const isImage = f.type.startsWith('image/') || /\.(png|jpg|jpeg)$/i.test(f.name);
                        const isSave = /\.(hsg|meta|save|json)$/i.test(f.name);
                        return (
                          <div 
                            key={i} 
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] group"
                          >
                            {isImage ? (
                              <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            ) : isSave ? (
                              <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            ) : (
                              <FileCode className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            <span className="truncate max-w-[140px] font-mono text-[11px]">{f.name}</span>
                            <span className="text-[10px] text-[var(--text-subtle)] font-mono">({(f.size / 1024).toFixed(0)} KB)</span>
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="text-[var(--text-subtle)] hover:text-rose-500 ml-1 p-0.5 rounded cursor-pointer transition-colors"
                              title="Remove file"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Save Game Folder Helper with Copyable Path */}
                  <div className="p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[var(--text-main)] flex items-center gap-1">
                        <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                        How to find your Save Game:
                      </span>
                      <span className="text-[10px] text-[var(--text-subtle)]">Windows path</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Copy the path below, paste it into Windows Explorer, open your save folder, and select your <strong>.hsg</strong> save file (e.g. <em>MySave.hsg</em>):
                    </p>
                    <div className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)]">
                      <span className="font-mono text-[10px] text-[var(--text-main)] truncate flex-1 select-all">
                        %USERPROFILE%\AppData\LocalLow\Hovgaard Games\Big Ambitions\SaveGames\Big Ambitions
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const savePath = '%USERPROFILE%\\AppData\\LocalLow\\Hovgaard Games\\Big Ambitions\\SaveGames\\Big Ambitions';
                          if (navigator?.clipboard?.writeText) {
                            navigator.clipboard.writeText(savePath).catch(() => {});
                          } else {
                            try {
                              const textArea = document.createElement('textarea');
                              textArea.value = savePath;
                              textArea.style.position = 'fixed';
                              textArea.style.opacity = '0';
                              document.body.appendChild(textArea);
                              textArea.focus();
                              textArea.select();
                              document.execCommand('copy');
                              document.body.removeChild(textArea);
                            } catch {
                              // Ignore fallback copy errors
                            }
                          }
                          setCopiedSavePath(true);
                          setTimeout(() => setCopiedSavePath(false), 2000);
                        }}
                        className="px-2.5 py-1 rounded-md bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[10px] font-bold text-[var(--text-main)] transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Copy folder path to clipboard"
                      >
                        {copiedSavePath ? (
                          <>
                            <CheckCheck className="w-3 h-3 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[var(--text-subtle)]" />
                            <span>Copy Path</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Friendly Diagnostic Summary Accordion */}
              <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(!previewOpen)}
                  className="w-full flex items-center justify-between p-3 bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="font-semibold text-[var(--text-main)] text-xs">What information is included in this report?</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--text-subtle)]">
                    <span className="text-[10px] font-medium hidden sm:inline">{previewOpen ? 'Hide' : 'Show details'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${previewOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {previewOpen && (
                  <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] space-y-4 animate-in fade-in duration-150">
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      Below is the exact list of information being attached with this report, item by item. No personal files, passwords, or browsing data are ever included.
                    </p>

                    <div className="space-y-3.5">
                      {/* Category: Game Connection */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                          <Activity className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Game Connection</span>
                        </div>
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)] overflow-hidden text-[11px]">
                          {diagnostics.connectionStatus ? (
                            <>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Connection Status</span>
                                <span className={`font-semibold ${diagnostics.connectionStatus.isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                  {diagnostics.connectionStatus.isConnected ? 'Connected to live game' : 'Disconnected'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Game Save State</span>
                                <span className="font-medium text-[var(--text-main)]">
                                  {diagnostics.connectionStatus.isCityLoaded ? 'Active save loaded' : 'No save active'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Installed Mod Version</span>
                                <span className="font-mono font-medium text-[var(--text-main)]">
                                  {diagnostics.connectionStatus.modVersion || 'None detected'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Target Mod Version</span>
                                <span className="font-mono font-medium text-[var(--text-main)]">
                                  v{diagnostics.connectionStatus.expectedModVersion}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Mod Response Time (Latency)</span>
                                <span className="font-mono font-medium text-[var(--text-main)]">
                                  {diagnostics.connectionStatus.lastLatencyMs !== null ? `${diagnostics.connectionStatus.lastLatencyMs} ms` : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Recent Mod Status Logs</span>
                                <span className="font-medium text-[var(--text-main)]">
                                  {diagnostics.recentLogs ? `${diagnostics.recentLogs.length} lines (last 20 messages)` : 'Excluded'}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="px-3 py-2 text-[var(--text-subtle)] italic">
                              Turned off - no connection info will be sent.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Category: Game Overview */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                          <Building2 className="w-3.5 h-3.5 text-sky-500" />
                          <span>Game Overview (Snapshot)</span>
                        </div>
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)] overflow-hidden text-[11px]">
                          {diagnostics.gameSnapshot ? (
                            <>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">In-Game Day</span>
                                <span className="font-medium text-[var(--text-main)]">Day {diagnostics.gameSnapshot.gameDay}</span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Player Cash</span>
                                <span className="font-mono font-medium text-[var(--text-main)]">
                                  {(diagnostics.gameSnapshot.playerCash ?? 0) < 0 ? '-' : ''}${Math.abs(diagnostics.gameSnapshot.playerCash ?? 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Net Worth</span>
                                <span className="font-mono font-medium text-[var(--text-main)]">
                                  {(diagnostics.gameSnapshot.netWorth ?? 0) < 0 ? '-' : ''}${Math.abs(diagnostics.gameSnapshot.netWorth ?? 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Total Businesses Owned</span>
                                <span className="font-medium text-[var(--text-main)]">{diagnostics.gameSnapshot.businessCount}</span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Total Employees Hired</span>
                                <span className="font-medium text-[var(--text-main)]">{diagnostics.gameSnapshot.employeeCount}</span>
                              </div>
                            </>
                          ) : (
                            <div className="px-3 py-2 text-[var(--text-subtle)] italic">
                              Not included (no save active or turned off by toggle).
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Category: Companion App Settings */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                          <Sliders className="w-3.5 h-3.5 text-amber-500" />
                          <span>App Configuration</span>
                        </div>
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)] overflow-hidden text-[11px]">
                          {diagnostics.appSettings ? (
                            <>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Mod Server Address</span>
                                <span className="font-mono font-medium text-[var(--text-main)]">{diagnostics.appSettings.serverHost}:{diagnostics.appSettings.serverPort}</span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Sync Refresh Rate</span>
                                <span className="font-medium text-[var(--text-main)]">Every {diagnostics.appSettings.pollingRateMs / 1000} seconds</span>
                              </div>
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">Pause When Tab Is Inactive</span>
                                <span className="font-medium text-[var(--text-main)]">{diagnostics.appSettings.autoPauseOnTabInactive ? 'Yes' : 'No'}</span>
                              </div>
                            </>
                          ) : (
                            <div className="px-3 py-2 text-[var(--text-subtle)] italic">
                              Turned off - no app configuration will be sent.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Category: Device & System Info */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                          <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Device & Browser Specs</span>
                        </div>
                        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)] overflow-hidden text-[11px]">
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-[var(--text-subtle)]">Web Browser</span>
                            <span className="font-medium text-[var(--text-main)]">{diagnostics.appInfo.browser}</span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-[var(--text-subtle)]">Operating System</span>
                            <span className="font-medium text-[var(--text-main)]">{diagnostics.appInfo.os}</span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-[var(--text-subtle)]">Active App Theme</span>
                            <span className="font-medium text-[var(--text-main)]">{diagnostics.appInfo.theme} Mode</span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-[var(--text-subtle)]">Internet Status</span>
                            <span className={`font-semibold ${diagnostics.appInfo.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                              {diagnostics.appInfo.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                          {diagnostics.appInfo.cpuCores && (
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[var(--text-subtle)]">CPU Cores</span>
                              <span className="font-mono font-medium text-[var(--text-main)]">{diagnostics.appInfo.cpuCores} cores</span>
                            </div>
                          )}
                          {diagnostics.appInfo.deviceMemoryGb && (
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[var(--text-subtle)]">Approx. Device RAM</span>
                              <span className="font-mono font-medium text-[var(--text-main)]">~{diagnostics.appInfo.deviceMemoryGb} GB</span>
                            </div>
                          )}
                          {diagnostics.appInfo.gpuRenderer && (
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[var(--text-subtle)]">Graphics Card (GPU)</span>
                              <span className="font-mono font-medium text-[var(--text-main)] text-right max-w-[240px] truncate" title={diagnostics.appInfo.gpuRenderer}>
                                {diagnostics.appInfo.gpuRenderer}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-[var(--text-subtle)]">Current Page</span>
                            <span className="font-mono font-medium text-[var(--text-main)]">{diagnostics.appInfo.page}</span>
                          </div>
                          <div className="flex items-center justify-between px-3 py-2">
                            <span className="text-[var(--text-subtle)]">Screen Resolution</span>
                            <span className="font-mono font-medium text-[var(--text-main)]">{diagnostics.appInfo.viewport.width} x {diagnostics.appInfo.viewport.height}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border-base)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{status === 'submitting' ? 'Sending...' : 'Send Report'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
