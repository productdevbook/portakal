import { describe, expect, it } from "vitest";
import { label } from "../src/builder";

describe("ZPL II compiler", () => {
  it("generates basic label structure", () => {
    const output = label({ width: 40, height: 30 }).toZPL();

    expect(output).toContain("^XA");
    expect(output).toContain("^XZ");
    expect(output).toContain("^PW320");
    expect(output).toContain("^LL240");
    expect(output).toContain("^CI28");
    expect(output).toContain("^PQ1");
  });

  it("generates text field", () => {
    const output = label({ width: 40, height: 30 })
      .text("Hello ZPL", { x: 50, y: 50, size: 2 })
      .toZPL();

    expect(output).toContain("^FO50,50");
    expect(output).toContain("^A0N,60,60");
    expect(output).toContain("^FDHello ZPL^FS");
  });

  it("generates text with rotation", () => {
    const output = label({ width: 40, height: 30 })
      .text("Rotated", { x: 10, y: 10, rotation: 90 })
      .toZPL();

    expect(output).toContain("^A0R,30,30");
  });

  it("generates reverse text", () => {
    const output = label({ width: 40, height: 30 })
      .text("Reversed", { x: 10, y: 10, reverse: true })
      .toZPL();

    expect(output).toContain("^FR");
  });

  it("generates box", () => {
    const output = label({ width: 40, height: 30 })
      .box({ x: 0, y: 0, width: 200, height: 100, thickness: 3 })
      .toZPL();

    expect(output).toContain("^FO0,0^GB200,100,3,B,0^FS");
  });

  it("generates circle", () => {
    const output = label({ width: 40, height: 30 })
      .circle({ x: 100, y: 100, diameter: 60, thickness: 2 })
      .toZPL();

    expect(output).toContain("^FO100,100^GC60,2,B^FS");
  });

  it("generates horizontal line", () => {
    const output = label({ width: 40, height: 30 })
      .line({ x1: 10, y1: 50, x2: 300, y2: 50, thickness: 2 })
      .toZPL();

    expect(output).toContain("^FO10,50^GB290,2,2^FS");
  });

  it("generates image as ASCII hex GF", () => {
    const bitmap = {
      data: new Uint8Array([0xff, 0x00, 0xff, 0x00]),
      width: 16,
      height: 2,
      bytesPerRow: 2,
    };

    const output = label({ width: 40, height: 30 }).image(bitmap, { x: 10, y: 10 }).toZPL();

    expect(output).toContain("^FO10,10^GFA,4,4,2,FF00FF00^FS");
  });

  it("handles raw ZPL passthrough", () => {
    const output = label({ width: 40, height: 30 }).raw("^FO10,10^FDCustom^FS").toZPL();

    expect(output).toContain("^FO10,10^FDCustom^FS");
  });

  it("omits ^LL for receipt mode (no height)", () => {
    const output = label({ width: 80 }).toZPL();
    expect(output).not.toContain("^LL0");
  });
});
