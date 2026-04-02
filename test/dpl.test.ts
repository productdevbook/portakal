import { describe, expect, it } from "vitest";
import { dpl } from "../src/lang/dpl";
import { label } from "../src/builder";

describe("DPL compiler", () => {
  it("generates STX L header and E footer", () => {
    const output = dpl.compile(label({ width: 40, height: 30 }));
    expect(output).toContain("\x02L");
    expect(output).toContain("\r\nE\r\n");
  });

  it("generates density command", () => {
    const output = dpl.compile(label({ width: 40, height: 30, density: 8 }));
    expect(output).toContain("D08");
  });

  it("generates speed command", () => {
    const output = dpl.compile(label({ width: 40, height: 30, speed: 6 }));
    expect(output).toContain("S06");
  });

  it("generates width command", () => {
    const output = dpl.compile(label({ width: 40, height: 30 }));
    expect(output).toContain("A0320"); // 40mm at 203 DPI
  });

  it("generates copies command", () => {
    const output = dpl.compile(label({ width: 40, height: 30, copies: 5 }));
    expect(output).toContain("Q0005");
  });

  it("generates text record", () => {
    const output = dpl.compile(label({ width: 40, height: 30 }).text("Hello", { x: 10, y: 20 }));
    expect(output).toContain("0010");
    expect(output).toContain("0020");
    expect(output).toContain("Hello");
  });

  it("generates rotated text", () => {
    const output = dpl.compile(
      label({ width: 40, height: 30 }).text("Rotated", { x: 10, y: 20, rotation: 90 }),
    );
    expect(output).toContain("2"); // rotation 2 = 90 degrees
  });

  it("generates box record", () => {
    const output = dpl.compile(
      label({ width: 40, height: 30 }).box({ x: 5, y: 5, width: 100, height: 80, thickness: 2 }),
    );
    expect(output).toContain("0005");
    expect(output).toContain("0100");
    expect(output).toContain("0080");
  });

  it("generates horizontal line", () => {
    const output = dpl.compile(
      label({ width: 40, height: 30 }).line({ x1: 10, y1: 50, x2: 300, y2: 50, thickness: 2 }),
    );
    expect(output).toContain("0010");
    expect(output).toContain("0050");
  });

  it("handles raw passthrough", () => {
    const output = dpl.compile(label({ width: 40, height: 30 }).raw("CUSTOM"));
    expect(output).toContain("CUSTOM");
  });
});
