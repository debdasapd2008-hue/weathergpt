import { Camera, Loader2, Send, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useI18n } from "@/i18n";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

export type ImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export interface ImageQnAProps {
  dataUrl: string;
  mime: ImageMime;
  onReplace?: () => void;
}

export function ImageQnA({ dataUrl, mime, onReplace }: ImageQnAProps) {
  const { t, language } = useI18n();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnswer(null);
    setError(null);
    setSupported(true);
    setQuestion("");
  }, [dataUrl]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    void api
      .askImage({ dataUrl, mime, question: text, language })
      .then((response) => {
        if (!response.supported) {
          setSupported(false);
          setError(response.reason ?? t("camera.notSupported", "Image analysis is not enabled."));
          return;
        }
        setAnswer(response.answer);
      })
      .catch((requestError: unknown) => {
        const apiError = requestError instanceof ApiError ? requestError : null;
        setError(apiError?.message ?? t("ai.failed", "The AI provider could not answer right now."));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <div className="animate-fade-up space-y-4">
      <div className="panel overflow-hidden p-3">
        <img
          src={dataUrl}
          alt="Captured or uploaded"
          className="max-h-96 w-full rounded-2xl object-contain"
        />
        {onReplace && (
          <button
            type="button"
            onClick={onReplace}
            className="btn-ghost mt-3 w-full justify-center py-2 text-sm"
          >
            <Camera size={15} aria-hidden="true" /> {t("camera.retake", "Retake")}
          </button>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400"
        >
          <X size={15} className="shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {answer === null && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label className="sr-only" htmlFor="image-question">
            Ask about this image
          </label>
          <input
            id="image-question"
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={loading}
            placeholder={t("files.ask", "Describe what you want to know about this image.")}
            autoComplete="off"
            className="field-input min-w-0 flex-1 px-4 py-2.5"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            aria-label="Ask about the image"
            className="btn-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-0"
          >
            {loading ? (
              <Loader2 size={17} aria-hidden="true" className="animate-spin" />
            ) : (
              <Send size={17} aria-hidden="true" />
            )}
          </button>
        </form>
      )}

      {answer !== null && (
        <div className={cn("panel p-5", supported ? "" : "opacity-80")}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink dark:text-white/85">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}