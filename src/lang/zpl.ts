/**
 * ZPL II language module — compile, parse, preview, validate.
 * Uses ZPL-specific font tables (A-V, 0) and rendering rules (^GB, ^FR).
 */

import type { LabelBuilder } from "../builder";
import type { LabelElement, ResolvedLabel } from "../types";
import { compileToZPL } from "../languages/zpl";
import { parseZPL } from "../parsers/zpl";
import { validate } from "../validate";

/** ZPL font pixel dimensions at 203 DPI: { width, height } */
const ZPL_FONTS: Record<string, { w: number; h: number }> = {
  A: { w: 5, h: 9 },
  B: { w: 7, h: 11 },
  C: { w: 10, h: 18 },
  D: { w: 10, h: 18 },
  E: { w: 15, h: 28 },
  F: { w: 13, h: 26 },
  G: { w: 40, h: 60 },
  H: { w: 13, h: 21 },
  P: { w: 18, h: 20 },
  Q: { w: 24, h: 28 },
  R: { w: 31, h: 35 },
  S: { w: 35, h: 40 },
  T: { w: 42, h: 48 },
  U: { w: 53, h: 59 },
  V: { w: 71, h: 80 },
  "0": { w: 15, h: 18 }, // base for scalable — actual size from ^A params
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Is this a scalable/proportional font? Font 0 is CG Triumvirate (proportional). */
function isProportionalFont(font: string | undefined): boolean {
  return (font ?? "0") === "0";
}

function zplFontSize(font: string | undefined, size: number | undefined, yScale?: number): number {
  // yScale = raw dot height from ^A or ^CF command
  if (yScale && yScale > 10) return yScale;
  const f = ZPL_FONTS[(font ?? "0").toUpperCase()];
  if (f && size) return f.h * size;
  if (f) return f.h;
  return size ? size * 12 : 18;
}

function zplCharWidth(font: string | undefined, size: number | undefined, xScale?: number): number {
  if (xScale && xScale > 10) {
    // Font 0 (proportional): avg glyph advance ≈ 0.52 × width param
    // Bitmap fonts (A-H): monospace, char advance = width param directly
    return isProportionalFont(font) ? xScale * 0.52 : xScale;
  }
  const f = ZPL_FONTS[(font ?? "0").toUpperCase()];
  if (f && size) return f.w * size;
  if (f) return f.w;
  return size ? size * 7 : 10;
}

/** Baseline offset from top of character cell. */
function zplBaselineRatio(font: string | undefined): number {
  // Font 0 (CG Triumvirate / Helvetica-like): ascent ≈ 0.78
  // Bitmap fonts A-H: ascent ≈ 0.82
  return isProportionalFont(font) ? 0.78 : 0.82;
}

/** CSS font-family for ZPL font. Uses single quotes for SVG attribute compatibility. */
function zplFontFamily(font: string | undefined): string {
  if (isProportionalFont(font)) {
    return "'Helvetica Neue', Helvetica, Arial, sans-serif";
  }
  return "monospace";
}

function renderElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const fs = zplFontSize(o.font, o.size, o.yScale);
      const baseline = zplBaselineRatio(o.font);
      const fontFamily = zplFontFamily(o.font);
      const weight = o.bold ? "bold" : "normal";
      const transform = o.rotation ? ` transform="rotate(${o.rotation} ${x} ${y})"` : "";

      // Text anchor for ^FB alignment
      let anchor = "";
      let textX = x;
      if (o.maxWidth && o.align === "center") {
        anchor = ' text-anchor="middle"';
        textX = x + o.maxWidth / 2;
      } else if (o.maxWidth && o.align === "right") {
        anchor = ' text-anchor="end"';
        textX = x + o.maxWidth;
      }

      const fill = o.reverse ? "#fff" : "#000";
      const svgY = Math.round((y + fs * baseline) * 100) / 100;
      return `<text x="${textX}" y="${svgY}" fill="${fill}" font-size="${fs}" font-weight="${weight}" font-family="${fontFamily}"${anchor}${transform}>${escapeXml(el.content)}</text>`;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      const w = o.width ?? bmp.width;
      const h = o.height ?? bmp.height;
      const step = Math.max(1, Math.floor(Math.max(bmp.width, bmp.height) / 100));
      const sx = w / bmp.width;
      const sy = h / bmp.height;
      let svg = "";
      for (let py = 0; py < bmp.height; py += step) {
        for (let px = 0; px < bmp.width; px += step) {
          const byteIdx = py * bmp.bytesPerRow + Math.floor(px / 8);
          const bitIdx = 7 - (px % 8);
          if ((bmp.data[byteIdx] >> bitIdx) & 1) {
            svg += `<rect x="${x + px * sx}" y="${y + py * sy}" width="${step * sx}" height="${step * sy}" fill="#000"/>`;
          }
        }
      }
      return svg;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const rx = o.radius ?? 0;
      // ZPL ^GB: filled when thickness >= min(width, height)
      if (t >= Math.min(o.width, o.height)) {
        return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#000" rx="${rx}"/>`;
      }
      // ZPL border draws inward
      return `<rect x="${o.x + t / 2}" y="${o.y + t / 2}" width="${o.width - t}" height="${o.height - t}" fill="none" stroke="#000" stroke-width="${t}" rx="${rx}"/>`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      // ZPL uses ^GB for lines (thin boxes)
      if (o.y1 === o.y2) {
        return `<rect x="${Math.min(o.x1, o.x2)}" y="${o.y1}" width="${Math.abs(o.x2 - o.x1)}" height="${t}" fill="#000"/>`;
      }
      if (o.x1 === o.x2) {
        return `<rect x="${o.x1}" y="${Math.min(o.y1, o.y2)}" width="${t}" height="${Math.abs(o.y2 - o.y1)}" fill="#000"/>`;
      }
      return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="#000" stroke-width="${t}"/>`;
    }

    case "circle": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const r = o.diameter / 2;
      if (t >= r) return `<circle cx="${o.x + r}" cy="${o.y + r}" r="${r}" fill="#000"/>`;
      return `<circle cx="${o.x + r}" cy="${o.y + r}" r="${r - t / 2}" fill="none" stroke="#000" stroke-width="${t}"/>`;
    }

    case "ellipse":
    case "reverse":
      return "";

    case "erase": {
      // White fill — used for ^FR XOR effect (e.g., Intershipping logo)
      const o = el.options;
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#fff"/>`;
    }

    case "raw": {
      // Parse barcode raw ZPL for placeholder rendering
      if (typeof el.content === "string" && el.content.includes("^B")) {
        const byMatch = el.content.match(/\^BY(\d+)/);
        const foMatch = el.content.match(/\^FO(\d+),(\d+)/);
        const bcMatch = el.content.match(/\^B([A-Z0-9])N?,(\d+)/);
        const fdMatch = el.content.match(/\^FD(.+?)\^FS/);
        if (foMatch && fdMatch) {
          const bx = Number(foMatch[1]);
          const by = Number(foMatch[2]);
          const bh = bcMatch ? Number(bcMatch[2]) : 80;
          const data = fdMatch[1];
          const mw = byMatch ? Number(byMatch[1]) : 2;
          // Code 128 width: (dataChars + 2) * 11 + 13 modules × moduleWidth
          const bw = ((data.length + 2) * 11 + 13) * mw;
          // Barcode placeholder: striped pattern using SVG pattern
          const pid = `bp${bx}${by}`;
          const textY = by + bh + 15;
          return [
            `<defs><pattern id="${pid}" width="${mw * 2}" height="${bh}" patternUnits="userSpaceOnUse">`,
            `<rect width="${mw}" height="${bh}" fill="#000"/>`,
            `</pattern></defs>`,
            `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="url(#${pid})"/>`,
            `<text x="${bx + bw / 2}" y="${textY}" text-anchor="middle" fill="#000" font-size="14" font-family="monospace">${escapeXml(data)}</text>`,
          ].join("");
        }
      }
      return "";
    }
  }
}

