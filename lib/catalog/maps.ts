function encodeQuery(value: string): string {
  return encodeURIComponent(value).replace(/'/g, "%27");
}

export function mapCoordinates(
  latitude?: number,
  longitude?: number,
): { latitude: number; longitude: number } | undefined {
  if (latitude === undefined || longitude === undefined) return undefined;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;
  return { latitude, longitude };
}

export function googleMapsHref(
  latitude?: number,
  longitude?: number,
  name?: string,
): string | undefined {
  const coords = mapCoordinates(latitude, longitude);
  if (!coords) return undefined;
  const query = name?.trim()
    ? `${name.trim()} ${coords.latitude},${coords.longitude}`
    : `${coords.latitude},${coords.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeQuery(query)}`;
}

export function appleMapsHref(
  latitude?: number,
  longitude?: number,
  name?: string,
): string | undefined {
  const coords = mapCoordinates(latitude, longitude);
  if (!coords) return undefined;
  const query = name?.trim() || `${coords.latitude},${coords.longitude}`;
  return `https://maps.apple.com/?ll=${coords.latitude},${coords.longitude}&q=${encodeQuery(query)}`;
}

export function openStreetMapHref(
  latitude?: number,
  longitude?: number,
): string | undefined {
  const coords = mapCoordinates(latitude, longitude);
  if (!coords) return undefined;
  return `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}#map=16/${coords.latitude}/${coords.longitude}`;
}

export function geoMapsHref(
  latitude?: number,
  longitude?: number,
  name?: string,
): string | undefined {
  const coords = mapCoordinates(latitude, longitude);
  if (!coords) return undefined;
  const pair = `${coords.latitude},${coords.longitude}`;
  const query = name?.trim() ? `${pair}(${name.trim()})` : pair;
  return `geo:${pair}?q=${encodeQuery(query)}`;
}

export function mapAppHrefs(latitude?: number, longitude?: number, name?: string) {
  const geo = geoMapsHref(latitude, longitude, name);
  const google = googleMapsHref(latitude, longitude, name);
  const apple = appleMapsHref(latitude, longitude, name);
  const openStreetMap = openStreetMapHref(latitude, longitude);
  if (!geo || !google || !apple || !openStreetMap) return undefined;
  return { geo, google, apple, openStreetMap };
}
