import { describe, expect, it } from "vitest";
import { escpos } from "../src/lang/escpos";
import { label } from "../src/builder";

describe("ESC/POS compiler", () => {
  it("starts with ESC @ (initialize)", () => {
    const output = escpos.compile(label({ width: 80 }));
    expect(output[0]).toBe(0x1b);
    expect(output[1]).toBe(0x40);
  });

  it("returns Uint8Array", () => {
    const output = escpos.compile(label({ width: 80 }));
    expect(output).toBeInstanceOf(Uint8Array);
  });

  it("generates text with line feed", () => {
    const output = escpos.compile(label({ width: 80 }).text("Hello"));
    const text = new TextDecoder().decode(output);
    expect(text).toContain("Hello");
  });

  it("generates bold text", () => {
    const output = escpos.compile(label({ width: 80 }).text("Bold", { bold: true }));
    const bytes = Array.from(output);
    const boldOnIdx = bytes.indexOf(0x45, bytes.indexOf(0x1b));
    expect(boldOnIdx).toBeGreaterThan(-1);
  });

  it("generates center alignment", () => {
    const output = escpos.compile(label({ width: 80 }).text("Centered", { align: "center" }));
    const bytes = Array.from(output);
    expect(bytes).toContain(0x61);
  });

  it("generates character size magnification", () => {
    const output = escpos.compile(label({ width: 80 }).text("Big", { size: 3 }));
    const bytes = Array.from(output);
    const gsIdx = bytes.findIndex((b, i) => b === 0x1d && bytes[i + 1] === 0x21);
    expect(gsIdx).toBeGreaterThan(-1);
    expect(bytes[gsIdx + 2]).toBe(0x22);
  });

  it("generates raster image with GS v 0", () => {
    const bitmap = {
      data: new Uint8Array([0xff, 0x00, 0xff, 0x00]),
      width: 8,
      height: 4,
      bytesPerRow: 1,
    };

    const output = escpos.compile(label({ width: 80 }).image(bitmap));
    const bytes = Array.from(output);

    const ls0Idx = bytes.findIndex(
      (b, i) => b === 0x1b && bytes[i + 1] === 0x33 && bytes[i + 2] === 0,
    );
    expect(ls0Idx).toBeGreaterThan(-1);

    const gvIdx = bytes.findIndex(
      (b, i) => b === 0x1d && bytes[i + 1] === 0x76 && bytes[i + 2] === 0x30,
    );
    expect(gvIdx).toBeGreaterThan(-1);

    const ls2Idx = bytes.findIndex((b, i) => b === 0x1b && bytes[i + 1] === 0x32);
    expect(ls2Idx).toBeGreaterThan(gvIdx);
  });

  it("generates raw bytes passthrough", () => {
    const raw = new Uint8Array([0x1b, 0x70, 0x00, 0x32, 0x32]);
    const output = escpos.compile(label({ width: 80 }).raw(raw));
    const bytes = Array.from(output);
    expect(bytes).toContain(0x70);
  });
});
