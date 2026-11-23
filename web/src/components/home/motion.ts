import type { CSSProperties } from "react";

/** Animation delay for .k-in / .k-pop / [data-reveal] (see globals.css). */
export const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

/** Entrance delay plus a separate start for the repeating pulse (.k-pop). */
export const popDelay = (ms: number, pulseMs: number) =>
  ({ "--d": `${ms}ms`, "--p": `${pulseMs}ms` }) as CSSProperties;
