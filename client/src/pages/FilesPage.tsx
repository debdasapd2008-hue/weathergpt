import { FileImage } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/i18n";
import { Card, PageHeader } from "@/components/Page";
import { ImageQnA, type ImageMime } from "@/components/ImageQnA";

const MAX_BYTES = 5 * 1024 * 1024;

function normalizeMime(type: string): ImageMime {
  const normalized = type.toLowerCase().replace("image/jpg", "image/jpeg");
  if (normalized === "image/jpeg" || normalized === "image/png" || normalized === "image/webp" || normalized === "image/gif") {
    return normalized;
  }
  return "image/jpeg";
}

export function FilesPage() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<{ dataUrl: string; mime: ImageMime } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setInputKey((key) => key + 1);
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError(t("files.tooLarge", "That image is too large. Please choose one under 5 MB."));
      setSelected(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(t("files.invalidType", "Please choose a JPG, PNG or WebP image."));
      setSelected(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        setSelected({ dataUrl: result, mime: normalizeMime(file.type) });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <PageHeader
        icon={FileImage}
        title={t("nav.files", "Files")}
        intro={t("files.intro", "Upload a plant, receipt or photo — the AI can read it if a vision model is enabled.")}
        index="15"
      />

      {selected ? (
        <ImageQnA
          dataUrl={selected.dataUrl}
          mime={selected.mime}
          onReplace={() => {
            setSelected(null);
            setError(null);
          }}
        />
      ) : (
        <Card className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
            <FileImage size={26} aria-hidden="true" />
          </span>
          <p className="max-w-md text-sm text-ink-2 dark:text-white/55">
            {t("nav.files", "Files")} — {t("files.intro", "Upload a plant, receipt or photo — the AI can read it if a vision model is enabled.")}
          </p>
          <label className="btn-primary cursor-pointer px-5 py-2.5 text-sm">
            <FileImage size={16} aria-hidden="true" /> {t("files.upload", "Choose an image")}
            <input key={inputKey} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={handleFile} />
          </label>
          {error && (
            <p role="alert" className="text-sm text-rose-500">
              {error}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}