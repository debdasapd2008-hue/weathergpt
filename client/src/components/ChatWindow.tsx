import {
  Copy,
  Eraser,
  FilePlus2,
  ImagePlus,
  Mic,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Volume2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/cn";
import {
  readAttachment,
  useSpeechRecognition,
  useSpeechSynthesis,
  type AttachmentFile,
} from "@/lib/speech";
import type { ChatAttachment, ChatMessageView } from "@/hooks/useAIChat";
import { ChatStylePicker } from "@/components/ChatStylePicker";
import { useSettings } from "@/stores/settings";

function avatarInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return ((parts[0] as string).slice(0, 2) ?? "?").toUpperCase();
  const first = (parts[0] as string)[0] ?? "";
  const last = (parts[parts.length - 1] as string)[0] ?? "";
  return (first + last).toUpperCase();
}

function formatTime(epoch: number): string {
  try {
    return new Date(epoch).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function UserBubble({ message }: { message: ChatMessageView }) {
  return (
    <div className="flex items-end justify-end gap-2.5">
      <div className="flex max-w-[80%] flex-col items-end gap-1">
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {message.attachments.map((att) =>
              att.kind === "image" && att.dataUrl ? (
                <img
                  key={att.id}
                  src={att.dataUrl}
                  alt={att.name}
                  className="h-16 w-16 rounded-xl border border-teal-500/30 object-cover"
                />
              ) : (
                <span
                  key={att.id}
                  className="flex items-center gap-1 rounded-lg border border-line bg-white/80 px-2 py-1 text-[11px] text-ink-2 dark:border-white/10 dark:bg-navy-night/60 dark:text-white/60"
                >
                  📎 {att.name}
                </span>
              ),
            )}
          </div>
        )}
        <div className="rounded-2xl rounded-br-sm bg-teal-600 px-4 py-2.5 text-sm text-white shadow-sm">
          {message.content || "📎"}
        </div>
        {message.createdAt > 0 && (
          <span className="text-[10px] text-ink-3 dark:text-white/40">{formatTime(message.createdAt)}</span>
        )}
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[11px] font-bold text-white">
        {avatarInitials("You")}
      </span>
    </div>
  );
}

