import { useCallback, useEffect, useRef, useState } from "react";

// ---- Type helpers for these (partially untyped) browser APIs ----

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    length: number;
    [index: number]: { transcript: string };
  }>;
}

interface SpeechRecognitionErrorLike {
  error: string;
  message?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructorLike {
  new (): SpeechRecognitionLike;
}

function getSpeechRecognition(): SpeechRecognitionConstructorLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructorLike;
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function speechRecognitionSupported(): boolean {
  return getSpeechRecognition() !== null;
}

export interface SpeechRecognitionState {
  /** True while the mic is actively listening. */
  listening: boolean;
  /** True if the browser does not support speech recognition. */
  unsupported: boolean;
  /** Mapping from the raw API error name to a friendly message. */
  error: string | null;
  /** Live combined transcript (final + interim) while listening. */
  transcript: string;
  /** Start listening. */
  start: () => void;
  /** Stop listening. */
  stop: () => void;
}

/**
 * Browser-native speech-to-text. Only listens while `start()` has been called
 * by an explicit user action — it never runs in a loop by itself.
 */
export function useSpeechRecognition(lang = "en-US"): SpeechRecognitionState {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const [listening, setListening] = useState(false);
  const [unsupported] = useState<boolean>(() => !speechRecognitionSupported());
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");

  const buildRecognition = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return null;
    const recognition = new Ctor();
    recognition.lang = lang || "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;
    return recognition;
  }, [lang]);

  const start = useCallback(() => {
    if (speechRecognitionSupported() === false) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    setError(null);
    finalRef.current = "";
    setTranscript("");
    const recognition = buildRecognition();
    if (!recognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result) continue;
        if (result.isFinal) {
          const alt = result[0];
          if (alt) finalRef.current += ` ${alt.transcript}`.trim();
        } else {
          const alt = result[0];
          if (alt) interim += alt.transcript;
        }
      }
      setTranscript(`${finalRef.current}${interim ? ` ${interim}` : ""}`.trim());
    };

    recognition.onerror = (event) => {
      const code = event.error;
      let message: string;
      switch (code) {
        case "not-allowed":
        case "service-not-allowed":
        case "not-allowed-error":
          message = "Microphone permission was denied. Allow it in your browser and try again.";
          break;
        case "no-speech":
          message = "I could not hear anything. Please try again.";
          break;
        case "network":
          message = "Speech recognition is unavailable right now (network error).";
          break;
        case "audio-capture":
          message = "No microphone is available on this device.";
          break;
        case "aborted":
          message = null as unknown as string;
          break;
        default:
          message = "Speech recognition had an error. Please try again.";
      }
      if (message) setError(message);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start the microphone right now.");
      setListening(false);
    }
  }, [buildRecognition]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return { listening, unsupported, error, transcript, start, stop };
}

// ---- Speech synthesis (read-aloud) ----

export function speechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface SpeechSynthesisState {
  supported: boolean;
  /** Language code currently being spoken (for highlighting the bubble). */
  speakingKey: string | null;
  speak: (text: string, key: string) => void;
  cancel: () => void;
  /** Pause/resume toggle. */
  toggle: (text: string, key: string) => void;
}

/**
 * Browser-native text-to-speech used to read AI responses aloud. Falls back
 * gracefully (unsupported browsers simply report `supported: false`).
 */
export function useSpeechSynthesis(): SpeechSynthesisState {
  const [supported] = useState<boolean>(() => speechSynthesisSupported());
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const currentTextRef = useRef<string | null>(null);
  const currentKeyRef = useRef<string | null>(null);

  const cancel = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeakingKey(null);
    currentTextRef.current = null;
    currentKeyRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string, key: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      if (!text.trim()) return;
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((voice) => voice.lang.startsWith("hi"));
      if (preferred) utterance.voice = preferred;
      utterance.lang = preferred ? preferred.lang : "en-US";
      utterance.onend = () => setSpeakingKey(null);
      utterance.onerror = () => setSpeakingKey(null);
      currentTextRef.current = text;
      currentKeyRef.current = key;
      setSpeakingKey(key);
      window.speechSynthesis.speak(utterance);
    },
    [],
  );

  const toggle = useCallback(
    (text: string, key: string) => {
      if (speakingKey === key) {
        cancel();
      } else {
        speak(text, key);
      }
    },
    [speakingKey, speak, cancel],
  );

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { supported, speakingKey, speak, cancel, toggle };
}

// ---- Attachment helpers ----

export interface AttachmentFile {
  id: string;
  name: string;
  kind: "image" | "pdf" | "text" | "other";
  dataUrl: string | null;
  size: number;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_BYTES = 8 * 1024 * 1024;

export type AttachmentCheckResult =
  | { ok: true; file: AttachmentFile }
  | { ok: false; error: string };

function guessKind(name: string, type: string): AttachmentFile["kind"] {
  if (type.startsWith("image/")) return "image";
  if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) return "pdf";
  if (type.startsWith("text/") || name.toLowerCase().endsWith(".txt")) return "text";
  return "other";
}

/**
 * Validate + read a selected file into a data URL. Images are sent to the
 * vision endpoint; other files just travel as metadata alongside the text.
 * Returns a readable error instead of throwing.
 */
export function readAttachment(file: File): Promise<AttachmentCheckResult> {
  return new Promise((resolve) => {
    const isImage = file.type.startsWith("image/");
    const sizeLimit = isImage ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
    if (file.size > sizeLimit) {
      resolve({
        ok: false,
        error: isImage
          ? "That image is too large. Please choose one under 5 MB."
          : "That file is too large. Please choose one under 8 MB.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      resolve({
        ok: true,
        file: {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          kind: guessKind(file.name, file.type),
          dataUrl,
          size: file.size,
        },
      });
    };
    reader.onerror = () => {
      resolve({ ok: false, error: "That file could not be read." });
    };
    // Read non-image files as well (data URL keeps the payload self-contained).
    reader.readAsDataURL(file);
  });
}
