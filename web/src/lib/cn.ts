/**
 * Tiny classname combiner.
 * Filters out falsy values and joins with a space.
 */
export function cn(
  ...classes: Array<string | undefined | null | false>
): string {
  return classes.filter(Boolean).join(" ");
}