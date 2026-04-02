import type { LabelElement, ResolvedLabel } from "./types";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Approximate font height in dots for preview rendering */
function fontSize(size: number): number {
  return Math.max(10, size * 12);
}

function renderElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const fs = fontSize(o.size ?? 1);
      const weight = o.bold ? "bold" : "normal";
      const decoration = o.underline ? ' text-decoration="underline"' : "";
      const transform = o.rotation ? ` transform="rotate(${o.rotation} ${x} ${y})"` : "";

      if (o.reverse) {
        const textW = el.content.length * fs * 0.6;
        const textH = fs * 1.2;
        return (
          `<rect x="${x - 2}" y="${y - 2}" width="${textW + 4}" height="${textH + 4}" fill="#000"/>` +
          `<text x="${x}" y="${y + fs}" fill="#fff" font-size="${fs}" font-weight="${weight}" font-family="monospace"${decoration}${transform}>${escapeXml(el.content)}</text>`
        );
      }

      return `<text x="${x}" y="${y + fs}" fill="#000" font-size="${fs}" font-weight="${weight}" font-family="monospace"${decoration}${transform}>${escapeXml(el.content)}</text>`;
    }

    case "barcode": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const h = o.height ?? 60;
      const w = Math.max(80, el.data.length * 8);

      // Simplified barcode bars rendering
      let bars = "";
      const barCount = Math.max(20, el.data.length * 4);
      const barW = w / barCount;
      for (let i = 0; i < barCount; i++) {
        if (i % 2 === 0) {
          const bw = barW * (0.5 + Math.random() * 1.2);
          bars += `<rect x="${x + i * barW}" y="${y}" width="${bw}" height="${h}" fill="#000"/>`;
        }
      }

      let label = "";
      if (o.readable !== false) {
        const labelY = o.readablePosition === "above" ? y - 4 : y + h + 12;
        label = `<text x="${x + w / 2}" y="${labelY}" text-anchor="middle" fill="#000" font-size="10" font-family="monospace">${escapeXml(el.data)}</text>`;
      }

      return bars + label;
    }

    case "qrcode": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const moduleSize = o.size ?? 6;
      const modules = Math.max(21, Math.min(40, Math.ceil(el.data.length / 2) + 17));
      const totalSize = modules * moduleSize;

      // Draw finder patterns + random data modules
      let svg = `<rect x="${x}" y="${y}" width="${totalSize}" height="${totalSize}" fill="#fff" stroke="#000" stroke-width="0.5"/>`;

      // Finder patterns (top-left, top-right, bottom-left)
      const finderPositions = [
        [0, 0],
        [modules - 7, 0],
        [0, modules - 7],
      ];
      for (const [fx, fy] of finderPositions) {
        const px = x + fx * moduleSize;
        const py = y + fy * moduleSize;
        svg += `<rect x="${px}" y="${py}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="#000"/>`;
        svg += `<rect x="${px + moduleSize}" y="${py + moduleSize}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="#fff"/>`;
        svg += `<rect x="${px + 2 * moduleSize}" y="${py + 2 * moduleSize}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="#000"/>`;
      }

      // Pseudo-random data modules
      let seed = 0;
      for (let i = 0; i < el.data.length; i++) seed += el.data.charCodeAt(i);
      for (let my = 9; my < modules - 8; my++) {
        for (let mx = 9; mx < modules - 8; mx++) {
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          if (seed % 3 === 0) {
            svg += `<rect x="${x + mx * moduleSize}" y="${y + my * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#000"/>`;
          }
        }
      }

      return svg;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      const w = o.width ?? bmp.width;
      const h = o.height ?? bmp.height;

      // Render monochrome bitmap as tiny rects (for preview only, not production)
      // For performance, sample at lower resolution for large images
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
      return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${o.height}" fill="none" stroke="#000" stroke-width="${t}" rx="${rx}" ry="${rx}"/>`;
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
      return `<circle cx="${o.x + r}" cy="${o.y + r}" r="${r}" fill="none" stroke="#000" stroke-width="${t}"/>`;
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
    // Background (simulates white label paper)
    `<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#f5f5f4" rx="4"/>`,
    `<rect x="${padding}" y="${padding}" width="${w}" height="${h}" fill="#fff" stroke="#e5e5e5" stroke-width="1" rx="2"/>`,
    // Label content (translated by padding)
    `<g transform="translate(${padding},${padding})">`,
    elements,
    "</g>",
    // Dimensions annotation
    `<text x="${svgW / 2}" y="${svgH - 1}" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="monospace">${w}×${h} dots (${label.dpi} DPI)</text>`,
    "</svg>",
  ].join("\n");
}
