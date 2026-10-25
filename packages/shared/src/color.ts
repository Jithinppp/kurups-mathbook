import { clamp } from "./utils";

export interface HsvColor {
  /** Hue in degrees, 0–360. */
  h: number;
  /** Saturation, 0–1. */
  s: number;
  /** Value/brightness, 0–1. */
  v: number;
}

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Normalises a 3- or 6-digit hex colour to lowercase `#rrggbb`.
 * Returns null for anything that cannot be stored as a category/account colour.
 */
export function normalizeHexColor(input: string): string | null {
  const match = input.trim().match(HEX_PATTERN);
  if (!match) return null;

  let value = match[1].toLowerCase();
  if (value.length === 3) {
    value = value
      .split("")
      .map((character) => `${character}${character}`)
      .join("");
  }
  return `#${value}`;
}

export function hexToHsv(input: string): HsvColor {
  const hex = normalizeHexColor(input) ?? "#000000";
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta > 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  return {
    h,
    s: max === 0 ? 0 : delta / max,
    v: max,
  };
}

export function hsvToHex(h: number, s: number, v: number): string {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s, 0, 1);
  const value = clamp(v, 0, 1);
  const chroma = value * saturation;
  const section = hue / 60;
  const second = chroma * (1 - Math.abs((section % 2) - 1));
  const match = value - chroma;

  let r = 0;
  let g = 0;
  let b = 0;

  if (section < 1) {
    r = chroma;
    g = second;
  } else if (section < 2) {
    r = second;
    g = chroma;
  } else if (section < 3) {
    g = chroma;
    b = second;
  } else if (section < 4) {
    g = second;
    b = chroma;
  } else if (section < 5) {
    r = second;
    b = chroma;
  } else {
    r = chroma;
    b = second;
  }

  return `#${toHexComponent(r + match)}${toHexComponent(g + match)}${toHexComponent(b + match)}`;
}

function toHexComponent(value: number) {
  return Math.round(clamp(value, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
}
