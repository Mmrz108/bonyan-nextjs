export type MapMarker = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  primary?: boolean;
};

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
