import { describe, expect, it } from "vitest";
import { ipl } from "../src/lang/ipl";
import { label } from "../src/builder";

describe("IPL compiler", () => {
  it("generates format creation and program mode", () => {
    const output = ipl.compile(label({ width: 40, height: 30 }));
    expect(output).toContain("\x02\x1bC1\x03");
    expect(output).toContain("\x02\x1bP\x03");
  });

  it("generates format end", () => {
    const output = ipl.compile(label({ width: 40, height: 30 }));
    expect(output).toContain("\x02\x1bE1\x03");
  });

  it("generates print command", () => {
    const output = ipl.compile(label({ width: 40, height: 30 }));
    expect(output).toContain("\x02R\x03");
  });

  it("generates label size config", () => {
    const output = ipl.compile(label({ width: 40, height: 30 }));
    expect(output).toContain("<SI>L240"); // 30mm at 203 DPI
    expect(output).toContain("<SI>W320"); // 40mm at 203 DPI
  });

  it("generates speed and density config", () => {
    const output = ipl.compile(label({ width: 40, height: 30, speed: 6, density: 10 }));
    expect(output).toContain("<SI>S60");
    expect(output).toContain("<SI>d10");
  });

  it("generates text field (H command)", () => {
    const output = ipl.compile(
      label({ width: 40, height: 30 }).text("Hello IPL", { x: 50, y: 30 }),
    );
    expect(output).toContain("H1;o50,30");
    expect(output).toContain("Hello IPL");
  });

  it("generates rotated text", () => {
    const output = ipl.compile(
      label({ width: 40, height: 30 }).text("Rotated", { x: 10, y: 20, rotation: 90 }),
    );
    expect(output).toContain(";f1;"); // rotation 1 = 90 degrees
  });

  it("generates box field (W command)", () => {
    const output = ipl.compile(
      label({ width: 40, height: 30 }).box({ x: 10, y: 20, width: 200, height: 100, thickness: 2 }),
    );
    expect(output).toContain("W1;o10,20");
    expect(output).toContain("l200");
    expect(output).toContain("h100");
    expect(output).toContain("w2");
  });

  it("generates horizontal line (L command)", () => {
    const output = ipl.compile(
      label({ width: 40, height: 30 }).line({ x1: 10, y1: 50, x2: 300, y2: 50, thickness: 2 }),
    );
    expect(output).toContain("L1;o10,50");
    expect(output).toContain("l290");
  });

  it("generates vertical line", () => {
    const output = ipl.compile(
      label({ width: 40, height: 30 }).line({ x1: 50, y1: 10, x2: 50, y2: 200 }),
    );
    expect(output).toContain(";f1;"); // vertical
    expect(output).toContain("l190");
  });

  it("generates multiple copies", () => {
    const output = ipl.compile(label({ width: 40, height: 30, copies: 5 }));
    expect(output).toContain("\x1bM5");
  });

  it("handles raw passthrough", () => {
    const output = ipl.compile(label({ width: 40, height: 30 }).raw("CUSTOM_CMD"));
    expect(output).toContain("CUSTOM_CMD");
  });
});
