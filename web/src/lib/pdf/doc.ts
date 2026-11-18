import path from "node:path";
import PDFDocument from "pdfkit";

/*
 * Thin layer over pdfkit for Krishi reports (server-only).
 *
 * Bangla needs a Bengali font and Latin text/punctuation needs a Latin font:
 * neither Noto font covers both. `write()` splits every string into runs by
 * script and switches font mid-line, so mixed text like "KR-INV-000003 · ৳১,০০০"
 * renders correctly. pdfkit (via fontkit) shapes Bengali conjuncts properly.
 */

const FONT_DIR = path.join(process.cwd(), "src", "fonts", "pdf");

const BRAND = "#3A7D44";
const GREEN_DEEP = "#2D5A37";
const INK = "#1C1A17";
const MUTED = "#7A746B";
const LINE = "#E3DED4";
const CREAM = "#F8F5EF";

const PAGE_MARGIN = 48;

/** Bengali block (incl. ৳), dandas and ZWJ/ZWNJ, allowing spaces inside a run. */
const BENGALI_RUN = /([ঀ-৿।॥‌‍]+(?: +[ঀ-৿।॥‌‍]+)*)/;

type Weight = "regular" | "bold";

export interface TextOpts {
  size?: number;
  weight?: Weight;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  align?: "left" | "right" | "center";
  lineGap?: number;
}

export interface Column {
  header: string;
  width: number; // fraction of the content width, columns should add up to 1
  align?: "left" | "right";
}

export class PdfReport {
  readonly doc: PDFKit.PDFDocument;
  private readonly title: string;
  private readonly footerLeft: string;
  private readonly pageLabel: (n: number, total: number) => string;

