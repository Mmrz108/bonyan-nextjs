"use client";

import { useEffect, useId, useRef } from "react";
import { useTranslations } from "next-intl";
import "leaflet/dist/leaflet.css";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/utils";

export type MapMarker = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  primary?: boolean;
};

type ProjectLocationMapProps = {
  markers: MapMarker[];
  className?: string;
};

export function ProjectLocationMap({ markers, className }: ProjectLocationMapProps) {
  const t = useTranslations("projects");
  const mapId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || markers.length === 0) return;

    let cancelled = false;

    async function setup() {
      const L = await import("leaflet");

      if (cancelled || !containerRef.current) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      for (const marker of markers) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:14px;height:14px;border-radius:999px;
            background:${marker.primary ? "#0b3d3a" : "#b08d57"};
            border:2px solid #fbfcfb;
            box-shadow:0 1px 4px rgba(21,32,29,.35);
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const pin = L.marker([marker.latitude, marker.longitude], { icon }).addTo(
          map,
        );
        pin.bindPopup(marker.label);
        bounds.extend([marker.latitude, marker.longitude]);
      }

      if (markers.length === 1) {
        map.setView([markers[0].latitude, markers[0].longitude], 13);
      } else {
        map.fitBounds(bounds.pad(0.25));
      }

      requestAnimationFrame(() => map.invalidateSize());
    }

    void setup();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [markers, mapId]);

  if (markers.length === 0) {
    return (
      <EmptyState
        title={t("mapEmptyTitle")}
        description={t("mapEmptyDescription")}
        className={cn("py-10", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-[var(--line)]",
        className,
      )}
    >
      <div ref={containerRef} className="h-72 w-full" dir="ltr" />
    </div>
  );
}

export function toMapMarkers(input: {
  location?: string;
  address?: string;
  latitude?: string | null;
  longitude?: string | null;
  locations?: Array<{
    id: string;
    name: string;
    latitude: string | null;
    longitude: string | null;
    is_primary: boolean;
    city?: string;
  }>;
}): MapMarker[] {
  const markers: MapMarker[] = [];

  const projectLat = Number(input.latitude);
  const projectLng = Number(input.longitude);
  if (
    input.latitude &&
    input.longitude &&
    !Number.isNaN(projectLat) &&
    !Number.isNaN(projectLng)
  ) {
    markers.push({
      id: "project-primary",
      label: input.location || input.address || "Project",
      latitude: projectLat,
      longitude: projectLng,
      primary: true,
    });
  }

  for (const loc of input.locations ?? []) {
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (
      !loc.latitude ||
      !loc.longitude ||
      Number.isNaN(lat) ||
      Number.isNaN(lng)
    ) {
      continue;
    }
    // Skip duplicate of project-level pin
    if (
      markers.some(
        (m) =>
          Math.abs(m.latitude - lat) < 1e-6 && Math.abs(m.longitude - lng) < 1e-6,
      )
    ) {
      continue;
    }
    markers.push({
      id: loc.id,
      label: [loc.name, loc.city].filter(Boolean).join(" · "),
      latitude: lat,
      longitude: lng,
      primary: loc.is_primary,
    });
  }

  return markers;
}
