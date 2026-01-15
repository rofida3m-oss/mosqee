/* ================= Constants ================= */

const EARTH_RADIUS_KM = 6371;

/* ================= Utilities ================= */

const degToRad = (deg: number): number => (deg * Math.PI) / 180;

const isValidLatLng = (lat: number, lng: number): boolean =>
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

/* ================= Distance ================= */

interface DistanceOptions {
  unit?: "km" | "m";
  precision?: number;
}

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  options: DistanceOptions = {}
): number => {
  if (
    !isValidLatLng(lat1, lon1) ||
    !isValidLatLng(lat2, lon2)
  ) {
    console.warn("Invalid latitude or longitude values");
    return 0;
  }

  const { unit = "km", precision = 1 } = options;

  const dLat = degToRad(lat2 - lat1);
  const dLon = degToRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degToRad(lat1)) *
      Math.cos(degToRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  let distance = EARTH_RADIUS_KM * c;

  if (unit === "m") {
    distance *= 1000;
  }

  return Number(distance.toFixed(precision));
};
