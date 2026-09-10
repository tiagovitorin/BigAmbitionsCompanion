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
  User,
  Lightbulb,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { DiscordIcon } from './DiscordIcon';
import { useLiveSync } from '@/context/LiveSyncContext';
import { useSettings } from '@/context/SettingsContext';
import { useTranslation } from '@/context/LanguageContext';
import { useModal, ModalReportMode } from '@/context/ModalContext';
import {
  buildDiagnosticSnapshot,
  hasAvailableGameSnapshot,
  stripExifFromImage,
  buildTelemetryReportSnapshot,
  DEFAULT_DIAGNOSTIC_TOGGLES,
  DiagnosticCategoryToggles,
} from '@/lib/buildDiagnosticSnapshot';
import { getSyncMode } from '@/lib/syncModes';
import { generateModDiagnostics } from '@/lib/modDiagnostics';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

const BUG_CATEGORIES = [
  { id: 'Live Sync Connection Issue', labelKey: 'bugReport.categories.cantConnect', descKey: 'bugReport.categories.cantConnectDesc', label: "Can't Connect to Game / Mod", desc: 'Companion won\'t sync with the game, red indicator, or port issue' },
  { id: 'Incorrect In-Game Numbers / Telemetry', labelKey: 'bugReport.categories.wrongNumbers', descKey: 'bugReport.categories.wrongNumbersDesc', label: 'Wrong Numbers or Stats', desc: 'Cash, store revenue, inventory, or employees look incorrect' },
  { id: 'Mod Lag / Performance', labelKey: 'bugReport.categories.modLag', descKey: 'bugReport.categories.modLagDesc', label: 'Game Lag or Stuttering', desc: 'Game drops frames or stutters while the mod is running' },
  { id: 'Crash or Game Freezing', labelKey: 'bugReport.categories.crashFreezing', descKey: 'bugReport.categories.crashFreezingDesc', label: 'Game Crash or Freezing', desc: 'The game closed unexpectedly, froze, or showed an error' },
  { id: 'UI Bug or Visual Glitch', labelKey: 'bugReport.categories.uiGlitch', descKey: 'bugReport.categories.uiGlitchDesc', label: 'Website / App Display Issue', desc: 'Buttons, text, tables, or dark mode look broken or misaligned' },
  { id: 'Other Bug', labelKey: 'bugReport.categories.otherBug', descKey: 'bugReport.categories.otherBugDesc', label: 'Other Glitch or Problem', desc: 'Something else broke or isn\'t behaving as intended' }
];

const SUGGESTION_CATEGORIES = [
  { id: 'New Feature / Tool', labelKey: 'bugReport.categories.newToolIdea', descKey: 'bugReport.categories.newToolDesc', label: 'New Tool or Feature Idea', desc: 'A new calculator, planner, graph, or feature for Live Sync or Compendium' },
  { id: 'UI / UX Improvement', labelKey: 'bugReport.categories.designImprovement', descKey: 'bugReport.categories.designDesc', label: 'Design or Layout Improvement', desc: 'Make navigation smoother, improve mobile view, or streamline an existing page' },
  { id: 'Game Data / Accuracy', labelKey: 'bugReport.categories.dataAccuracy', descKey: 'bugReport.categories.dataAccuracyDesc', label: 'Data / Reference Update', desc: 'New game items, corrected wholesale prices, building data, or store info' },
  { id: 'Quality of Life', labelKey: 'bugReport.categories.convenienceShortcut', descKey: 'bugReport.categories.convenienceDesc', label: 'Convenience / Shortcut', desc: 'Small tweaks, keybindings, export options, or helpful workflow additions' },
  { id: 'General Suggestion', labelKey: 'bugReport.categories.generalFeedback', descKey: 'bugReport.categories.generalDesc', label: 'General Feedback', desc: 'Any other ideas or suggestions you would love to see added' }
];

// Categories that are effectively undebuggable without the mod's diagnostics file.
const DIAGNOSTIC_REQUIRED_CATEGORIES = new Set([
  'Mod Lag / Performance',
  'Crash or Game Freezing',
  'Incorrect In-Game Numbers / Telemetry'
]);

