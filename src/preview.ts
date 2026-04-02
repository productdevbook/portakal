import type { LabelElement, ResolvedLabel } from "./types";

/**
 * SVG preview renderer — renders label elements to SVG string.
 * Font sizes and rendering rules based on official spec research:
 * - ZPL: Zebra ZPL II Programming Guide, Labelary rendering reference
 * - TSC: TSPL/TSPL2 Programming Manual
 * - EPL: EPL2 Programmer's Manual
 * - CPCL: Zebra CPCL Font Manual
 */

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Calculate font pixel height from size and yScale.
 *
 * Priority:
 * 1. yScale (raw dot height from parser, e.g., ZPL ^CF height) — use directly
 * 2. size as multiplier (TSC/EPL x_mul/y_mul) — multiply base font height
 */
function calcFontSize(size: number, yScale?: number): number {
  if (yScale && yScale > 10) return yScale;
  // Default: size is a multiplier on ~12 dot base height
  return Math.max(8, size * 12);
}

/**
 * Baseline offset ratio from top of character cell.
 * Proportional fonts (font 0): ~0.78, bitmap/monospace: ~0.82
 */
function baselineRatio(font?: string): number {
  return font === "0" ? 0.78 : 0.82;
}

/** CSS font-family based on font identifier. Uses single quotes for SVG attribute compatibility. */
function fontFamily(font?: string): string {
  if (font === "0") return "'Helvetica Neue', Helvetica, Arial, sans-serif";
  return "monospace";
}

function renderElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const fs = calcFontSize(o.size ?? 1, o.yScale);
      const bl = baselineRatio(o.font);
      const ff = fontFamily(o.font);
      const weight = o.bold ? "bold" : "normal";
      const decoration = o.underline ? ' text-decoration="underline"' : "";
      const transform = o.rotation ? ` transform="rotate(${o.rotation} ${x} ${y})"` : "";

      // Text anchor for alignment (^FB justify)
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
      const svgY = Math.round((y + fs * bl) * 100) / 100;
      return `<text x="${textX}" y="${svgY}" fill="${fill}" font-size="${fs}" font-weight="${weight}" font-family="${ff}"${anchor}${decoration}${transform}>${escapeXml(el.content)}</text>`;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      const w = o.width ?? bmp.width;
      const h = o.height ?? bmp.height;

      const step = Math.max(1, Math.floor(Math.max(bmp.width, bmp.height) / 100));
      const scaleX = w / bmp.width;
      const scaleY = h / bmp.height;
      let svg = "";

      for (let py = 0; py < bmp.height; py += step) {
        for (let px = 0; px < bmp.width; px += step) {
          const byteIdx = py * bmp.bytesPerRow + Math.floor(px / 8);
          const bitIdx = 7 - (px % 8);
          const isBlack = (bmp.data[byteIdx] >> bitIdx) & 1;
          if (isBlack) {
            svg += `<rect x="${x + px * scaleX}" y="${y + py * scaleY}" width="${step * scaleX}" height="${step * scaleY}" fill="#000"/>`;
          }
        }
      }

      return svg;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const rx = o.radius ?? 0;

      // Spec: filled when thickness >= min(width, height)
      if (t >= Math.min(o.width, o.height)) {
        return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#000" rx="${rx}" ry="${rx}"/>`;
      }

      // Outline — border draws inward
      return `<rect x="${o.x + t / 2}" y="${o.y + t / 2}" width="${o.width - t}" height="${o.height - t}" fill="none" stroke="#000" stroke-width="${t}" rx="${rx}" ry="${rx}"/>`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      return `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="#000" stroke-width="${t}"/>`;
    }

    case "circle": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const r = o.diameter / 2;
      if (t >= r) {
        return `<circle cx="${o.x + r}" cy="${o.y + r}" r="${r}" fill="#000"/>`;
      }
      return `<circle cx="${o.x + r}" cy="${o.y + r}" r="${r - t / 2}" fill="none" stroke="#000" stroke-width="${t}"/>`;
    }

    case "ellipse": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const rx = o.width / 2;
      const ry = o.height / 2;
      return `<ellipse cx="${o.x + rx}" cy="${o.y + ry}" rx="${rx}" ry="${ry}" fill="none" stroke="#000" stroke-width="${t}"/>`;
    }

    case "reverse": {
      const o = el.options;
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#000"/>`;
    }

    case "erase": {
      const o = el.options;
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="#fff"/>`;
    }

    case "raw":
      return "";
  }
}

/** Render a resolved label as an SVG preview string */
export function renderPreview(label: ResolvedLabel): string {
  const w = label.widthDots;
  const h = label.heightDots > 0 ? label.heightDots : 400;
  const padding = 10;
  const svgW = w + padding * 2;
  const svgH = h + padding * 2;

  let elements = "";
  for (const el of label.elements) {
    elements += renderElement(el);
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">`,
    `<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#f5f5f4" rx="4"/>`,
    `<rect x="${padding}" y="${padding}" width="${w}" height="${h}" fill="#fff" stroke="#e5e5e5" stroke-width="1" rx="2"/>`,
    `<g transform="translate(${padding},${padding})">`,
    elements,
    "</g>",
    `<text x="${svgW / 2}" y="${svgH - 1}" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="monospace">${w}×${h} dots (${label.dpi} DPI)</text>`,
    "</svg>",
  ].join("\n");
}
