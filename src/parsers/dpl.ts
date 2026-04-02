import type { LabelElement } from "../types";

/**
 * DPL Parser — Datamax/Honeywell Programming Language.
 * Based on DPL Programmer's Manual.
 * Uses SOH (0x01) and STX (0x02) prefixes.
 */

export interface DPLParseResult {
  commands: { type: string; params: string }[];
  widthDots: number;
  elements: LabelElement[];
  warnings: string[];
}

export function parseDPL(code: string): DPLParseResult {
  const commands: { type: string; params: string }[] = [];
  const elements: LabelElement[] = [];
  const warnings: string[] = [];
  let widthDots = 832;
  let inLabel = false;

  for (const rawLine of code.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // STX L — Enter label format
    if (line === "\x02L" || line === "L") {
      inLabel = true;
      commands.push({ type: "STX_L", params: "" });
      continue;
    }

    // E — End label, print
    if (line === "E" && inLabel) {
      inLabel = false;
      commands.push({ type: "E", params: "" });
      continue;
    }

    // Configuration commands
    if (line.startsWith("D") && line.length <= 4 && /^D\d{1,2}$/.test(line)) {
      commands.push({ type: "DENSITY", params: line.slice(1) });
      continue;
    }

    if (line.startsWith("S") && /^S\d{1,2}$/.test(line)) {
      commands.push({ type: "SPEED", params: line.slice(1) });
      continue;
    }

    if (line.startsWith("A") && /^A\d{4}$/.test(line)) {
      widthDots = Number(line.slice(1));
      commands.push({ type: "WIDTH", params: line.slice(1) });
      continue;
    }

    if (line.startsWith("Q") && /^Q\d{4}$/.test(line)) {
      commands.push({ type: "QUANTITY", params: line.slice(1) });
      continue;
    }

    // Label format records (fixed-field)
    if (inLabel && /^\d/.test(line)) {
      // Record: rotation(1) + column(4) + row(4) + height(4) + width(4) + ...
      if (line.length >= 13) {
        const rotation = Number(line[0]);
        const col = Number(line.slice(1, 5));
        const row = Number(line.slice(5, 9));
        commands.push({ type: "RECORD", params: line });

        // Try to extract text content (appears after the fixed fields)
        if (line.length > 20) {
          const content = line.slice(Math.min(20, line.length));
          if (content && /[A-Za-z0-9]/.test(content)) {
            elements.push({
              type: "text",
              content,
              options: { x: col, y: row },
            });
          }
        }
      }
      continue;
    }

    commands.push({ type: "OTHER", params: line });
  }

  return { commands, widthDots, elements, warnings };
}
