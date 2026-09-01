import { Camera, CameraOff, ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/i18n";
import { Card, PageHeader } from "@/components/Page";
import { ImageQnA, type ImageMime } from "@/components/ImageQnA";

function captureErrorText(): string {
  return "The camera is unavailable in this browser.";
}

export function CameraPage() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<{ dataUrl: string; mime: ImageMime } | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function openCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(captureErrorText());
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setPreview(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError(captureErrorText());
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setPreview(false);
  }

  function capture() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    setCaptured({ dataUrl, mime: "image/jpeg" });
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileInputKey((key) => key + 1);
    if (!file) return;
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError(t("files.tooLarge", "That image is too large. Please choose one under 5 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (result) {
        stopCamera();
        setCaptured({ dataUrl: result, mime: normalizeMime(file.type) });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <PageHeader
        icon={Camera}
        title={t("nav.camera", "Camera")}
        intro={t("camera.intro", "Take a photo and ask the AI to identify or explain it.")}
        index="14"
      />

      {captured ? (
        <ImageQnA
          dataUrl={captured.dataUrl}
          mime={captured.mime}
          onReplace={() => {
            setCaptured(null);
            setPreview(false);
          }}
        />
      ) : (
        <Card>
          {preview ? (
            <div>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full rounded-2xl bg-slate-950"
                aria-label="Live camera preview"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={capture}
                  className="btn-primary flex flex-1 items-center justify-center gap-2 py-2.5 text-sm"
                >
                  <Camera size={16} aria-hidden="true" /> {t("camera.takePhoto", "Take a photo")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setError(null);
                  }}
                  className="btn-ghost items-center justify-center gap-2 px-4 py-2.5 text-sm"
                >
                  <CameraOff size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-lg">
                <Camera size={26} aria-hidden="true" />
              </span>
              <p className="text-sm text-ink-2 dark:text-white/55">
                Open the camera to take a photo, or choose an image from your device.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void openCamera()}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  <Camera size={16} aria-hidden="true" /> {t("camera.takePhoto", "Take a photo")}
                </button>
                <label className="btn-ghost cursor-pointer px-4 py-2 text-sm">
                  <ImagePlus size={16} aria-hidden="true" /> {t("files.upload", "Choose an image")}
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFile}
                  />
                </label>
              </div>
              {error && (
                <p role="alert" className="text-sm text-rose-500">
                  {error}
                </p>
              )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function normalizeMime(type: string): ImageMime {
  const normalized = type.toLowerCase().replace("image/jpg", "image/jpeg");
  if (normalized === "image/jpeg" || normalized === "image/png" || normalized === "image/webp" || normalized === "image/gif") {
    return normalized;
  }
  return "image/jpeg";
}