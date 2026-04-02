import type { LabelElement, ResolvedLabel } from "../types";

function eplRotation(r: number): number {
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

function compileElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const rot = eplRotation(o.rotation ?? 0);
      const font = o.font ?? "2";
      const hMul = o.xScale ?? o.size ?? 1;
      const vMul = o.yScale ?? o.size ?? 1;
      const reverse = o.reverse ? "R" : "N";
      return `A${x},${y},${rot},${font},${hMul},${vMul},${reverse},"${el.content}"`;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      return `GW${x},${y},${bmp.bytesPerRow},${bmp.height}`;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const x2 = o.x + o.width;
      const y2 = o.y + o.height;
      return `X${o.x},${o.y},${x2},${y2},${t}`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      if (o.y1 === o.y2) {
        const w = Math.abs(o.x2 - o.x1);
        return `LO${Math.min(o.x1, o.x2)},${o.y1},${w},${t}`;
      }
      if (o.x1 === o.x2) {
        const h = Math.abs(o.y2 - o.y1);
        return `LO${o.x1},${Math.min(o.y1, o.y2)},${t},${h}`;
      }
      return `LO${o.x1},${o.y1},${Math.abs(o.x2 - o.x1)},${t}`;
    }

    case "circle":
      return "";

    case "raw":
      return typeof el.content === "string" ? el.content : "";
  }
}

/** Compile a resolved label to EPL2 command string */
export function compileToEPL(label: ResolvedLabel): string {
  const lines: string[] = [];

  lines.push("N");
  lines.push(`q${label.widthDots}`);
  if (label.heightDots > 0) {
    lines.push(`Q${label.heightDots},${label.gapDots}`);
  }
  lines.push(`S${label.speed}`);
  lines.push(`D${label.density}`);

  for (const el of label.elements) {
    const line = compileElement(el);
    if (line) {
      lines.push(line);
    }
  }

  lines.push(`P${label.copies}`);
  return lines.join("\n") + "\n";
}
