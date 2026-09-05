export type UncleFredContextPeriod = '3d' | '7d' | '14d' | 'all';

export interface UncleFredSettings {
  apiKey: string;
  provider: 'gemini' | 'groq' | 'custom';
  customEndpoint?: string;
  aiEnabled: boolean;
  proactiveMode: boolean; // true = periodic background AI advice; false = on-demand only
  proactiveIntervalMinutes: number; // default: 6
  contextPeriod: UncleFredContextPeriod; // default: '7d'
  language: string; // default: 'en' ('en', 'es', 'pt', 'de', 'fr', 'zh', 'ja', etc.)
}

export interface UncleFredChatMessage {
  id: string;
  sender: 'user' | 'fred';
  text: string;
  timestamp: number;
  actionSummary?: {
    headline: string;
    impact?: string;
    storeName?: string;
  };
  followUpPrompts?: string[];
}

export interface UncleFredUsageStats {
  totalQueries: number;
  totalPromptTokens: number;
  totalCandidatesTokens: number;
  lastUsedModel?: string;
  lastQueryTimestamp?: number;
}

const SETTINGS_KEY = 'ba_unclefred_settings';
const CHAT_HISTORY_KEY = 'ba_unclefred_chat_history';
const USAGE_STATS_KEY = 'ba_unclefred_usage_stats';

export const DEFAULT_SETTINGS: UncleFredSettings = {
  apiKey: '',
  provider: 'gemini',
  aiEnabled: false,
  proactiveMode: false,
  proactiveIntervalMinutes: 6,
  contextPeriod: '7d',
  language: 'en',
};

export function getUncleFredSettings(): UncleFredSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.error('Failed to parse Uncle Fred settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveUncleFredSettings(settings: Partial<UncleFredSettings>): UncleFredSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const current = getUncleFredSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save Uncle Fred settings:', err);
  }
  return updated;
}

export function getUncleFredChatHistory(): UncleFredChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load chat history:', err);
    return [];
  }
}

export function saveUncleFredChatHistory(history: UncleFredChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep complete message history unless explicitly cleared by the player
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error('Failed to save chat history:', err);
  }
}

export function clearUncleFredChatHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (err) {
    console.error('Failed to clear chat history:', err);
  }
}

export function getUncleFredUsageStats(): UncleFredUsageStats {
  if (typeof window === 'undefined') {
    return { totalQueries: 0, totalPromptTokens: 0, totalCandidatesTokens: 0 };
  }
  try {
    const raw = localStorage.getItem(USAGE_STATS_KEY);
    if (!raw) return { totalQueries: 0, totalPromptTokens: 0, totalCandidatesTokens: 0 };
    return JSON.parse(raw);
  } catch {
    return { totalQueries: 0, totalPromptTokens: 0, totalCandidatesTokens: 0 };
  }
}

export function recordUncleFredUsage(
  promptTokens: number,
  candidatesTokens: number,
  modelUsed?: string
): UncleFredUsageStats {
  const current = getUncleFredUsageStats();
  const updated: UncleFredUsageStats = {
    totalQueries: current.totalQueries + 1,
    totalPromptTokens: current.totalPromptTokens + (promptTokens || 0),
    totalCandidatesTokens: current.totalCandidatesTokens + (candidatesTokens || 0),
    lastUsedModel: modelUsed || current.lastUsedModel,
    lastQueryTimestamp: Date.now()
  };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(updated));
    } catch {}
  }
  return updated;
}

export function resetUncleFredUsage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USAGE_STATS_KEY);
  } catch {}
}