function renderPreviewSVG(resolved: ResolvedLabel): string {
  const w = resolved.widthDots;
  const h = resolved.heightDots > 0 ? resolved.heightDots : 1218;
  const pad = 10;
  const svgW = w + pad * 2;
  const svgH = h + pad * 2;

  let els = "";
  for (const el of resolved.elements) els += renderElement(el);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">`,
    `<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#f5f5f4" rx="4"/>`,
    `<rect x="${pad}" y="${pad}" width="${w}" height="${h}" fill="#fff" stroke="#e5e5e5" stroke-width="1" rx="2"/>`,
    `<g transform="translate(${pad},${pad})">`,
    els,
    "</g>",
    `<text x="${svgW / 2}" y="${svgH - 1}" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="monospace">${w}×${h} dots (${resolved.dpi} DPI) — ZPL</text>`,
    "</svg>",
  ].join("\n");
}

/** ZPL language module */
export const zpl = {
  compile(builder: LabelBuilder): string {
    return compileToZPL(builder.resolve());
  },
  parse(code: string) {
    return parseZPL(code);
  },
  preview(builder: LabelBuilder): string {
    return renderPreviewSVG(builder.resolve());
  },
  previewResolved(resolved: ResolvedLabel): string {
    return renderPreviewSVG(resolved);
  },
  validate(code: string) {
    return validate(code, "zpl");
  },

};
