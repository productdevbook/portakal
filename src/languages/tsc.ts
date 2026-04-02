import type { LabelElement, ResolvedLabel } from "../types";

function compileElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const font = o.font ?? "2";
      const rotation = o.rotation ?? 0;
      const xMul = o.xScale ?? o.size ?? 1;
      const yMul = o.yScale ?? o.size ?? 1;
      if (o.maxWidth) {
        const align = o.align === "center" ? 2 : o.align === "right" ? 3 : 1;
        const spacing = o.lineSpacing ?? 0;
        return `BLOCK ${x},${y},${o.maxWidth},${o.maxWidth},"${font}",${rotation},${xMul},${yMul},${spacing},${align},"${el.content}"`;
      }

      return `TEXT ${x},${y},"${font}",${rotation},${xMul},${yMul},"${el.content}"`;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      return `BITMAP ${x},${y},${bmp.bytesPerRow},${bmp.height},0,`;
    }

    case "box": {
      const o = el.options;
      const x2 = o.x + o.width;
      const y2 = o.y + o.height;
      const t = o.thickness ?? 1;
      if (o.radius) {
        return `BOX ${o.x},${o.y},${x2},${y2},${t},${o.radius}`;
      }
      return `BOX ${o.x},${o.y},${x2},${y2},${t}`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      if (o.y1 === o.y2) {
        const w = Math.abs(o.x2 - o.x1);
        return `BAR ${Math.min(o.x1, o.x2)},${o.y1},${w},${t}`;
      }
      if (o.x1 === o.x2) {
        const h = Math.abs(o.y2 - o.y1);
        return `BAR ${o.x1},${Math.min(o.y1, o.y2)},${t},${h}`;
      }
      return `DIAGONAL ${o.x1},${o.y1},${o.x2},${o.y2},${t}`;
    }

    case "circle": {
      const o = el.options;
      const t = o.thickness ?? 1;
      return `CIRCLE ${o.x},${o.y},${o.diameter},${t}`;
    }

    case "raw":
      return typeof el.content === "string" ? el.content : "";
  }
}

/** Compile a resolved label to TSC/TSPL2 command string */
export function compileToTSC(label: ResolvedLabel): string {
  const lines: string[] = [];
  const dpi = label.dpi;
  const wMM = Math.round((label.widthDots / dpi) * 25.4);
  const hMM = label.heightDots > 0 ? Math.round((label.heightDots / dpi) * 25.4) : 0;
  const gMM = Math.round((label.gapDots / dpi) * 25.4);

  lines.push(`SIZE ${wMM} mm,${hMM} mm`);
  lines.push(`GAP ${gMM} mm,0 mm`);
  lines.push(`SPEED ${label.speed}`);
  lines.push(`DENSITY ${label.density}`);
  lines.push(`DIRECTION ${label.direction}`);
  lines.push("CLS");

  for (const el of label.elements) {
    lines.push(compileElement(el));
  }

  lines.push(`PRINT ${label.copies}`);
  return lines.join("\r\n") + "\r\n";
}
