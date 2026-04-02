import type { LabelElement } from "../types";

/**
 * SBPL Parser — SATO Barcode Printer Language.
 * Based on SBPL Programming Guide.
 * Uses ESC (0x1B) prefix, framed by ESC+A / ESC+Z.
 */

export interface SBPLParseResult {
  commands: { cmd: string; params: string }[];
  elements: LabelElement[];
  warnings: string[];
}

const ESC = "\x1b";

export function parseSBPL(code: string): SBPLParseResult {
  const commands: { cmd: string; params: string }[] = [];
  const elements: LabelElement[] = [];
  const warnings: string[] = [];
  let currentX = 0;
  let currentY = 0;

  // Split by ESC character
  const parts = code.split(ESC);

  for (const part of parts) {
    if (!part) continue;

    const cmdChar = part[0];
    const rest = part.slice(1);

    switch (cmdChar) {
      case "A":
        commands.push({ cmd: "START", params: rest });
        break;

      case "Z":
        commands.push({ cmd: "END", params: rest });
        break;

      case "C":
        if (rest.startsWith("S")) {
          commands.push({ cmd: "CLEAR", params: rest });
        }
        break;

      case "H":
        // Horizontal position (4 digits)
        currentX = Number(rest.slice(0, 4)) || 0;
        commands.push({ cmd: "H", params: rest.slice(0, 4) });
        break;

      case "V":
        // Vertical position (4 digits)
        currentY = Number(rest.slice(0, 4)) || 0;
        commands.push({ cmd: "V", params: rest.slice(0, 4) });
        break;

      case "L":
        // Magnification
        commands.push({ cmd: "L", params: rest.slice(0, 4) });
        break;

      case "%":
        // Rotation
        commands.push({ cmd: "ROTATION", params: rest[0] ?? "0" });
        break;

      case "K":
        // Text output
        if (rest.startsWith("9B")) {
          const text = rest.slice(2).split(ESC)[0] ?? "";
          commands.push({ cmd: "TEXT", params: text });
          elements.push({
            type: "text",
            content: text,
            options: { x: currentX, y: currentY },
          });
        } else {
          commands.push({ cmd: "K", params: rest });
        }
        break;

      case "B":
      case "D":
        // Barcode
        commands.push({ cmd: `BARCODE_${cmdChar}`, params: rest });
        break;

      case "G":
        // Graphics
        if (rest.startsWith("M")) {
          commands.push({ cmd: "GRAPHIC", params: rest });
        }
        break;

      case "F":
        // Line/box drawing (FW)
        if (rest.startsWith("W")) {
          commands.push({ cmd: "DRAW", params: rest.slice(1) });
        }
        break;

      case "Q":
        // Quantity
        commands.push({ cmd: "QUANTITY", params: rest });
        break;

      case "2":
        // 2D barcode
        if (rest.startsWith("D")) {
          commands.push({ cmd: "2D_BARCODE", params: rest });
        }
        break;

      default:
        commands.push({ cmd: cmdChar, params: rest });
        break;
    }
  }

  return { commands, elements, warnings };
}
