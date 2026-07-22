"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Crosshair, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureGps, isGeoError, type GeoCoordinates } from "@/lib/site-visits/geo";

type GpsCaptureProps = {
  value: GeoCoordinates | null;
  onChange: (value: GeoCoordinates | null) => void;
  required?: boolean;
};

export function GpsCapture({ value, onChange, required }: GpsCaptureProps) {
  const t = useTranslations("siteVisits");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function capture() {
    setLoading(true);
    setError(null);
    try {
      const coords = await captureGps();
      onChange(coords);
    } catch (err) {
      onChange(null);
      if (isGeoError(err)) {
        setError(t(`gps.${err.code}`));
      } else {
        setError(t("gps.unavailable"));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Auto-attempt once for required actions when empty.
    if (required && !value) {
      void capture();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [required]);

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            {t("gps.label")}
            {required ? " *" : ""}
          </p>
          {value ? (
            <p className="mt-1 font-mono text-xs tabular-nums text-[var(--ink)]" dir="ltr">
              {value.latitude}, {value.longitude}
              {value.accuracy != null
                ? ` (±${Math.round(value.accuracy)}m)`
                : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--muted)]">{t("gps.empty")}</p>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => void capture()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair className="h-4 w-4" />
          )}
          {t("gps.capture")}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
