'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Settings as SettingsIcon, 
  Send, 
  X, 
  Key, 
  Sparkles, 
  Check, 
  ExternalLink, 
  Trash2,
  Search,
  Clock,
  Tag,
  DollarSign,
  ArrowRight,
  Maximize2,
  Minimize2,
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  Activity,
  RotateCcw,
  Copy,
  TrendingUp,
  Package,
  Languages,
  ChevronDown,
  BookOpen,
  Compass,
  Store,
  LayoutGrid,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import { 
  getUncleFredSettings, 
  saveUncleFredSettings, 
  getUncleFredChatHistory, 
  saveUncleFredChatHistory, 
  clearUncleFredChatHistory,
  getUncleFredUsageStats,
  resetUncleFredUsage,
  UncleFredSettings, 
  UncleFredChatMessage,
  UncleFredUsageStats,
  UncleFredContextPeriod
} from '@/lib/uncleFredStorage';
import { 
  checkVoiceEngineStatus, 
  synthesizeUncleFredVoice, 
  playUncleFredAudio, 
  stopUncleFredAudio, 
  VoiceEngineStatus 
} from '@/lib/uncleFredAudio';
import { askUncleFredAI, TelemetrySummary, BusinessStoreTelemetry } from '@/lib/uncleFredAi';
import { parseUncleFredOutput } from '@/lib/uncleFredResponseParser';
import { FormattedUncleFredText } from '@/components/UncleFredTextFormatter';
import { useTranslation } from '@/context/LanguageContext';

interface UncleFredProps {
  playerCash?: number;
  unpaidTaxes?: number;
  totalLoans?: number;
  currentHour?: number;
  currentDay?: number;
  businessesCount?: number;
  topPerformerName?: string;
  empireMargin?: number;
  saveTotalDays?: number;
  ownedRealEstateCount?: number;
  districtFootprint?: Record<string, number>;
  businessesList?: BusinessStoreTelemetry[];
  isConnected?: boolean;
  currentPage?: string;
  pageTitle?: string;
  disabled?: boolean;
  disabledBubbleText?: string;
  todayNetProfit?: number;
  revenueTrend?: number[];
  taxDeadlineDay?: number;
  totalDebt?: number;
  debtBankName?: string;
  warehouseCount?: number;
  vehicleCount?: number;
  logisticsAutomationActive?: boolean;
  totalEmployees?: number;
  avgMorale?: number;
  activeRecruitmentCampaigns?: number;
}

const STATIC_FALLBACK_TIPS = [
  "Keep 100% customer service and interior rating. Happy customers spend up to 20% more without flinching.",
  "Check the market ceiling on your pricing tab - people in Midtown pay top dollar.",
  "Taxes hit every Sunday at midnight. Don't go negative or loan interest will bleed you dry.",
  "Traffic Index matters more than store size. A small 15-capacity store on a 100-traffic corner beats a dead avenue.",
  "Don't hire full-time workers if you're open 8 hours a day. Part-time shifts keep payroll lean.",
  "Commercial real estate is passive gold. Once you own the building, rent expense drops to zero.",
  "Revenue is vanity, profit is sanity, but cash flow is king, kid."
];

