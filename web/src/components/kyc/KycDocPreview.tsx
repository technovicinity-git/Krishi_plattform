"use client";

import { useState } from "react";

/** True when the stored path points at a PDF rather than an image. */
function isPdfPath(path: string | null | undefined): boolean {
  return /\.pdf$/i.test(path ?? "");
}

/**
 * Preview tile for an uploaded KYC document. Images show a thumbnail; PDFs
 * (or images that fail to load) show a document card. Either way the tile
 * opens the file in a new tab.
 */
export function KycDocPreview({
  label,
  url,
  path,
  emptyLabel = "Not provided",
  pdfLabel = "PDF document",
  fileLabel = "Document",
  openLabel = "Click to open",
}: {
  label: string;
  url: string | null;
  path: string | null | undefined;
  emptyLabel?: string;
  pdfLabel?: string;
  fileLabel?: string;
  openLabel?: string;
}) {
  const pdf = isPdfPath(path);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !pdf && !imageFailed;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-semibold text-ink-muted">{label}</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block overflow-hidden rounded-[8px] border border-border-light bg-stone transition-colors hover:border-brand"
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={label}
              onError={() => setImageFailed(true)}
              className="h-[180px] w-full object-cover"
            />
          ) : (
            <div className="flex h-[180px] flex-col items-center justify-center gap-2 px-4 text-center">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10 text-brand"
              >
                <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                <path d="M14 3v5h5" />
                <path d="M9 13h6M9 17h4" />
              </svg>
              <span className="text-[13px] font-semibold text-ink">
                {pdf ? pdfLabel : fileLabel}
              </span>
              <span className="text-[11px] font-semibold text-brand group-hover:underline">
                {openLabel} →
              </span>
            </div>
          )}
        </a>
      ) : (
        <div className="flex h-[180px] items-center justify-center rounded-[8px] border border-dashed border-border-light bg-stone text-[12px] text-ink-muted">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
