/**
 * Floors a number down to the nearest multiple of `base` for a clean,
 * "sleek" stat display (e.g. 552 -> 550, 551 -> 550).
 */
export function floorToNearest(value, base = 10) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return 0;
  return Math.floor(num / base) * base;
}

/**
 * Formats a live count as a floored, "+"-suffixed string for stat
 * displays, e.g. floorPlus(552) -> "550+". Always derived from the real
 * fetched number, so it grows on its own (550+ -> 560+ -> ...) as content
 * is added — nothing here is hardcoded.
 */
export function floorPlus(value, base = 10) {
  return `${floorToNearest(value, base).toLocaleString()}+`;
}
