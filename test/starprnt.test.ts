import { describe, expect, it } from "vitest";
import { starprnt } from "../src/lang/starprnt";
import { label } from "../src/builder";

describe("Star PRNT compiler", () => {
  it("starts with ESC @ (initialize)", () => {
    const output = starprnt.compile(label({ width: 80 }));
    expect(output[0]).toBe(0x1b);
    expect(output[1]).toBe(0x40);
  });

  it("returns Uint8Array", () => {
    const output = starprnt.compile(label({ width: 80 }));
    expect(output).toBeInstanceOf(Uint8Array);
  });

  it("ends with partial cut (ESC d 1)", () => {
    const output = starprnt.compile(label({ width: 80 }));
    const bytes = Array.from(output);
    const len = bytes.length;
    expect(bytes[len - 3]).toBe(0x1b);
    expect(bytes[len - 2]).toBe(0x64);
    expect(bytes[len - 1]).toBe(1);
  });

  it("generates text with line feed", () => {
    const output = starprnt.compile(label({ width: 80 }).text("Hello Star"));
    const text = new TextDecoder().decode(output);
    expect(text).toContain("Hello Star");
  });

  it("generates Star alignment: ESC GS a n", () => {
    const output = starprnt.compile(label({ width: 80 }).text("Center", { align: "center" }));
    const bytes = Array.from(output);
    // ESC GS a 1 (center)
    const idx = bytes.findIndex(
      (b, i) => b === 0x1b && bytes[i + 1] === 0x1d && bytes[i + 2] === 0x61,
    );
    expect(idx).toBeGreaterThan(-1);
    expect(bytes[idx + 3]).toBe(1);
  });

  it("generates Star bold: ESC E (on) / ESC F (off)", () => {
    const output = starprnt.compile(label({ width: 80 }).text("Bold", { bold: true }));
    const bytes = Array.from(output);
    // ESC E (bold on)
    const onIdx = bytes.findIndex((b, i) => b === 0x1b && bytes[i + 1] === 0x45);
    expect(onIdx).toBeGreaterThan(-1);
    // ESC F (bold off)
    const offIdx = bytes.findIndex((b, i) => b === 0x1b && bytes[i + 1] === 0x46);
    expect(offIdx).toBeGreaterThan(onIdx);
  });

  it("generates Star size: ESC i h w", () => {
    const output = starprnt.compile(label({ width: 80 }).text("Big", { size: 3 }));
    const bytes = Array.from(output);
    const idx = bytes.findIndex((b, i) => b === 0x1b && bytes[i + 1] === 0x69);
    expect(idx).toBeGreaterThan(-1);
    expect(bytes[idx + 2]).toBe(3); // height
    expect(bytes[idx + 3]).toBe(3); // width
  });

  it("generates Star raster mode for images", () => {
    const bitmap = {
      data: new Uint8Array([0xff, 0x00, 0xaa, 0x55]),
      width: 8,
      height: 4,
      bytesPerRow: 1,
    };
    const output = starprnt.compile(label({ width: 80 }).image(bitmap));
    const bytes = Array.from(output);

    // Enter raster: ESC * r A
    const enterIdx = bytes.findIndex(
      (b, i) =>
        b === 0x1b && bytes[i + 1] === 0x2a && bytes[i + 2] === 0x72 && bytes[i + 3] === 0x41,
    );
    expect(enterIdx).toBeGreaterThan(-1);

    // Exit raster: ESC * r B
    const exitIdx = bytes.findIndex(
      (b, i) =>
        b === 0x1b && bytes[i + 1] === 0x2a && bytes[i + 2] === 0x72 && bytes[i + 3] === 0x42,
    );
    expect(exitIdx).toBeGreaterThan(enterIdx);

    // Should have 4 'b' commands (one per row)
    let bCount = 0;
    for (let i = enterIdx + 4; i < exitIdx; i++) {
      if (bytes[i] === 0x62) bCount++;
    }
    expect(bCount).toBe(4);
  });

  it("generates raw passthrough", () => {
    const raw = new Uint8Array([0x07]); // BEL (cash drawer)
    const output = starprnt.compile(label({ width: 80 }).raw(raw));
    expect(Array.from(output)).toContain(0x07);
  });
});
