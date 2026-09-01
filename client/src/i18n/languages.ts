export interface LanguageInfo {
  code: string;
  /** Name of the language written in its own script. */
  native: string;
  flag: string;
  /** Vernacular region hint, e.g. "India". */
  region: string;
  /**
   * "full" = has real partial translations in this app.
   * "core" = widely spoken, interface falls back to English (AI still responds).
   * "beta" = community-tier support, falls back to English.
   */
  tier: "full" | "core" | "beta";
}

export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  { code: "en", native: "English", flag: "🌐", region: "International", tier: "full" },
  { code: "hi", native: "हिन्दी", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "bn", native: "বাংলা", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "te", native: "తెలుగు", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "mr", native: "मराठी", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "ta", native: "தமிழ்", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "gu", native: "ગુજરાતી", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "kn", native: "ಕನ್ನಡ", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "ml", native: "മലയാളം", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "pa", native: "ਪੰਜਾਬੀ", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "ur", native: "اردو", flag: "🇮🇳", region: "India / Pakistan", tier: "full" },
  { code: "or", native: "ଓଡ଼ିଆ", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "as", native: "অসমীয়া", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "bho", native: "भोजपुरी", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "mai", native: "मैथिली", flag: "🇮🇳", region: "India", tier: "full" },
  { code: "es", native: "Español", flag: "🇪🇸", region: "International", tier: "full" },
  { code: "fr", native: "Français", flag: "🇫🇷", region: "International", tier: "full" },
  { code: "de", native: "Deutsch", flag: "🇩🇪", region: "International", tier: "full" },
  { code: "pt", native: "Português", flag: "🇧🇷", region: "International", tier: "core" },
  { code: "zh", native: "中文", flag: "🇨🇳", region: "International", tier: "core" },
  { code: "ja", native: "日本語", flag: "🇯🇵", region: "International", tier: "core" },
  { code: "ko", native: "한국어", flag: "🇰🇷", region: "International", tier: "core" },
  { code: "ru", native: "Русский", flag: "🇷🇺", region: "International", tier: "core" },
  { code: "ar", native: "العربية", flag: "🇸🇦", region: "Middle East / North Africa", tier: "core" },
  { code: "fa", native: "فارسی", flag: "🇮🇷", region: "Iran", tier: "core" },
  { code: "tr", native: "Türkçe", flag: "🇹🇷", region: "International", tier: "core" },
  { code: "it", native: "Italiano", flag: "🇮🇹", region: "International", tier: "core" },
  { code: "nl", native: "Nederlands", flag: "🇳🇱", region: "International", tier: "core" },
  { code: "pl", native: "Polski", flag: "🇵🇱", region: "International", tier: "core" },
  { code: "uk", native: "Українська", flag: "🇺🇦", region: "Ukraine", tier: "core" },
  { code: "vi", native: "Tiếng Việt", flag: "🇻🇳", region: "Vietnam", tier: "core" },
  { code: "th", native: "ไทย", flag: "🇹🇭", region: "Thailand", tier: "core" },
  { code: "id", native: "Bahasa Indonesia", flag: "🇮🇩", region: "Indonesia", tier: "core" },
  { code: "ms", native: "Bahasa Melayu", flag: "🇲🇾", region: "Malaysia", tier: "core" },
  { code: "ro", native: "Română", flag: "🇷🇴", region: "International", tier: "core" },
  { code: "el", native: "Ελληνικά", flag: "🇬🇷", region: "International", tier: "core" },
  { code: "sv", native: "Svenska", flag: "🇸🇪", region: "International", tier: "core" },
  { code: "da", native: "Dansk", flag: "🇩🇰", region: "International", tier: "core" },
  { code: "no", native: "Norsk", flag: "🇳🇴", region: "Norway", tier: "core" },
  { code: "fi", native: "Suomi", flag: "🇫🇮", region: "Finland", tier: "core" },
  { code: "cs", native: "Čeština", flag: "🇨🇿", region: "Czech Republic", tier: "core" },
  { code: "hu", native: "Magyar", flag: "🇭🇺", region: "Hungary", tier: "core" },
  { code: "he", native: "עברית", flag: "🇮🇱", region: "Israel", tier: "core" },
  { code: "sw", native: "Kiswahili", flag: "🇰🇪", region: "East Africa", tier: "core" },
  { code: "sr", native: "Српски", flag: "🇷🇸", region: "Serbia", tier: "core" },
  { code: "bg", native: "Български", flag: "🇧🇬", region: "Bulgaria", tier: "core" },
  { code: "hr", native: "Hrvatski", flag: "🇭🇷", region: "Croatia", tier: "core" },
  { code: "sk", native: "Slovenčina", flag: "🇸🇰", region: "Slovakia", tier: "core" },
  { code: "ne", native: "नेपाली", flag: "🇳🇵", region: "Nepal", tier: "core" },
  { code: "si", native: "සිංහල", flag: "🇱🇰", region: "Sri Lanka", tier: "core" },
  { code: "km", native: "ខ្មែរ", flag: "🇰🇭", region: "Cambodia", tier: "core" },
  { code: "my", native: "မြန်မာ", flag: "🇲🇲", region: "Myanmar", tier: "core" },
  { code: "tl", native: "Filipino", flag: "🇵🇭", region: "Philippines", tier: "core" },
  { code: "af", native: "Afrikaans", flag: "🇿🇦", region: "South Africa", tier: "core" },
  { code: "lt", native: "Lietuvių", flag: "🇱🇹", region: "Lithuania", tier: "beta" },
  { code: "lv", native: "Latviešu", flag: "🇱🇻", region: "Latvia", tier: "beta" },
  { code: "et", native: "Eesti", flag: "🇪🇪", region: "Estonia", tier: "beta" },
  { code: "sl", native: "Slovenščina", flag: "🇸🇮", region: "Slovenia", tier: "beta" },
  { code: "am", native: "አማርኛ", flag: "🇪🇹", region: "Ethiopia", tier: "beta" },
  { code: "ka", native: "ქართული", flag: "🇬🇪", region: "Georgia", tier: "beta" },
  { code: "hy", native: "Հայերեն", flag: "🇦🇲", region: "Armenia", tier: "beta" },
  { code: "az", native: "Azərbaycan", flag: "🇦🇿", region: "Azerbaijan", tier: "beta" },
  { code: "kk", native: "Қазақша", flag: "🇰🇿", region: "Kazakhstan", tier: "beta" },
  { code: "uz", native: "Oʻzbekcha", flag: "🇺🇿", region: "Uzbekistan", tier: "beta" },
  { code: "mn", native: "Монгол", flag: "🇲🇳", region: "Mongolia", tier: "beta" },
  { code: "mk", native: "Македонски", flag: "🇲🇰", region: "North Macedonia", tier: "beta" },
  { code: "sq", native: "Shqip", flag: "🇦🇱", region: "Albania", tier: "beta" },
  { code: "is", native: "Íslenska", flag: "🇮🇸", region: "Iceland", tier: "beta" },
  { code: "ga", native: "Gaeilge", flag: "🇮🇪", region: "Ireland", tier: "beta" },
  { code: "cy", native: "Cymraeg", flag: "🏴", region: "Wales", tier: "beta" },
  { code: "gl", native: "Galego", flag: "🇪🇸", region: "Galicia", tier: "beta" },
  { code: "yo", native: "Yorùbá", flag: "🇳🇬", region: "Nigeria", tier: "beta" },
  { code: "ha", native: "Hausa", flag: "🇳🇬", region: "Nigeria", tier: "beta" },
  { code: "ig", native: "Igbo", flag: "🇳🇬", region: "Nigeria", tier: "beta" },
  { code: "zu", native: "isiZulu", flag: "🇿🇦", region: "South Africa", tier: "beta" },
];

export const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(
  AVAILABLE_LANGUAGES.map((language) => [language.code, language.native]),
);

export function languageNativeName(code: string): string {
  return LANGUAGE_NAMES[code] ?? "English";
}

const RTL_CODES = new Set(["ur", "ar", "fa", "he"]);

export function isRtl(code: string): boolean {
  return RTL_CODES.has(code);
}