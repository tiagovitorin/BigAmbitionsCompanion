export interface LanguageOption {
  code: string;
  countryCode: string;
  name: string;
  nativeName: string;
  flagEmoji: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', countryCode: 'US', name: 'English', nativeName: 'English', flagEmoji: '🇺🇸' },
  { code: 'de', countryCode: 'DE', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪' },
  { code: 'fr', countryCode: 'FR', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷' },
  { code: 'es', countryCode: 'ES', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸' },
  { code: 'pt', countryCode: 'BR', name: 'Portuguese (BR)', nativeName: 'Português (Brasil)', flagEmoji: '🇧🇷' },
  { code: 'zh-cn', countryCode: 'CN', name: 'Chinese (Simplified)', nativeName: '简体中文', flagEmoji: '🇨🇳' },
  { code: 'zh-tw', countryCode: 'TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flagEmoji: '🇹🇼' },
  { code: 'ja', countryCode: 'JP', name: 'Japanese', nativeName: '日本語', flagEmoji: '🇯🇵' },
  { code: 'ko', countryCode: 'KR', name: 'Korean', nativeName: '한국어', flagEmoji: '🇰🇷' },
  { code: 'ru', countryCode: 'RU', name: 'Russian', nativeName: 'Русский', flagEmoji: '🇷🇺' },
  { code: 'it', countryCode: 'IT', name: 'Italian', nativeName: 'Italiano', flagEmoji: '🇮🇹' },
  { code: 'nl', countryCode: 'NL', name: 'Dutch', nativeName: 'Nederlands', flagEmoji: '🇳🇱' },
  { code: 'pl', countryCode: 'PL', name: 'Polish', nativeName: 'Polski', flagEmoji: '🇵🇱' },
  { code: 'tr', countryCode: 'TR', name: 'Turkish', nativeName: 'Türkçe', flagEmoji: '🇹🇷' },
  { code: 'uk', countryCode: 'UA', name: 'Ukrainian', nativeName: 'Українська', flagEmoji: '🇺🇦' },
  { code: 'cs', countryCode: 'CZ', name: 'Czech', nativeName: 'Čeština', flagEmoji: '🇨🇿' },
  { code: 'da', countryCode: 'DK', name: 'Danish', nativeName: 'Dansk', flagEmoji: '🇩🇰' },
  { code: 'fi', countryCode: 'FI', name: 'Finnish', nativeName: 'Suomi', flagEmoji: '🇫🇮' },
  { code: 'el', countryCode: 'GR', name: 'Greek', nativeName: 'Ελληνικά', flagEmoji: '🇬🇷' },
  { code: 'hu', countryCode: 'HU', name: 'Hungarian', nativeName: 'Magyar', flagEmoji: '🇭🇺' },
  { code: 'lt', countryCode: 'LT', name: 'Lithuanian', nativeName: 'Lietuvių', flagEmoji: '🇱🇹' },
  { code: 'ro', countryCode: 'RO', name: 'Romanian', nativeName: 'Română', flagEmoji: '🇷🇴' },
  { code: 'ar', countryCode: 'SA', name: 'Arabic', nativeName: 'العربية', flagEmoji: '🇸🇦', dir: 'rtl' },
];

export const DEFAULT_LANGUAGE = 'en';

export function getLanguageByCode(code: string): LanguageOption {
  return SUPPORTED_LANGUAGES.find(lang => lang.code.toLowerCase() === code.toLowerCase()) || SUPPORTED_LANGUAGES[0];
}

// Convert country code to Twitter/Discord Twemoji SVG so Windows never shows letters "US"
export function getTwemojiFlagUrl(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(c => (127397 + c.charCodeAt(0)).toString(16))
    .join('-');
  return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoints}.svg`;
}
