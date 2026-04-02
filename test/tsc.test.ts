import { describe, expect, it } from "vitest";
import { tsc } from "../src/lang/tsc";
import { label } from "../src/builder";

describe("TSC/TSPL2 compiler", () => {
  it("generates basic label setup commands", () => {
    const output = tsc.compile(label({ width: 40, height: 30 }));

    expect(output).toContain("SIZE 40 mm,30 mm\r\n");
    expect(output).toContain("GAP 3 mm,0 mm\r\n");
    expect(output).toContain("SPEED 4\r\n");
    expect(output).toContain("DENSITY 8\r\n");
    expect(output).toContain("DIRECTION 0\r\n");
    expect(output).toContain("CLS\r\n");
    expect(output).toContain("PRINT 1\r\n");
  });

  it("uses CRLF line endings", () => {
    const output = tsc.compile(label({ width: 40, height: 30 }));
    const lines = output.split("\r\n");
    expect(lines.length).toBeGreaterThan(5);
  });

  it("generates TEXT command", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).text("Hello World", { x: 10, y: 20, font: "3", size: 2 }),
    );

    expect(output).toContain('TEXT 10,20,"3",0,2,2,"Hello World"');
  });

  it("generates TEXT with rotation", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).text("Rotated", { x: 10, y: 20, rotation: 90 }),
    );

    expect(output).toContain('TEXT 10,20,"2",90,1,1,"Rotated"');
  });

  it("generates BOX command", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).box({ x: 5, y: 5, width: 300, height: 200, thickness: 2 }),
    );

    expect(output).toContain("BOX 5,5,305,205,2");
  });

  it("generates BOX with radius", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).box({
        x: 5,
        y: 5,
        width: 100,
        height: 100,
        thickness: 1,
        radius: 5,
      }),
    );

    expect(output).toContain("BOX 5,5,105,105,1,5");
  });

  it("generates horizontal line as BAR", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).line({ x1: 10, y1: 50, x2: 300, y2: 50, thickness: 2 }),
    );

    expect(output).toContain("BAR 10,50,290,2");
  });

  it("generates vertical line as BAR", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).line({ x1: 50, y1: 10, x2: 50, y2: 200, thickness: 3 }),
    );

    expect(output).toContain("BAR 50,10,3,190");
  });

  it("generates DIAGONAL for non-axis-aligned lines", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).line({ x1: 10, y1: 20, x2: 100, y2: 200, thickness: 2 }),
    );

    expect(output).toContain("DIAGONAL 10,20,100,200,2");
  });

  it("generates CIRCLE command", () => {
    const output = tsc.compile(
      label({ width: 40, height: 30 }).circle({ x: 100, y: 100, diameter: 50, thickness: 2 }),
    );

    expect(output).toContain("CIRCLE 100,100,50,2");
  });

  it("generates BITMAP command for images", () => {
    const bitmap = {
      data: new Uint8Array([0xff, 0x00]),
      width: 8,
      height: 2,
      bytesPerRow: 1,
    };
    const output = tsc.compile(label({ width: 40, height: 30 }).image(bitmap, { x: 10, y: 10 }));

    expect(output).toContain("BITMAP 10,10,1,2,0,");
  });

  it("handles raw command passthrough", () => {
    const output = tsc.compile(label({ width: 40, height: 30 }).raw("SET CUTTER ON"));

    expect(output).toContain("SET CUTTER ON");
  });

  it("handles multiple copies", () => {
    const output = tsc.compile(label({ width: 40, height: 30, copies: 5 }));
    expect(output).toContain("PRINT 5");
  });

  it("handles custom speed and density", () => {
    const output = tsc.compile(label({ width: 40, height: 30, speed: 8, density: 12 }));
    expect(output).toContain("SPEED 8");
    expect(output).toContain("DENSITY 12");
  });
});
