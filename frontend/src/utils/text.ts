export function split(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-•]+/, "").trim())
    .filter(Boolean);
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
