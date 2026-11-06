export function osmLink(latitude: string | null, longitude: string | null): string | null {
  if (!latitude || !longitude) return null;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=11/${latitude}/${longitude}`;
}

export const whatsappLink = (number: string) => `https://wa.me/${number.replace(/\D/g, "")}`;
export const telegramLink = (handle: string) => (/^https?:\/\//.test(handle) ? handle : `https://t.me/${handle.replace(/^@/, "")}`);
export const phoneLink = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
