import type { LabelElement } from "../types";

/**
 * IPL Parser — Intermec Printer Language.
 * Based on IPL Programmer's Reference Manual.
 * Uses STX (0x02) / ETX (0x03) framing with ; command separator.
 */

export interface IPLParseResult {
  commands: { type: string; params: string }[];
  widthDots: number;
  heightDots: number;
  elements: LabelElement[];
  warnings: string[];
}

const STX = "\x02";
const ETX = "\x03";
const ESC = "\x1b";

export function parseIPL(code: string): IPLParseResult {
  const commands: { type: string; params: string }[] = [];
  const elements: LabelElement[] = [];
  const warnings: string[] = [];
  let widthDots = 832;
  let heightDots = 400;

  // Split by STX...ETX frames
  const frames: string[] = [];
  let pos = 0;
  while (pos < code.length) {
    const stxIdx = code.indexOf(STX, pos);
    if (stxIdx < 0) break;
    const etxIdx = code.indexOf(ETX, stxIdx);
    if (etxIdx < 0) {
      frames.push(code.slice(stxIdx + 1));
      break;
    }
    frames.push(code.slice(stxIdx + 1, etxIdx));
    pos = etxIdx + 1;
  }

  for (const frame of frames) {
    // ESC commands
    if (frame.startsWith(ESC)) {
      const cmdChar = frame[1];
      const params = frame.slice(2);

      switch (cmdChar) {
        case "C":
          commands.push({ type: "CREATE_FORMAT", params });
          break;
        case "E":
          commands.push({ type: "END_FORMAT", params });
          break;
        case "P":
          commands.push({ type: "PROGRAM_MODE", params });
          break;
        case "F":
          commands.push({ type: "FILL_FIELD", params });
          break;
        case "M":
          commands.push({ type: "COPIES", params });
          break;
        default:
          commands.push({ type: `ESC_${cmdChar}`, params });
      }
      continue;
    }

    // SI commands (configuration)
    if (frame.startsWith("<SI>") || frame.startsWith("SI>")) {
      const rest = frame.replace(/^<?SI>/, "");
      const key = rest[0];
      const value = rest.slice(1);

      switch (key) {
        case "L":
          heightDots = Number(value) || heightDots;
          commands.push({ type: "LABEL_LENGTH", params: value });
          break;
        case "W":
          widthDots = Number(value) || widthDots;
          commands.push({ type: "LABEL_WIDTH", params: value });
          break;
        case "S":
          commands.push({ type: "SPEED", params: value });
          break;
        case "d":
          commands.push({ type: "DARKNESS", params: value });
          break;
        case "g":
          commands.push({ type: "GAP", params: value });
          break;
        case "t":
          commands.push({ type: "MEDIA_TYPE", params: value });
          break;
        default:
          commands.push({ type: `SI_${key}`, params: value });
      }
      continue;
    }

    // Field commands: H (text), B (barcode), L (line), W (box), G (graphic)
    if (
      frame.startsWith("H") ||
      frame.startsWith("B") ||
      frame.startsWith("L") ||
      frame.startsWith("W") ||
      frame.startsWith("G")
    ) {
      const fieldType = frame[0];
      const rest = frame.slice(1);

      // Parse field: number;params
      const semiIdx = rest.indexOf(";");
      const fieldNum = semiIdx >= 0 ? rest.slice(0, semiIdx) : rest;
      const fieldParams = semiIdx >= 0 ? rest.slice(semiIdx + 1) : "";

      commands.push({ type: `FIELD_${fieldType}`, params: `${fieldNum};${fieldParams}` });

      // Extract position and data from H (text) fields
      if (fieldType === "H") {
        const oMatch = fieldParams.match(/o(\d+),(\d+)/);
        const dMatch = fieldParams.match(/d\d+,(.+)$/);
        if (oMatch && dMatch) {
          elements.push({
            type: "text",
            content: dMatch[1],
            options: { x: Number(oMatch[1]), y: Number(oMatch[2]) },
          });
        }
      }

      // Extract box from W fields
      if (fieldType === "W") {
        const oMatch = fieldParams.match(/o(\d+),(\d+)/);
        const lMatch = fieldParams.match(/l(\d+)/);
        const hMatch = fieldParams.match(/h(\d+)/);
        const wMatch = fieldParams.match(/w(\d+)/);
        if (oMatch && lMatch && hMatch) {
          elements.push({
            type: "box",
            options: {
              x: Number(oMatch[1]),
              y: Number(oMatch[2]),
              width: Number(lMatch[1]),
              height: Number(hMatch[1]),
              thickness: wMatch ? Number(wMatch[1]) : 1,
            },
          });
        }
      }

      // Extract line from L fields
      if (fieldType === "L") {
        const oMatch = fieldParams.match(/o(\d+),(\d+)/);
        const lMatch = fieldParams.match(/l(\d+)/);
        const wMatch = fieldParams.match(/w(\d+)/);
        const fMatch = fieldParams.match(/f(\d+)/);
        if (oMatch && lMatch) {
          const x = Number(oMatch[1]);
          const y = Number(oMatch[2]);
          const len = Number(lMatch[1]);
          const t = wMatch ? Number(wMatch[1]) : 1;
          const dir = fMatch ? Number(fMatch[1]) : 0;
          if (dir === 0) {
            elements.push({
              type: "line",
              options: { x1: x, y1: y, x2: x + len, y2: y, thickness: t },
            });
          } else {
            elements.push({
              type: "line",
              options: { x1: x, y1: y, x2: x, y2: y + len, thickness: t },
            });
          }
        }
      }

      continue;
    }

    // R — Print
    if (frame === "R") {
      commands.push({ type: "PRINT", params: "" });
      continue;
    }

    commands.push({ type: "UNKNOWN", params: frame });
  }

  return { commands, widthDots, heightDots, elements, warnings };
}
