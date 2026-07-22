"use client";

import { useTranslations } from "next-intl";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { listOfflineQueue } from "@/lib/site-visits/offline-queue";
import { useEffect, useState } from "react";

export function OfflineBanner() {
  const t = useTranslations("siteVisits");
  const online = useOnlineStatus();
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    function refresh() {
      setQueued(listOfflineQueue().length);
    }
    refresh();
    window.addEventListener("storage", refresh);
    const id = window.setInterval(refresh, 2000);
    return () => {
      window.removeEventListener("storage", refresh);
      window.clearInterval(id);
    };
  }, []);

  if (online && queued === 0) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--accent)_16%,white)] px-4 py-2 text-sm text-[color-mix(in_srgb,var(--accent)_85%,#5c3a0a)]"
    >
      <div className="mx-auto flex max-w-3xl items-start gap-2">
        <WifiOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-medium">
            {online ? t("offline.queuedTitle") : t("offline.offlineTitle")}
          </p>
          <p className="text-xs opacity-90">
            {online
              ? t("offline.queuedHint", { count: queued })
              : t("offline.offlineHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
