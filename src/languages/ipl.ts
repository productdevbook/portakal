import type { LabelElement, ResolvedLabel } from "../types";

const STX = "\x02";
const ETX = "\x03";
const ESC = "\x1b";

function iplRotation(r: number): number {
  switch (r) {
    case 90:
      return 1;
    case 180:
      return 2;
    case 270:
      return 3;
    default:
      return 0;
  }
}

function compileElement(el: LabelElement, fieldNum: number): string[] {
  const cmds: string[] = [];

  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const rot = iplRotation(o.rotation ?? 0);
      const h = (o.size ?? 1) * 12;
      const w = h;
      cmds.push(`${STX}H${fieldNum};o${x},${y};f${rot};h${h};w${w};c26;d3,${el.content}${ETX}`);
      break;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      cmds.push(`${STX}G${fieldNum};o${x},${y};f0${ETX}`);
      break;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      cmds.push(`${STX}W${fieldNum};o${o.x},${o.y};f0;l${o.width};h${o.height};w${t}${ETX}`);
      break;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      if (o.y1 === o.y2) {
        const len = Math.abs(o.x2 - o.x1);
        cmds.push(`${STX}L${fieldNum};o${Math.min(o.x1, o.x2)},${o.y1};f0;l${len};w${t}${ETX}`);
      } else if (o.x1 === o.x2) {
        const len = Math.abs(o.y2 - o.y1);
        cmds.push(`${STX}L${fieldNum};o${o.x1},${Math.min(o.y1, o.y2)};f1;l${len};w${t}${ETX}`);
      }
      break;
    }

    case "circle":
      break;

    case "raw":
      if (typeof el.content === "string") cmds.push(el.content);
      break;
  }

  return cmds;
}

/** Compile a resolved label to IPL (Intermec Printer Language) command string */
export function compileToIPL(label: ResolvedLabel): string {
  const lines: string[] = [];

  lines.push(`${STX}${ESC}C1${ETX}`); // Create format 1
  lines.push(`${STX}${ESC}P${ETX}`); // Enter program mode

  // Configuration
  lines.push(`${STX}<SI>L${label.heightDots > 0 ? label.heightDots : 400}${ETX}`);
  lines.push(`${STX}<SI>W${label.widthDots}${ETX}`);
  lines.push(`${STX}<SI>S${label.speed}0${ETX}`);
  lines.push(`${STX}<SI>d${label.density}${ETX}`);

  let fieldNum = 1;
  for (const el of label.elements) {
    lines.push(...compileElement(el, fieldNum));
    fieldNum++;
  }

  lines.push(`${STX}R${ETX}`); // Print
  if (label.copies > 1) {
    lines.push(`${STX}${ESC}M${label.copies}${ETX}`);
  }
  lines.push(`${STX}${ESC}E1${ETX}`); // End format

  return lines.join("\r\n") + "\r\n";
}
