export type GeoCoordinates = {
  latitude: string;
  longitude: string;
  accuracy?: number;
};

export class GeoError extends Error {
  code: "unsupported" | "denied" | "unavailable" | "timeout";

  constructor(code: GeoError["code"], message: string) {
    super(message);
    this.name = "GeoError";
    this.code = code;
  }
}

export function formatCoord(value: number, digits = 7): string {
  return value.toFixed(digits);
}

export async function captureGps(
  options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 20_000,
    maximumAge: 5_000,
  },
): Promise<GeoCoordinates> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    throw new GeoError("unsupported", "Geolocation is not available on this device.");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: formatCoord(position.coords.latitude),
          longitude: formatCoord(position.coords.longitude),
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new GeoError("denied", "Location permission was denied."));
          return;
        }
        if (error.code === error.TIMEOUT) {
          reject(new GeoError("timeout", "Timed out while reading GPS."));
          return;
        }
        reject(new GeoError("unavailable", "Could not determine location."));
      },
      options,
    );
  });
}

export function isGeoError(error: unknown): error is GeoError {
  return error instanceof GeoError;
}
