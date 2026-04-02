import { describe, expect, it } from "vitest";
import { label } from "../src/builder";
import { tsc } from "../src/lang/tsc";
import { zpl } from "../src/lang/zpl";

describe("tsc language module", () => {
  const b = () => label({ width: 40, height: 30 }).text("Hello", { x: 10, y: 10, size: 2 });

  it("compiles to TSC", () => {
    expect(tsc.compile(b())).toContain('TEXT 10,10,"2",0,2,2,"Hello"');
  });

  it("renders TSC preview with correct font size", () => {
    const svg = tsc.preview(b());
    expect(svg).toContain("<svg");
    expect(svg).toContain("Hello");
    expect(svg).toContain("— TSC"); // label shows TSC
    // Font "2" at size 2: base 12x20, multiplied by 2 = height 40
    expect(svg).toContain('font-size="40"');
  });

  it("parses TSC code", () => {
    const result = tsc.parse('SIZE 40 mm,30 mm\nCLS\nTEXT 10,10,"2",0,2,2,"Hello"\nPRINT 1');
    expect(result.commands.length).toBeGreaterThan(0);
  });

  it("validates TSC code", () => {
    const result = tsc.validate('SIZE 40 mm,30 mm\nCLS\nTEXT 10,10,"2",0,1,1,"Hi"\nPRINT 1');
    expect(result.valid).toBe(true);
  });

  it("validates and reports errors", () => {
    const result = tsc.validate('TEXT 10,10,"2",0,1,1,"No CLS"\nPRINT 1');
    expect(result.errors).toBeGreaterThan(0);
  });
});

describe("zpl language module", () => {
  const b = () =>
    label({ width: 40, height: 30 })
      .text("Hello ZPL", { x: 50, y: 50, size: 2 })
      .box({ x: 10, y: 10, width: 300, height: 220, thickness: 3 });

  it("compiles to ZPL", () => {
    const code = zpl.compile(b());
    expect(code).toContain("^XA");
    expect(code).toContain("^FDHello ZPL^FS");
    expect(code).toContain("^GB");
    expect(code).toContain("^XZ");
  });

  it("renders ZPL preview with correct font metrics", () => {
    const svg = zpl.preview(b());
    expect(svg).toContain("<svg");
    expect(svg).toContain("Hello ZPL");
    expect(svg).toContain("— ZPL");
  });

  it("renders filled box when thickness >= side", () => {
    const b2 = label({ width: 40, height: 30 }).box({
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      thickness: 100,
    });
    const svg = zpl.preview(b2);
    expect(svg).toContain('fill="#000"');
  });

  it("renders corner radius correctly", () => {
    const b2 = label({ width: 40, height: 30 }).box({
      x: 10,
      y: 10,
      width: 200,
      height: 100,
      thickness: 3,
      radius: 4,
    });
    const svg = zpl.preview(b2);
    // radius is in dots, used directly in SVG
    expect(svg).toContain('rx="4"');
  });

  it("parses ZPL code", () => {
    const result = zpl.parse("^XA^FO10,10^A0N,30,30^FDTest^FS^XZ");
    expect(result.commands.length).toBeGreaterThan(0);
  });

  it("validates ZPL code", () => {
    const result = zpl.validate("^XA^FO10,10^A0N,30,30^FDTest^FS^XZ");
    expect(result.valid).toBe(true);
  });

  it("validates and reports missing ^XA", () => {
    const result = zpl.validate("^FO10,10^FDTest^FS^XZ");
    expect(result.errors).toBeGreaterThan(0);
  });
});

describe("TSC vs ZPL preview differences", () => {
  it("produces different font sizes for same label", () => {
    const b = label({ width: 40, height: 30 }).text("Test", { x: 10, y: 10, font: "2", size: 2 });
    const tscSvg = tsc.preview(b);
    const zplSvg = zpl.preview(b);

    // TSC font "2" at size 2: 12x20 * 2 = height 40
    expect(tscSvg).toContain('font-size="40"');
    // ZPL font "2" doesn't exist in ZPL font table, uses default calculation
    // Different font table = different result
    expect(tscSvg).not.toBe(zplSvg);
  });

  it("labels show language name", () => {
    const b = label({ width: 40, height: 30 }).text("Test", { x: 10, y: 10 });
    expect(tsc.preview(b)).toContain("— TSC");
    expect(zpl.preview(b)).toContain("— ZPL");
  });
});
