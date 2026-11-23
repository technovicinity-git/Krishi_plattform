"use client";

import { useEffect } from "react";

/**
 * Turns on scroll reveals for [data-reveal] elements on the page. Elements
 * already on screen when it mounts are shown at once, so nothing flickers.
 */
export function RevealOnScroll({ auto = false }: { auto?: boolean }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (auto) autoTag();
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

    // Content added later (a filtered list re-rendering): observe it too.
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        for (const node of Array.from(r.addedNodes)) {
          if (!(node instanceof Element)) continue;
          const found = [node, ...Array.from(node.querySelectorAll("[data-reveal]"))].filter(
            (el) => el.hasAttribute("data-reveal") && !el.classList.contains("is-in"),
          );
          for (const el of found) io.observe(el);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
      root.classList.remove("reveal-on");
    };
  }, [auto]);
  return null;
}

/**
 * Tags a long content page for reveals without editing every section:
 * each section's blocks fade in (a two-column layout slides in from both
 * sides), and grids and lists of three or more items stagger in.
 * The first section (the hero) is left alone: it has its own entrance.
 */
function autoTag() {
  const sections = Array.from(document.querySelectorAll("main section")).slice(1);
  const tag = (el: Element, how: string, ms: number) => {
    if (el.hasAttribute("data-reveal")) return;
    el.setAttribute("data-reveal", how);
    (el as HTMLElement).style.setProperty("--d", `${ms}ms`);
  };
  for (const section of sections) {
    // <section> > Container > the section's own wrapper.
    const wrapper = section.firstElementChild?.firstElementChild;
    if (!wrapper) continue;
    const blocks = Array.from(wrapper.children);
    const twoColumns = blocks.length === 2 && getComputedStyle(wrapper).display === "grid" && innerWidth >= 1024;
    blocks.forEach((block, i) => {
      if (twoColumns) tag(block, i === 0 ? "left" : "right", i * 150);
      else tag(block, "", Math.min(i, 3) * 120);
    });
    // Cards and steps: one after another.
    for (const group of Array.from(section.querySelectorAll(".grid, ul, ol"))) {
      const items = Array.from(group.children);
      if (items.length < 3) continue;
      items.forEach((item, i) => tag(item, "", 120 + (i % 5) * 90));
    }
  }
}
