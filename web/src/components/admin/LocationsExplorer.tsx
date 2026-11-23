"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { NavIcon } from "@/components/dashboard/NavIcon";

export interface ThanaView {
  id: string;
  nameEn: string;
  nameBn: string;
  /** Steward offerings placed in this thana. */
  offerings: number;
}

export interface DistrictView {
  id: string;
  nameEn: string;
  nameBn: string;
  plans: number;
  stewards: number;
  thanas: ThanaView[];
}

export interface DivisionView {
  id: string;
  nameEn: string;
  nameBn: string;
  districts: DistrictView[];
}

const matches = (q: string, en: string, bn: string) => en.toLowerCase().includes(q) || bn.includes(q);

/** Search divisions, districts and thanas; see where Krishi is active; open a district for its thanas. */
export function LocationsExplorer({ divisions }: { divisions: DivisionView[] }) {
  const [query, setQuery] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const q = query.trim().toLowerCase();

  // What to show: a matching division shows all its districts; a matching
  // district shows all its thanas; otherwise only matching thanas.
  const shown = useMemo(() => {
    return divisions
      .map((div) => {
        const divHit = q !== "" && matches(q, div.nameEn, div.nameBn);
        const districts = div.districts
          .filter((d) => !activeOnly || d.plans > 0 || d.stewards > 0)
          .map((d) => {
            if (!q || divHit || matches(q, d.nameEn, d.nameBn)) return { ...d, thanaHits: null as ThanaView[] | null };
            const hits = d.thanas.filter((t) => matches(q, t.nameEn, t.nameBn));
            return hits.length ? { ...d, thanaHits: hits } : null;
          })
          .filter((d): d is DistrictView & { thanaHits: ThanaView[] | null } => d !== null);
        return { ...div, districts };
      })
      .filter((div) => div.districts.length > 0);
  }, [divisions, q, activeOnly]);

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const results = shown.reduce((n, d) => n + d.districts.length, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-[380px]">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search division, district or thana (English or বাংলা)"
            className="h-[42px] w-full rounded-[10px] border border-border-light bg-white pl-9 pr-3 text-[13.5px] text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-ink-muted">
            {results} district{results === 1 ? "" : "s"}
          </span>
          <div className="flex rounded-[10px] border border-border-light bg-white p-1">
            {[
              { v: false, label: "All" },
              { v: true, label: "Active" },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setActiveOnly(o.v)}
                className={cn(
                  "rounded-[7px] px-3 py-1.5 text-[12.5px] font-semibold transition-colors",
                  activeOnly === o.v ? "bg-brand text-white" : "text-ink-nav hover:bg-stone",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-light bg-white px-6 py-14 text-center text-[13.5px] text-ink-muted">
          {activeOnly && !q ? "No district has a plan or steward yet." : `Nothing matches “${query}”.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          {shown.map((div) => {
            const all = divisions.find((d) => d.id === div.id)!;
            const active = all.districts.filter((d) => d.plans > 0 || d.stewards > 0).length;
            const thanaCount = all.districts.reduce((n, d) => n + d.thanas.length, 0);
            return (
              <section key={div.id} className="overflow-hidden rounded-2xl border border-border-light bg-white">
                <header className="flex items-center justify-between gap-3 border-b border-border-light bg-cream px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-tint text-brand">
                      <NavIcon name="map" className="h-[18px] w-[18px]" />
                    </span>
                    <div className="flex flex-col">
                      <span className="font-serif text-[18px] leading-tight text-ink">
                        {div.nameEn} <span className="text-[13px] font-sans text-ink-muted">{div.nameBn}</span>
                      </span>
                      <span className="text-[11.5px] text-ink-muted">
                        {all.districts.length} districts · {thanaCount} thanas
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-bold",
                      active ? "bg-brand-tint text-green-deep" : "bg-stone text-ink-muted",
                    )}
                  >
                    {active}/{all.districts.length} active
                  </span>
                </header>

                <ul className="divide-y divide-border-light">
                  {div.districts.map((d) => {
                    const isActive = d.plans > 0 || d.stewards > 0;
                    const expanded = open.has(d.id) || d.thanaHits !== null;
                    const thanas = d.thanaHits ?? d.thanas;
                    return (
                      <li key={d.id}>
                        <button
                          type="button"
                          onClick={() => toggle(d.id)}
                          aria-expanded={expanded}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-stone/50"
                        >
                          <span className={cn("h-2 w-2 shrink-0 rounded-full", isActive ? "bg-brand" : "bg-border-light")} />
                          <span className="min-w-0 flex-1">
                            <span className="text-[13.5px] font-semibold text-ink">{d.nameEn}</span>{" "}
                            <span className="text-[12px] text-ink-muted">{d.nameBn}</span>
                          </span>
                          <span className="hidden items-center gap-1.5 sm:flex">
                            {d.plans > 0 && <Pill tone="brand">{d.plans} plan{d.plans === 1 ? "" : "s"}</Pill>}
                            {d.stewards > 0 && <Pill tone="camel">{d.stewards} steward{d.stewards === 1 ? "" : "s"}</Pill>}
                            <Pill>{d.thanas.length} thanas</Pill>
                          </span>
                          <svg
                            viewBox="0 0 20 20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            className={cn("h-4 w-4 shrink-0 text-ink-muted transition-transform duration-200", expanded && "rotate-180")}
                            aria-hidden="true"
                          >
                            <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        {/* Counts on phones, under the name. */}
                        <div className="-mt-1.5 flex flex-wrap gap-1.5 px-5 pb-2.5 pl-10 sm:hidden">
                          {d.plans > 0 && <Pill tone="brand">{d.plans} plans</Pill>}
                          {d.stewards > 0 && <Pill tone="camel">{d.stewards} stewards</Pill>}
                          <Pill>{d.thanas.length} thanas</Pill>
                        </div>
                        <div
                          className={cn(
                            "grid transition-[grid-template-rows] duration-200 ease-out",
                            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                          )}
                        >
                          <div className="overflow-hidden">
                            <div className="flex flex-wrap gap-1.5 bg-cream/60 px-5 py-3 pl-10">
                              {thanas.length === 0 ? (
                                <span className="text-[12px] text-ink-muted">No thanas listed.</span>
                              ) : (
                                thanas.map((t) => (
                                  <span
                                    key={t.id}
                                    title={t.nameBn}
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-[6px] border px-2.5 py-1 text-[12px]",
                                      t.offerings > 0
                                        ? "border-brand/40 bg-brand-tint font-semibold text-green-deep"
                                        : "border-border-light bg-white text-ink-secondary",
                                    )}
                                  >
                                    {t.nameEn}
                                    {t.offerings > 0 && <span className="text-[10.5px] text-brand">· {t.offerings}</span>}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brand" /> Active: has a plan or a steward
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-5 rounded-[3px] border border-brand/40 bg-brand-tint" /> Thana with offerings (count)
        </span>
      </p>
    </div>
  );
}

function Pill({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "brand" | "camel" }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
        tone === "brand" && "bg-brand-tint text-green-deep",
        tone === "camel" && "bg-[#F6ECE3] text-[#9A6B3F]",
        tone === "plain" && "bg-stone text-ink-muted",
      )}
    >
      {children}
    </span>
  );
}
