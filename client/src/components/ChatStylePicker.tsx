import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ChatStyle } from "@weathergpt/shared";
import { CHAT_STYLE_LABELS, CHAT_STYLE_OPTIONS } from "@/lib/chatStyle";
import { cn } from "@/lib/cn";

/**
 * Dropdown used to choose the reply language/style. Shared by the chat
 * composer and the Settings page so there is a single source of truth.
 */
export function ChatStylePicker({
  value,
  onChange,
  align = "right",
  compact = false,
}: {
  value: ChatStyle;
  onChange: (style: ChatStyle) => void;
  align?: "left" | "right";
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Chat language and style"
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-600/10 font-medium text-teal-700 transition hover:bg-teal-600/15 dark:border-teal-400/25 dark:text-teal-200",
          compact ? "px-3 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
        )}
      >
        <Check size={compact ? 12 : 13} aria-hidden="true" />
        <span className="max-w-[180px] truncate">{CHAT_STYLE_LABELS[value]}</span>
        <ChevronDown size={compact ? 12 : 13} aria-hidden="true" className={cn("transition", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            role="listbox"
            aria-label="Chat language and style"
            className={cn(
              "absolute z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-2xl border border-line bg-white/95 p-2 shadow-xl backdrop-blur dark:border-white/10 dark:bg-slate-900/95",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            {CHAT_STYLE_OPTIONS.map((style) => (
              <button
                key={style}
                type="button"
                role="option"
                aria-selected={value === style}
                onClick={() => {
                  onChange(style);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-teal-600/10"
              >
                <span>{CHAT_STYLE_LABELS[style]}</span>
                {value === style && (
                  <Check size={14} aria-hidden="true" className="shrink-0 text-teal-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}