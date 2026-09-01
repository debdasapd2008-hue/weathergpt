import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EN, type Dict } from "./dict";
import { TRANSLATIONS, type LanguageDict } from "./translations";
import { AVAILABLE_LANGUAGES, isRtl } from "./languages";

export const STORAGE_KEY = "weathergpt-language";
export const DEFAULT_LANGUAGE = "en";

const LANGUAGE_CODES = new Set(AVAILABLE_LANGUAGES.map((language) => language.code));

function deepMerge(base: Dict, patch: LanguageDict): Dict {
  const out: Record<string, unknown> = { ...(base as unknown as Record<string, unknown>) };
  const baseRecord = base as unknown as Record<string, unknown>;
  const patchRecord = patch as unknown as Record<string, unknown>;
  for (const key of Object.keys(baseRecord)) {
    const baseValue = baseRecord[key];
    const patchValue = patchRecord[key];
    if (
      patchValue !== undefined &&
      typeof baseValue === "object" &&
      baseValue !== null &&
      typeof patchValue === "object" &&
      patchValue !== null &&
      !Array.isArray(baseValue)
    ) {
      out[key] = deepMerge(
        baseValue as unknown as Dict,
        patchValue as unknown as LanguageDict,
      );
    } else if (patchValue !== undefined) {
      out[key] = patchValue as unknown;
    }
  }
  return out as Dict;
}

type TranslationFunction = (key: string, fallback?: string) => string;

export interface I18nContextValue {
  language: string;
  setLanguage: (code: string) => void;
  t: TranslationFunction;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolve(dict: Dict, key: string): string | undefined {
  const parts = key.split(".");
  let value: unknown = dict;
  for (const part of parts) {
    if (value === null || value === undefined || typeof value !== "object") {
      return undefined;
    }
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === "string" ? value : undefined;
}

function browserLanguage(): string | null {
  if (typeof navigator === "undefined") return null;
  const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const candidate of candidates) {
    const exact = String(candidate).toLowerCase();
    if (LANGUAGE_CODES.has(exact)) return exact;
    const base = exact.split("-")[0];
    if (base && LANGUAGE_CODES.has(base)) return base;
  }
  return null;
}

function initialLanguage(): string {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && LANGUAGE_CODES.has(stored)) {
    return stored;
  }
  return browserLanguage() ?? DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(initialLanguage);

  const setLanguage = useCallback((code: string) => {
    setLanguageState(code);
    try {
      window.localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // persistence is best-effort
    }
  }, []);

  const dictionary = useMemo(() => {
    const patch = TRANSLATIONS[language];
    return patch ? deepMerge(EN, patch) : EN;
  }, [language]);

  const t = useCallback<TranslationFunction>(
    (key, fallback) => {
      const value = resolve(dictionary, key);
      if (value !== undefined) return value;
      const english = resolve(EN, key);
      if (english !== undefined) return english;
      return fallback ?? key;
    },
    [dictionary],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ language, setLanguage, t, dir: isRtl(language) ? "rtl" : "ltr" }),
    [language, setLanguage, t],
  );

  useEffect(() => {
    document.documentElement.dir = value.dir;
  }, [value.dir]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside an I18nProvider");
  }
  return context;
}

/** Human-readable language name for the active code (in its own script). */
export function languageName(code: string): string {
  return lookupEnglishName(code);
}

const ENGLISH_NAMES: string[] = [
  "English",
  "Hindi",
  "Bengali",
  "Telugu",
  "Marathi",
  "Tamil",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
  "Urdu",
  "Odia",
  "Assamese",
  "Bhojpuri",
  "Maithili",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Korean",
  "Russian",
  "Arabic",
  "Persian",
  "Turkish",
  "Italian",
  "Dutch",
  "Polish",
  "Ukrainian",
  "Vietnamese",
  "Thai",
  "Indonesian",
  "Malay",
  "Romanian",
  "Greek",
  "Swedish",
  "Danish",
  "Norwegian",
  "Finnish",
  "Czech",
  "Hungarian",
  "Hebrew",
  "Swahili",
  "Serbian",
  "Bulgarian",
  "Croatian",
  "Slovak",
  "Nepali",
  "Sinhala",
  "Khmer",
  "Burmese",
  "Filipino",
  "Afrikaans",
  "Lithuanian",
  "Latvian",
  "Estonian",
  "Slovenian",
  "Amharic",
  "Georgian",
  "Armenian",
  "Azerbaijani",
  "Kazakh",
  "Uzbek",
  "Mongolian",
  "Macedonian",
  "Albanian",
  "Icelandic",
  "Irish",
  "Welsh",
  "Galician",
  "Yoruba",
  "Hausa",
  "Igbo",
  "Zulu",
];

const LANGUAGE_ENGLISH_NAMES: Record<string, string> = {};
AVAILABLE_LANGUAGES.forEach((language, index) => {
  const englishName = ENGLISH_NAMES[index];
  if (englishName) LANGUAGE_ENGLISH_NAMES[language.code] = englishName;
});

function lookupEnglishName(code: string): string {
  return LANGUAGE_ENGLISH_NAMES[code] ?? "English";
}