const CATEGORY_LABELS: Record<keyof DiagnosticCategoryToggles, { titleKey: string; title: string; descriptionKey: string; description: string }> = {
  connectionStatus: {
    titleKey: 'bugReport.diagnostics.connectionStatusTitle',
    title: 'Game Connection Info',
    descriptionKey: 'bugReport.diagnostics.connectionStatusDesc',
    description: 'Connection status, latency speed, and mod version.',
  },
  gameSnapshot: {
    titleKey: 'bugReport.diagnostics.gameSnapshotTitle',
    title: 'Game Overview',
    descriptionKey: 'bugReport.diagnostics.gameSnapshotDesc',
    description: 'Current in-game day, cash, net worth, and number of businesses.',
  },
  appSettings: {
    titleKey: 'bugReport.diagnostics.appSettingsTitle',
    title: 'App Settings',
    descriptionKey: 'bugReport.diagnostics.appSettingsDesc',
    description: 'Your refresh interval and alert preferences.',
  },
  recentLogs: {
    titleKey: 'bugReport.diagnostics.recentLogsTitle',
    title: 'Recent Technical Logs',
    descriptionKey: 'bugReport.diagnostics.recentLogsDesc',
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
  const { t } = useTranslation();
  const { modalMode, setModalMode } = useModal();

  const isSuggestion = modalMode === 'suggestion';
  const activeCategories = isSuggestion ? SUGGESTION_CATEGORIES : BUG_CATEGORIES;

  const [category, setCategory] = useState(activeCategories[0].id);
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
  const [consentSaveShare, setConsentSaveShare] = useState(false);
  const [diagStatus, setDiagStatus] = useState<'idle' | 'generating' | 'error' | 'ready'>('idle');
  const [diagError, setDiagError] = useState('');
  const [diagText, setDiagText] = useState<string | null>(null);
  const [diagPreviewOpen, setDiagPreviewOpen] = useState(false);
  const [copiedDiag, setCopiedDiag] = useState(false);

  const isSaveLikeFile = (f: File) => /\.(hsg|meta|save|json|zip)$/i.test(f.name);
  const hasSaveAttached = !isSuggestion && files.some(isSaveLikeFile);
  const needsDiagnostics = !isSuggestion && DIAGNOSTIC_REQUIRED_CATEGORIES.has(category);
  const hasModDiagnosticsFile = files.some(f => f.name === 'mod-diagnostics.json');

  // Sync category when mode changes if category doesn't belong
  useEffect(() => {
    const cats = isSuggestion ? SUGGESTION_CATEGORIES : BUG_CATEGORIES;
    setCategory(cats[0].id);
  }, [isSuggestion]);

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

  // Paste screenshots straight from the clipboard (Ctrl+V / Cmd+V) while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const onPaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const images = items
        .filter(it => it.type.startsWith('image/'))
        .map(it => it.getAsFile())
        .filter((f): f is File => Boolean(f));
      if (images.length === 0) return;
      e.preventDefault();
      addFiles(images);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
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

  useEscapeToClose(isOpen, onClose);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    await addFiles(selected);
  };

  async function addFiles(incoming: File[]) {
    const MAX_SIZE = 15 * 1024 * 1024;
    const oversized = incoming.find((f) => f.size > MAX_SIZE);
    if (oversized) {
      setErrorMsg(t('bugReport.errorOversize', '"{name}" exceeds 15MB. Please choose a smaller file.').replace('{name}', oversized.name));
      return;
    }

    const cleanedFiles = await Promise.all(incoming.map(f => stripExifFromImage(f)));
    if (files.length + cleanedFiles.length > 3) {
      setErrorMsg(t('bugReport.maxFilesHint', 'You can attach up to 3 files.'));
    }
    setFiles(prev => [...prev, ...cleanedFiles].slice(0, 3));
    if (files.length + cleanedFiles.length <= 3) {
      setErrorMsg('');
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const copyDiagnosticsToClipboard = () => {
    if (!diagText) return;
    const done = () => {
      setCopiedDiag(true);
      setTimeout(() => setCopiedDiag(false), 2000);
    };
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(diagText).then(done).catch(() => {});
      return;
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = diagText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      done();
    } catch {
      // Clipboard unavailable
    }
  };

  const copySavePath = () => {
    const savePath = '%USERPROFILE%\\AppData\\LocalLow\\Hovgaard Games\\Big Ambitions\\SaveGames\\Big Ambitions';
    const markCopied = () => {
      setCopiedSavePath(true);
      setTimeout(() => setCopiedSavePath(false), 2000);
    };
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(savePath).then(markCopied).catch(() => {});
      return;
    }
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
      markCopied();
    } catch {
      // Clipboard unavailable
    }
  };

  async function handleGenerateDiagnostics() {
    setDiagStatus('generating');
    setDiagError('');
    setDiagPreviewOpen(false);
    setCopiedDiag(false);
    try {
      const { text } = await generateModDiagnostics({
        serverHost: liveHq.serverHost,
        serverPort: liveHq.serverPort
      });
      setDiagText(text);
      setDiagStatus('ready');
      await addFiles([new File([text], 'mod-diagnostics.json', { type: 'application/json' })]);
    } catch {
      setDiagStatus('error');
      setDiagError(
        t('bugReport.diagNotConnected', 'Could not reach the game to build diagnostics. Make sure Big Ambitions is running with the mod and a save loaded, then try again.')
      );
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setValidationError(true);
      setErrorMsg(t('bugReport.errorRequiredDesc'));
      descriptionRef.current?.focus();
      return;
    }

    // These categories are undebuggable without the mod's diagnostics file.
    if (needsDiagnostics && !hasModDiagnosticsFile) {
      setErrorMsg(
        t('bugReport.diagRequiredError', 'This issue type requires the generated mod diagnostics file. Click "Generate mod diagnostics" above, or attach a mod-diagnostics.json file.')
      );
      return;
    }

    // Saves contain empire (business/staff) names: require explicit consent before sending one.
    if (hasSaveAttached && !consentSaveShare) {
      setErrorMsg(t('bugReport.saveConsentRequired', 'Tick the "share my save" box to include your save file with this report.'));
      return;
    }

    setValidationError(false);
    setStatus('submitting');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('reportType', isSuggestion ? 'suggestion' : 'bug');
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

      // Auto-attach a compact telemetry snapshot for bug reports (privacy-scrubbed).
      if (!isSuggestion) {
        try {
          const telemetry = buildTelemetryReportSnapshot(state);
          const blob = new Blob([JSON.stringify(telemetry)], { type: 'application/json' });
          formData.append('telemetryFile', blob, 'telemetry-report.json');
        } catch {
          // Never block a report because snapshot serialization failed
        }
      }

      const res = await fetch('/api/bug-report', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || t(isSuggestion ? 'bugReport.failedSubmitSuggestion' : 'bugReport.failedSubmitBug'));
      }

      setSubmittedReportId(data.reportId || (isSuggestion ? 'SUGG-REPORT' : 'BA-REPORT'));
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || t('bugReport.errorSubmit'));
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
    setConsentSaveShare(false);
    setDiagStatus('idle');
    setDiagError('');
    setDiagText(null);
    setDiagPreviewOpen(false);
    setCopiedDiag(false);
    onClose();
  };

  const selectedCategoryObj = activeCategories.find(c => c.id === category) || activeCategories[0];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div 
        className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 transition-colors"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 pt-4 pb-3 border-b border-[var(--border-base)] bg-[var(--bg-surface)] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shadow-xs transition-colors ${
                isSuggestion 
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' 
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                {isSuggestion ? <Lightbulb className="w-5 h-5" /> : <Bug className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[var(--text-main)] leading-none">
                  {isSuggestion ? t('bugReport.submitSuggestion') : t('bugReport.reportProblem')}
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">
                  {isSuggestion 
                    ? t('bugReport.suggestionSubtitle')
                    : t('bugReport.reportSubtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="p-1.5 rounded-xl border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              title={t('bugReport.closeBtn')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Segmented Mode Switcher: Bug Report vs Suggestion */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModalMode('bug')}
              className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                !isSuggestion
                  ? 'bg-[var(--bg-surface)] text-rose-600 dark:text-rose-400 border border-[var(--border-base)] shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>{t('bugReport.modeBug')}</span>
            </button>
            <button
              type="button"
              onClick={() => setModalMode('suggestion')}
              className={`py-1.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isSuggestion
                  ? 'bg-[var(--bg-surface)] text-purple-600 dark:text-purple-400 border border-[var(--border-base)] shadow-xs font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('bugReport.modeSuggestion')}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {status === 'success' ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs border ${
                isSuggestion 
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' 
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
              }`}>
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-[var(--text-main)]">
                  {isSuggestion ? t('bugReport.successSuggestionTitle') : t('bugReport.successBugTitle')}
                </h3>
                <p className="text-xs font-mono text-[var(--text-subtle)] bg-[var(--bg-base)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-md inline-block">
                  {isSuggestion ? t('bugReport.successSuggestionId') : t('bugReport.successReportId')}: {submittedReportId}
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed pt-1">
                  {isSuggestion
                    ? t('bugReport.successSuggestionDesc')
                    : t('bugReport.successBugDesc')}
                </p>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleResetAndClose}
                  className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer ${
                    isSuggestion 
                      ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {t('bugReport.done')}
                </button>

                <a
                  href="https://discord.gg/qX4tXFQpEV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#5865F2] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <DiscordIcon className="w-3.5 h-3.5" />
                  <span>{t('bugReport.joinDiscord')}</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Custom Stylized Category Dropdown */}
              <div className="space-y-1.5" ref={dropdownRef}>
                <label className="text-xs font-bold text-[var(--text-main)] block">
                  {isSuggestion ? t('bugReport.categoryQuestionSuggestion') : t('bugReport.categoryQuestionBug')}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(prev => !prev)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left text-xs transition-all cursor-pointer bg-[var(--bg-base)] ${
                      categoryDropdownOpen 
                        ? (isSuggestion ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-xs' : 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs')
                        : 'border-[var(--border-base)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[var(--text-main)] text-xs flex items-center gap-2">
                        <span>{t(selectedCategoryObj.labelKey, selectedCategoryObj.label)}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-subtle)] line-clamp-1">{t(selectedCategoryObj.descKey, selectedCategoryObj.desc)}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 shrink-0 ml-2 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Stylized Dropdown Popover */}
                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-xl overflow-hidden py-1.5 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                      {activeCategories.map((c) => {
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
                                ? (isSuggestion ? 'bg-purple-500/10 text-[var(--text-main)] font-semibold' : 'bg-emerald-500/10 text-[var(--text-main)] font-semibold')
                                : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="font-medium text-[var(--text-main)] text-xs flex items-center gap-1.5">
                                <span>{t(c.labelKey, c.label)}</span>
                              </div>
                              <p className="text-[10px] text-[var(--text-subtle)] leading-tight">{t(c.descKey, c.desc)}</p>
                            </div>
                            {isSelected && (
                              <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isSuggestion ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
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
                    <span>{t('bugReport.discordContactLabel')}</span>
                  </label>
                  <span className="text-[10px] text-[var(--text-subtle)] font-mono">{t('bugReport.optional')}</span>
                </div>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t('bugReport.discordContactPlaceholder')}
                  maxLength={64}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-main)] block flex items-center gap-1.5">
                    <span>{isSuggestion ? t('bugReport.descriptionQuestionSuggestion') : t('bugReport.descriptionQuestionBug')}</span>
                    {validationError && !description.trim() && (
                      <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 animate-pulse">
                        {t('bugReport.fieldRequired')}
                      </span>
                    )}
                  </label>
                  <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider font-mono">{t('bugReport.required')}</span>
                </div>
                <textarea
                  ref={descriptionRef}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (validationError && e.target.value.trim()) {
                      setValidationError(false);
                      if (errorMsg === t('bugReport.errorRequiredDesc')) {
                        setErrorMsg('');
                      }
                    }
                  }}
                  rows={4}
                  placeholder={
                    isSuggestion
                      ? t('bugReport.descriptionPlaceholderSuggestion')
                      : t('bugReport.descriptionPlaceholderBug')
                  }
                  className={`w-full p-3 rounded-xl border bg-[var(--bg-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none transition-all resize-y leading-relaxed ${
                    validationError && !description.trim()
                      ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/[0.03]'
                      : isSuggestion
                      ? 'border-[var(--border-base)] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                      : 'border-[var(--border-base)] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
              </div>

              {/* Steps to Reproduce / Additional Context */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-main)] block">
                    {isSuggestion ? t('bugReport.stepsQuestionSuggestion') : t('bugReport.stepsQuestionBug')}
                  </label>
                  <span className="text-[10px] text-[var(--text-subtle)] font-mono">{t('bugReport.optional')}</span>
                </div>
                <textarea
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  rows={2}
                  placeholder={
                    isSuggestion
                      ? t('bugReport.stepsPlaceholderSuggestion')
                      : t('bugReport.stepsPlaceholderBug')
                  }
                  className={`w-full p-3 rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none transition-all text-[11px] resize-y leading-relaxed ${
                    isSuggestion
                      ? 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                      : 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono'
                  }`}
                />
              </div>

              {/* Diagnostic Checklist & Save Helper: ONLY relevant for Bug Reports, NOT Suggestions */}
              {!isSuggestion && (
                <>
                  {/* Diagnostic Checklist with stylized toggles */}
                  <div className="space-y-2.5 p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-xs font-bold text-[var(--text-main)]">{t('bugReport.diagnosticDataTitle')}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-subtle)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md font-medium">{t('bugReport.includedSafely')}</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-subtle)] -mt-1 leading-snug">
                      {t('bugReport.diagnosticDataDesc')}
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
                                  {t(CATEGORY_LABELS[key].titleKey, CATEGORY_LABELS[key].title)}
                                </span>
                                <span className="text-[10px] text-[var(--text-subtle)] block leading-tight">
                                  {t(CATEGORY_LABELS[key].descriptionKey, CATEGORY_LABELS[key].description)}
                                </span>
                              </div>

                              {/* Custom Toggle Switch Button */}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isChecked}
                                aria-label={t(CATEGORY_LABELS[key].titleKey, CATEGORY_LABELS[key].title)}
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
                </>
              )}

              {/* Required: on-demand mod diagnostics */}
              {!isSuggestion && needsDiagnostics && (
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-sky-500/5 border border-sky-500/25">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-main)]">
                      <FileCode className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>{t('bugReport.diagTitle', 'Required: Mod Diagnostics')}</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                        {t('bugReport.required')}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {t('bugReport.diagDesc', 'We auto-generate a small diagnostics file straight from your running game - no need to find or send a save. It captures empire scale, order-history sizes, and the mod build time, which is exactly what is needed to fix lag and crashes.')}
                  </p>

                  {diagStatus === 'ready' && hasModDiagnosticsFile ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDiagPreviewOpen(v => !v)}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
                      >
                        {diagPreviewOpen ? t('bugReport.diagHideContents', 'Hide contents') : t('bugReport.diagViewContents', 'View contents')}
                      </button>
                      <button
                        type="button"
                        onClick={copyDiagnosticsToClipboard}
                        title={t('bugReport.copyDiagTooltip', 'Copy full diagnostics to clipboard')}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-main)] transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        {copiedDiag ? (
                          <>
                            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">{t('bugReport.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                            <span>{t('bugReport.copyDiag', 'Copy full file')}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateDiagnostics}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
                      >
                        {t('bugReport.diagRegenerate', 'Regenerate')}
                      </button>
                    </div>
                  ) : diagStatus === 'generating' ? (
                    <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] animate-pulse">
                      <FileCode className="w-3.5 h-3.5 text-sky-500" />
                      <span>{t('bugReport.diagGenerating', 'Building diagnostics from your game...')}</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleGenerateDiagnostics}
                        className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-2"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{t('bugReport.diagGenerate', 'Generate mod diagnostics')}</span>
                      </button>
                      {diagStatus === 'error' && (
                        <p className="text-[11px] text-rose-500 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{diagError}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-[var(--text-subtle)] leading-relaxed">
                        {t('bugReport.diagOfflineHint', 'If the game is not running, launch it, load your save, then come back and try again - or attach an existing mod-diagnostics.json file below.')}
                      </p>
                    </div>
                  )}

                  {diagStatus === 'ready' && diagText && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 shrink-0" />
                        <span>{t('bugReport.diagPreviewTrust', 'Nothing leaves your computer until you press Send. Here is exactly what this file contains:')}</span>
                      </p>
                      {diagPreviewOpen && (
                        <pre className="max-h-96 overflow-auto rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] p-2.5 text-[10px] font-mono text-[var(--text-muted)] leading-relaxed whitespace-pre-wrap break-all">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(diagText), null, 2);
                            } catch {
                              return diagText;
                            }
                          })()}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* File Attachments */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Paperclip className={`w-3.5 h-3.5 ${isSuggestion ? 'text-purple-500' : 'text-emerald-500'}`} />
                    <span>{isSuggestion ? t('bugReport.attachmentsQuestionSuggestion') : t('bugReport.attachmentsQuestionBug')}</span>
                  </label>
                  <span className="text-[10px] text-[var(--text-subtle)] font-mono bg-[var(--bg-base)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-md">
                    {t('bugReport.filesCount', '{count}/3').replace('{count}', files.length.toString())}
                  </span>
                </div>

                <div className="space-y-2">
                  {files.length < 3 && (
                    <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-base)]/50 hover:bg-[var(--bg-surface-hover)] text-xs font-medium text-[var(--text-main)] cursor-pointer transition-all ${
                      isSuggestion ? 'hover:border-purple-500/50' : 'hover:border-emerald-500/50'
                    }`}>
                      <UploadCloud className={`w-4 h-4 ${isSuggestion ? 'text-purple-500' : 'text-emerald-500'}`} />
                      <span>{isSuggestion ? t('bugReport.chooseFilesSuggestion') : t('bugReport.chooseFilesBug')}</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept={isSuggestion ? ".png,.jpg,.jpeg" : ".hsg,.meta,.save,.zip,.json,.png,.jpg,.jpeg,.txt,.log"}
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
                              title={t('bugReport.removeFile')}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Consent for attached save files - only appears once a save is attached */}
                  {hasSaveAttached && (
                    <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 text-[11px] text-[var(--text-main)] cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={consentSaveShare}
                        onChange={(e) => {
                          setConsentSaveShare(e.target.checked);
                          if (e.target.checked) setErrorMsg('');
                        }}
                        className="mt-0.5 w-4 h-4 accent-amber-600"
                      />
                      <span>
                        {t('bugReport.saveConsentLabel', 'I understand my save contains my empire (business and staff names) and agree to share it with the developer for debugging.')}
                      </span>
                    </label>
                  )}

                  {/* Save folder path (compact, optional manual attach) */}
                  {!isSuggestion && !needsDiagnostics && (
                    <button
                      type="button"
                      onClick={copySavePath}
                      title={t('bugReport.copyPathTooltip')}
                      className="flex items-center gap-1.5 text-[10px] text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors cursor-pointer w-full justify-start"
                    >
                      <FolderOpen className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate font-mono">%USERPROFILE%\AppData\LocalLow\Hovgaard Games\Big Ambitions\SaveGames\Big Ambitions</span>
                      {copiedSavePath ? <CheckCheck className="w-3 h-3 text-emerald-500 shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Friendly Diagnostic Summary Accordion - Only shown for Bug Reports */}
              {!isSuggestion && (
                <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(!previewOpen)}
                    className="w-full flex items-center justify-between p-3 bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-[var(--text-main)] text-xs">{t('bugReport.includedInfoQuestion')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[var(--text-subtle)]">
                      <span className="text-[10px] font-medium hidden sm:inline">{previewOpen ? t('bugReport.hideDetails') : t('bugReport.showDetails')}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${previewOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {previewOpen && (
                    <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] space-y-4 animate-in fade-in duration-150">
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        {t('bugReport.includedInfoDesc')}
                      </p>

                      <div className="space-y-3.5">
                        {/* Category: Game Connection */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                            <Activity className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{t('bugReport.gameConnectionSection')}</span>
                          </div>
                          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)] overflow-hidden text-[11px]">
                            {diagnostics.connectionStatus ? (
                              <>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.connectionStatus')}</span>
                                  <span className={`font-semibold ${diagnostics.connectionStatus.isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                    {diagnostics.connectionStatus.isConnected ? t('bugReport.connectedLive') : t('bugReport.disconnected')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.gameSaveState')}</span>
                                  <span className="font-medium text-[var(--text-main)]">
                                    {diagnostics.connectionStatus.isCityLoaded ? t('bugReport.activeSave') : t('bugReport.noSave')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.installedModVersion')}</span>
                                  <span className="font-mono font-medium text-[var(--text-main)]">
                                    {diagnostics.connectionStatus.modVersion || t('bugReport.noneDetected')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.targetModVersion')}</span>
                                  <span className="font-mono font-medium text-[var(--text-main)]">
                                    v{diagnostics.connectionStatus.expectedModVersion}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.modLatency')}</span>
                                  <span className="font-mono font-medium text-[var(--text-main)]">
                                    {diagnostics.connectionStatus.lastLatencyMs !== null ? `${diagnostics.connectionStatus.lastLatencyMs} ms` : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.recentLogs')}</span>
                                  <span className="font-medium text-[var(--text-main)]">
                                    {diagnostics.recentLogs ? t('bugReport.logLines', '{count} lines (last 20 messages)').replace('{count}', diagnostics.recentLogs.length.toString()) : t('bugReport.excluded')}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="px-3 py-2 text-[var(--text-subtle)] italic">
                                {t('bugReport.connectionOff')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category: Game Overview */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                            <Building2 className="w-3.5 h-3.5 text-sky-500" />
                            <span>{t('bugReport.gameOverviewSection')}</span>
                          </div>
                          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)] overflow-hidden text-[11px]">
                            {diagnostics.gameSnapshot ? (
                              <>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.inGameDay')}</span>
                                  <span className="font-medium text-[var(--text-main)]">{t('bugReport.dayPrefix', 'Day {day}').replace('{day}', diagnostics.gameSnapshot.gameDay.toString())}</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.playerCash')}</span>
                                  <span className="font-mono font-medium text-[var(--text-main)]">
                                    {(diagnostics.gameSnapshot.playerCash ?? 0) < 0 ? '-' : ''}${Math.abs(diagnostics.gameSnapshot.playerCash ?? 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.netWorth')}</span>
                                  <span className="font-mono font-medium text-[var(--text-main)]">
                                    {(diagnostics.gameSnapshot.netWorth ?? 0) < 0 ? '-' : ''}${Math.abs(diagnostics.gameSnapshot.netWorth ?? 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.businessesOwned')}</span>
                                  <span className="font-medium text-[var(--text-main)]">{diagnostics.gameSnapshot.businessCount}</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.employeesHired')}</span>
                                  <span className="font-medium text-[var(--text-main)]">{diagnostics.gameSnapshot.employeeCount}</span>
                                </div>
                              </>
                            ) : (
                              <div className="px-3 py-2 text-[var(--text-subtle)] italic">
                                {t('bugReport.snapshotNotIncluded')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category: Companion App Settings */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                            <Sliders className="w-3.5 h-3.5 text-amber-500" />
                            <span>{t('bugReport.appConfigSection')}</span>
                          </div>
                          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)] overflow-hidden text-[11px]">
                            {diagnostics.appSettings ? (
                              <>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.modServerAddress')}</span>
                                  <span className="font-mono font-medium text-[var(--text-main)]">{diagnostics.appSettings.serverHost}:{diagnostics.appSettings.serverPort}</span>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2">
                                  <span className="text-[var(--text-subtle)]">{t('bugReport.syncRefreshRate')}</span>
                                  <span className="font-medium text-[var(--text-main)]">
                                    {t(getSyncMode(diagnostics.appSettings.syncMode as any).descKey)}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="px-3 py-2 text-[var(--text-subtle)] italic">
                                {t('bugReport.appConfigOff')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category: Device & System Info */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{t('bugReport.deviceSpecsSection')}</span>
                          </div>
                          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)] overflow-hidden text-[11px]">
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[var(--text-subtle)]">{t('bugReport.webBrowser')}</span>
                              <span className="font-medium text-[var(--text-main)]">{diagnostics.appInfo.browser}</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[var(--text-subtle)]">{t('bugReport.operatingSystem')}</span>
                              <span className="font-medium text-[var(--text-main)]">{diagnostics.appInfo.os}</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[var(--text-subtle)]">{t('bugReport.activeTheme')}</span>
                              <span className="font-medium text-[var(--text-main)]">{t('bugReport.themeSuffix', '{theme} Mode').replace('{theme}', diagnostics.appInfo.theme)}</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[var(--text-subtle)]">{t('bugReport.internetStatus')}</span>
                              <span className={`font-semibold ${diagnostics.appInfo.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                {diagnostics.appInfo.isOnline ? t('bugReport.online') : t('bugReport.offline')}
                              </span>
                            </div>
                            {diagnostics.appInfo.cpuCores && (
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">{t('bugReport.cpuCores')}</span>
                                <span className="font-mono font-medium text-[var(--text-main)]">{t('bugReport.coresUnit', '{count} cores').replace('{count}', diagnostics.appInfo.cpuCores.toString())}</span>
                              </div>
                            )}
                            {diagnostics.appInfo.gpuRenderer && (
                              <div className="flex items-center justify-between px-3 py-2">
                                <span className="text-[var(--text-subtle)]">{t('bugReport.gpuRenderer')}</span>
                                <span className="font-mono font-medium text-[var(--text-main)] text-right max-w-[240px] truncate" title={diagnostics.appInfo.gpuRenderer}>
                                  {diagnostics.appInfo.gpuRenderer}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[var(--text-subtle)]">{t('bugReport.currentPage')}</span>
                              <span className="font-mono font-medium text-[var(--text-main)]">{diagnostics.appInfo.page}</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-2">
                              <span className="text-[var(--text-subtle)]">{t('bugReport.screenResolution')}</span>
                              <span className="font-mono font-medium text-[var(--text-main)]">{diagnostics.appInfo.viewport.width} x {diagnostics.appInfo.viewport.height}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" />

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[var(--border-subtle)]">
                <a
                  href="https://discord.gg/qX4tXFQpEV"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-xs font-bold text-[#5865F2] transition-all shadow-xs hover:shadow-[#5865F2]/15 cursor-pointer group order-2 sm:order-1 self-stretch sm:self-auto justify-center"
                  title={t('bugReport.joinDiscordTooltip')}
                >
                  <DiscordIcon className="w-4 h-4 text-[#5865F2] group-hover:scale-110 transition-transform" />
                  <span>{t('bugReport.joinDiscordShort')}</span>
                </a>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end order-1 sm:order-2">
                  <button
                    type="button"
                    onClick={handleResetAndClose}
                    className="px-4 py-2.5 rounded-xl border border-[var(--border-base)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
                  >
                    {t('bugReport.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                      isSuggestion
                        ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/20'
                        : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {status === 'submitting' 
                        ? t('bugReport.sending') 
                        : (isSuggestion ? t('bugReport.submitSuggestionBtn') : t('bugReport.sendReportBtn'))}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