const SUPPORTED_LANGUAGES = [
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'bg', label: 'Bulgarian (Български)' },
  { code: 'ca', label: 'Catalan (Català)' },
  { code: 'zh-CN', label: 'Chinese Simplified (简体中文)' },
  { code: 'zh-TW', label: 'Chinese Traditional (繁體中文)' },
  { code: 'hr', label: 'Croatian (Hrvatski)' },
  { code: 'cs', label: 'Czech (Čeština)' },
  { code: 'da', label: 'Danish (Dansk)' },
  { code: 'nl-BE', label: 'Dutch - Belgium (Flemish)' },
  { code: 'nl', label: 'Dutch - Netherlands (Nederlands)' },
  { code: 'en-AU', label: 'English (Australia)' },
  { code: 'en-CA', label: 'English (Canada)' },
  { code: 'en-GB', label: 'English (United Kingdom)' },
  { code: 'en', label: 'English (United States)' },
  { code: 'et', label: 'Estonian (Eesti)' },
  { code: 'fi', label: 'Finnish (Suomi)' },
  { code: 'fr-CA', label: 'French - Canada (Français canadien)' },
  { code: 'fr', label: 'French - France (Français)' },
  { code: 'de-AT', label: 'German - Austria (Österreichisches Deutsch)' },
  { code: 'de', label: 'German - Germany (Deutsch)' },
  { code: 'de-CH', label: 'German - Switzerland (Schweizerdeutsch)' },
  { code: 'el', label: 'Greek (Ελληνικά)' },
  { code: 'he', label: 'Hebrew (עברית)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'hu', label: 'Hungarian (Magyar)' },
  { code: 'id', label: 'Indonesian (Bahasa Indonesia)' },
  { code: 'it', label: 'Italian (Italiano)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'ko', label: 'Korean (한국어)' },
  { code: 'lv', label: 'Latvian (Latviešu)' },
  { code: 'lt', label: 'Lithuanian (Lietuvių)' },
  { code: 'ms', label: 'Malay (Bahasa Melayu)' },
  { code: 'no', label: 'Norwegian (Norsk)' },
  { code: 'pl', label: 'Polish (Polski)' },
  { code: 'pt-BR', label: 'Portuguese - Brazil (Português do Brasil)' },
  { code: 'pt-PT', label: 'Portuguese - Portugal (Português europeu)' },
  { code: 'ro', label: 'Romanian (Română)' },
  { code: 'ru', label: 'Russian (Русский)' },
  { code: 'sr', label: 'Serbian (Srpski)' },
  { code: 'sk', label: 'Slovak (Slovenčina)' },
  { code: 'sl', label: 'Slovenian (Slovenščina)' },
  { code: 'es-AR', label: 'Spanish - Argentina (Español rioplatense)' },
  { code: 'es-MX', label: 'Spanish - Mexico (Español mexicano)' },
  { code: 'es', label: 'Spanish - Spain (Español de España)' },
  { code: 'sv', label: 'Swedish (Svenska)' },
  { code: 'th', label: 'Thai (ไทย)' },
  { code: 'tr', label: 'Turkish (Türkçe)' },
  { code: 'uk', label: 'Ukrainian (Українська)' },
  { code: 'vi', label: 'Vietnamese (Tiếng Việt)' }
];

export function UncleFredAdvisor({
  playerCash = 0,
  unpaidTaxes = 0,
  totalLoans = 0,
  currentHour = 8,
  currentDay = 1,
  saveTotalDays = 1,
  businessesCount = 0,
  topPerformerName,
  empireMargin = 0,
  ownedRealEstateCount = 0,
  districtFootprint = {},
  businessesList = [],
  isConnected = false,
  currentPage,
  pageTitle,
  disabled = false,
  disabledBubbleText,
  todayNetProfit,
  revenueTrend,
  taxDeadlineDay,
  totalDebt,
  debtBankName,
  warehouseCount,
  vehicleCount,
  logisticsAutomationActive,
  totalEmployees,
  avgMorale,
  activeRecruitmentCampaigns
}: UncleFredProps) {
  const { t } = useTranslation();
  const defaultDisabledBubble = t('uncleFred.disabledBubbleText', 'Link the Companion Mod with your active game in Live HQ whenever you want me to inspect your live cash, schedules, and registers.');
  const effectiveDisabledBubbleText = disabledBubbleText || defaultDisabledBubble;
  const routerPathname = usePathname();
  const activePath = currentPage || routerPathname || '/';

  // Modal / Hub States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBubbleOpen, setIsBubbleOpen] = useState(false);
  const [bubbleText, setBubbleText] = useState(STATIC_FALLBACK_TIPS[0]);
  const [showSettings, setShowSettings] = useState(false);

  // Derive human-readable page title for AI context
  const resolvedPageTitle = useMemo(() => {
    if (pageTitle) return pageTitle;
    if (activePath === '/') return 'Companion Home';
    if (activePath === '/live-sync') return 'Live HQ Dashboard';
    if (activePath === '/businesses') return 'Business Compendium';
    if (activePath === '/builder') return 'Store & Office Builder';
    if (activePath === '/pricing') return 'Pricing Calculator';
    if (activePath === '/marketing') return 'Marketing Planner';
    if (activePath === '/factories') return 'Factory Planner';
    if (activePath === '/suppliers') return 'Wholesale Suppliers';
    if (activePath === '/items') return 'Item Catalog';
    if (activePath === '/real-estate') return 'Commercial Real Estate';
    if (activePath.startsWith('/live/')) return 'Live HQ Empire Management';
    return activePath.replace('/', '').replace(/-/g, ' ');
  }, [pageTitle, activePath]);

  // Settings State
  const [settings, setSettings] = useState<UncleFredSettings>(getUncleFredSettings);
  const [tempApiKey, setTempApiKey] = useState('');
  const [verifiedApiKey, setVerifiedApiKey] = useState<string>('');
  const [tempCoachingBubbles, setTempCoachingBubbles] = useState(true);
  const [tempContextPeriod, setTempContextPeriod] = useState<UncleFredContextPeriod>('7d');
  const [tempLanguage, setTempLanguage] = useState<string>('en');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testErrorMsg, setTestErrorMsg] = useState('');

  // API Usage Statistics
  const [usageStats, setUsageStats] = useState<UncleFredUsageStats>(getUncleFredUsageStats);

  // Chat State
  const [messages, setMessages] = useState<UncleFredChatMessage[]>(() => {
    return getUncleFredChatHistory();
  });
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Chat Dimensions (Default, Expanded, and persistence)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ba_unclefred_chat_expanded') === 'true';
  });

  // State for tracking copied message ID feedback
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const handleCopyMessage = (msgId: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedMessageId(msgId);
        setTimeout(() => {
          setCopiedMessageId((prev) => (prev === msgId ? null : prev));
        }, 1800);
      }).catch(() => {});
    }
  };

  // Voice Engine State
  const [voiceEngineStatus, setVoiceEngineStatus] = useState<VoiceEngineStatus>({
    online: false,
    model: 'XTTS-v2',
    device: 'Offline',
    speakerReady: false
  });
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [synthesizingMessageId, setSynthesizingMessageId] = useState<string | null>(null);
  const [tempVoiceEnabled, setTempVoiceEnabled] = useState<boolean>(true);

  // Check voice engine status once on mount
  useEffect(() => {
    let isMounted = true;
    checkVoiceEngineStatus().then((status) => {
      if (isMounted) {
        setVoiceEngineStatus(status);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSpeakMessage = async (msgId: string, text: string) => {
    if (currentlySpeakingId === msgId) {
      stopUncleFredAudio();
      setCurrentlySpeakingId(null);
      return;
    }

    setSynthesizingMessageId(msgId);
    try {
      const audioUrl = await synthesizeUncleFredVoice(text, settings.language || 'en');
      if (audioUrl) {
        setCurrentlySpeakingId(msgId);
        playUncleFredAudio(audioUrl, msgId, {
          volume: settings.voiceVolume ?? 1.0,
          speed: settings.voiceSpeed ?? 1.0,
          onEnded: () => setCurrentlySpeakingId(null),
          onError: () => setCurrentlySpeakingId(null)
        });
      }
    } catch (err) {
      console.warn('Voice playback failed:', err);
    } finally {
      setSynthesizingMessageId(null);
    }
  };

  // Toggle between standard and expanded mode
  const toggleExpanded = () => {
    setIsExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ba_unclefred_chat_expanded', String(next));
      } catch (_) {}
      return next;
    });
  };

  // Construct telemetry summary for AI context
  const telemetry: TelemetrySummary = useMemo(() => {
    const period = settings.contextPeriod || '7d';
    const contextPeriodLabel = period === '3d' ? '3 days' : period === '7d' ? '7 days' : period === '14d' ? '14 days' : 'all recorded days';

    return {
      playerCash,
      unpaidTaxes,
      totalLoans,
      currentHour,
      currentDay,
      saveTotalDays: saveTotalDays || currentDay || 1,
      businessesCount,
      topPerformerName,
      empireMargin,
      ownedRealEstateCount,
      districtFootprint,
      isConnected,
      currentPage: activePath,
      pageTitle: resolvedPageTitle,
      contextPeriodKey: period,
      contextPeriodLabel,
      businesses: businessesList,
      todayNetProfit,
      revenueTrend,
      taxDeadlineDay,
      totalDebt,
      debtBankName,
      warehouseCount,
      vehicleCount,
      logisticsAutomationActive,
      totalEmployees,
      avgMorale,
      activeRecruitmentCampaigns
    };
  }, [playerCash, unpaidTaxes, totalLoans, currentHour, currentDay, saveTotalDays, businessesCount, topPerformerName, empireMargin, ownedRealEstateCount, districtFootprint, isConnected, activePath, resolvedPageTitle, settings.contextPeriod, businessesList, todayNetProfit, revenueTrend, taxDeadlineDay, totalDebt, debtBankName, warehouseCount, vehicleCount, logisticsAutomationActive, totalEmployees, avgMorale, activeRecruitmentCampaigns]);

  // Dynamic context-aware chips based on player's live financials and current screen context
  const dynamicChips = useMemo(() => {
    const chips: Array<{ label: string; prompt: string; icon: React.ReactNode; crisis?: boolean }> = [];

    // When game is connected: provide live telemetry analysis chips
    if (isConnected) {
      // 1. High tax risk or low cash warning (Crisis takes precedence)
      if (unpaidTaxes > 0 && playerCash < unpaidTaxes * 1.2) {
        chips.push({
          label: t('uncleFred.chips.surviveTaxBill', 'Survive Tax Bill'),
          prompt: t('uncleFred.chips.surviveTaxPrompt', 'Sunday taxes are coming up at ${taxes} and I only have ${cash} in cash. What is my best move right now to not go broke?')
            .replace('${taxes}', Math.round(unpaidTaxes).toLocaleString())
            .replace('${cash}', Math.round(playerCash).toLocaleString()),
          icon: <AlertTriangle className="w-3 h-3 text-rose-500" />,
          crisis: true
        });
      }

      // 2. PRIMARY TOP EXPANSION PROMPT (Always prominent)
      chips.push({
        label: t('uncleFred.chips.whereToExpand', 'Where to Expand?'),
        prompt: t('uncleFred.chips.whereToExpandPrompt', 'Look at my cash reserves, profit margins, and current district locations. What business should I open next, which district has the best opportunity, and can I afford it right now?'),
        icon: <TrendingUp className="w-3 h-3 text-emerald-500" />
      });

      // 3. Item Sales & Stockout Velocity Audit
      chips.push({
        label: t('uncleFred.chips.itemSalesAudit', 'Item Sales Audit'),
        prompt: t('uncleFred.chips.itemSalesPrompt', 'Which items had the highest sales volume across all my businesses in the past 3 days? Are any products close to stocking out or stalling?'),
        icon: <Package className="w-3 h-3 text-sky-500" />
      });

      // 4. High bank loans
      if (totalLoans > 150000) {
        chips.push({
          label: t('uncleFred.chips.loanPayoffPlan', 'Loan Payoff Plan'),
          prompt: t('uncleFred.chips.loanPayoffPrompt', 'I have ${loans} in bank loans with Larry at Vantander Bank. Can I afford to pay this down faster or should I keep expanding?')
            .replace('${loans}', Math.round(totalLoans).toLocaleString()),
          icon: <DollarSign className="w-3 h-3 text-amber-500" />
        });
      }

      // 5. Operational Weak Spots
      chips.push({
        label: t('uncleFred.chips.auditWeakSpot', 'Audit Weak Spot'),
        prompt: t('uncleFred.chips.auditWeakSpotPrompt', 'Audit my business operations right now. What is my biggest weak spot or risk?'),
        icon: <Search className="w-3 h-3" />
      });

      // 6. Schedules & Staffing
      chips.push({
        label: t('uncleFred.chips.checkSchedules', 'Check Schedules'),
        prompt: t('uncleFred.chips.checkSchedulesPrompt', 'Review my store opening hours and employee shifts. Is my staffing schedule efficient or am I wasting payroll?'),
        icon: <Clock className="w-3 h-3" />
      });

      // 7. Pricing Optimization
      chips.push({
        label: t('uncleFred.chips.auditPricing', 'Audit Pricing'),
        prompt: t('uncleFred.chips.auditPricingPrompt', 'Inspect my retail prices versus wholesale cost and market ceiling. Can I raise prices to maximize margin?'),
        icon: <Tag className="w-3 h-3" />
      });
    } else {
      // When game is NOT connected: offer page-aware compendium strategy & starter advice
      if (activePath === '/pricing') {
        chips.push({
          label: t('uncleFred.chips.pricingCeilingRule', 'Pricing Ceiling Rule'),
          prompt: t('uncleFred.chips.pricingCeilingPrompt', 'How does pricing elasticity and customer satisfaction work in Big Ambitions? Can I charge above market reference price?'),
          icon: <Tag className="w-3 h-3 text-amber-500" />
        });
      }

      if (activePath === '/builder' || activePath === '/businesses') {
        chips.push({
          label: t('uncleFred.chips.bestStarterBusiness', 'Best Starter Business'),
          prompt: t('uncleFred.chips.bestStarterPrompt', 'Which business type is best for a beginner in Big Ambitions, and how much starting capital do I need?'),
          icon: <Store className="w-3 h-3 text-emerald-500" />
        });
        chips.push({
          label: t('uncleFred.chips.trafficVsSize', 'Foot Traffic vs Store Size'),
          prompt: t('uncleFred.chips.trafficVsSizePrompt', 'Should I rent a large 75-capacity building right away, or is foot traffic index and small square footage better?'),
          icon: <LayoutGrid className="w-3 h-3 text-sky-500" />
        });
      }

      if (activePath === '/factories' || activePath === '/suppliers') {
        chips.push({
          label: t('uncleFred.chips.wholesaleVsImport', 'Wholesale vs Import'),
          prompt: t('uncleFred.chips.wholesaleVsImportPrompt', 'When does it make financial sense to set up a central warehouse and import goods instead of local wholesale deliveries?'),
          icon: <Package className="w-3 h-3 text-violet-500" />
        });
      }

      // Universal compendium prompts
      chips.push({
        label: t('uncleFred.chips.earlyTycoonAdvice', 'Early Game Tycoon Advice'),
        prompt: t('uncleFred.chips.earlyTycoonPrompt', 'What are the most common mistakes new business owners make in Big Ambitions?'),
        icon: <Compass className="w-3 h-3 text-sky-500" />
      });

      chips.push({
        label: t('uncleFred.chips.staffTrainingSecrets', 'Staff Training Secrets'),
        prompt: t('uncleFred.chips.staffTrainingPrompt', 'How does customer service skill affect store sales and revenue in Big Ambitions?'),
        icon: <BookOpen className="w-3 h-3 text-amber-500" />
      });

      chips.push({
        label: t('uncleFred.chips.nycDistrictSecrets', 'NYC District Secrets'),
        prompt: t('uncleFred.chips.nycDistrictPrompt', 'What is the difference between Garment District, Hell\'s Kitchen, Murray Hill, and Midtown?'),
        icon: <TrendingUp className="w-3 h-3 text-emerald-500" />
      });
    }

    return chips;
  }, [isConnected, unpaidTaxes, playerCash, totalLoans, activePath]);

  // Infinite / Lazy Loaded Chat History Window
  // Loads initial 20 messages, and loads 20 more as the player scrolls up to the top
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollingRef = useRef<boolean>(false);

  // Auto-scroll chat to bottom on new messages or when thinking
  useEffect(() => {
    if (isChatOpen && messagesEndRef.current) {
      isAutoScrollingRef.current = true;
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      const timer = setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isChatOpen, isThinking]);

  // Handle Escape key to dismiss chat or settings
  useEffect(() => {
    if (!isChatOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // If language dropdown or settings sub-view is open, close them first or close the entire chat
        if (isLangDropdownOpen) {
          setIsLangDropdownOpen(false);
        } else if (showSettings) {
          setShowSettings(false);
        } else {
          setIsChatOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, isLangDropdownOpen, showSettings]);

  // Handle scroll up to lazy load older history
  const handleScroll = () => {
    if (!scrollContainerRef.current || isAutoScrollingRef.current) return;
    const { scrollTop, scrollHeight } = scrollContainerRef.current;

    // When within 30px of the top and there are older messages remaining
    if (scrollTop < 30 && visibleCount < messages.length) {
      const prevScrollHeight = scrollHeight;
      setVisibleCount(prev => Math.min(prev + 20, messages.length));

      // Maintain scroll position after prepending older messages so content doesn't jump
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          const newScrollHeight = scrollContainerRef.current.scrollHeight;
          scrollContainerRef.current.scrollTop = newScrollHeight - prevScrollHeight + scrollTop;
        }
      });
    }
  };

  // Keep a ref to the latest settings so the bubble timer reads fresh state
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Occasional strategic coaching bubble timer (4-8 minute randomized interval).
  // Uncle Fred no longer autonomously queries Gemini - he only speaks from the
  // queued coaching tips returned by the player's own prompts, or static fallbacks.
  const isChatOpenRef = useRef(isChatOpen);
  isChatOpenRef.current = isChatOpen;

  const coachingTipsQueueRef = useRef<string[]>([]);
  const coachingTipIndexRef = useRef(0);

  const enqueueCoachingTips = (tips: string[]) => {
    if (!tips || tips.length === 0) return;
    coachingTipsQueueRef.current = [...coachingTipsQueueRef.current, ...tips];
  };

  const popNextCoachingTip = (): string | null => {
    const queue = coachingTipsQueueRef.current;
    if (queue.length === 0) return null;
    const idx = coachingTipIndexRef.current % queue.length;
    coachingTipIndexRef.current = idx + 1;
    return queue[idx];
  };

  const appendCoachingTipToChat = (tip: string) => {
    const tipMsg: UncleFredChatMessage = {
      id: 'msg-' + Date.now() + '-coaching',
      sender: 'fred',
      text: tip,
      timestamp: Date.now()
    };
    setMessages(prev => {
      const updated = [...prev, tipMsg];
      saveUncleFredChatHistory(updated);
      return updated;
    });
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const scheduleNext = () => {
      const delayMs = (4 + Math.random() * 4) * 60 * 1000;
      timer = setTimeout(() => {
        const currentSettings = settingsRef.current;
        if (currentSettings.coachingBubbles !== false && !isChatOpenRef.current) {
          const tip = popNextCoachingTip() || STATIC_FALLBACK_TIPS[Math.floor(Math.random() * STATIC_FALLBACK_TIPS.length)];
          setBubbleText(tip);
          appendCoachingTipToChat(tip);
          setIsBubbleOpen(true);
        }
        scheduleNext();
      }, delayMs);
    };

    scheduleNext();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Auto-dismiss bubble timer (with hover-pause and 2s exit delay)
  const [isBubbleHovered, setIsBubbleHovered] = useState(false);
  const bubbleDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isBubbleOpen) {
      if (bubbleDismissTimeoutRef.current) {
        clearTimeout(bubbleDismissTimeoutRef.current);
        bubbleDismissTimeoutRef.current = null;
      }
      return;
    }

    // While mouse is hovering over the bubble, do not dismiss
    if (isBubbleHovered) {
      if (bubbleDismissTimeoutRef.current) {
        clearTimeout(bubbleDismissTimeoutRef.current);
        bubbleDismissTimeoutRef.current = null;
      }
      return;
    }

    // When not hovered (or mouse just left), set dismiss timer (2s after mouse exit or initial 14s)
    bubbleDismissTimeoutRef.current = setTimeout(() => {
      setIsBubbleOpen(false);
    }, 14000);

    return () => {
      if (bubbleDismissTimeoutRef.current) {
        clearTimeout(bubbleDismissTimeoutRef.current);
      }
    };
  }, [isBubbleOpen, isBubbleHovered]);

  const handleBubbleMouseEnter = () => {
    setIsBubbleHovered(true);
    if (bubbleDismissTimeoutRef.current) {
      clearTimeout(bubbleDismissTimeoutRef.current);
      bubbleDismissTimeoutRef.current = null;
    }
  };

  const handleBubbleMouseLeave = () => {
    setIsBubbleHovered(false);
    if (bubbleDismissTimeoutRef.current) {
      clearTimeout(bubbleDismissTimeoutRef.current);
    }
    // After leaving mouse, wait 2 seconds and dismiss
    bubbleDismissTimeoutRef.current = setTimeout(() => {
      setIsBubbleOpen(false);
    }, 2000);
  };

  // Avatar click handler: toggles the interactive consultation hub
  const handleAvatarClick = () => {
    setIsBubbleOpen(false);
    setIsChatOpen(prev => !prev);
  };

  // Send message to Uncle Fred
  const handleSendMessage = async (promptToSend?: string) => {
    const query = (promptToSend || inputText).trim();
    if (!query || isThinking) return;

    // Append user message
    const userMsg: UncleFredChatMessage = {
      id: 'msg-' + Date.now() + '-u',
      sender: 'user',
      text: query,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    saveUncleFredChatHistory(newHistory);
    if (!promptToSend) setInputText('');

    // If AI is not enabled or key is missing, give friendly guidance
    if (!settings.apiKey.trim() || !settings.aiEnabled) {
      setTimeout(() => {
        const fredReply: UncleFredChatMessage = {
          id: 'msg-' + Date.now() + '-f',
          sender: 'fred',
          text: t('uncleFred.unconfiguredAiNotice', "Kid, I'd love to crunch your live books, but you haven't turned on my AI brain yet! Click the Settings gear in the corner, grab a free Google Gemini key (takes 30 seconds), and let me inspect your numbers."),
          timestamp: Date.now()
        };
        const updated = [...newHistory, fredReply];
        setMessages(updated);
        saveUncleFredChatHistory(updated);
      }, 400);
      return;
    }

    setIsThinking(true);
    try {
      const fredResponse = await askUncleFredAI(query, telemetry, settings, newHistory);
      const parsed = parseUncleFredOutput(fredResponse);
      const msgId = 'msg-' + Date.now() + '-f';

      const fredMsg: UncleFredChatMessage = {
        id: msgId,
        sender: 'fred',
        text: parsed.cleanText,
        actionSummary: parsed.actionSummary,
        followUpPrompts: parsed.followUpPrompts,
        timestamp: Date.now()
      };
      const updated = [...newHistory, fredMsg];
      setMessages(updated);
      saveUncleFredChatHistory(updated);

      if (parsed.coachingTips.length > 0) {
        enqueueCoachingTips(parsed.coachingTips);
      }
    } catch (err: any) {
      const errorMsg: UncleFredChatMessage = {
        id: 'msg-' + Date.now() + '-err',
        sender: 'fred',
        text: t('uncleFred.networkErrorNotice', 'Bah, line went dead on my phone: {error}. Check your API key in settings or try again.').replace('{error}', err.message || 'Network error'),
        timestamp: Date.now()
      };
      const updated = [...newHistory, errorMsg];
      setMessages(updated);
      saveUncleFredChatHistory(updated);
    } finally {
      setIsThinking(false);
    }
  };

  // Dedicated API Key Validation function
  const handleValidateKey = async () => {
    if (!tempApiKey.trim()) {
      setTestStatus('error');
      setTestErrorMsg('Please enter an API key first.');
      return;
    }

    setTestStatus('testing');
    setTestErrorMsg('');

    try {
      const testSettings: UncleFredSettings = {
        ...settings,
        apiKey: tempApiKey.trim(),
        aiEnabled: true,
        coachingBubbles: tempCoachingBubbles,
        contextPeriod: tempContextPeriod,
        language: tempLanguage
      };
      await askUncleFredAI("Hey Fred, test check. You there?", telemetry, testSettings);
      setVerifiedApiKey(tempApiKey.trim());
      setTestStatus('success');
    } catch (err: any) {
      setTestStatus('error');
      setTestErrorMsg(err.message || 'Failed to authenticate with Gemini API.');
    }
  };

  // Save settings (bypasses re-validation if key was already validated or unchanged)
  const handleSaveSettings = async () => {
    setTestErrorMsg('');

    if (!tempApiKey.trim()) {
      // Disabled AI
      const updated = saveUncleFredSettings({
        apiKey: '',
        aiEnabled: false,
        coachingBubbles: tempCoachingBubbles,
        contextPeriod: tempContextPeriod,
        language: tempLanguage,
        voiceEnabled: tempVoiceEnabled
      });
      setSettings(updated);
      setVerifiedApiKey('');
      setTestStatus('idle');
      setShowSettings(false);
      return;
    }

    const trimmedKey = tempApiKey.trim();
    const isAlreadyValidated = (trimmedKey === verifiedApiKey) || (trimmedKey === settings.apiKey && settings.aiEnabled);

    // If key has already been validated, save immediately without making another network test call
    if (isAlreadyValidated) {
      const saved = saveUncleFredSettings({
        apiKey: trimmedKey,
        aiEnabled: true,
        coachingBubbles: tempCoachingBubbles,
        contextPeriod: tempContextPeriod,
        language: tempLanguage,
        voiceEnabled: tempVoiceEnabled
      });
      setSettings(saved);
      setShowSettings(false);
      return;
    }

    // Otherwise, perform validation for the new/unverified key before saving
    setTestStatus('testing');
    try {
      const testSettings: UncleFredSettings = {
        ...settings,
        apiKey: trimmedKey,
        aiEnabled: true,
        coachingBubbles: tempCoachingBubbles,
        contextPeriod: tempContextPeriod,
        language: tempLanguage,
        voiceEnabled: tempVoiceEnabled
      };
      await askUncleFredAI("Hey Fred, test check. You there?", telemetry, testSettings);

      const saved = saveUncleFredSettings({
        apiKey: trimmedKey,
        aiEnabled: true,
        coachingBubbles: tempCoachingBubbles,
        contextPeriod: tempContextPeriod,
        language: tempLanguage,
        voiceEnabled: tempVoiceEnabled
      });
      setSettings(saved);
      setVerifiedApiKey(trimmedKey);
      setTestStatus('success');
      setTimeout(() => {
        setShowSettings(false);
        setTestStatus('idle');
      }, 800);
    } catch (err: any) {
      setTestStatus('error');
      setTestErrorMsg(err.message || 'Failed to authenticate with Gemini API.');
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-end gap-3.5 pointer-events-auto">
      {/* Content-Aware Sleek Speech Bubble (Rectangular chat bubble pointing to Fred's avatar) */}
      {!isChatOpen && isBubbleOpen && (
        <div 
          id="unclefred-bubble"
          onMouseEnter={handleBubbleMouseEnter}
          onMouseLeave={handleBubbleMouseLeave}
          className="relative mb-3.5 mr-1 py-3 px-4 rounded-2xl rounded-br-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-200 select-text cursor-text min-w-[260px] max-w-[440px] w-auto"
        >
          {/* Dismiss button in top corner */}
          <button
            type="button"
            onClick={() => setIsBubbleOpen(false)}
            className="absolute top-2 right-2 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
            title={t('uncleFred.dismissBubble', 'Dismiss bubble')}
          >
            <X className="w-3 h-3" />
          </button>

          {/* Uncle Fred Label Header */}
          <div className="flex items-center justify-between mb-1.5 pr-6 select-none">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-sky-400'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isConnected ? t('uncleFred.bubbleLiveSynced', 'Uncle Fred (Live Synced)') : t('uncleFred.bubbleCompendium', 'Uncle Fred (Compendium Advisor)')}
              </span>
            </div>

            {/* Speak Bubble Audio Button (Available only when voice enabled and language is English) */}
            {settings.voiceEnabled !== false && (settings.language || 'en').toLowerCase().startsWith('en') && (
              <button
                type="button"
                onClick={() => handleSpeakMessage('bubble', bubbleText)}
                disabled={synthesizingMessageId !== null && synthesizingMessageId !== 'bubble'}
                className="p-1 rounded text-slate-400 hover:text-sky-500 transition-colors cursor-pointer flex items-center gap-1"
                title={
                  currentlySpeakingId === 'bubble'
                    ? t('uncleFred.stopVoice', 'Stop voice')
                    : synthesizingMessageId === 'bubble'
                    ? t('uncleFred.voiceWarmingUp', 'Warming up voice engine (~1-2 min)...')
                    : t('uncleFred.hearVoiceTooltip', 'Hear Uncle Fred speak this (first request takes ~1-2 min)')
                }
              >
                {currentlySpeakingId === 'bubble' ? (
                  <VolumeX className="w-3 h-3 text-sky-500 animate-pulse" />
                ) : synthesizingMessageId === 'bubble' ? (
                  <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />
                ) : (
                  <Volume2 className="w-3 h-3 hover:scale-110 transition-transform" />
                )}
              </button>
            )}
          </div>

          <div className="text-xs leading-relaxed font-normal text-slate-800 dark:text-slate-100 pr-2">
            <FormattedUncleFredText
              text={bubbleText}
              businesses={businessesList}
              onNavigateStore={() => setIsBubbleOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Interactive Uncle Fred Chatbot Consultation Hub */}
      {isChatOpen && (
        <div 
          className={`relative mb-2 flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-all overscroll-contain ${
            isExpanded 
              ? 'w-[560px] max-w-[90vw] h-[680px] max-h-[85vh]' 
              : 'w-[380px] max-w-[90vw] h-[520px] max-h-[78vh]'
          }`}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 shrink-0 select-none">
            {/* Top-center minimize pill handle & wider clickable zone */}
            <button
              type="button"
              onClick={() => setIsChatOpen(false)}
              className="absolute left-1/2 -translate-x-1/2 top-0 h-6 w-24 flex items-start justify-center pt-1.5 group/pill cursor-pointer z-10"
              title={t('uncleFred.minimizeChat', 'Minimize chat')}
            >
              <span className="w-14 h-1 rounded-full bg-slate-500/70 group-hover/pill:bg-slate-300 group-hover/pill:w-16 transition-all duration-200" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/80 shrink-0">
                <img src="/images/unclefred.png" alt="Uncle Fred" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-1.5" translate="no">
                  <h4 className="notranslate text-xs font-bold leading-tight">{t('uncleFred.headerTitle', 'Uncle Fred')}</h4>
                  <span className={`notranslate text-[9px] px-1.5 py-0.2 rounded-full font-semibold border ${
                    isConnected 
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80' 
                      : 'bg-sky-950/80 text-sky-400 border-sky-800/80'
                  }`}>
                    {isConnected ? t('uncleFred.syncedBadge', 'Synced') : t('uncleFred.compendiumBadge', 'Compendium')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${isThinking ? 'bg-sky-400 animate-ping' : settings.aiEnabled ? (isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-sky-400') : 'bg-slate-500'}`} />
                  <span className={isThinking ? 'text-sky-400 font-medium' : synthesizingMessageId ? 'text-amber-400 font-medium' : ''}>
                    {isThinking
                      ? t('uncleFred.typingIndicator', 'Uncle Fred is typing...')
                      : synthesizingMessageId
                      ? t('uncleFred.voiceWarmingUp', 'Warming up voice engine (~1-2 min)...')
                      : settings.aiEnabled
                      ? t('uncleFred.onDemandBadge', 'AI On-Demand')
                      : t('uncleFred.offlineMentorBadge', 'Offline Mentor')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {messages.length > 0 && !showSettings && (
                <button
                  type="button"
                  onClick={() => {
                    clearUncleFredChatHistory();
                    setMessages([]);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                  title={t('uncleFred.clearHistory', 'Clear Chat History')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {/* Expand / Minimize Window Size Toggle */}
              <button
                type="button"
                onClick={toggleExpanded}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={isExpanded ? t('uncleFred.collapseWindow', 'Collapse to standard size') : t('uncleFred.expandWindow', 'Expand chat window')}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const current = getUncleFredSettings();
                  setSettings(current);
                  setTempApiKey(current.apiKey || '');
                  setVerifiedApiKey(current.apiKey ? current.apiKey.trim() : '');
                  setTempCoachingBubbles(current.coachingBubbles !== false);
                  setTempContextPeriod(current.contextPeriod || '7d');
                  setTempLanguage(current.language || 'en');
                  setTempVoiceEnabled(current.voiceEnabled !== false);
                  setTestStatus('idle');
                  setTestErrorMsg('');
                  setUsageStats(getUncleFredUsageStats());
                  setShowSettings(prev => !prev);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showSettings ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title={t('uncleFred.settingsTooltip', 'AI Advisor Settings & Usage')}
              >
                <SettingsIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title={t('uncleFred.closeChat', 'Close chat')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Settings Drawer Overlay */}
          {showSettings ? (
            <div className="flex-1 p-4 overflow-y-auto overscroll-contain bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs space-y-4 select-text">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-2">
                <h5 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-500" />
                  {t('uncleFred.settings.title', 'Free AI Brain Setup (BYOK)')}
                </h5>
                <p className="text-[11px] text-slate-500 mt-1">
                  {t('uncleFred.settings.subtitle', '100% free forever. Your key stays in your local browser and is never saved to any external server.')}
                </p>
              </div>

              {/* Gemini Key Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold block text-[11px] text-slate-700 dark:text-slate-300">
                    {t('uncleFred.settings.apiKeyLabel', 'Google Gemini API Key')}
                  </label>
                  {tempApiKey.trim() && (
                    <span className="text-[10px] font-medium flex items-center gap-1">
                      {((tempApiKey.trim() === verifiedApiKey) || (tempApiKey.trim() === settings.apiKey && settings.aiEnabled)) ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> {t('uncleFred.settings.validated', 'Validated')}
                        </span>
                      ) : (
                        <span className="text-amber-500">{t('uncleFred.settings.unverified', 'Unverified key')}</span>
                      )}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    type="password"
                    value={tempApiKey}
                    onChange={(e) => {
                      setTempApiKey(e.target.value);
                      if (testStatus !== 'idle') {
                        setTestStatus('idle');
                        setTestErrorMsg('');
                      }
                    }}
                    placeholder={t('uncleFred.apiKeyPlaceholder', 'AIzaSy...')}
                    className="flex-1 min-w-0 px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    disabled={!tempApiKey.trim() || testStatus === 'testing'}
                    onClick={handleValidateKey}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                      ((tempApiKey.trim() === verifiedApiKey) || (tempApiKey.trim() === settings.apiKey && settings.aiEnabled))
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/50 hover:text-sky-600 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                    title={t('uncleFred.validateKeyTitle', 'Validate this API key with Gemini')}
                  >
                    {testStatus === 'testing' ? (
                      <>
                        <Sparkles className="w-3 h-3 animate-spin text-sky-500" />
                        <span>{t('uncleFred.settings.checking', 'Checking...')}</span>
                      </>
                    ) : ((tempApiKey.trim() === verifiedApiKey) || (tempApiKey.trim() === settings.apiKey && settings.aiEnabled)) ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>{t('uncleFred.settings.validBtn', 'Valid')}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{t('uncleFred.settings.validateBtn', 'Validate')}</span>
                      </>
                    )}
                  </button>
                </div>

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-500 font-medium pt-0.5"
                >
                  <span>{t('uncleFred.settings.getKeyLink', 'Get a free key at Google AI Studio')}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Telemetry Context Timeframe & Token Consumption Setting */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold block text-[11px] text-slate-700 dark:text-slate-300">
                    {t('uncleFred.settings.contextTimeframeLabel', 'Telemetry History Context Window')}
                  </label>
                  <span className="text-[10px] font-mono font-medium text-sky-600 dark:text-sky-400 uppercase">
                    {tempContextPeriod === '3d' ? t('uncleFred.settings.period3d', '3 Days') : tempContextPeriod === '7d' ? t('uncleFred.settings.period7d', '7 Days') : tempContextPeriod === '14d' ? t('uncleFred.settings.period14d', '14 Days') : t('uncleFred.settings.periodAll', 'All Days')}
                  </span>
                </div>

                {/* Segmented Period Buttons */}
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTempContextPeriod('3d')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center ${
                      tempContextPeriod === '3d'
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t('uncleFred.settings.period3d', '3 Days')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempContextPeriod('7d')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center ${
                      tempContextPeriod === '7d'
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t('uncleFred.settings.period7d', '7 Days')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempContextPeriod('14d')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center ${
                      tempContextPeriod === '14d'
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t('uncleFred.settings.period14d', '14 Days')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempContextPeriod('all')}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer text-center ${
                      tempContextPeriod === 'all'
                        ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {t('uncleFred.settings.periodAll', 'All Days')}
                  </button>
                </div>

                {/* Token Usage Warning */}
                <div className={`p-2 rounded-xl text-[10px] leading-tight border transition-colors ${
                  tempContextPeriod === '14d' || tempContextPeriod === 'all'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-500'
                }`}>
                  <p className="font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>
                      {tempContextPeriod === '3d' && t('uncleFred.settings.periodDesc3d', 'Lowest tokens (~900 tokens) - Fast queries, recent sales.')}
                      {tempContextPeriod === '7d' && t('uncleFred.settings.periodDesc7d', 'Recommended (~1,500 tokens) - Balanced weekly trend & inventory.')}
                      {tempContextPeriod === '14d' && t('uncleFred.settings.periodDesc14d', 'Higher token burn (~2,800 tokens) - Multi-week sales volume.')}
                      {tempContextPeriod === 'all' && t('uncleFred.settings.periodDescAll', 'Maximum token burn (~4,500+ tokens) - Full historical sales books.')}
                    </span>
                  </p>
                  {(tempContextPeriod === '14d' || tempContextPeriod === 'all') && (
                    <p className="mt-1 text-[9.5px] opacity-90">
                      {t('uncleFred.settings.periodWarning', 'Warning: Larger timeframes include more daily sales rows, increasing response latency and token usage.')}
                    </p>
                  )}
                </div>
              </div>

              {/* Language Selector (Stylized Searchable Custom Dropdown) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5 relative">
                <div className="flex items-center justify-between">
                  <label className="font-semibold block text-[11px] text-slate-700 dark:text-slate-300">
                    {t('uncleFred.settings.languageLabel', "Uncle Fred's Language")}
                  </label>
                  <span className="text-[10px] font-mono font-medium text-slate-500 uppercase flex items-center gap-1">
                    <Languages className="w-3 h-3 text-sky-500" />
                    <span>{SUPPORTED_LANGUAGES.find(l => l.code === tempLanguage)?.label || tempLanguage}</span>
                  </span>
                </div>

                {/* Custom Trigger Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsLangDropdownOpen(prev => !prev);
                    setLangSearchQuery('');
                  }}
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-sky-500 dark:hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-white flex items-center justify-between transition-colors cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <Languages className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>{SUPPORTED_LANGUAGES.find(l => l.code === tempLanguage)?.label || tempLanguage} ({tempLanguage})</span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180 text-sky-500' : ''}`} />
                </button>

                {/* Searchable Dropdown Menu Popover */}
                {isLangDropdownOpen && (
                  <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl space-y-2 animate-in fade-in zoom-in-95 duration-150 z-20">
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        autoFocus
                        value={langSearchQuery}
                        onChange={(e) => setLangSearchQuery(e.target.value)}
                        placeholder={t('uncleFred.settings.searchLangPlaceholder', 'Search language or country...')}
                        className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                      />
                      {langSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setLangSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Filtered Language List */}
                    <div className="max-h-44 overflow-y-auto space-y-0.5 pr-0.5">
                      {SUPPORTED_LANGUAGES
                        .filter(l => 
                          l.label.toLowerCase().includes(langSearchQuery.toLowerCase()) || 
                          l.code.toLowerCase().includes(langSearchQuery.toLowerCase())
                        )
                        .map(lang => {
                          const isSelected = lang.code === tempLanguage;
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              onClick={() => {
                                setTempLanguage(lang.code);
                                setIsLangDropdownOpen(false);
                                setLangSearchQuery('');
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                              }`}
                            >
                              <span>{lang.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono text-slate-400 uppercase">
                                  {lang.code}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-sky-500" />}
                              </div>
                            </button>
                          );
                        })}
                      {SUPPORTED_LANGUAGES.filter(l => 
                        l.label.toLowerCase().includes(langSearchQuery.toLowerCase()) || 
                        l.code.toLowerCase().includes(langSearchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="p-3 text-center text-slate-400 text-[11px]">
                          {t('uncleFred.settings.noLanguagesFound', 'No languages match "{query}"').replace('{query}', langSearchQuery)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-500">
                  {t('uncleFred.settings.languageHelp', 'Uncle Fred will converse fluently in your selected language while preserving store names and addresses.')}
                </p>
              </div>

              {/* Uncle Fred Spoken Voice Engine Controls */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Radio className={`w-3.5 h-3.5 ${voiceEngineStatus.online ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {t('uncleFred.settings.voiceEngineTitle', 'Spoken Voice Engine')}
                    </span>
                  </div>
                  <span className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold border ${
                    voiceEngineStatus.online
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                  }`}>
                    {voiceEngineStatus.online ? t('uncleFred.settings.voiceReady', 'Voice Ready') : t('uncleFred.settings.voiceStandby', 'Voice Standby')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                  {(() => {
                    const isEnglish = (tempLanguage || 'en').toLowerCase().startsWith('en');
                    return (
                      <>
                        <label className={`flex items-center justify-between ${isEnglish ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              disabled={!isEnglish}
                              checked={isEnglish && tempVoiceEnabled}
                              onChange={(e) => setTempVoiceEnabled(e.target.checked)}
                              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700 disabled:opacity-50"
                            />
                            <div>
                              <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px] block">
                                {t('uncleFred.settings.enableVoiceButtons', 'Enable Voice Buttons')}
                              </span>
                              {!isEnglish && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5">
                                  {t('uncleFred.settings.englishOnlyVoiceNotice', "Available only when English is selected (Uncle Fred's studio voice is in English).")}
                                </span>
                              )}
                            </div>
                          </div>
                        </label>

                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-slate-600 dark:text-slate-300 text-[10.5px] leading-relaxed space-y-1.5">
                          <p className="font-semibold text-amber-700 dark:text-amber-400">
                            {t('uncleFred.settings.communityNoticeTitle', 'Community Project Notice:')}
                          </p>
                          <p>
                            {t('uncleFred.settings.communityNoticeP1', "To keep this tool 100% free with zero running costs, Uncle Fred's voice AI uses on-demand cloud GPUs that sleep when inactive.")}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            - {t('uncleFred.settings.communityNoticeP2', '- First audio request: ~1 to 2 minutes (cold start & GPU warm-up)\n- Follow-up requests: ~10 seconds while active')}
                          </p>
                        </div>

                        <div className="pt-0.5 flex items-center justify-between">
                          <button
                            type="button"
                            disabled={!isEnglish || synthesizingMessageId === 'sample-test'}
                            onClick={() => handleSpeakMessage('sample-test', "Listen up kid! It's your Uncle Fred speaking. Let's make some serious money.")}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30 text-[10.5px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Volume2 className="w-3 h-3 text-sky-500" />
                            <span>{synthesizingMessageId === 'sample-test' ? t('uncleFred.voiceWarmingUp', 'Warming up voice (~1-2 min)...') : t('uncleFred.settings.testVoiceBtn', 'Test Uncle Fred Voice')}</span>
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Occasional In-Game Speech Bubbles Toggle */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempCoachingBubbles}
                    onChange={(e) => setTempCoachingBubbles(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-700"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block text-xs">
                      {t('uncleFred.settings.coachingBubblesTitle', 'Occasional In-Game Speech Bubbles')}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {t('uncleFred.settings.coachingBubblesDesc', 'Fred pops up with timeless tycoon coaching tips every few minutes while you browse. Turning this off also skips requesting tips to save tokens.')}
                    </span>
                  </div>
                </label>
              </div>

              {/* Status / Test feedback */}
              {testStatus === 'testing' && (
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-700 dark:text-sky-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-sky-500" />
                  <span>{t('uncleFred.settings.verifyingKeyMsg', 'Checking connection with Gemini...')}</span>
                </div>
              )}
              {testStatus === 'error' && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300">
                  <p className="font-semibold">{t('uncleFred.settings.failedVerifyKeyTitle', 'Failed to verify key:')}</p>
                  <p className="mt-0.5 opacity-90">{testErrorMsg}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={testStatus === 'testing'}
                  onClick={handleSaveSettings}
                  className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{t('uncleFred.settings.saveConfigBtn', 'Save Configuration')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer transition-colors"
                >
                  {t('uncleFred.settings.cancelBtn', 'Cancel')}
                </button>
              </div>

              {/* API Usage & Token Telemetry Card */}
              <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-sky-500" />
                    {t('uncleFred.settings.usageTelemetryTitle', 'API Usage & Telemetry')}
                  </span>
                  {usageStats.totalQueries > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        resetUncleFredUsage();
                        setUsageStats(getUncleFredUsageStats());
                      }}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title={t('uncleFred.resetUsageTitle', 'Reset usage counter')}
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>{t('uncleFred.settings.resetBtn', 'Reset')}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">{t('uncleFred.settings.totalCalls', 'Total Calls')}</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {usageStats.totalQueries.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">{t('uncleFred.settings.promptTokens', 'Prompt Tokens')}</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {usageStats.totalPromptTokens.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">{t('uncleFred.settings.outputTokens', 'Output Tokens')}</div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                      {usageStats.totalCandidatesTokens.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    {t('uncleFred.settings.modelLabel', 'Model:')} <strong className="text-slate-600 dark:text-slate-300 font-mono">{usageStats.lastUsedModel || 'gemini-3.6-flash'}</strong>
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{t('uncleFred.settings.providerLabel', 'Google AI Studio API')}</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Chat Messages Area with Lazy Loaded Infinite Scroll */
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950/40">
              <div 
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 p-3 overflow-y-auto overscroll-contain space-y-2.5 text-xs"
              >
                {/* Lazy Load Indicator when older messages exist */}
                {visibleCount < messages.length && (
                  <div className="text-center py-1">
                    <span className="text-[10px] text-slate-400 font-medium bg-slate-200/60 dark:bg-slate-800/60 px-2.5 py-0.5 rounded-full">
                      {t('uncleFred.scrollOlderMessages', 'Scroll up to load older messages ({count} older)').replace('{count}', String(messages.length - visibleCount))}
                    </span>
                  </div>
                )}

                {/* Clean Empty Chat State */}
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto select-none opacity-60">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 p-0.5 mb-2.5">
                      <img src="/images/unclefred.png" alt="Uncle Fred" className="w-full h-full object-cover rounded-full" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('uncleFred.noMessagesTitle', 'No messages yet')}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">
                      {t('uncleFred.noMessagesDesc', 'Send a message or pick a prompt below to chat with Uncle Fred.')}
                    </p>
                  </div>
                )}

                {/* Message Log (Lazy-loaded slice) */}
                {messages.slice(-visibleCount).map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div
                      className={`max-w-[90%] px-3.5 py-2.5 rounded-2xl leading-relaxed select-text cursor-text text-[11px] ${
                        msg.sender === 'user'
                          ? 'bg-sky-600 text-white rounded-br-none'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.sender === 'fred' ? (
                        <FormattedUncleFredText
                          text={msg.text}
                          businesses={businessesList}
                          onNavigateStore={() => setIsChatOpen(false)}
                        />
                      ) : (
                        msg.text
                      )}
                    </div>

                    {/* Message Footer: Timestamp & Quick Copy (for Fred messages) */}
                    <div className="flex items-center gap-1.5 px-1 select-none">
                      {msg.timestamp && (
                        <span className="text-[9px] text-slate-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {msg.sender === 'fred' && (
                        <>
                          {/* Play / Replay Voice Button (Available only when voice enabled and language is English) */}
                          {settings.voiceEnabled !== false && (settings.language || 'en').toLowerCase().startsWith('en') && (
                            <button
                              type="button"
                              onClick={() => handleSpeakMessage(msg.id, msg.text)}
                              disabled={synthesizingMessageId !== null && synthesizingMessageId !== msg.id}
                              className={`p-0.5 px-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                                currentlySpeakingId === msg.id
                                  ? 'text-sky-500 bg-sky-50 dark:bg-sky-950/60 font-semibold'
                                  : synthesizingMessageId === msg.id
                                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 font-medium'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-60 hover:opacity-100'
                              }`}
                              title={
                                currentlySpeakingId === msg.id
                                  ? t('uncleFred.stopVoice', 'Stop voice')
                                  : synthesizingMessageId === msg.id
                                  ? t('uncleFred.voiceWarmingUp', 'Warming up on-demand GPU (~1-2 min)...')
                                  : t('uncleFred.hearVoiceTooltip', "Speak in Uncle Fred's voice (first request takes ~1-2 min)")
                              }
                            >
                              {currentlySpeakingId === msg.id ? (
                                <>
                                  <VolumeX className="w-2.5 h-2.5 text-sky-500 animate-pulse" />
                                  <span className="text-[8.5px] text-sky-500">{t('uncleFred.speakingStatus', 'Speaking...')}</span>
                                </>
                              ) : synthesizingMessageId === msg.id ? (
                                <>
                                  <Sparkles className="w-2.5 h-2.5 animate-spin text-amber-500" />
                                  <span className="text-[8.5px] text-amber-600 dark:text-amber-400">{t('uncleFred.loadingVoiceStatus', 'Loading voice (~1-2 min)...')}</span>
                                </>
                              ) : (
                                <Volume2 className="w-2.5 h-2.5" />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg.id, msg.text)}
                            className="opacity-60 hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity cursor-pointer"
                            title={copiedMessageId === msg.id ? t('uncleFred.copiedFeedback', 'Copied to clipboard') : t('uncleFred.copyAdvice', 'Copy advice')}
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-2.5 h-2.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Dynamic Context Follow-Up Chips under Fred's latest answer - Styled cleanly matching default bubbles */}
                    {msg.sender === 'fred' && msg.followUpPrompts && msg.followUpPrompts.length > 0 && msg.id === messages[messages.length - 1]?.id && (
                      <div className="flex flex-wrap gap-1.5 pt-1 max-w-[94%]">
                        {msg.followUpPrompts.map((fu, fIdx) => (
                          <button
                            key={fIdx}
                            type="button"
                            disabled={isThinking}
                            onClick={() => handleSendMessage(fu)}
                            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-950/60 hover:text-sky-600 text-slate-700 dark:text-slate-300 font-medium text-[11px] transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 text-left"
                          >
                            <span>{fu}</span>
                            <ArrowRight className="w-2.5 h-2.5 shrink-0 opacity-60" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Industry Standard 3-Dots Typing Indicator */}
                {isThinking && (
                  <div className="flex items-center gap-1.5 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none shadow-sm w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Dynamic Tycoon Prompts (Adapts to live numbers) */}
              <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-1.5">
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-1 flex items-center justify-between">
                  <span>{t('uncleFred.quickTycoonPrompts', 'Quick Tycoon Prompts')}</span>
                  {!settings.aiEnabled && (
                    <span 
                      onClick={() => setShowSettings(true)}
                      className="text-amber-500 hover:underline cursor-pointer normal-case font-medium"
                    >
                      {t('uncleFred.enableAiFree', 'Enable AI (Free)')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                  {dynamicChips.map((chip, cIdx) => (
                    <button
                      key={cIdx}
                      type="button"
                      disabled={isThinking}
                      onClick={() => handleSendMessage(chip.prompt)}
                      className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer border ${
                        chip.crisis 
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-950/60 hover:text-sky-600 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {chip.icon}
                      <span>{chip.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0"
              >
                <input
                  type="text"
                  placeholder={t('uncleFred.chatPlaceholder', 'Ask Uncle Fred for business advice, store planning...')}
                  value={inputText}
                  disabled={isThinking}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none focus:outline-none focus:ring-1 focus:ring-sky-500 text-slate-900 dark:text-white placeholder-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isThinking}
                  className="p-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 transition-opacity cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Mascot Avatar Bubble - Locked at 70px x 70px */}
      <button
        id="unclefred-avatar"
        type="button"
        onClick={handleAvatarClick}
        style={{ width: '70px', height: '70px' }}
        className="group relative flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-2xl rounded-full"
        title={isThinking ? t('uncleFred.avatarThinking', 'Uncle Fred is thinking...') : t('uncleFred.avatarAriaLabel', 'Uncle Fred (Click to chat or get tycoon advice)')}
      >
        {/* Outer glowing pulsing aura while thinking */}
        {isThinking && (
          <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500 via-amber-400 to-sky-500 blur-sm opacity-70 animate-pulse pointer-events-none" />
        )}

        {/* Gradient Border Ring: Only this border ring spins, keeping Fred's face stationary */}
        <div 
          className={`absolute inset-0 rounded-full ${
            isConnected
              ? 'bg-gradient-to-tr from-emerald-500 via-amber-400 to-sky-500'
              : 'bg-gradient-to-tr from-sky-500 via-indigo-400 to-amber-400'
          } shadow-md transition-all ${
            isThinking ? 'animate-[spin_4s_linear_infinite]' : ''
          }`}
        />

        {/* Mascot Avatar Portrait - Perfectly stationary inside the ring */}
        <div className="relative w-[65px] h-[65px] rounded-full overflow-hidden border border-white/90 bg-slate-900 z-10">
          <img
            src="/images/unclefred.png"
            alt="Uncle Fred"
            className="w-full h-full object-cover"
          />
        </div>
      </button>
    </div>
  );
}
