/**
 * Shared geofencing math for office locations — used by the ESS clock-in/
 * out flow to decide "is this employee inside an assigned location's
 * area". A location is either a "circle" (radiusMeters around lat/lng,
 * the original/default shape) or a "polygon" (an arbitrary list of
 * vertices, for compounds a single radius either misses corners of or
 * spills onto public roads — user, 2026-11-09).
 */

export interface GeofenceLocation {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  shapeType: string | null;
  polygonPoints: { lat: number; lng: number }[] | null;
}

/** Haversine distance in meters between two lat/lng points. */
export function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/** Standard ray-casting point-in-polygon test. Treats (lng, lat) as plane coordinates — fine at office-compound scale, no need for spherical geometry. */
export function isPointInPolygon(lat: number, lng: number, polygon: { lat: number; lng: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** True if (lat, lng) falls inside this one office location's geofence, whichever shape it uses. */
export function isWithinLocation(lat: number, lng: number, location: GeofenceLocation): boolean {
  if (location.shapeType === "polygon" && location.polygonPoints && location.polygonPoints.length >= 3) {
    return isPointInPolygon(lat, lng, location.polygonPoints);
  }
  if (location.latitude == null || location.longitude == null) return false;
  return distanceMeters(lat, lng, location.latitude, location.longitude) <= location.radiusMeters;
}

/** True if (lat, lng) is within ANY of the given locations — "jika di set lebih dari 1 bisa didalam radius salah satu lokasi" (user, 2026-11-09). */
export function isWithinAnyLocation(lat: number, lng: number, locations: GeofenceLocation[]): boolean {
  return locations.some((loc) => isWithinLocation(lat, lng, loc));
}
