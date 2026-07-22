"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Camera, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CameraCaptureProps = {
  file: File | null;
  onChange: (file: File | null) => void;
  className?: string;
};

export function CameraCapture({ file, onChange, className }: CameraCaptureProps) {
  const t = useTranslations("siteVisits");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const inputId = useMemo(() => `camera-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-2">
        <label htmlFor={`${inputId}-camera`}>
          <span className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-[var(--brand)] px-4 text-sm font-medium text-[var(--brand-contrast)]">
            <Camera className="h-4 w-4" />
            {t("camera.takePhoto")}
          </span>
          <input
            id={`${inputId}-camera`}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              onChange(next);
            }}
          />
        </label>
        <label htmlFor={`${inputId}-gallery`}>
          <span className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--line)] bg-[var(--surface-elevated)] px-4 text-sm font-medium text-[var(--ink)]">
            <ImagePlus className="h-4 w-4" />
            {t("camera.chooseGallery")}
          </span>
          <input
            id={`${inputId}-gallery`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const next = event.target.files?.[0] ?? null;
              onChange(next);
            }}
          />
        </label>
        {file ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => onChange(null)}
          >
            <X className="h-4 w-4" />
            {t("camera.remove")}
          </Button>
        ) : null}
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={t("camera.previewAlt")}
            className="max-h-72 w-full object-contain"
          />
          <p className="truncate border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]">
            {file?.name} · {Math.round((file?.size || 0) / 1024)} KB
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
          {t("camera.empty")}
        </div>
      )}
    </div>
  );
}
