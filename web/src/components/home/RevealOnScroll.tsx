"use client";

import { useEffect } from "react";

/**
 * Turns on scroll reveals for [data-reveal] elements on the page. Elements
 * already on screen when it mounts are shown at once, so nothing flickers.
 */
export function RevealOnScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const done = (el: Element) =>
      el.addEventListener("transitionend", () => el.classList.add("is-done"), { once: true });
    for (const el of els) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("is-in", "is-done");
    }
    root.classList.add("reveal-on");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            done(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    for (const el of els) if (!el.classList.contains("is-in")) io.observe(el);
    return () => {
      io.disconnect();
      root.classList.remove("reveal-on");
    };
  }, []);
  return null;
}