  constructor(opts: {
    title: string;
    subtitle?: string;
    meta: Array<[string, string]>;
    footerLeft: string;
    pageLabel: (n: number, total: number) => string;
    author?: string;
  }) {
    this.title = opts.title;
    this.footerLeft = opts.footerLeft;
    this.pageLabel = opts.pageLabel;
    this.doc = new PDFDocument({
      size: "A4",
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN + 18, left: PAGE_MARGIN, right: PAGE_MARGIN },
      bufferPages: true,
      info: { Title: opts.title, Author: opts.author ?? "Krishi", Creator: "Krishi" },
    });
    this.doc.registerFont("lat", path.join(FONT_DIR, "NotoSans-Regular.ttf"));
    this.doc.registerFont("latB", path.join(FONT_DIR, "NotoSans-Bold.ttf"));
    this.doc.registerFont("bn", path.join(FONT_DIR, "NotoSansBengali-Regular.ttf"));
    this.doc.registerFont("bnB", path.join(FONT_DIR, "NotoSansBengali-Bold.ttf"));
    this.header(opts.subtitle, opts.meta);
  }

  get contentWidth(): number {
    return this.doc.page.width - PAGE_MARGIN * 2;
  }

  private get bottom(): number {
    return this.doc.page.height - PAGE_MARGIN - 18;
  }

  /** Writes mixed Bangla/Latin text, switching fonts per script run. */
  write(text: string, opts: TextOpts = {}): void {
    const d = this.doc;
    const size = opts.size ?? 10;
    const bold = opts.weight === "bold";
    const runs = String(text).split(BENGALI_RUN).filter((r) => r.length > 0);
    if (runs.length === 0) runs.push(" ");
    d.fillColor(opts.color ?? INK).fontSize(size);

    const fontFor = (run: string) =>
      /[ঀ-৿।॥]/.test(run) ? (bold ? "bnB" : "bn") : bold ? "latB" : "lat";

    // pdfkit aligns each continued segment on its own, so mixed-font text that
    // is right/center aligned would overlap. For a single line, measure the
    // segments and place them left-aligned at the right offset instead.
    if (runs.length > 1 && opts.width && (opts.align === "right" || opts.align === "center")) {
      const total = runs.reduce((w, run) => w + d.font(fontFor(run)).fontSize(size).widthOfString(run), 0);
      if (total <= opts.width) {
        const free = opts.width - total;
        const startX = (opts.x ?? d.x) + (opts.align === "right" ? free : free / 2);
        this.write(text, { ...opts, x: startX, width: total + 1, align: "left" });
        if (opts.x !== undefined) d.x = opts.x;
        return;
      }
    }

    runs.forEach((run, i) => {
      d.font(fontFor(run));
      const last = i === runs.length - 1;
      const common = { continued: !last, lineGap: opts.lineGap ?? 2 };
      if (i === 0) {
        const first = { ...common, width: opts.width, align: opts.align };
        if (opts.x !== undefined || opts.y !== undefined) {
          d.text(run, opts.x ?? d.x, opts.y ?? d.y, first);
        } else {
          d.text(run, first);
        }
      } else {
        d.text(run, common);
      }
    });
  }

  /** Height a string would take at a width (approximate for mixed text). */
  heightOf(text: string, width: number, size = 10, weight: Weight = "regular"): number {
    const bengali = /[ঀ-৿।॥]/.test(text);
    this.doc.font(bengali ? (weight === "bold" ? "bnB" : "bn") : weight === "bold" ? "latB" : "lat").fontSize(size);
    return this.doc.heightOfString(String(text) || " ", { width, lineGap: 2 });
  }

  /** Starts a new page if fewer than `needed` points remain. */
  ensureSpace(needed: number): void {
    if (this.doc.y + needed > this.bottom) this.doc.addPage();
  }

  private header(subtitle: string | undefined, meta: Array<[string, string]>): void {
    const d = this.doc;
    const x = PAGE_MARGIN;
    d.rect(0, 0, d.page.width, 6).fill(BRAND);
    this.write("Krishi", { x, y: PAGE_MARGIN - 14, size: 11, weight: "bold", color: BRAND });
    this.write(this.title, { x, y: PAGE_MARGIN + 4, size: 20, weight: "bold" });
    if (subtitle) this.write(subtitle, { x, size: 11, color: MUTED });
    d.moveDown(0.6);

    // Meta grid: two columns of label/value pairs.
    const colW = this.contentWidth / 2;
    let rowY = d.y;
    meta.forEach(([label, value], i) => {
      const col = i % 2;
      if (col === 0 && i > 0) rowY = d.y + 4;
      const cx = x + col * colW;
      this.write(label, { x: cx, y: rowY, size: 8, color: MUTED, width: colW - 12 });
      this.write(value, { x: cx, size: 10, weight: "bold", width: colW - 12 });
      if (col === 1 || i === meta.length - 1) d.x = x;
    });
    d.moveDown(0.8);
    this.rule();
  }

  rule(): void {
    const d = this.doc;
    d.moveTo(PAGE_MARGIN, d.y).lineTo(d.page.width - PAGE_MARGIN, d.y).lineWidth(0.7).strokeColor(LINE).stroke();
    d.moveDown(0.8);
  }

  section(title: string): void {
    this.ensureSpace(60);
    const d = this.doc;
    d.x = PAGE_MARGIN;
    d.moveDown(0.4);
    const y = d.y;
    d.rect(PAGE_MARGIN, y + 2, 3, 13).fill(BRAND);
    this.write(title, { x: PAGE_MARGIN + 10, y, size: 13, weight: "bold", color: GREEN_DEEP });
    d.moveDown(0.5);
    d.x = PAGE_MARGIN;
  }

  paragraph(text: string, color = MUTED): void {
    this.ensureSpace(30);
    this.write(text, { x: PAGE_MARGIN, size: 9.5, color, width: this.contentWidth });
    this.doc.moveDown(0.4);
  }

  /** Label/value rows in two columns. */
  keyValues(rows: Array<[string, string]>, opts: { highlightLast?: boolean } = {}): void {
    const d = this.doc;
    const colW = this.contentWidth / 2 - 8;
    for (let i = 0; i < rows.length; i += 2) {
      this.ensureSpace(26);
      const y = d.y;
      let maxY = y;
      for (let c = 0; c < 2; c++) {
        const row = rows[i + c];
        if (!row) continue;
        const cx = PAGE_MARGIN + c * (colW + 16);
        const strong = opts.highlightLast && i + c === rows.length - 1;
        this.write(row[0], { x: cx, y, size: 9, color: MUTED, width: colW * 0.48 });
        this.write(row[1], {
          x: cx + colW * 0.5,
          y,
          size: strong ? 11 : 9.5,
          weight: strong ? "bold" : "regular",
          color: strong ? GREEN_DEEP : INK,
          width: colW * 0.5,
          align: "right",
        });
        maxY = Math.max(maxY, d.y);
      }
      d.y = maxY + 3;
      d.moveTo(PAGE_MARGIN, d.y).lineTo(PAGE_MARGIN + this.contentWidth, d.y).lineWidth(0.4).strokeColor(LINE).stroke();
      d.y += 4;
    }
    d.x = PAGE_MARGIN;
    d.moveDown(0.3);
  }

  /** A table that continues on the next page with its header repeated. */
  table(columns: Column[], rows: string[][], emptyText: string): void {
    const d = this.doc;
    const widths = columns.map((c) => c.width * this.contentWidth);
    const pad = 5;

    const drawHeader = () => {
      const y = d.y;
      const h = 18;
      d.rect(PAGE_MARGIN, y, this.contentWidth, h).fill(CREAM);
      let cx = PAGE_MARGIN;
      columns.forEach((c, i) => {
        this.write(c.header.toUpperCase(), {
          x: cx + pad,
          y: y + 4,
          size: 7.5,
          weight: "bold",
          color: MUTED,
          width: widths[i] - pad * 2,
          align: c.align ?? "left",
        });
        cx += widths[i];
      });
      d.y = y + h + 2;
    };

    if (rows.length === 0) {
      this.paragraph(emptyText);
      return;
    }

    this.ensureSpace(44);
    drawHeader();
    for (const row of rows) {
      const h =
        Math.max(...row.map((cell, i) => this.heightOf(cell, widths[i] - pad * 2, 9))) + pad * 1.4;
      if (d.y + h > this.bottom) {
        d.addPage();
        drawHeader();
      }
      const y = d.y;
      let cx = PAGE_MARGIN;
      row.forEach((cell, i) => {
        this.write(cell || "—", {
          x: cx + pad,
          y: y + pad * 0.6,
          size: 9,
          width: widths[i] - pad * 2,
          align: columns[i].align ?? "left",
        });
        cx += widths[i];
      });
      d.y = y + h;
      d.moveTo(PAGE_MARGIN, d.y).lineTo(PAGE_MARGIN + this.contentWidth, d.y).lineWidth(0.4).strokeColor(LINE).stroke();
    }
    d.x = PAGE_MARGIN;
    d.moveDown(0.6);
  }

  /** Adds page footers and returns the finished PDF bytes. */
  async finish(): Promise<Buffer> {
    const d = this.doc;
    const chunks: Buffer[] = [];
    d.on("data", (c: Buffer) => chunks.push(c));
    const done = new Promise<Buffer>((resolve) => d.on("end", () => resolve(Buffer.concat(chunks))));

    const range = d.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      d.switchToPage(i);
      const y = d.page.height - PAGE_MARGIN + 6;
      // Write in the bottom margin without triggering a page break.
      const saved = d.page.margins.bottom;
      d.page.margins.bottom = 0;
      d.moveTo(PAGE_MARGIN, y - 6).lineTo(d.page.width - PAGE_MARGIN, y - 6).lineWidth(0.5).strokeColor(LINE).stroke();
      this.write(this.footerLeft, { x: PAGE_MARGIN, y, size: 7.5, color: MUTED, width: this.contentWidth * 0.7 });
      this.write(this.pageLabel(i + 1, range.count), {
        x: PAGE_MARGIN + this.contentWidth * 0.7,
        y,
        size: 7.5,
        color: MUTED,
        width: this.contentWidth * 0.3,
        align: "right",
      });
      d.page.margins.bottom = saved;
    }
    d.end();
    return done;
  }
}
