import type { ChatStyle } from "@weathergpt/shared";

// Pure, testable heuristics for guessing a message's conversational style.
// They only vote on the *response* style; the AI still does the real work.

const DEVANAGARI = /[\u0900-\u097F]/;
const BENGALI_SCRIPT = /[\u0980-\u09FF]/;
const GURMUKHI = /[\u0A00-\u0A7F]/;
const GUJARATI = /[\u0A80-\u0AFF]/;
const ORIYA = /[\u0B00-\u0B7F]/;
const TAMIL_SCRIPT = /[\u0B80-\u0BFF]/;
const TELUGU = /[\u0C00-\u0C7F]/;
const KANNADA = /[\u0C80-\u0CFF]/;
const MALAYALAM = /[\u0D00-\u0D7F]/;
const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

// Romanized Hindi / Hinglish markers (case-insensitive).
const HINGLISH_WORDS = [
  "kya", "hai", "hain", "bhai", "nhi", "nahi", "nai", "kal", "aaj", "tum",
  "mujhe", "apna", "hum", "acha", "accha", "baarish", "garmi", "sardi",
  "mausam", "kaisa", "kaise", "hai?", "jaldi", "thoda", "bahut", "kholo",
  "jaana", "jao", "aana", "aao", "dost", "sahi", "theek", "chalo", "bhi",
];

// Romanized Bengali / Banglish markers.
const BANGLISH_WORDS = [
  "hobe", "hoye", "naki", "brishti", "aaj", "kal", "kemon", "kemon?", "ki",
  "jabe", "jete", "chai", "na", "amake", "tomar", "amar", "dorkar", "kichu",
  "bhai", "bari", "kaj", "porbe", "sombhob", "vai", "kothay", "eibar", "tokhon",
];

// Romanized Tamil / Tanglish markers.
const TANGLISH_WORDS = [
  "varuma", "varumaa", "indru", "naala", "naalai", "mazhai", "epdi", "eppadi",
  "inga", "anga", "irukku", "ithu", "apdi", "summa", "vera", "poga", "pogauma",
  "theriyuma", "romba", "illa", "illai", "nan", "enakku", "ungal", "pannu",
];

function countMatches(text: string, words: string[]): number {
  const lower = ` ${text.toLowerCase()} `;
  return words.reduce((count, word) => {
    const pattern = new RegExp(`(?<![a-z])${escapeRegExp(word)}(?![a-z])`, "g");
    const matches = lower.match(pattern);
    return count + (matches ? matches.length : 0);
  }, 0);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Infer the conversational style of a user message. Returns `auto` when no
 * strong signal is found (so the model decides).
 */
export function detectChatStyle(message: string): ChatStyle {
  if (!message || !message.trim()) return "auto";
  const text = message.trim();

  if (DEVANAGARI.test(text)) return "hindi";
  if (BENGALI_SCRIPT.test(text)) return "bengali";
  if (GURMUKHI.test(text)) return "punjabi";
  if (GUJARATI.test(text)) return "gujarati";
  if (ORIYA.test(text)) return "odia";
  if (TAMIL_SCRIPT.test(text)) return "tamil";
  if (TELUGU.test(text)) return "telugu";
  if (KANNADA.test(text)) return "kannada";
  if (MALAYALAM.test(text)) return "malayalam";
  if (ARABIC_SCRIPT.test(text)) return "urdu";

  const hinglish = countMatches(text, HINGLISH_WORDS);
  const banglish = countMatches(text, BANGLISH_WORDS);
  const tanglish = countMatches(text, TANGLISH_WORDS);

  if (tanglish > 0 && tanglish > banglish && tanglish >= hinglish) return "tanglish";
  if (banglish > 0 && banglish > hinglish && banglish > tanglish) return "banglish";
  if (hinglish > 0 && hinglish > banglish && hinglish > tanglish) return "hinglish";

  return "auto";
}

/** Short human-friendly label for a chat style (English UI strings). */
export const CHAT_STYLE_LABELS: Record<ChatStyle, string> = {
  auto: "Mixed / Auto detect",
  english: "English",
  "simple-english": "Simple English",
  hindi: "Hindi",
  bengali: "Bengali",
  hinglish: "Hinglish",
  banglish: "Banglish",
  tanglish: "Tanglish",
  tamil: "Tamil",
  telugu: "Telugu",
  kannada: "Kannada",
  malayalam: "Malayalam",
  gujarati: "Gujarati",
  punjabi: "Punjabi",
  odia: "Odia",
  marathi: "Marathi",
  urdu: "Urdu",
};

/** Ordered list used to render the style picker. */
export const CHAT_STYLE_OPTIONS: ChatStyle[] = [
  "auto",
  "english",
  "simple-english",
  "hindi",
  "hinglish",
  "bengali",
  "banglish",
  "tamil",
  "tanglish",
  "telugu",
  "kannada",
  "malayalam",
  "gujarati",
  "punjabi",
  "odia",
  "marathi",
  "urdu",
];
