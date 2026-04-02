import type { LabelElement, ResolvedLabel } from "../types";

function zplRotation(r: number): string {
  switch (r) {
    case 90:
      return "R";
    case 180:
      return "I";
    case 270:
      return "B";
    default:
      return "N";
  }
}

function compileElement(el: LabelElement): string {
  switch (el.type) {
    case "text": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const rot = zplRotation(o.rotation ?? 0);
      const font = o.font ?? "0";
      const h = (o.size ?? 1) * 30;
      const w = o.xScale ?? h;

      let cmd = `^FO${x},${y}`;
      cmd += `^A${font}${rot},${h},${w}`;

      if (o.maxWidth) {
        const justify = o.align === "center" ? "C" : o.align === "right" ? "R" : "L";
        const lines = 999;
        cmd += `^FB${o.maxWidth},${lines},0,${justify}`;
      }

      if (o.reverse) {
        cmd += "^FR";
      }

      cmd += `^FD${el.content}^FS`;
      return cmd;
    }

    case "image": {
      const o = el.options;
      const x = o.x ?? 0;
      const y = o.y ?? 0;
      const bmp = el.bitmap;
      const totalBytes = bmp.data.length;

      let hex = "";
      for (let i = 0; i < bmp.data.length; i++) {
        hex += bmp.data[i].toString(16).padStart(2, "0").toUpperCase();
      }

      return `^FO${x},${y}^GFA,${totalBytes},${totalBytes},${bmp.bytesPerRow},${hex}^FS`;
    }

    case "box": {
      const o = el.options;
      const t = o.thickness ?? 1;
      const radiusDots = o.radius ?? 0;
      // Convert dot radius to ZPL 0-8 index: index = radius / (shorter_side/2) * 8
      const maxR = Math.min(o.width, o.height) / 2;
      const rIndex = maxR > 0 && radiusDots > 0 ? Math.min(8, Math.round((radiusDots / maxR) * 8)) : 0;
      return `^FO${o.x},${o.y}^GB${o.width},${o.height},${t},B,${rIndex}^FS`;
    }

    case "line": {
      const o = el.options;
      const t = o.thickness ?? 1;
      if (o.y1 === o.y2) {
        const w = Math.abs(o.x2 - o.x1);
        return `^FO${Math.min(o.x1, o.x2)},${o.y1}^GB${w},${t},${t}^FS`;
      }
      if (o.x1 === o.x2) {
        const h = Math.abs(o.y2 - o.y1);
        return `^FO${o.x1},${Math.min(o.y1, o.y2)}^GB${t},${h},${t}^FS`;
      }
      const w = Math.abs(o.x2 - o.x1);
      const h = Math.abs(o.y2 - o.y1);
      const dir = o.x2 > o.x1 === o.y2 > o.y1 ? "R" : "L";
      return `^FO${Math.min(o.x1, o.x2)},${Math.min(o.y1, o.y2)}^GD${w},${h},${t},B,${dir}^FS`;
    }

    case "circle": {
      const o = el.options;
      const t = o.thickness ?? 1;
      return `^FO${o.x},${o.y}^GC${o.diameter},${t},B^FS`;
    }

    case "ellipse":
    case "reverse":
    case "erase":
      return "";
    case "raw":
      return typeof el.content === "string" ? el.content : "";
  }
}

/** Compile a resolved label to ZPL II command string */
export function compileToZPL(label: ResolvedLabel): string {
  const lines: string[] = [];

  lines.push("^XA");
  lines.push(`^PW${label.widthDots}`);
  if (label.heightDots > 0) {
    lines.push(`^LL${label.heightDots}`);
  }
  lines.push(`^PR${label.speed}`);
  lines.push(`~SD${label.density * 2}`);
  lines.push("^CI28");

  for (const el of label.elements) {
    lines.push(compileElement(el));
  }

  lines.push(`^PQ${label.copies}`);
  lines.push("^XZ");
  return lines.join("\n") + "\n";
}
