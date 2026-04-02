import { describe, expect, it } from "vitest";
import { sbpl } from "../src/lang/sbpl";
import { label } from "../src/builder";

describe("SBPL compiler", () => {
  it("generates ESC A start and ESC Z end", () => {
    const output = sbpl.compile(label({ width: 40, height: 30 }));
    expect(output).toContain("\x1bA");
    expect(output).toContain("\x1bZ");
  });

  it("generates ESC CS (clear buffer)", () => {
    const output = sbpl.compile(label({ width: 40, height: 30 }));
    expect(output).toContain("\x1bCS");
  });

  it("generates text with position and font", () => {
    const output = sbpl.compile(
      label({ width: 40, height: 30 }).text("Hello SATO", { x: 100, y: 50, size: 2 }),
    );
    expect(output).toContain("\x1bH0100"); // H position
    expect(output).toContain("\x1bV0050"); // V position
    expect(output).toContain("\x1bL0202"); // magnification 2x2
    expect(output).toContain("\x1bK9BHello SATO"); // text output
  });

  it("generates rotated text", () => {
    const output = sbpl.compile(
      label({ width: 40, height: 30 }).text("Rotated", { x: 10, y: 20, rotation: 90 }),
    );
    expect(output).toContain("\x1b%1"); // 90 degree rotation
  });

  it("generates box with FW command", () => {
    const output = sbpl.compile(
      label({ width: 40, height: 30 }).box({ x: 10, y: 20, width: 200, height: 100, thickness: 2 }),
    );
    expect(output).toContain("\x1bH0010");
    expect(output).toContain("\x1bV0020");
    expect(output).toContain("\x1bFW02V0100H0200");
  });

  it("generates horizontal line", () => {
    const output = sbpl.compile(
      label({ width: 40, height: 30 }).line({ x1: 10, y1: 50, x2: 300, y2: 50, thickness: 2 }),
    );
    expect(output).toContain("\x1bFW02H0290");
  });

  it("generates vertical line", () => {
    const output = sbpl.compile(
      label({ width: 40, height: 30 }).line({ x1: 50, y1: 10, x2: 50, y2: 200, thickness: 1 }),
    );
    expect(output).toContain("\x1bFW01V0190");
  });

  it("generates image with GM command", () => {
    const bitmap = {
      data: new Uint8Array([0xff, 0x00]),
      width: 8,
      height: 2,
      bytesPerRow: 1,
    };
    const output = sbpl.compile(label({ width: 40, height: 30 }).image(bitmap, { x: 10, y: 10 }));
    expect(output).toContain("\x1bGM00002,FF00");
  });

  it("generates copies with ESC Q", () => {
    const output = sbpl.compile(label({ width: 40, height: 30, copies: 3 }));
    expect(output).toContain("\x1bQ3");
  });

  it("omits ESC Q for single copy", () => {
    const output = sbpl.compile(label({ width: 40, height: 30, copies: 1 }));
    expect(output).not.toContain("\x1bQ");
  });

  it("handles raw passthrough", () => {
    const output = sbpl.compile(label({ width: 40, height: 30 }).raw("\x1bKC1"));
    expect(output).toContain("\x1bKC1");
  });
});
