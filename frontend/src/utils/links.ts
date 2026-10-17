export function osmLink(latitude: string | null, longitude: string | null): string | null {
  if (!latitude || !longitude) return null;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=11/${latitude}/${longitude}`;
}
