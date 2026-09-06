/**
 * Uncle Fred Voice Engine Client & Audio Player
 * Connects to the local FastAPI TTS engine running on RTX 3060 (port 8020)
 */

export interface VoiceEngineStatus {
  online: boolean;
  model: string;
  device: string;
  speakerReady: boolean;
}

const TTS_SERVER_URL = 'http://127.0.0.1:8020';

// In-memory audio cache to avoid re-synthesizing previously heard messages
const audioBlobCache = new Map<string, string>();

let activeAudio: HTMLAudioElement | null = null;
let currentPlayingId: string | null = null;

export async function checkVoiceEngineStatus(): Promise<VoiceEngineStatus> {
  // First try the Next.js API route (/api/tts) which proxies to Hugging Face or configured cloud URL
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('/api/tts', {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.online) {
        return {
          online: true,
          model: data.model || 'Uncle Fred XTTS-v2 Cloud',
          device: data.device || 'Cloud GPU',
          speakerReady: Boolean(data.speakerReady ?? true),
        };
      }
    }
  } catch {}

  // Fallback to local port 8020 if running locally
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${TTS_SERVER_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        model: data.model || 'XTTS-v2',
        device: data.device || 'Local GPU',
        speakerReady: Boolean(data.speakerReady ?? true),
      };
    }
  } catch {}

  return {
    online: false,
    model: 'None',
    device: 'Offline',
    speakerReady: false,
  };
}

export async function synthesizeUncleFredVoice(text: string, language: string = 'en'): Promise<string | null> {
  // Strip markdown, asterisks, citations, and brackets for clean speech
  const cleanSpeechText = text
    .replace(/[*_#`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanSpeechText) return null;

  // Check cache
  const cacheKey = `${language}:${cleanSpeechText}`;
  if (audioBlobCache.has(cacheKey)) {
    return audioBlobCache.get(cacheKey)!;
  }

  // 1. Try Next.js API route (/api/tts)
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanSpeechText,
        language: language.startsWith('pt') ? 'pt' : language.startsWith('es') ? 'es' : language.startsWith('de') ? 'de' : language.startsWith('fr') ? 'fr' : 'en',
      }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioBlobCache.set(cacheKey, audioUrl);
      return audioUrl;
    }
  } catch {}

  // 2. Fallback to direct local engine if testing locally on port 8020
  try {
    const res = await fetch(`${TTS_SERVER_URL}/api/speak`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanSpeechText,
        language: language.startsWith('pt') ? 'pt' : language.startsWith('es') ? 'es' : language.startsWith('de') ? 'de' : language.startsWith('fr') ? 'fr' : 'en',
      }),
    });

    if (res.ok) {
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioBlobCache.set(cacheKey, audioUrl);
      return audioUrl;
    }
  } catch {}

  return null;
}

export function playUncleFredAudio(
  audioUrl: string, 
  id: string, 
  options?: { volume?: number; speed?: number; onPlay?: () => void; onEnded?: () => void; onError?: () => void }
): void {
  // Stop existing speech
  stopUncleFredAudio();

  const audio = new Audio(audioUrl);
  audio.volume = Math.max(0, Math.min(1, options?.volume ?? 1.0));
  audio.playbackRate = Math.max(0.5, Math.min(2.0, options?.speed ?? 1.0));

  activeAudio = audio;
  currentPlayingId = id;

  audio.onplay = () => {
    options?.onPlay?.();
  };

  audio.onended = () => {
    if (currentPlayingId === id) {
      currentPlayingId = null;
      activeAudio = null;
    }
    options?.onEnded?.();
  };

  audio.onerror = () => {
    if (currentPlayingId === id) {
      currentPlayingId = null;
      activeAudio = null;
    }
    options?.onError?.();
  };

  audio.play().catch(err => {
    console.warn('Audio playback was prevented by browser policy or error:', err);
    options?.onError?.();
  });
}

export function stopUncleFredAudio(): void {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  currentPlayingId = null;
}

export function isAudioPlaying(id?: string): boolean {
  if (!activeAudio || activeAudio.paused) return false;
  if (!id) return true;
  return currentPlayingId === id;
}