function AssistantBubble({
  message,
  speakingKey,
  onToggleSpeech,
  speechSupported,
  onRegenerate,
  onCopy,
}: {
  message: ChatMessageView;
  speakingKey: string | null;
  onToggleSpeech: (text: string, key: string) => void;
  speechSupported: boolean;
  onRegenerate?: () => void;
  onCopy: (text: string) => void;
}) {
  const isSpeaking = speakingKey === message.id;
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
        <Sparkles size={15} aria-hidden="true" />
      </span>
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-bl-sm border border-teal-500/25 bg-teal-500/[0.07] px-4 py-2.5 text-sm leading-relaxed text-ink dark:text-white/80">
          {message.content}
        </div>
        <div className="mt-1 flex items-center gap-1 text-ink-3 dark:text-white/40">
          {message.createdAt > 0 && <span className="px-1 text-[10px]">{formatTime(message.createdAt)}</span>}
          <button
            type="button"
            onClick={() => onCopy(message.content)}
            aria-label="Copy response"
            title="Copy response"
            className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-200"
          >
            <Copy size={13} aria-hidden="true" />
          </button>
          {speechSupported && (
            <button
              type="button"
              onClick={() => onToggleSpeech(message.content, message.id)}
              aria-label={isSpeaking ? "Stop speaking" : "Read aloud"}
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-teal-500/10",
                isSpeaking ? "text-teal-700 dark:text-teal-300" : "hover:text-teal-700 dark:hover:text-teal-200",
              )}
            >
              {isSpeaking ? <Square size={13} aria-hidden="true" /> : <Volume2 size={13} aria-hidden="true" />}
            </button>
          )}
          {onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              aria-label="Regenerate response"
              title="Regenerate response"
              className="flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-200"
            >
              <RefreshCw size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
        <Sparkles size={15} aria-hidden="true" />
      </span>
      <div
        className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-sm border border-teal-500/25 bg-teal-500/10 px-4 py-3"
        aria-label="AI is typing"
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-dot-bounce h-1.5 w-1.5 rounded-full bg-teal-600"
            style={{ animationDelay: `${i * 130}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function AttachmentPreview({
  attachments,
  onRemove,
}: {
  attachments: AttachmentFile[];
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) return null;
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="relative flex items-center gap-2 rounded-xl border border-line bg-white/80 p-1.5 pr-2 dark:border-white/10 dark:bg-navy-night/60"
        >
          {att.kind === "image" && att.dataUrl ? (
            <img src={att.dataUrl} alt={att.name} className="h-9 w-9 rounded-lg object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-lg">
              📎
            </span>
          )}
          <span className="max-w-[120px] truncate text-xs text-ink-2 dark:text-white/60">
            {att.name}
          </span>
          <button
            type="button"
            onClick={() => onRemove(att.id)}
            aria-label={`Remove ${att.name}`}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-3 transition hover:bg-rose-500/10 hover:text-rose-500 dark:text-white/40"
          >
            <X size={12} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

export interface ChatWindowProps {
  messages: ChatMessageView[];
  input: string;
  setInput: (value: string) => void;
  loading: boolean;
  error: string | null;
  onSend: (question: string, attachments?: ChatAttachment[]) => void;
  onRegenerate?: () => void;
  onClear?: () => void;
  placeholder: string;
  suggested?: string[];
  disabled?: boolean;
  disabledHint?: string;
  headerNote?: string;
  showStylePicker?: boolean;
}

export function ChatWindow({
  messages,
  input,
  setInput,
  loading,
  error,
  onSend,
  onRegenerate,
  onClear,
  placeholder,
  suggested = [],
  disabled = false,
  disabledHint,
  headerNote,
  showStylePicker = true,
}: ChatWindowProps) {
  const { t } = useI18n();
  const { chatStyle, setChatStyle } = useSettings();
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [imageKey, setImageKey] = useState(0);
  const [fileKey, setFileKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const speech = useSpeechRecognition();
  const synth = useSpeechSynthesis();

  // Live transcription from the microphone is written into the input.
  useEffect(() => {
    if (speech.transcript) setInput(speech.transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript]);

  useEffect(() => {
    if (speech.listening) setAttachmentError(null);
  }, [speech.listening]);

  useEffect(() => {
    if (messages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const copy = useCallback(
    (text: string) => {
      const id = messages.find((m) => m.content === text)?.id ?? "";
      void navigator.clipboard?.writeText(text).then(() => {
        setCopiedId(id);
        window.setTimeout(() => setCopiedId(null), 1500);
      });
    },
    [messages],
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if ((!text && attachments.length === 0) || loading || disabled) return;
    const boxed = attachments.map((a) => ({
      id: a.id,
      kind: a.kind,
      name: a.name,
      dataUrl: a.dataUrl,
    }));
    onSend(text, boxed.length > 0 ? boxed : undefined);
    setAttachments([]);
    setAttachmentError(null);
    if (speech.listening) speech.stop();
  }

  function toggleListening() {
    if (speech.listening) {
      const final = input.trim();
      speech.stop();
      if (final) setInput(final);
      return;
    }
    speech.start();
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    setAttachmentError(null);
    Array.from(files).forEach((file) => {
      void readAttachment(file).then((result) => {
        if (result.ok) {
          setAttachments((current) => [...current, result.file]);
        } else {
          setAttachmentError(result.error);
        }
      });
    });
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
    setImageKey((k) => k + 1);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    addFiles(event.target.files);
    setFileKey((k) => k + 1);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
  }

  const removeAttachment = (id: string) =>
    setAttachments((current) => current.filter((a) => a.id !== id));

  const micDisabled = disabled || loading || speech.unsupported;

  return (
    <div className="panel p-5">
      {disabled && disabledHint && (
        <p className="mb-3 rounded-xl border border-dashed border-line bg-ink/[0.03] px-3 py-2.5 text-sm text-ink-2 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
          {disabledHint}
        </p>
      )}

      {headerNote && messages.length > 0 && (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-ink-3 dark:text-white/40">{headerNote}</p>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {messages.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label={t("ai.clear", "Clear chat")}
            title={t("ai.clear", "Clear chat")}
            className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-ink-2 transition hover:border-rose-400 hover:text-rose-500 dark:border-white/10 dark:text-white/50"
          >
            <Eraser size={13} aria-hidden="true" /> {t("ai.clear", "Clear")}
          </button>
        )}
        {showStylePicker && (
          <ChatStylePicker value={chatStyle} onChange={setChatStyle} compact />
        )}
      </div>

      {messages.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-ink-2 dark:text-white/55">
            {t("chat.intro", "Chat about anything — tips, ideas, facts — in your own language.")}
          </p>
          {suggested.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggested.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={loading || disabled}
                  onClick={() => onSend(question)}
                  className="chip"
                >
                  {question}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div ref={scrollRef} className="max-h-[420px] space-y-3 overflow-y-auto pr-1" onDrop={handleDrop} onDragOver={handleDragOver}>
          {messages.map((message) =>
            message.role === "user" ? (
              <UserBubble key={message.id} message={message} />
            ) : (
              <AssistantBubble
                key={message.id}
                message={message}
                speakingKey={synth.speakingKey}
                onToggleSpeech={synth.toggle}
                speechSupported={synth.supported}
                onRegenerate={onRegenerate}
                onCopy={copy}
              />
            ),
          )}
          {loading && <TypingIndicator />}
        </div>
      )}

      {(error || speech.error || attachmentError) && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm text-rose-600 dark:text-rose-400"
        >
          <X size={15} className="shrink-0" aria-hidden="true" />
          {error ?? speech.error ?? attachmentError}
        </div>
      )}

      {/* Recording indicator (not color-only). */}
      {speech.listening && (
        <p role="status" className="mt-2 flex items-center gap-2 text-xs font-medium text-teal-700 dark:text-teal-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500" />
          </span>
          {t("voice.recording", "Listening…")} — {t("voice.tapToStop", "tap the mic to stop")}
        </p>
      )}

      <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />

      <form onSubmit={handleSubmit} className="mt-4 flex items-end gap-2" onDrop={handleDrop} onDragOver={handleDragOver}>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <label className="sr-only" htmlFor="chat-question">
            {disabled ? "Chat is disabled" : "Write a message"}
          </label>
          <div className="flex min-w-0 items-center gap-1.5 rounded-full border border-line bg-white/80 pl-2 pr-1.5 transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/25 dark:border-white/10 dark:bg-white/[0.06]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={t("voice.attachFile", "Attach a file")}
              title={t("voice.attachFile", "Attach a file")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 transition hover:bg-teal-500/10 hover:text-teal-700 disabled:opacity-40 dark:text-white/40 dark:hover:text-teal-300"
              disabled={disabled || loading}
            >
              <FilePlus2 size={18} aria-hidden="true" />
            </button>
            <input
              ref={fileInputRef}
              key={fileKey}
              type="file"
              multiple
              accept=".pdf,.txt,.md,.csv,text/plain,text/markdown,application/pdf"
              className="sr-only"
              onChange={handleFileChange}
            />
            <input
              id="chat-question"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={disabled || loading || speech.listening}
              placeholder={placeholder}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-ink-3 disabled:opacity-50 dark:placeholder:text-white/35"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleListening()}
          aria-label={speech.listening ? "Stop recording" : "Start voice input"}
          role="switch"
          aria-checked={speech.listening}
          aria-live="polite"
          title={
            speech.unsupported
              ? "Voice input is not supported in this browser"
              : speech.listening
                ? "Stop recording"
                : "Start voice input"
          }
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition active:scale-95",
            speech.listening
              ? "animate-pulse border-rose-400 bg-rose-500 text-white shadow-md"
              : "border-line text-ink-2 hover:border-rose-400 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white/55",
          )}
          disabled={micDisabled}
        >
          {speech.listening ? <Square size={16} aria-hidden="true" /> : <Mic size={17} aria-hidden="true" />}
        </button>

        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line text-ink-2 transition hover:border-teal-400 hover:text-teal-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white/55 dark:hover:border-teal-400/50 dark:hover:text-teal-300">
          <span className="sr-only">{t("voice.attachImage", "Attach an image")}</span>
          <ImagePlus size={17} aria-hidden="true" />
          <input
            key={imageKey}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            disabled={disabled || loading}
            onChange={handleImageChange}
          />
        </label>

        <button
          type="submit"
          disabled={disabled || loading || (!input.trim() && attachments.length === 0)}
          aria-label="Send message"
          className="btn-primary h-11 w-11 !px-0"
        >
          <Send size={17} aria-hidden="true" />
        </button>
      </form>

      {copiedId && (
        <p role="status" className="mt-2 text-xs font-medium text-emerald-500">
          {t("voice.copied", "Copied to clipboard")}
        </p>
      )}
    </div>
  );
}
