import { describe, expect, it } from "vitest";
import { label, LabelBuilder } from "../src/builder";
import { InvalidConfigError } from "../src/errors";

describe("label()", () => {
  it("creates a LabelBuilder", () => {
    const builder = label({ width: 40, height: 30 });
    expect(builder).toBeInstanceOf(LabelBuilder);
  });

  it("throws on invalid width", () => {
    expect(() => label({ width: 0 })).toThrow(InvalidConfigError);
    expect(() => label({ width: -1 })).toThrow(InvalidConfigError);
  });
});

describe("LabelBuilder", () => {
  it("chains fluently", () => {
    const builder = label({ width: 40, height: 30 });
    const result = builder
      .text("Hello")
      .box({ x: 0, y: 0, width: 100, height: 100 })
      .line({ x1: 0, y1: 0, x2: 100, y2: 100 })
      .raw("CUSTOM");

    expect(result).toBe(builder);
  });

  it("resolves with correct defaults", () => {
    const resolved = label({ width: 40, height: 30 }).resolve();
    expect(resolved.dpi).toBe(203);
    expect(resolved.speed).toBe(4);
    expect(resolved.density).toBe(8);
    expect(resolved.direction).toBe(0);
    expect(resolved.copies).toBe(1);
    expect(resolved.widthDots).toBe(320);
    expect(resolved.heightDots).toBe(240);
  });

  it("resolves with custom config", () => {
    const resolved = label({
      width: 4,
      height: 6,
      unit: "inch",
      dpi: 300,
      speed: 6,
      density: 12,
      copies: 3,
    }).resolve();

    expect(resolved.widthDots).toBe(1200);
    expect(resolved.heightDots).toBe(1800);
    expect(resolved.dpi).toBe(300);
    expect(resolved.speed).toBe(6);
    expect(resolved.density).toBe(12);
    expect(resolved.copies).toBe(3);
  });

  it("resolves height 0 for receipt mode", () => {
    const resolved = label({ width: 80 }).resolve();
    expect(resolved.heightDots).toBe(0);
  });

  it("collects elements in order", () => {
    const resolved = label({ width: 40, height: 30 }).text("First").text("Last").resolve();

    expect(resolved.elements).toHaveLength(2);
    expect(resolved.elements[0].type).toBe("text");
    expect(resolved.elements[1].type).toBe("text");
  });
});
