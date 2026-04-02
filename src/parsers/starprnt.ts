import type { LabelElement } from "../types";

/**
 * Star PRNT / Star Line Mode Parser.
 * Based on Star Micronics StarPRNT SDK documentation.
 * Binary protocol — differs from ESC/POS.
 */

export interface StarPRNTParseResult {
  commands: { name: string; bytes: number[] }[];
  elements: LabelElement[];
  warnings: string[];
}

export function parseStarPRNT(data: Uint8Array): StarPRNTParseResult {
  const commands: { name: string; bytes: number[] }[] = [];
  const elements: LabelElement[] = [];
  const warnings: string[] = [];
  let i = 0;
  let currentAlign: "left" | "center" | "right" = "left";
  let isBold = false;

  while (i < data.length) {
    const b = data[i];

    // ESC (0x1B) commands
    if (b === 0x1b && i + 1 < data.length) {
      const cmd = data[i + 1];

      // ESC @ — Initialize
      if (cmd === 0x40) {
        commands.push({ name: "ESC @", bytes: [0x1b, 0x40] });
        isBold = false;
        currentAlign = "left";
        i += 2;
        continue;
      }

      // ESC GS a n — Star alignment (3 bytes: ESC GS a n)
      if (cmd === 0x1d && i + 3 < data.length && data[i + 2] === 0x61) {
        const n = data[i + 3];
        currentAlign = n === 1 ? "center" : n === 2 ? "right" : "left";
        commands.push({ name: "ESC GS a", bytes: [0x1b, 0x1d, 0x61, n] });
        i += 4;
        continue;
      }

      // ESC E — Bold ON (Star uses no parameter)
      if (cmd === 0x45) {
        isBold = true;
        commands.push({ name: "ESC E", bytes: [0x1b, 0x45] });
        i += 2;
        continue;
      }

      // ESC F — Bold OFF
      if (cmd === 0x46) {
        isBold = false;
        commands.push({ name: "ESC F", bytes: [0x1b, 0x46] });
        i += 2;
        continue;
      }

      // ESC - n — Underline
      if (cmd === 0x2d && i + 2 < data.length) {
        commands.push({ name: "ESC -", bytes: [0x1b, 0x2d, data[i + 2]] });
        i += 3;
        continue;
      }

      // ESC i h w — Star size magnification
      if (cmd === 0x69 && i + 3 < data.length) {
        commands.push({ name: "ESC i", bytes: [0x1b, 0x69, data[i + 2], data[i + 3]] });
        i += 4;
        continue;
      }

      // ESC d n — Partial cut
      if (cmd === 0x64 && i + 2 < data.length) {
        commands.push({ name: "ESC d", bytes: [0x1b, 0x64, data[i + 2]] });
        i += 3;
        continue;
      }

      // ESC * r A — Enter raster mode
      if (cmd === 0x2a && i + 3 < data.length && data[i + 2] === 0x72 && data[i + 3] === 0x41) {
        commands.push({ name: "ESC * r A", bytes: [0x1b, 0x2a, 0x72, 0x41] });
        i += 4;

        // Read raster data until ESC * r B
        while (i < data.length) {
          if (
            data[i] === 0x1b &&
            i + 3 < data.length &&
            data[i + 1] === 0x2a &&
            data[i + 2] === 0x72 &&
            data[i + 3] === 0x42
          ) {
            commands.push({ name: "ESC * r B", bytes: [0x1b, 0x2a, 0x72, 0x42] });
            i += 4;
            break;
          }
          // b nL nH data — raster line
          if (data[i] === 0x62 && i + 2 < data.length) {
            const nL = data[i + 1];
            const nH = data[i + 2];
            const len = nL + nH * 256;
            commands.push({ name: "b", bytes: [0x62, nL, nH] });
            i += 3 + len;
          } else {
            i++;
          }
        }
        continue;
      }

      // Other ESC commands
      commands.push({ name: `ESC ${String.fromCharCode(cmd)}`, bytes: [0x1b, cmd] });
      i += 2;
      continue;
    }

    // BEL (0x07) — Cash drawer
    if (b === 0x07) {
      commands.push({ name: "BEL", bytes: [0x07] });
      i++;
      continue;
    }

    // LF (0x0A)
    if (b === 0x0a) {
      commands.push({ name: "LF", bytes: [0x0a] });
      i++;
      continue;
    }

    // Printable text
    if (b >= 0x20 && b <= 0x7e) {
      let text = "";
      while (i < data.length && data[i] >= 0x20 && data[i] <= 0x7e) {
        text += String.fromCharCode(data[i]);
        i++;
      }
      commands.push({ name: "TEXT", bytes: Array.from(new TextEncoder().encode(text)) });
      elements.push({
        type: "text",
        content: text,
        options: { align: currentAlign, bold: isBold || undefined },
      });
      continue;
    }

    i++;
  }

  return { commands, elements, warnings };
}
