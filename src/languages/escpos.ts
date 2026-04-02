import type { LabelElement, ResolvedLabel } from "../types";

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

function alignByte(align: string | undefined): number {
  switch (align) {
    case "center":
      return 1;
    case "right":
      return 2;
    default:
      return 0;
  }
}

class ByteBuffer {
  private chunks: Uint8Array[] = [];

  write(...bytes: number[]): void {
    this.chunks.push(new Uint8Array(bytes));
  }

  writeBytes(data: Uint8Array): void {
    this.chunks.push(data);
  }

  writeText(text: string): void {
    this.writeBytes(new TextEncoder().encode(text));
  }

  toUint8Array(): Uint8Array {
    let totalLen = 0;
    for (const c of this.chunks) totalLen += c.length;
    const result = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of this.chunks) {
      result.set(c, offset);
      offset += c.length;
    }
    return result;
  }
}

function compileElement(el: LabelElement, buf: ByteBuffer): void {
  switch (el.type) {
    case "text": {
      const o = el.options;

      buf.write(ESC, 0x61, alignByte(o.align));

      if (o.bold) {
        buf.write(ESC, 0x45, 1);
      }

      if (o.underline) {
        buf.write(ESC, 0x2d, 1);
      }

      if (o.size && o.size > 1) {
        const mag = o.size - 1;
        buf.write(GS, 0x21, ((mag & 0x07) << 4) | (mag & 0x07));
      }

      if (o.reverse) {
        buf.write(GS, 0x42, 1);
      }

      buf.writeText(el.content);
      buf.write(LF);

      if (o.bold) buf.write(ESC, 0x45, 0);
      if (o.underline) buf.write(ESC, 0x2d, 0);
      if (o.size && o.size > 1) buf.write(GS, 0x21, 0);
      if (o.reverse) buf.write(GS, 0x42, 0);
      buf.write(ESC, 0x61, 0);
      break;
    }

    case "image": {
      const bmp = el.bitmap;
      const xL = bmp.bytesPerRow & 0xff;
      const xH = (bmp.bytesPerRow >> 8) & 0xff;
      const yL = bmp.height & 0xff;
      const yH = (bmp.height >> 8) & 0xff;

      buf.write(ESC, 0x33, 0);
      buf.write(GS, 0x76, 0x30, 0, xL, xH, yL, yH);
      buf.writeBytes(bmp.data);
      buf.write(ESC, 0x32);
      break;
    }

    case "box":
    case "line":
    case "circle":
      break;

    case "raw":
      if (typeof el.content === "string") {
        buf.writeText(el.content);
      } else {
        buf.writeBytes(el.content);
      }
      break;
  }
}

/** Compile a resolved label to ESC/POS byte sequence */
export function compileToESCPOS(label: ResolvedLabel): Uint8Array {
  const buf = new ByteBuffer();

  buf.write(ESC, 0x40);

  for (const el of label.elements) {
    compileElement(el, buf);
  }

  return buf.toUint8Array();
}
